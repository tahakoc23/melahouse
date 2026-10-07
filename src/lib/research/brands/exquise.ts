/**
 * Exquise (Shopify). Normal /search sayfası Frankfurt'tan 429 veriyor; Shopify'ın
 * tahmine dayalı arama uç noktası (search/suggest.json) ise açık. Shopify en fazla 10 ürün döndürür
 * (resources[limit] > 10 yok sayılır). Fiyatlar TL, "4657.50" biçiminde; compare_at_price_max indirimsiz fiyat.
 */
import { fetchPage, parsePrice, absoluteUrl } from '../fetch'
import { type RawItem, type Source, enc, str, fullThenBroad } from './_shared'

const HOST = 'https://www.exquise.com.tr'

const suggestUrl = (term: string) =>
  `${HOST}/search/suggest.json?q=${enc(term)}&resources[type]=product&resources[limit]=10&resources[options][unavailable_products]=hide`

interface SuggestProduct {
  title?: string
  url?: string
  handle?: string
  price?: string
  price_min?: string
  compare_at_price_max?: string
  image?: string
  featured_image?: { url?: string }
  available?: boolean
}

export const exquise: Source = {
  id: 'exquise',
  name: 'Exquise',
  segment: 'orta',
  searchUrl: q => `${HOST}/search?q=${enc(q.full)}&type=product`,
  run(q) {
    return fullThenBroad(q, async term => {
      const body = await fetchPage(suggestUrl(term), { headers: { Accept: 'application/json' } })
      let products: SuggestProduct[] = []
      try {
        products = JSON.parse(body)?.resources?.results?.products ?? []
      } catch {
        return []
      }
      const seen = new Set<string>()
      const out: RawItem[] = []
      for (const p of products) {
        const title = str(p.title).replace(/\s+/g, ' ').trim()
        // url'deki arama izleme parametrelerini (_pos, _psq...) at
        const path = p.handle ? `/products/${p.handle}` : str(p.url).split('?')[0]
        if (!title || !path || p.available === false) continue
        const url = absoluteUrl(path, HOST)
        if (!url || seen.has(url)) continue
        seen.add(url)
        const price = parsePrice(p.price) || parsePrice(p.price_min)
        if (!price) continue
        const compare = parsePrice(p.compare_at_price_max)
        out.push({
          store: 'Exquise',
          segment: 'orta',
          title: `Exquise ${title}`,
          url,
          price,
          originalPrice: compare > price ? compare : undefined,
          image: str(p.featured_image?.url) || str(p.image) || undefined,
          brand: 'Exquise',
        })
      }
      return out
    })
  },
}
