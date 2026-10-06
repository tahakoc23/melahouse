import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateShipping, MAX_QUANTITY_PER_ITEM } from '@/lib/constants'

export interface RequestedItem {
  productId: string
  variantId?: string | null
  quantity: number
}

export interface QuoteLine {
  productId: string
  variantId: string | null
  productName: string
  variantInfo: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface OrderQuote {
  lines: QuoteLine[]
  subtotal: number
  shipping: number
  total: number
}

export class CheckoutError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

interface ProductRow {
  id: string
  name: string
  base_price: number | null
  sale_price: number | null
  is_active: boolean | null
}

interface VariantRow {
  id: string
  product_id: string | null
  color_name: string | null
  size: string | null
  stock_quantity: number | null
  price_override: number | null
  is_active: boolean | null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_LINES = 50

const round2 = (n: number) => Math.round(n * 100) / 100
const isPositive = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0

/** Ürün birim fiyatı: varyant price_override > geçerli indirimli fiyat > liste fiyatı. */
export function resolveUnitPrice(product: ProductRow, variant: VariantRow | null): number | null {
  if (variant && isPositive(variant.price_override)) return Number(variant.price_override)
  const base = isPositive(product.base_price) ? Number(product.base_price) : null
  const sale = isPositive(product.sale_price) ? Number(product.sale_price) : null
  if (sale !== null && (base === null || sale < base)) return sale
  return base
}

/** İstemciden gelen kalemleri doğrular (şekil + adet). Aynı ürün/varyant tekrarlarını birleştirir. */
export function normalizeItems(raw: unknown): RequestedItem[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new CheckoutError('Sepetiniz boş.')
  if (raw.length > MAX_LINES) throw new CheckoutError('Sepetinizde çok fazla ürün var.')

  const merged = new Map<string, RequestedItem>()
  for (const r of raw) {
    const productId = typeof r?.productId === 'string' ? r.productId : ''
    const variantId = typeof r?.variantId === 'string' && r.variantId ? r.variantId : null
    const quantity = Number(r?.quantity)
    if (!UUID_RE.test(productId) || (variantId !== null && !UUID_RE.test(variantId))) {
      throw new CheckoutError('Sepetinizde geçersiz bir ürün var. Lütfen sepetinizi yenileyin.')
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
      throw new CheckoutError(`Ürün adedi 1 ile ${MAX_QUANTITY_PER_ITEM} arasında olmalıdır.`)
    }
    const key = `${productId}:${variantId ?? '-'}`
    const existing = merged.get(key)
    if (existing) {
      existing.quantity += quantity
      if (existing.quantity > MAX_QUANTITY_PER_ITEM) {
        throw new CheckoutError(`Ürün adedi 1 ile ${MAX_QUANTITY_PER_ITEM} arasında olmalıdır.`)
      }
    } else {
      merged.set(key, { productId, variantId, quantity })
    }
  }
  return [...merged.values()]
}

/**
 * Fiyatları ve stokları veritabanından (service role) okuyarak sunucu tarafında sipariş tutarını hesaplar.
 * İstemciden gelen fiyatlar hiçbir zaman kullanılmaz.
 */
export async function buildOrderQuote(admin: SupabaseClient, items: RequestedItem[]): Promise<OrderQuote> {
  const productIds = [...new Set(items.map((i) => i.productId))]

  const [{ data: productsData, error: productsError }, { data: variantsData, error: variantsError }] =
    await Promise.all([
      admin.from('products').select('id, name, base_price, sale_price, is_active').in('id', productIds),
      admin
        .from('product_variants')
        .select('id, product_id, color_name, size, stock_quantity, price_override, is_active')
        .in('product_id', productIds),
    ])

  if (productsError || variantsError) {
    console.error('Checkout quote load error:', productsError || variantsError)
    throw new CheckoutError('Ürün bilgileri alınamadı. Lütfen tekrar deneyin.', 500)
  }

  const products = new Map((productsData as ProductRow[] | null ?? []).map((p) => [p.id, p]))
  const variants = (variantsData as VariantRow[] | null) ?? []

  const lines: QuoteLine[] = []
  for (const item of items) {
    const product = products.get(item.productId)
    if (!product || product.is_active === false) {
      throw new CheckoutError('Sepetinizdeki bir ürün artık satışta değil. Lütfen sepetinizi güncelleyin.', 409)
    }

    const productVariants = variants.filter((v) => v.product_id === product.id)
    let variant: VariantRow | null = null

    if (item.variantId) {
      variant = productVariants.find((v) => v.id === item.variantId) ?? null
      if (!variant || variant.is_active === false) {
        throw new CheckoutError(`"${product.name}" için seçtiğiniz beden/renk artık mevcut değil.`, 409)
      }
    } else if (productVariants.some((v) => v.is_active !== false)) {
      // Varyantlı ürün varyant seçilmeden sipariş edilemez
      throw new CheckoutError(`"${product.name}" için lütfen beden/renk seçin.`, 409)
    }

    if (variant) {
      const stock = Number(variant.stock_quantity ?? 0)
      if (stock < item.quantity) {
        throw new CheckoutError(
          stock > 0
            ? `"${product.name}" için stokta yalnızca ${stock} adet var.`
            : `"${product.name}" (${[variant.color_name, variant.size].filter(Boolean).join(' / ')}) tükendi.`,
          409,
        )
      }
    }

    const unitPrice = resolveUnitPrice(product, variant)
    if (unitPrice === null) {
      throw new CheckoutError(`"${product.name}" şu anda satın alınamıyor.`, 409)
    }

    const variantInfo = variant
      ? [variant.color_name, variant.size].filter(Boolean).join(' / ') || 'Standart'
      : 'Standart'

    lines.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      productName: product.name,
      variantInfo,
      quantity: item.quantity,
      unitPrice: round2(unitPrice),
      totalPrice: round2(unitPrice * item.quantity),
    })
  }

  const subtotal = round2(lines.reduce((sum, l) => sum + l.totalPrice, 0))
  const shipping = calculateShipping(subtotal)
  return { lines, subtotal, shipping, total: round2(subtotal + shipping) }
}
