/** Ürün formunun durum tipleri */

export interface ColorEntry {
  /** Formdaki sabit anahtar (renk adı değişse de hücreler korunur) */
  key: string
  name: string
  /** Boş bırakılabilir; hazır renklerde otomatik dolar */
  hex: string
}

export interface StockCell {
  /** Veritabanındaki varyant id'si (düzenlemede) */
  id?: string
  sku: string
  /** Input değeri; boş = girilmedi */
  stock: string
}

export interface ScrapedInfo {
  title: string
  price: number
  color: string
  fabric: string
  sizes: string
  sku: string
  description: string
  image_url: string
  domain: string
  brand_name: string
  stock_status: 'stokta_var' | 'stokta_yok'
  raw_metadata: Record<string, unknown>
}

export interface SupplierLinkState {
  supplierId: string
  url: string
  /** Bu ürüne zaten bağlı supplier_products satırı (düzenlemede) */
  linkId: string | null
  /** /admin/urunler/yeni?from_supplier=… ile gelen toptancı ürünü */
  sourceId: string | null
  /** Son "Bilgileri getir" sonucu (yeni bağlantı satırı oluşturulurken kullanılır) */
  scraped: ScrapedInfo | null
}

export interface ProductFormState {
  name: string
  slug: string
  categoryId: string
  description: string
  fabric: string
  care: string
  details: string[]
  images: string[]
  imageAlts: Record<string, string>
  colors: ColorEntry[]
  sizes: string[]
  /** `${colorKey}::${size}` -> hücre. Seçimden çıkarılan hücreler saklanır (geri seçilince id korunur). */
  cells: Record<string, StockCell>
  mainSku: string
  cost: string
  base: string
  sale: string
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  outOfStock: boolean
  supplier: SupplierLinkState
}

export interface SupplierRow {
  id: string
  name: string
  domain: string | null
  website_url: string | null
}

export const cellKey = (colorKey: string, size: string) => `${colorKey}::${size}`

export type FieldKey =
  | 'name'
  | 'category'
  | 'slug'
  | 'colors'
  | 'sizes'
  | 'stock'
  | 'sku'
  | 'cost'
  | 'base'
  | 'sale'

export type FieldErrors = Partial<Record<FieldKey, string>>

/** Hata özetindeki bağlantıların hedefleri */
export const FIELD_ANCHORS: Record<FieldKey, { id: string; label: string }> = {
  name: { id: 'pf-name', label: 'Ürün adı' },
  category: { id: 'pf-category', label: 'Kategori' },
  slug: { id: 'pf-slug', label: 'URL' },
  colors: { id: 'pf-variants', label: 'Renkler' },
  sizes: { id: 'pf-variants', label: 'Bedenler' },
  stock: { id: 'pf-variants', label: 'Stok' },
  sku: { id: 'pf-variants', label: 'SKU' },
  cost: { id: 'pf-cost', label: 'Alış fiyatı' },
  base: { id: 'pf-base', label: 'Satış fiyatı' },
  sale: { id: 'pf-sale', label: 'İndirimli fiyat' },
}
