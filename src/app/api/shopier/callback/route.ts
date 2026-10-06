import { NextResponse } from 'next/server';
import { verifyShopierCallback } from '@/lib/shopier';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmation } from '@/lib/email';
import {
  ORDER_STATUS_PAID,
  ORDER_STATUS_PAYMENT_FAILED,
  ORDER_STATUS_PAYMENT_PENDING,
} from '@/lib/checkout/orderStatus';

interface OrderRow {
  id: string;
  user_id: string | null;
  status: string | null;
  total: number | null;
  order_number: string | null;
}

interface OrderItemRow {
  variant_id: string | null;
  product_id: string | null;
  product_name: string | null;
  quantity: number | null;
  unit_price: number | null;
}

function siteUrl(req: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
}

// Shopier POST ile döner; 303 ile tarayıcı GET'e çevrilir (307 POST'u tekrarlardı).
function redirectTo(req: Request, params: Record<string, string>) {
  const url = new URL('/odeme', siteUrl(req));
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, 303);
}

const fail = (req: Request, reason: string) => redirectTo(req, { odeme: 'hata', neden: reason });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const postData: Record<string, string> = {};
    for (const [k, v] of formData.entries()) {
      if (typeof v === 'string') postData[k] = v;
    }

    if (!verifyShopierCallback(postData)) {
      console.error('Shopier callback: invalid signature for order', postData.platform_order_id);
      return fail(req, 'invalid_signature');
    }

    // UYARI: Shopier'in imzası `status` alanını kapsamıyor ve bu istek müşterinin tarayıcısı üzerinden geliyor.
    // Siparişleri kargolamadan önce ödemeyi Shopier panelinden teyit edin veya sunucudan sunucuya
    // bildirim (OSB/webhook) ile doğrulama ekleyin.
    const status = (postData.status || '').toLowerCase();
    const orderId = postData.platform_order_id;
    const paymentId = postData.payment_id || postData.invoice_id || postData.order_id || null;

    const supabase = createAdminClient();

    const { data: existingData, error: loadError } = await supabase
      .from('orders')
      .select('id, user_id, status, total, order_number')
      .eq('id', orderId)
      .maybeSingle();
    const existing = existingData as OrderRow | null;

    if (loadError || !existing) {
      console.error('Shopier callback: order not found', orderId, loadError);
      return fail(req, 'order_not_found');
    }

    // İdempotent: yalnızca ödeme bekleyen sipariş işlenir.
    if (existing.status !== ORDER_STATUS_PAYMENT_PENDING) {
      if (existing.status === ORDER_STATUS_PAID) {
        return redirectTo(req, { odeme: 'basarili', siparis: existing.order_number || existing.id });
      }
      return fail(req, 'already_processed');
    }

    if (status !== 'success') {
      const { error } = await supabase
        .from('orders')
        .update({ status: ORDER_STATUS_PAYMENT_FAILED, updated_at: new Date().toISOString() } as never)
        .eq('id', orderId)
        .eq('status', ORDER_STATUS_PAYMENT_PENDING);
      if (error) console.error('Shopier callback: failed to mark order as failed', orderId, error);
      return fail(req, 'payment_failed');
    }

    // Koşullu güncelleme: eşzamanlı/tekrarlanan callback'lerde yalnızca biri satırı günceller.
    const { data: updatedData, error: updateError } = await supabase
      .from('orders')
      .update({
        status: ORDER_STATUS_PAID,
        shopier_payment_id: paymentId,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', orderId)
      .eq('status', ORDER_STATUS_PAYMENT_PENDING)
      .select('id, user_id, status, total, order_number');

    const updated = (updatedData as OrderRow[] | null)?.[0];
    if (updateError) {
      console.error('Shopier callback: failed to update order status', orderId, updateError);
      return fail(req, 'server_error');
    }
    if (!updated) {
      // Başka bir istek zaten işledi
      return redirectTo(req, { odeme: 'basarili', siparis: existing.order_number || existing.id });
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('variant_id, product_id, product_name, quantity, unit_price')
      .eq('order_id', orderId);
    const orderItems = (itemsData as OrderItemRow[] | null) ?? [];
    if (itemsError) console.error('Shopier callback: failed to load order items', orderId, itemsError);

    for (const item of orderItems) {
      if (!item.variant_id || !item.quantity) continue;
      const { error } = await supabase.rpc('decrement_stock' as never, {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      } as never);
      if (error) console.error('Shopier callback: decrement_stock failed', orderId, item.variant_id, error);
    }

    if (updated.user_id) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(updated.user_id);
        const customerEmail = userData?.user?.email;
        if (customerEmail) {
          const customerName = (userData?.user?.user_metadata?.full_name as string) || 'Değerli Müşterimiz';
          await sendOrderConfirmation(
            { ...updated, total_amount: updated.total },
            orderItems.map((i) => ({ ...i, price: i.unit_price })),
            customerEmail,
            customerName,
          );
        }
      } catch (emailError) {
        console.error('Shopier callback: order confirmation email failed', orderId, emailError);
      }
    }

    return redirectTo(req, { odeme: 'basarili', siparis: updated.order_number || updated.id });
  } catch (error) {
    console.error('Shopier callback processing error:', error);
    return fail(req, 'server_error');
  }
}
