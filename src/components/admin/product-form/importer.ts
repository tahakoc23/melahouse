/**
 * Toptancı verisini forma aktarır. Kural: yalnızca boş alanlar doldurulur; dolu alanlar
 * değiştirilmez ve raporda ayrıca listelenir (yanlışlıkla üzerine yazmayı önler).
 *
 * Ticimax gibi zengin kaynaklarda raw_metadata kullanılır: images (sıralı, ilki kapak),
 * category, colors[], sizes[], fabric_name, fabric_content, price_without_vat, vat_rate.
 * "Standart" / "Belirtilmemiş" gibi eski yer tutucu değerlere güvenilmez.
 */
import { formatTurkishPrice, parseTurkishPrice } from '@/app/admin/urunler/_lib/price'
import { slugifyTr } from '@/app/admin/urunler/_lib/slug'
import {
  COLOR_PRESETS,
  STD_SIZE,
  compareSizes,
  findDetails,
  findPresetColor,
  guessCategory,
  normalizeSize,
  presetHex,
  tidyColorName,
  trLower,
  type CategoryRow,
} from './constants'
import { ensureCells } from './logic'
import type { ColorEntry, ProductFormState } from './types'

export interface ImportSource {
  title?: string | null
  price?: number | string | null
  color?: string | null
  fabric?: string | null
  sizes?: string | null
  description?: string | null
  image_url?: string | null
  stock_status?: string | null
  raw_metadata?: Record<string, unknown> | null
}

export interface ImportedCostInfo {
  /** KDV dahil alış fiyatı (forma yazılan) */
  value: number
  net: number | null
  vatRate: number | null
}

const PLACEHOLDERS = ['', '-', 'standart', 'belirtilmemiş', 'belirtilmemis', 'toptancı sitesinden çekildi.']

const meaningful = (v: unknown) => {
  const s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : ''
  return PLACEHOLDERS.includes(trLower(s)) ? '' : s
}

const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.map(x => meaningful(x)).filter(Boolean) : [])

const titleCase = (s: string) =>
  trLower(s).replace(/(^|[\s\-/(])([a-zçğıöşü])/g, (_, p: string, c: string) => p + c.toLocaleUpperCase('tr'))

/**
 * Okunur ad önerisi: model kodunu ve tireli renk ekini atar, rengi başa koyar.
 *   "6948 ELBİSE-SİYAH" + Siyah -> "Siyah Elbise"
 */
export function suggestName(title: string, color: string): string {
  const raw = title.replace(/\s+/g, ' ').trim()
  if (!raw) return ''
  const colorNames = new Set([trLower(color), ...COLOR_PRESETS.map(c => trLower(c.name))].filter(Boolean))
  const words = raw
    .split(/\s*-\s*|\s+/)
    .filter(w => w && !/\d/.test(w)) // model/stok kodları ("6948", "A-102")
    .filter(w => !colorNames.has(trLower(w)))
  const base = titleCase(words.join(' ')).trim()
  if (!base) return raw === raw.toLocaleUpperCase('tr') ? titleCase(raw) : raw
  const c = color ? tidyColorName(color) : ''
  return c && !trLower(base).includes(trLower(c)) ? `${c} ${base}` : base
}

export function parseSizeList(raw: string | null | undefined): string[] {
  const list = (raw || '')
    .split(/[,;/|]+/)
    .map(normalizeSize)
    .filter(Boolean)
  const unique = Array.from(new Set(list))
  // "Standart" diğer bedenlerle birlikte geldiyse yok sayılır
  const sized = unique.filter(s => s !== STD_SIZE)
  return (sized.length ? sized : unique).sort(compareSizes)
}

function matchCategory(name: string, categories: CategoryRow[]): CategoryRow | null {
  const n = trLower(name.trim())
  const slug = slugifyTr(name)
  if (!n) return null
  return categories.find(c => trLower(c.name) === n || slugifyTr(c.slug) === slug) || null
}

export function applyImport(
  form: ProductFormState,
  src: ImportSource,
  categories: CategoryRow[],
  opts: { slugTouched: boolean; mode: 'create' | 'edit' },
): { form: ProductFormState; filled: string[]; kept: string[]; cost: ImportedCostInfo | null; originalTitle: string } {
  const next: ProductFormState = { ...form }
  const filled: string[] = []
  const kept: string[] = []
  const meta = (src.raw_metadata || {}) as Record<string, unknown>
  const title = meaningful(src.title)

  // Renkler: önce raw_metadata.colors, sonra virgüllü color, en son başlıktan tahmin
  const metaColors = strArray(meta.colors)
  const colorList = (metaColors.length ? metaColors : meaningful(src.color).split(',').map(s => s.trim()).filter(Boolean)).map(tidyColorName)
  const colors = Array.from(new Set(colorList))
  if (colors.length === 0) {
    const guess = findPresetColor(title)
    if (guess) colors.push(guess.name)
  }
  const mainColor = colors[0] || ''

  // Kategori: kaynaktaki kategori adı DB'de varsa o, yoksa addan tahmin
  const metaCategory = meaningful(meta.category)
  const description = meaningful(src.description)
  const cleanDesc = description && trLower(description) !== trLower(metaCategory) && description.length >= 20 ? description : ''
  const textForGuess = `${title} ${cleanDesc}`

  if (title) {
    const suggested = suggestName(title, mainColor)
    if (!next.name.trim()) {
      next.name = suggested
      if (opts.mode === 'create' && !opts.slugTouched) next.slug = slugifyTr(suggested)
      filled.push('ürün adı (öneri)')
    } else if (next.name.trim() !== suggested) kept.push('ürün adı')
  }

  if (!next.categoryId) {
    const cat = (metaCategory && matchCategory(metaCategory, categories)) || guessCategory(textForGuess, categories)
    if (cat) {
      next.categoryId = cat.id
      filled.push(`kategori (${cat.name})`)
    }
  }

  if (colors.length) {
    const first = next.colors[0]
    if (!first.name.trim() && next.colors.length === 1) {
      const entries: ColorEntry[] = colors.map((name, i) => ({
        key: i === 0 ? first.key : `c${i + 1}`,
        name,
        hex: presetHex(name) || '',
      }))
      next.colors = entries
      filled.push(colors.length > 1 ? `renkler (${colors.join(', ')})` : 'renk')
    } else if (trLower(first.name.trim()) !== trLower(mainColor)) kept.push('renk')
  }

  const fabricName = meaningful(meta.fabric_name)
  const fabricContent = meaningful(meta.fabric_content)
  const fabric =
    fabricName || fabricContent
      ? [fabricName, fabricContent].filter(Boolean).join(', ')
      : meaningful(src.fabric).replace(/\s*·\s*/g, ', ')
  if (fabric) {
    if (!next.fabric.trim()) {
      next.fabric = fabric
      filled.push('kumaş')
    } else if (next.fabric.trim() !== fabric) kept.push('kumaş')
  }

  if (next.details.length === 0) {
    const details = findDetails(textForGuess)
    if (details.length) {
      next.details = details
      filled.push('model detayları')
    }
  }

  if (cleanDesc) {
    if (!next.description.trim()) {
      next.description = cleanDesc
      filled.push('açıklama')
    } else if (next.description.trim() !== cleanDesc) kept.push('açıklama')
  }

  // Bedenler: raw_metadata.sizes dizisi güvenilir; düz metindeki tek "Standart" yer tutucu sayılır
  const metaSizes = strArray(meta.sizes)
  let sizes = metaSizes.length ? parseSizeList(metaSizes.join(',')) : parseSizeList(meaningful(src.sizes))
  if (!metaSizes.length && sizes.length === 1 && sizes[0] === STD_SIZE) sizes = []
  if (sizes.length) {
    if (next.sizes.length === 0) {
      next.sizes = sizes
      next.cells = ensureCells(next)
      // Stok adedini admin girer (boş kalır); toptancıda tükendiyse 0
      if (src.stock_status === 'stokta_yok') {
        const cells = { ...next.cells }
        for (const k of Object.keys(cells)) if (!cells[k].id && cells[k].stock === '') cells[k] = { ...cells[k], stock: '0' }
        next.cells = cells
      }
      filled.push(`bedenler (${sizes.map(s => (s === STD_SIZE ? 'Standart' : s)).join(', ')})`)
    } else kept.push('bedenler')
  }
  // Yeni eklenen renkler için de hücre olsun
  if (next.sizes.length) next.cells = ensureCells(next)

  let costInfo: ImportedCostInfo | null = null
  const cost = parseTurkishPrice(src.price ?? null)
  if (cost && cost > 0) {
    const net = Number(meta.price_without_vat)
    const vat = Number(meta.vat_rate)
    costInfo = { value: cost, net: Number.isFinite(net) && net > 0 ? net : null, vatRate: Number.isFinite(vat) && vat > 0 ? vat : null }
    if (!next.cost.trim()) {
      next.cost = formatTurkishPrice(cost)
      filled.push('alış fiyatı')
    } else if (parseTurkishPrice(next.cost) !== cost) kept.push('alış fiyatı')
  }

  // Görseller: raw_metadata.images (sıralı) ya da tek image_url; mevcutların sonuna eklenir
  const metaImages = strArray(meta.images).filter(u => /^https?:\/\//i.test(u))
  const single = meaningful(src.image_url)
  const incoming = metaImages.length ? metaImages : /^https?:\/\//i.test(single) ? [single] : []
  const fresh = incoming.filter(u => !next.images.includes(u))
  if (fresh.length) {
    next.images = [...next.images, ...fresh].slice(0, 10)
    filled.push(fresh.length > 1 ? `${fresh.length} görsel` : 'görsel')
  }

  return { form: next, filled, kept, cost: costInfo, originalTitle: title }
}
