/**
 * Ürün formunun saf hesapları: aktif varyantlar, toplam stok, kâr/marj, doğrulama.
 */
import { parseTurkishPrice } from '@/app/admin/urunler/_lib/price'
import { nextVariantSku } from '@/app/admin/urunler/_lib/slug'
import { LOW_MARGIN_PERCENT, STD_SIZE, sizeLabel, trLower } from './constants'
import { cellKey, type FieldErrors, type ProductFormState, type StockCell } from './types'

export interface ActiveVariant {
  key: string
  colorKey: string
  colorName: string
  colorHex: string
  size: string
  cell: StockCell
}

/** Şu an seçili renk × beden kombinasyonları (sıralı) */
export function activeVariants(s: ProductFormState): ActiveVariant[] {
  const out: ActiveVariant[] = []
  for (const c of s.colors) {
    for (const size of s.sizes) {
      const key = cellKey(c.key, size)
      const cell = s.cells[key]
      if (cell) out.push({ key, colorKey: c.key, colorName: c.name.trim(), colorHex: c.hex, size, cell })
    }
  }
  return out
}

/** Her renk × beden için hücre olduğundan emin olur; yeni hücrelere benzersiz SKU verir */
export function ensureCells(s: ProductFormState): Record<string, StockCell> {
  const cells = { ...s.cells }
  for (const c of s.colors) {
    for (const size of s.sizes) {
      const key = cellKey(c.key, size)
      if (!cells[key]) {
        cells[key] = { sku: nextVariantSku(s.mainSku, Object.values(cells)), stock: '' }
      }
    }
  }
  return cells
}

export const parseStock = (v: string): number | null => {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : NaN
}

export function totalStock(s: ProductFormState): number {
  return activeVariants(s).reduce((sum, v) => {
    const n = parseStock(v.cell.stock)
    return sum + (n && !Number.isNaN(n) ? n : 0)
  }, 0)
}

export interface PriceNumbers {
  cost: number | null
  base: number | null
  sale: number | null
  /** Müşterinin ödediği fiyat */
  effective: number | null
  profit: number | null
  marginPct: number | null
}

export function priceNumbers(s: ProductFormState): PriceNumbers {
  const cost = s.cost.trim() ? parseTurkishPrice(s.cost) : null
  const base = s.base.trim() ? parseTurkishPrice(s.base) : null
  const sale = s.sale.trim() ? parseTurkishPrice(s.sale) : null
  const effective = base && base > 0 ? (sale && sale > 0 && sale < base ? sale : base) : null
  const profit = effective !== null && cost !== null && cost > 0 ? Math.round((effective - cost) * 100) / 100 : null
  const marginPct = profit !== null && effective ? (profit / effective) * 100 : null
  return { cost, base, sale, effective, profit, marginPct }
}

export type SaveIntent = 'draft' | 'publish'

/**
 * Engelleyen hatalar. Taslakta yalnızca ad, kategori ve tutarlılık (SKU, indirim) zorunludur;
 * yayınlarken fiyat, beden ve stok da gerekir.
 */
export function validate(s: ProductFormState, intent: SaveIntent, mode: 'create' | 'edit'): FieldErrors {
  const e: FieldErrors = {}
  const publish = intent === 'publish'

  if (!s.name.trim()) e.name = 'Ürün adını yazın.'
  else if (s.name.trim().length < 3) e.name = 'Ürün adı en az 3 harf olmalı.'
  if (!s.categoryId) e.category = 'Kategori seçin.'
  if (mode === 'edit' && !s.slug.trim()) e.slug = 'URL boş olamaz.'

  // Renkler
  const names = s.colors.map(c => trLower(c.name.trim()))
  if (names.some(n => !n)) {
    if (publish || s.colors.length > 1) e.colors = s.colors.length > 1 ? 'Her rengin adını yazın.' : 'Rengi yazın ya da aşağıdan seçin.'
  } else if (new Set(names).size !== names.length) {
    e.colors = 'Aynı renk iki kez eklenmiş.'
  }

  // Bedenler ve stok
  if (s.sizes.length === 0) {
    if (publish) e.sizes = 'En az bir beden seçin.'
  }
  const active = activeVariants(s)
  const badStock = active.filter(v => {
    const n = parseStock(v.cell.stock)
    return Number.isNaN(n) || (publish && n === null)
  })
  if (badStock.length) {
    const first = badStock[0]
    const where = s.colors.length > 1 ? `${first.colorName || 'renk'} / ${sizeLabel(first.size)}` : sizeLabel(first.size)
    e.stock = badStock.some(v => Number.isNaN(parseStock(v.cell.stock)))
      ? `Stok 0 veya daha büyük tam sayı olmalı (${where}).`
      : `Her beden için stok girin (${where} boş). Yoksa 0 yazın.`
  }

  // SKU
  const skus = active.map(v => v.cell.sku.trim())
  if (skus.some(k => !k)) e.sku = 'Her varyantın SKU kodu olmalı.'
  else if (new Set(skus.map(k => k.toUpperCase())).size !== skus.length) e.sku = 'Aynı SKU iki varyantta kullanılmış.'

  // Fiyatlar
  const p = priceNumbers(s)
  if (s.cost.trim() && (p.cost === null || p.cost < 0)) e.cost = 'Geçerli bir alış fiyatı yazın (ör. 650 veya 649,90).'
  if (s.base.trim() && (p.base === null || p.base <= 0)) e.base = 'Satış fiyatı 0’dan büyük olmalı.'
  else if (!s.base.trim() && publish) e.base = 'Satış fiyatını yazın.'
  if (s.sale.trim()) {
    if (p.sale === null || p.sale <= 0) e.sale = 'Geçerli bir indirimli fiyat yazın ya da alanı boşaltın.'
    else if (p.base !== null && p.sale >= p.base) e.sale = 'İndirimli fiyat satış fiyatından düşük olmalı.'
  }
  return e
}

export interface FormWarning {
  id: string
  text: string
}

/** Engellemeyen uyarılar */
export function warnings(s: ProductFormState): FormWarning[] {
  const w: FormWarning[] = []
  if (s.images.length === 0) w.push({ id: 'images', text: 'Görsel yok. Görselsiz ürünler mağazada boş kutu olarak görünür.' })
  const active = activeVariants(s)
  if (active.length > 0 && totalStock(s) === 0 && active.every(v => v.cell.stock.trim() !== '')) {
    w.push({ id: 'stock', text: 'Toplam stok 0. Ürün mağazada “Tükendi” görünür.' })
  }
  const p = priceNumbers(s)
  if (p.marginPct !== null && p.marginPct < LOW_MARGIN_PERCENT) {
    w.push({
      id: 'margin',
      text: p.marginPct < 0 ? 'Satış fiyatı alış fiyatının altında: zarar edersiniz.' : `Kâr marjı %${LOW_MARGIN_PERCENT}’un altında.`,
    })
  }
  return w
}

export function hasStdOnly(sizes: string[]) {
  return sizes.length === 1 && sizes[0] === STD_SIZE
}
