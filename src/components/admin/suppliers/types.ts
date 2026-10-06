/** Toptancı ekranı için ortak tipler ve veri kalitesi kontrolleri. */

export interface Supplier {
  id: string
  name: string
  domain: string | null
  website_url: string | null
  contact_person: string | null
  phone: string | null
  email: string | null
  notes: string | null
  created_at?: string | null
}

export interface SupplierProduct {
  id: string
  supplier_id: string | null
  admin_product_id: string | null
  title: string
  product_url: string
  sku: string | null
  price: number | string | null
  stock_status: string | null
  color: string | null
  fabric: string | null
  description: string | null
  image_url: string | null
  raw_metadata: Record<string, unknown> | null
  last_scraped_at: string | null
  created_at: string | null
  suppliers?: { name: string | null; domain: string | null } | null
  products?: { id: string; name: string; slug: string } | null
}

export interface SupplierChange {
  id: string
  supplier_product_id: string | null
  field_changed: string
  old_value: string | null
  new_value: string | null
  is_read: boolean | null
  created_at: string
  supplier_products?: {
    title: string | null
    product_url: string | null
    image_url: string | null
    suppliers?: { name: string | null } | null
  } | null
}

/** Önizleme/düzenleme formunda kullanılan ürün alanları (scrape API ile aynı adlar) */
export interface SupplierProductDraft {
  title: string
  product_url: string
  sku: string
  price: number
  stock_status: 'stokta_var' | 'stokta_yok'
  color: string
  fabric: string
  sizes: string
  description: string
  image_url: string
  raw_metadata?: Record<string, unknown> | null
  brand_name?: string
}

export const toNumber = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Eski kayıtlardaki uydurma varsayılanları ("Standart", "Belirtilmemiş") boş sayar */
export function cleanText(v: unknown): string {
  if (typeof v !== 'string') return ''
  const t = v.trim()
  return t === 'Standart' || t === 'Belirtilmemiş' ? '' : t
}

/** raw_metadata içindeki metin alanı (category, assortment, season, sizes...) */
export function metaText(p: SupplierProduct, key: string): string {
  return cleanText(p.raw_metadata?.[key])
}

export function sizesOf(p: SupplierProduct): string {
  return metaText(p, 'sizes')
}

/** Eski içe aktarıcı fiyat bulamayınca 2000 yazıyordu: tarama platformu yoksa doğrulanmamış sayılır. */
export function isUnverifiedPrice(p: SupplierProduct): boolean {
  return toNumber(p.price) === 2000 && !p.raw_metadata?.platform
}

const WRONG_HOSTS = [
  'youtube.com',
  'youtu.be',
  'instagram.com',
  'facebook.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'google.com',
  'pinterest.com',
  'wa.me',
  'whatsapp.com',
]

/** Ürün linki bariz yanlışsa kısa açıklama döner, sorun yoksa null. */
export function urlIssue(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return 'Link yok'
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return 'Geçersiz link'
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'Geçersiz link'
  const host = parsed.hostname.replace(/^www\.|^m\./, '').toLowerCase()
  if (WRONG_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) return 'Ürün sayfası değil'
  return null
}

export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** API hatasını okunur metne çevirir */
export async function readJson<T>(res: Response): Promise<T & { error?: string }> {
  try {
    return (await res.json()) as T & { error?: string }
  } catch {
    return {} as T & { error?: string }
  }
}

export function productToDraft(p: SupplierProduct): SupplierProductDraft {
  return {
    title: p.title || '',
    product_url: p.product_url || '',
    sku: p.sku || '',
    price: toNumber(p.price),
    stock_status: p.stock_status === 'stokta_yok' ? 'stokta_yok' : 'stokta_var',
    color: cleanText(p.color),
    fabric: cleanText(p.fabric),
    sizes: sizesOf(p),
    description: p.description || '',
    image_url: p.image_url || '',
    raw_metadata: p.raw_metadata,
  }
}
