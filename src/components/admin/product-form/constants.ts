/**
 * Ürün formunun sabit seçenekleri ve küçük yardımcıları.
 * Saf modül (tarayıcı/sunucu fark etmez).
 */
import { CATEGORY_TREE } from '@/components/product/catalog'
import { slugifyTr } from '@/app/admin/urunler/_lib/slug'

export const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: 'Siyah', hex: '#111111' },
  { name: 'Beyaz', hex: '#FFFFFF' },
  { name: 'Ekru', hex: '#EDE6D6' },
  { name: 'Bej', hex: '#D9C7A7' },
  { name: 'Krem', hex: '#F3E9D2' },
  { name: 'Vizon', hex: '#9C8A7A' },
  { name: 'Kahverengi', hex: '#6B4A33' },
  { name: 'Bordo', hex: '#6D1A2A' },
  { name: 'Kırmızı', hex: '#C21E2B' },
  { name: 'Pudra', hex: '#E8C5C1' },
  { name: 'Pembe', hex: '#E58FAE' },
  { name: 'Lacivert', hex: '#1F2A44' },
  { name: 'Mavi', hex: '#3A6EA5' },
  { name: 'Yeşil', hex: '#3C6E47' },
  { name: 'Haki', hex: '#6B6B47' },
  { name: 'Gri', hex: '#9A9A9A' },
  { name: 'Antrasit', hex: '#3D3F42' },
  { name: 'Lila', hex: '#B9A3CF' },
  { name: 'Sarı', hex: '#E8C547' },
  { name: 'Çok renkli', hex: '#B08D57' },
]

export const FABRIC_PRESETS = [
  'Saten', 'Viskon', 'Pamuk', 'Keten', 'Krep', 'Şifon', 'Triko',
  'Kadife', 'Deri', 'Denim', 'Dantel', 'Tül', 'Polyester', 'Modal',
]

export const DETAIL_OPTIONS = [
  'Mini', 'Midi', 'Maxi', 'Kruvaze', 'Askılı', 'Straplez', 'Kolsuz', 'Kısa kollu',
  'Uzun kollu', 'V yaka', 'Bisiklet yaka', 'Balıkçı yaka', 'Gömlek yaka', 'Yırtmaçlı',
  'Dantelli', 'Drapeli', 'Fırfırlı', 'Kemerli', 'Oversize', 'Dar kesim', 'Bol kesim',
  'Yüksek bel', 'Geniş paça', 'Pileli', 'Düğmeli', 'Fermuarlı', 'Astarlı',
]

/** Kaydedilen beden değeri 'STD' (vitrin bunu "tek beden" olarak tanır), etiketi "Standart". */
export const STD_SIZE = 'STD'

export const SIZE_PRESETS: { id: string; label: string; sizes: string[] }[] = [
  { id: 'harf', label: 'Harf', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'rakam', label: 'Rakam', sizes: ['34', '36', '38', '40', '42', '44', '46'] },
  { id: 'standart', label: 'Standart', sizes: [STD_SIZE] },
]

export const sizeLabel = (s: string) => (s === STD_SIZE ? 'Standart' : s)

/** Vitrin "Tükendi" bayrağı (etiket olarak da yazılır; eski kayıtlarla uyumlu) */
export const OUT_OF_STOCK_TAG = 'Tükendi'

export const LOW_STOCK_LIMIT = 2
export const LOW_MARGIN_PERCENT = 30

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', STD_SIZE]

export function compareSizes(a: string, b: string): number {
  const ia = SIZE_ORDER.indexOf(a)
  const ib = SIZE_ORDER.indexOf(b)
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  const na = Number(a)
  const nb = Number(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
  return a.localeCompare(b, 'tr')
}

export const trLower = (s: string) => s.toLocaleLowerCase('tr')

/** Beden metnini normalize eder: "s" -> "S", "Standart"/"Tek beden" -> STD */
export function normalizeSize(raw: string): string {
  const s = raw.trim().toLocaleUpperCase('tr')
  if (!s) return ''
  if (['STD', 'STANDART', 'TEK BEDEN', 'TEK EBAT', 'ONE SIZE', 'TEKBEDEN'].includes(s)) return STD_SIZE
  if (s === '2XL') return 'XXL'
  return s
}

/** Metinde geçen hazır rengi bulur (ör. "6948 ELBİSE-SİYAH" -> Siyah) */
export function findPresetColor(text: string): { name: string; hex: string } | null {
  const t = ` ${trLower(text).replace(/[^a-zçğıöşü0-9]+/g, ' ')} `
  for (const c of COLOR_PRESETS) {
    if (t.includes(` ${trLower(c.name)} `)) return c
  }
  return null
}

export function presetHex(name: string): string | null {
  const n = trLower(name.trim())
  return COLOR_PRESETS.find(c => trLower(c.name) === n)?.hex ?? null
}

/** Ürün adı/açıklamasında geçen model detaylarını bulur */
export function findDetails(text: string): string[] {
  const t = ` ${trLower(text).replace(/[^a-zçğıöşü0-9]+/g, ' ')} `
  return DETAIL_OPTIONS.filter(d => t.includes(` ${trLower(d)} `))
}

/** Çok renkli olmayan ürünlerde renk adını "Siyah" biçimine getirir */
export function tidyColorName(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  const preset = COLOR_PRESETS.find(c => trLower(c.name) === trLower(s))
  if (preset) return preset.name
  const lower = trLower(s)
  return lower.charAt(0).toLocaleUpperCase('tr') + lower.slice(1)
}

/* ------------------------------------------------------------------ */
/* Kategoriler                                                         */
/* ------------------------------------------------------------------ */

export interface CategoryRow {
  id: string
  name: string
  slug: string
  parent_id: string | null
  is_active: boolean | null
}

export interface CategoryGroup {
  label: string
  options: CategoryRow[]
}

/** Kategorinin üst grubunun adı (DB parent_id öncelikli, yoksa vitrin ağacı) */
export function parentCategoryName(cat: CategoryRow, all: CategoryRow[]): string | null {
  if (cat.parent_id) return all.find(c => c.id === cat.parent_id)?.name ?? null
  const slug = slugifyTr(cat.slug || cat.name)
  for (const node of CATEGORY_TREE) {
    if (node.subcategories?.some(s => s.slug === slug)) return node.name
  }
  return null
}

/**
 * Kategorileri gruplar: parent_id kullanılıyorsa üst kategoriye göre,
 * kullanılmıyorsa vitrin ağacındaki gruplara göre (Üst Giyim, Alt Giyim…).
 */
export function groupCategories(all: CategoryRow[]): CategoryGroup[] {
  const usesParent = all.some(c => c.parent_id)
  const groups: CategoryGroup[] = []
  const used = new Set<string>()

  if (usesParent) {
    const roots = all.filter(c => !c.parent_id)
    for (const root of roots) {
      const children = all.filter(c => c.parent_id === root.id)
      groups.push({ label: root.name, options: [root, ...children] })
      used.add(root.id)
      children.forEach(c => used.add(c.id))
    }
  } else {
    for (const node of CATEGORY_TREE) {
      const slugs = [node.slug, ...(node.subcategories || []).map(s => s.slug)]
      const options = slugs
        .map(s => all.find(c => slugifyTr(c.slug) === s))
        .filter((c): c is CategoryRow => !!c)
      if (options.length) {
        groups.push({ label: node.name, options })
        options.forEach(o => used.add(o.id))
      }
    }
  }
  const rest = all.filter(c => !used.has(c.id))
  if (rest.length) groups.push({ label: 'Diğer', options: rest })
  return groups
}

/** Ürün adından kategori tahmini (ör. "Saten Elbise" -> Elbise). Alt kategoriler önce. */
export function guessCategory(text: string, all: CategoryRow[]): CategoryRow | null {
  const t = ` ${trLower(text).replace(/[^a-zçğıöşü0-9-]+/g, ' ')} `
  const sorted = [...all].sort((a, b) => Number(!!parentCategoryName(b, all)) - Number(!!parentCategoryName(a, all)))
  for (const c of sorted) {
    const n = trLower(c.name)
    if (n.includes(' ')) continue // "Üst Giyim" gibi grup adları ürün adında geçmez
    if (t.includes(` ${n} `) || t.includes(` ${n}-`) || t.includes(`-${n} `)) return c
  }
  return null
}

/** Ürün etiketlerinde formun yönettiği (kategori/detay/tükendi) dışında kalanlar */
export function foreignTags(tags: string[], categories: CategoryRow[]): string[] {
  const managed = new Set<string>([
    ...DETAIL_OPTIONS.map(trLower),
    trLower(OUT_OF_STOCK_TAG),
    ...categories.map(c => trLower(c.name)),
    ...CATEGORY_TREE.flatMap(n => [n.name, ...(n.subcategories || []).map(s => s.name)]).map(trLower),
  ])
  return tags.filter(t => t && !managed.has(trLower(t)))
}
