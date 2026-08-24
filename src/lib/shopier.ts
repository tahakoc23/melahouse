import crypto from 'crypto';

interface ShopierOrderData {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  currency?: string;
  language?: string;
  isSubscription?: boolean;
}

export class ShopierPayment {
  private apiKey: string;
  private apiSecret: string;
  private static readonly ENDPOINT = 'https://shopier.com/ShowProduct/api_pay4.php';

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  public createPaymentForm(data: ShopierOrderData): string {
    const {
      orderId,
      amount,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      currency = '0', // 0: TRY
      language = 'tr',
      isSubscription = false,
    } = data;

    // Convert amount to the expected format (e.g., 10.50)
    const formattedAmount = amount.toFixed(2);
    const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/shopier/callback`;

    const args: Record<string, string> = {
      API_key: this.apiKey,
      website_index: '1',
      platform_order_id: orderId,
      product_name: `Sipariş #${orderId}`,
      product_type: '1', // 1 for physical goods, 2 for digital
      buyer_name: customerName.split(' ')[0] || '',
      buyer_surname: customerName.split(' ').slice(1).join(' ') || '',
      buyer_email: customerEmail,
      buyer_account_age: '0',
      buyer_id_nr: '0',
      buyer_phone: customerPhone,
      billing_address: shippingAddress,
      billing_city: '-', // Optional
      billing_country: 'Türkiye',
      billing_postcode: '-', // Optional
      shipping_address: shippingAddress,
      shipping_city: '-', // Optional
      shipping_country: 'Türkiye',
      shipping_postcode: '-', // Optional
      total_order_value: formattedAmount,
      currency,
      platform: '0',
      is_in_frame: '0',
      current_language: language,
      modul_version: '1.0.0',
      random_nr: Math.floor(Math.random() * 1000000).toString(),
    };

    const signatureString = args.random_nr + args.platform_order_id + args.total_order_value + args.currency;
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(signatureString)
      .digest('base64');
    
    args.signature = signature;
    args.return_url = returnUrl;

    let formHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Shopier ile Ödeme</title>
      </head>
      <body>
          <form id="shopier_form" method="post" action="${ShopierPayment.ENDPOINT}">
    `;

    for (const [key, value] of Object.entries(args)) {
      formHtml += `<input type="hidden" name="${key}" value="${value}">\n`;
    }

    formHtml += `
          </form>
          <script type="text/javascript">
              document.getElementById("shopier_form").submit();
          </script>
      </body>
      </html>
    `;

    return formHtml;
  }

  public verifyCallback(postData: any): boolean {
    const { status, invoice_id, order_id, platform_order_id, random_nr, signature, custom_field, installment } = postData;
    
    if (!signature) {
      return false;
    }

    const signatureString = random_nr + platform_order_id + invoice_id;
    const expectedSignature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(signatureString)
      .digest('base64');

    return signature === expectedSignature;
  }
}

export function createShopierPayment(data: ShopierOrderData): string {
  const apiKey = process.env.SHOPIER_API_KEY || 'placeholder_api_key';
  const apiSecret = process.env.SHOPIER_API_SECRET || 'placeholder_api_secret';
  const shopier = new ShopierPayment(apiKey, apiSecret);
  return shopier.createPaymentForm(data);
}

export function verifyShopierCallback(postData: any): boolean {
  const apiKey = process.env.SHOPIER_API_KEY || 'placeholder_api_key';
  const apiSecret = process.env.SHOPIER_API_SECRET || 'placeholder_api_secret';
  const shopier = new ShopierPayment(apiKey, apiSecret);
  return shopier.verifyCallback(postData);
}
