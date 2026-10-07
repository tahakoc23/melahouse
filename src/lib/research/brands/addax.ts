import { fetchPage, parsePrice } from '../fetch'
import { enc, fullThenBroad, str, type RawItem, type Source } from './_shared'

const BASE = 'https://www.addax.com.tr'
/**
 * Addax (Farktor altyapısı) aramayı sitenin kendi kullandığı herkese açık Elasticsearch
 * dizininden yapıyor. /arama sayfası sunucuda boş (404) döndüğü için doğrudan dizin sorgulanır.
 * GET + `source` parametresi kullanılır ki fetchPage'in yedek bağlantısı da çalışsın.
 */
const ES = 'https://service.farktor.com/elasticSearchfr-5500218/_search'

function esUrl(term: string): string {
  const body = {
    size: 30,
    _source: ['productId', 'ModelCode', 'SeoUrl', 'PriceMarket', 'priceSale', 'productName', 'color', 'photos', 'stock'],
    // Dizinde her beden ayrı kayıt: modele göre tekilleştir
    collapse: { field: 'ModelCode.keyword' },
    query: {
      bool: {
        // Tüm kelimeler geçmeli; bulanık eşleşme "maxi"yi "mavi"ye çevirdiği için kapalı
        must: { match: { fullTextSearch: { query: term, operator: 'and' } } },
        filter: { range: { stock: { gt: 0 } } },
      },
    },
  }
  return `${ES}?source_content_type=application/json&source=${enc(JSON.stringify(body))}`
}

export const addax: Source = {
  id: 'addax',
  name: 'Addax',
  segment: 'alt',
  searchUrl: q => `${BASE}/arama?Search=1&keyword=${enc(q.full)}`,
  run(q) {
    return fullThenBroad(q, async term => {
      const text = await fetchPage(esUrl(term), { headers: { Accept: 'application/json' } })
      let hits: { _source?: Record<string, unknown> }[] = []
      try {
        hits = JSON.parse(text)?.hits?.hits ?? []
      } catch {
        return []
      }
      const out: RawItem[] = []
      for (const h of hits) {
        const s = h._source
        if (!s?.productName || !s.SeoUrl || !s.productId) continue
        const sale = parsePrice(s.priceSale)
        const market = parsePrice(s.PriceMarket)
        const price = sale || market
        if (!price) continue
        const name = str(s.productName)
          // Sondaki model kodu ("Desenli Mini Elbise E17726") başlığa gürültü katar
          .replace(/\s+[A-ZÇĞİÖŞÜ]{1,3}\d[\w-]*$/u, '')
          .trim()
        out.push({
          store: 'Addax',
          segment: 'alt',
          title: `Addax ${name} ${str(s.color)}`.trim(),
          url: `${BASE}/${str(s.SeoUrl)}_${str(s.productId)}`,
          price,
          originalPrice: market > price ? market : undefined,
          image: str(s.photos).split(',')[0] || undefined,
          brand: 'Addax',
        })
      }
      return out
    })
  },
}
