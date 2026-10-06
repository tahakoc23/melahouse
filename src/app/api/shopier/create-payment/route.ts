import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createShopierPayment } from '@/lib/shopier';
import { ORDER_STATUS_PAYMENT_PENDING } from '@/lib/checkout/orderStatus';

interface OrderRow {
  id: string;
  order_number: string | null;
  user_id: string | null;
  status: string | null;
  total: number | null;
  shipping_address: Record<string, unknown> | null;
}

const asStr = (v: unknown) => (typeof v === 'string' ? v : '');

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    let orderId = '';
    try {
      const body = await req.json();
      orderId = typeof body?.orderId === 'string' ? body.orderId : '';
    } catch {
      /* boş gövde */
    }
    if (!orderId) {
      return NextResponse.json({ error: 'Sipariş bilgisi eksik' }, { status: 400 });
    }

    // Tutar ve alıcı bilgileri istemciden DEĞİL, veritabanındaki siparişten alınır.
    const admin = createAdminClient();
    const { data, error: orderError } = await admin
      .from('orders')
      .select('id, order_number, user_id, status, total, shipping_address')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .eq('status', ORDER_STATUS_PAYMENT_PENDING)
      .maybeSingle();

    const order = data as OrderRow | null;
    if (orderError || !order) {
      if (orderError) console.error('create-payment: order lookup failed', orderError);
      return NextResponse.json({ error: 'Ödeme bekleyen sipariş bulunamadı' }, { status: 404 });
    }

    const amount = Number(order.total);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Sipariş tutarı geçersiz' }, { status: 400 });
    }

    const { data: profileData } = await admin
      .from('profiles')
      .select('full_name, phone, email')
      .eq('id', user.id)
      .maybeSingle();
    const profile = (profileData ?? {}) as { full_name?: string | null; phone?: string | null; email?: string | null };

    const addr = order.shipping_address ?? {};
    const customerName = asStr(addr.full_name) || profile.full_name || asStr(user.user_metadata?.full_name) || 'Müşteri';
    const customerEmail = asStr(addr.email) || user.email || profile.email || '';
    const customerPhone = asStr(addr.phone) || profile.phone || '';
    const shippingAddress =
      [asStr(addr.address_line), asStr(addr.district), asStr(addr.city)].filter(Boolean).join(', ') || '-';

    const form = createShopierPayment({
      orderId: order.id,
      orderNumber: order.order_number,
      amount,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      city: asStr(addr.city) || '-',
      postcode: asStr(addr.postal_code) || '-',
    });

    return NextResponse.json({ action: form.action, fields: form.fields, formHtml: form.html });
  } catch (error) {
    console.error('Shopier payment creation error:', error);
    return NextResponse.json({ error: 'Ödeme işlemi başlatılırken bir hata oluştu' }, { status: 500 });
  }
}
