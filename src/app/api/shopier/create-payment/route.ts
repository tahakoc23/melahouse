// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createShopierPayment } from '@/lib/shopier';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, amount, customerEmail, customerName, customerPhone, shippingAddress } = body;

    if (!orderId || !amount || !customerEmail || !customerName || !customerPhone || !shippingAddress) {
      return NextResponse.json({ error: 'Eksik sipariş bilgileri' }, { status: 400 });
    }

    // Generate the payment form HTML
    const paymentFormHtml = createShopierPayment({
      orderId,
      amount,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
    });

    // Optionally update the order status to pending payment in Supabase here
    await supabase
      .from('orders' as any)
      .update({ status: 'bekliyor' }) // Initial state before callback
      .eq('id', orderId);

    return NextResponse.json({ formHtml: paymentFormHtml });
  } catch (error) {
    console.error('Shopier payment creation error:', error);
    return NextResponse.json({ error: 'Ödeme işlemi başlatılırken bir hata oluştu' }, { status: 500 });
  }
}
