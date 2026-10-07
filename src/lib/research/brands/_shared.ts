/**
 * Marka kaynaklarının ortak parçaları. Her marka kendi dosyasında bir `Source` dışa aktarır;
 * sources.ts bunları toplar. Buradaki tipler sources.ts ile aynıdır (tek kaynak burası).
 */
import type { Segment } from '../stats'

export type { Segment }

export interface RawItem {
  store: string
  segment: Segment
  title: string
  url: string
  price: number
  originalPrice?: number
  image?: string
  brand?: string
}

export interface SourceQuery {
  /** Detaylı sorgu (renk + detay + kumaş + kategori): "siyah maxi gömlek elbise" */
  full: string
  /** Geniş sorgu (renk + kategori): "siyah elbise" */
  broad: string
}

export interface Source {
  id: string
  /** Marka adı (araştırma sonucunda gösterilir) */
  name: string
  segment: Segment
  /** Kullanıcıya gösterilecek arama sayfası */
  searchUrl: (q: SourceQuery) => string
  run: (q: SourceQuery) => Promise<RawItem[]>
}

export const enc = encodeURIComponent
export const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

/** Detaylı sorgu az sonuç verirse geniş sorguyla tekrar dener (küçük kataloglu marka siteleri) */
export async function fullThenBroad(
  q: SourceQuery,
  search: (term: string) => Promise<RawItem[]>,
  min = 4,
): Promise<RawItem[]> {
  const first = await search(q.full)
  if (first.length >= min || q.broad === q.full) return first
  const second = await search(q.broad)
  const seen = new Set(first.map(i => i.url))
  return [...first, ...second.filter(i => !seen.has(i.url))]
}
