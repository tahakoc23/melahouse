/**
 * Fiyat istatistikleri. Hem sunucuda hem tarayıcıda kullanılır
 * (admin bir ürünü dahil/hariç ettiğinde sonuçlar anında yeniden hesaplanır).
 */

export type Segment = 'pazaryeri' | 'marka' | 'premium'

/** Alış fiyatı biliniyorsa karşılaştırılabilir fiyat bandı: alışın 1,2 – 5 katı */
export const TIER_MIN_MULTIPLIER = 1.2
export const TIER_MAX_MULTIPLIER = 5

export const SEGMENT_ORDER: Segment[] = ['pazaryeri', 'marka', 'premium']
export const SEGMENT_INFO: Record<Segment, { label: string; hint: string }> = {
  pazaryeri: { label: 'Pazaryerleri', hint: 'Trendyol, Hepsiburada, n11 satıcıları' },
  marka: { label: 'Hızlı moda', hint: 'LC Waikiki, Koton, Penti vb.' },
  premium: { label: 'Premium & lüks', hint: 'Network, İpekyol, Beymen vb.' },
}

export interface PricedItem {
  price: number
  segment: Segment
  included: boolean
}

export interface SegmentStat {
  segment: Segment
  label: string
  count: number
  median: number
  min: number
  max: number
}

export interface PriceStats {
  count: number
  median: number
  average: number
  min: number
  max: number
  p25: number
  p75: number
  segments: SegmentStat[]
}

const round2 = (n: number) => Math.round(n * 100) / 100

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

/** IQR ile uç değerleri ayıklar (5+ veri varsa) */
export function trimOutliers(prices: number[]): number[] {
  const sorted = [...prices].sort((a, b) => a - b)
  if (sorted.length < 5) return sorted
  const q1 = quantile(sorted, 0.25)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1
  return sorted.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr)
}

function summarize(prices: number[]) {
  const s = trimOutliers(prices)
  return {
    count: s.length,
    median: round2(quantile(s, 0.5)),
    average: s.length ? round2(s.reduce((a, b) => a + b, 0) / s.length) : 0,
    min: s[0] ?? 0,
    max: s[s.length - 1] ?? 0,
    p25: round2(quantile(s, 0.25)),
    p75: round2(quantile(s, 0.75)),
  }
}

/**
 * Piyasa ortası:
 * - Alış fiyatı biliniyorsa hesaba katılan ürünler zaten karşılaştırılabilir banttadır: hepsi kullanılır.
 * - Bilinmiyorsa lüks markalar ortalamayı anlamsız yükseltmesin diye pazaryeri + hızlı moda
 *   kullanılır (en az 5 ürün varsa); premium ayrı segment olarak gösterilir.
 */
export function computeStats(items: PricedItem[], opts: { costKnown?: boolean } = {}): PriceStats {
  const included = items.filter(i => i.included && i.price > 0)
  const mainstream = included.filter(i => i.segment !== 'premium')
  const base = !opts.costKnown && mainstream.length >= 5 ? mainstream : included
  const all = summarize(base.map(i => i.price))
  const segments = SEGMENT_ORDER.map(segment => {
    const s = summarize(included.filter(i => i.segment === segment).map(i => i.price))
    return { segment, label: SEGMENT_INFO[segment].label, count: s.count, median: s.median, min: s.min, max: s.max }
  }).filter(s => s.count > 0)
  return { ...all, segments }
}

/** Psikolojik fiyat: 1.873 -> 1.899,90 ; 412 -> 419,90 */
export function charmPrice(n: number): number {
  if (n <= 0) return 0
  const step = n >= 5000 ? 250 : n >= 2000 ? 100 : n >= 500 ? 50 : 10
  return round2(Math.ceil(n / step) * step - 0.1)
}

export interface PriceSuggestion {
  key: 'market' | 'premium' | 'cost'
  label: string
  note: string
  value: number
  recommended?: boolean
}

/**
 * Fiyat önerileri.
 * Önerilen: piyasa ortası (tüm uyumlu ürünlerin medyanı). Alış fiyatı biliniyorsa
 * önerilen fiyat en az alış × 2 olur (sağlıklı marj). Premium konum ayrı seçenek olarak sunulur.
 */
export function suggestPrices(stats: PriceStats, cost?: number): PriceSuggestion[] {
  const out: PriceSuggestion[] = []
  if (stats.count > 0) {
    out.push({ key: 'market', label: 'Piyasa ortası', note: `${stats.count} benzer ürünün medyanı`, value: charmPrice(stats.median) })
  }
  const premium = stats.segments.find(s => s.segment === 'premium')
  if (premium && premium.count >= 2) {
    out.push({ key: 'premium', label: 'Premium konum', note: `${premium.count} premium ürünün medyanı`, value: charmPrice(premium.median) })
  }
  if (cost && cost > 0) {
    out.push({ key: 'cost', label: 'Alış × 2,5', note: 'Butik modada yaygın çarpan', value: charmPrice(cost * 2.5) })
  }
  if (!out.length) return out

  let target = stats.count > 0 ? stats.median : 0
  if (cost && cost > 0) target = Math.max(target, cost * 2)
  const recommended = charmPrice(target || out[0].value)
  const match = out.find(s => s.value === recommended)
  if (match) match.recommended = true
  else out.unshift({ key: 'market', label: 'Önerilen', note: 'Piyasa ortası, alış × 2 marjı korunarak', value: recommended, recommended: true })
  return out
}
