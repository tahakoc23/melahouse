import crypto from 'crypto';

export interface ShopierOrderData {
  orderId: string;
  orderNumber?: string | null;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  city?: string;
  postcode?: string;
  currency?: string;
  language?: string;
}

export interface ShopierPaymentForm {
  action: string;
  fields: Record<string, string>;
  html: string;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

function hmacBase64(secret: string, data: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('base64');
}

/** Sabit zamanlı karşılaştırma (base64 imzaları ham bayt olarak karşılaştırır). */
function safeEqualBase64(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'base64');
  const bufB = Buffer.from(b, 'base64');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export class ShopierPayment {
  private apiKey: string;
  private apiSecret: string;
  static readonly ENDPOINT = 'https://shopier.com/ShowProduct/api_pay4.php';

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  public createPaymentForm(data: ShopierOrderData): ShopierPaymentForm {
    const {
      orderId,
      orderNumber,
      amount,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      city = '-',
      postcode = '-',
      currency = '0', // 0: TRY
      language = 'tr',
    } = data;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      throw new Error('NEXT_PUBLIC_SITE_URL tanımlı değil; Shopier dönüş adresi oluşturulamıyor.');
    }

    const nameParts = customerName.trim().split(/\s+/);
    const args: Record<string, string> = {
      API_key: this.apiKey,
      website_index: '1',
      platform_order_id: orderId,
      product_name: `Sipariş #${orderNumber || orderId}`,
      product_type: '1', // 1: fiziksel ürün, 2: dijital
      buyer_name: nameParts[0] || '',
      buyer_surname: nameParts.slice(1).join(' ') || '-',
      buyer_email: customerEmail,
      buyer_account_age: '0',
      buyer_id_nr: '0',
      buyer_phone: customerPhone,
      billing_address: shippingAddress,
      billing_city: city,
      billing_country: 'Türkiye',
      billing_postcode: postcode,
      shipping_address: shippingAddress,
      shipping_city: city,
      shipping_country: 'Türkiye',
      shipping_postcode: postcode,
      total_order_value: amount.toFixed(2),
      currency,
      platform: '0',
      is_in_frame: '0',
      current_language: language,
      modul_version: '1.0.0',
      random_nr: crypto.randomInt(100000, 1000000).toString(),
    };

    // TODO(shopier): İmza algoritmasını Shopier dokümanı ile ve gerçek bir test ödemesiyle doğrulayın.
    // Mevcut uygulama: base64(HMAC-SHA256(random_nr + platform_order_id + total_order_value + currency)).
    args.signature = hmacBase64(this.apiSecret, args.random_nr + args.platform_order_id + args.total_order_value + args.currency);
    // Not: Shopier dönüş (callback) adresi Shopier panelinde de bu URL olarak tanımlı olmalıdır.
    args.return_url = `${siteUrl}/api/shopier/callback`;

    const inputs = Object.entries(args)
      .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`)
      .join('\n');

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Shopier ile Ödeme</title></head>
<body>
<form id="shopier_form" method="post" action="${escapeHtml(ShopierPayment.ENDPOINT)}">
${inputs}
</form>
<script>document.getElementById("shopier_form").submit();</script>
</body>
</html>`;

    return { action: ShopierPayment.ENDPOINT, fields: args, html };
  }

  /**
   * Shopier dönüşündeki imzayı doğrular.
   * TODO(shopier): Shopier dokümanına göre imza base64(HMAC-SHA256(random_nr + platform_order_id)) olmalıdır;
   * önceki kod ayrıca invoice_id ekliyordu. İkisi de gizli anahtar gerektirdiğinden her iki biçim kabul edilir.
   * Gerçek bir test ödemesiyle hangisinin geldiğini doğrulayıp diğerini kaldırın.
   * NOT: Bu imza `status` alanını kapsamaz; bkz. callback route'undaki uyarı.
   */
  public verifyCallback(postData: Record<string, unknown>): boolean {
    const signature = typeof postData.signature === 'string' ? postData.signature : '';
    const randomNr = typeof postData.random_nr === 'string' ? postData.random_nr : '';
    const platformOrderId = typeof postData.platform_order_id === 'string' ? postData.platform_order_id : '';
    if (!signature || !randomNr || !platformOrderId) return false;

    const candidates = [hmacBase64(this.apiSecret, randomNr + platformOrderId)];
    const invoiceId = typeof postData.invoice_id === 'string' ? postData.invoice_id : '';
    if (invoiceId) candidates.push(hmacBase64(this.apiSecret, randomNr + platformOrderId + invoiceId));

    // Kısa devre yapmadan tüm adayları karşılaştır
    let ok = false;
    for (const expected of candidates) {
      if (safeEqualBase64(signature, expected)) ok = true;
    }
    return ok;
  }
}

function getShopier(): ShopierPayment {
  const apiKey = process.env.SHOPIER_API_KEY;
  const apiSecret = process.env.SHOPIER_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error('SHOPIER_API_KEY / SHOPIER_API_SECRET ortam değişkenleri tanımlı değil.');
  }
  return new ShopierPayment(apiKey, apiSecret);
}

export function createShopierPayment(data: ShopierOrderData): ShopierPaymentForm {
  return getShopier().createPaymentForm(data);
}

export function verifyShopierCallback(postData: Record<string, unknown>): boolean {
  return getShopier().verifyCallback(postData);
}
