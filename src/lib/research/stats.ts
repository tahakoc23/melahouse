/**
 * Fiyat istatistikleri. Hem sunucuda hem tarayıcıda kullanılır
 * (admin bir markayı hesaptan çıkardığında ya da başka ürününü seçtiğinde sonuçlar anında yeniden hesaplanır).
 *
 * Araştırma her markadan tek bir fiyat alır; markalar alt ve orta segmentlere dağılır; önerilen fiyat orta segmentten gelir.
 * Segment farkı bilerek istendiği için uç değer kırpılmaz; segment ortalamaları ayrıca gösterilir.
 */

/** Marka segmenti: alt (bütçe, referans), orta (önerilen fiyatın tabanı) */
export type Segment = 'alt' | 'orta'

export const SEGMENT_ORDER: Segment[] = ['orta', 'alt']
export const SEGMENT_INFO: Record<Segment, { label: string; hint: string }> = {
  alt: { label: 'Alt segment', hint: 'LC Waikiki, Koton, Colin’s, Addax' },
  orta: { label: 'Orta segment', hint: 'Oxxo, Jimmy Key, Mudo, Yargıcı, Exquise' },
}

/** Önerilen fiyat alışın bu katının altına düşerse satışta marj kalmaz: ekranda uyarılır */
export const MIN_HEALTHY_MULTIPLIER = 1.5

export interface PricedItem {
  price: number
  segment: Segment
  included: boolean
}

export interface SegmentStat {
  segment: Segment
  label: string
  count: number
  average: number
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

function summarize(prices: number[]) {
  const s = [...prices].sort((a, b) => a - b)
  return {
    count: s.length,
    median: round2(quantile(s, 0.5)),
    average: s.length ? round2(s.reduce((a, b) => a + b, 0) / s.length) : 0,
    min: s[0] ?? 0,
    max: s[s.length - 1] ?? 0,
  }
}

export function computeStats(items: PricedItem[]): PriceStats {
  const included = items.filter(i => i.included && i.price > 0)
  const all = summarize(included.map(i => i.price))
  const segments = SEGMENT_ORDER.map(segment => {
    const s = summarize(included.filter(i => i.segment === segment).map(i => i.price))
    return { segment, label: SEGMENT_INFO[segment].label, ...s }
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
  key: 'market' | 'average' | Segment | 'cost'
  label: string
  note: string
  value: number
  recommended?: boolean
}

/**
 * Fiyat önerileri.
 * Önerilen: orta segment markalarının medyan fiyatı (en az 2 marka yoksa tüm markaların medyanı).
 * Alış fiyatı önerilen fiyatı yukarı itmez: alış yüksekse ürün o piyasaya uygun değildir ve ekranda uyarılır.
 */
export function suggestPrices(stats: PriceStats, cost?: number): PriceSuggestion[] {
  const out: PriceSuggestion[] = []
  const mid = stats.segments.find(s => s.segment === 'orta')
  const useMid = !!mid && mid.count >= 2
  if (stats.count > 0) {
    out.push(
      useMid
        ? { key: 'market', label: 'Orta segment fiyatı', note: `${mid!.count} orta segment markasının medyanı`, value: charmPrice(mid!.median), recommended: true }
        : { key: 'market', label: 'Piyasa ortası', note: `${stats.count} markanın medyanı`, value: charmPrice(stats.median), recommended: true },
    )
    out.push({ key: 'average', label: 'Tüm markaların ortalaması', note: `${stats.count} markanın ortalaması`, value: charmPrice(stats.average) })
  }
  for (const s of stats.segments) {
    out.push({
      key: s.segment,
      label: s.label,
      note: `${s.count} markanın ortalaması`,
      value: charmPrice(s.average),
    })
  }
  if (cost && cost > 0) {
    out.push({ key: 'cost', label: 'Alış × 2,5', note: 'Butik modada yaygın çarpan', value: charmPrice(cost * 2.5) })
  }
  return out
}
