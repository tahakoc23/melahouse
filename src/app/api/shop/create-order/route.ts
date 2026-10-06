import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildOrderQuote, CheckoutError, normalizeItems } from '@/lib/checkout/pricing'
import {
  ORDER_STATUS_COD_RECEIVED,
  ORDER_STATUS_PAYMENT_PENDING,
  PAYMENT_METHODS,
  type PaymentMethod,
} from '@/lib/checkout/orderStatus'

interface ShippingAddress {
  title: string
  full_name: string
  phone: string
  email: string
  city: string
  district: string
  address_line: string
  postal_code: string
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function parseAddress(raw: unknown, fallbackEmail: string): ShippingAddress {
  const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const address: ShippingAddress = {
    title: str(a.title, 60) || 'Ev',
    full_name: str(a.fullName, 120),
    phone: str(a.phone, 30),
    email: str(a.email, 160) || fallbackEmail,
    city: str(a.city, 60),
    district: str(a.district, 80),
    address_line: str(a.line, 500),
    postal_code: str(a.zip, 10),
  }
  if (!address.full_name || !address.phone || !address.city || !address.district || !address.address_line) {
    throw new CheckoutError('Lütfen tüm zorunlu adres alanlarını doldurunuz.')
  }
  const phoneDigits = address.phone.replace(/\D/g, '')
  if (phoneDigits.length < 10 || phoneDigits.length > 13) {
    throw new CheckoutError('Lütfen geçerli bir telefon numarası giriniz.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
    throw new CheckoutError('Lütfen geçerli bir e-posta adresi giriniz.')
  }
  return address
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Sipariş verebilmek için giriş yapmalısınız.' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    }

    const items = normalizeItems(body.items)
    const admin = createAdminClient()
    const quote = await buildOrderQuote(admin, items)

    // Sadece tutar önizlemesi (ödeme adımında sunucu fiyatlarını göstermek için); kayıt oluşturmaz.
    if (body.preview === true) {
      return NextResponse.json({ subtotal: quote.subtotal, shipping: quote.shipping, total: quote.total })
    }

    const paymentMethod = body.paymentMethod as PaymentMethod
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Geçersiz ödeme yöntemi.' }, { status: 400 })
    }

    const shippingAddress = parseAddress(body.address, user.email ?? '')
    const notes = str(body.notes, 1000) || null

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: user.id,
        status: paymentMethod === 'card' ? ORDER_STATUS_PAYMENT_PENDING : ORDER_STATUS_COD_RECEIVED,
        subtotal: quote.subtotal,
        shipping_cost: quote.shipping,
        total: quote.total,
        shipping_address: shippingAddress,
        notes,
      } as never)
      .select('id, order_number, total')
      .single()

    const createdOrder = order as { id: string; order_number: string | null; total: number | null } | null
    if (orderError || !createdOrder) {
      console.error('create-order: order insert failed', orderError)
      return NextResponse.json({ error: 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.' }, { status: 500 })
    }

    const { error: itemsError } = await admin.from('order_items').insert(
      quote.lines.map((l) => ({
        order_id: createdOrder.id,
        product_id: l.productId,
        variant_id: l.variantId,
        product_name: l.productName,
        variant_info: l.variantInfo,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        total_price: l.totalPrice,
      })) as never,
    )

    if (itemsError) {
      console.error('create-order: order_items insert failed', itemsError)
      // Kalemsiz sipariş bırakma
      const { error: cleanupError } = await admin.from('orders').delete().eq('id', createdOrder.id)
      if (cleanupError) console.error('create-order: cleanup failed for order', createdOrder.id, cleanupError)
      return NextResponse.json({ error: 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.' }, { status: 500 })
    }

    // Kapıda ödeme siparişi kesinleşti: stok hemen düşülür.
    // Kart ödemesinde stok, Shopier callback'inde ödeme onaylanınca düşülür.
    if (paymentMethod === 'cod') {
      for (const l of quote.lines) {
        if (!l.variantId) continue
        const { error } = await admin.rpc('decrement_stock' as never, {
          p_variant_id: l.variantId,
          p_quantity: l.quantity,
        } as never)
        if (error) console.error('create-order: decrement_stock failed', createdOrder.id, l.variantId, error)
      }
    }

    return NextResponse.json({
      orderId: createdOrder.id,
      orderNumber: createdOrder.order_number,
      total: Number(createdOrder.total ?? quote.total),
    })
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('create-order: unexpected error', err)
    return NextResponse.json({ error: 'Sipariş oluşturulurken bir hata oluştu.' }, { status: 500 })
  }
}
