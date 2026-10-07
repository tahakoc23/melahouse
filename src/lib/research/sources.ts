import * as cheerio from 'cheerio'
import { absoluteUrl, fetchPage, findJsonObjects, parsePrice } from './fetch'
import { enc, str, type RawItem, type Source, type SourceQuery } from './brands/_shared'
import { addax } from './brands/addax'
import { beymenClub } from './brands/beymenclub'
import { colins } from './brands/colins'
import { exquise } from './brands/exquise'
import { jimmykey } from './brands/jimmykey'
import { mudo } from './brands/mudo'
import { nocturne } from './brands/nocturne'
import { oxxo } from './brands/oxxo'
import { perspective, setre } from './brands/ticimax'
import { tozlu } from './brands/tozlu'
import { roman, sarar } from './brands/tsoft'
import { yargici } from './brands/yargici'

export type { RawItem, Segment, Source, SourceQuery } from './brands/_shared'

/**
 * Piyasa araştırması kaynakları: yalnızca marka siteleri (her markadan bir fiyat alınır).
 * Hepsi Frankfurt'taki sunucumuzdan erişilebilir olduğu test edildi. Engelleyenler (DeFacto, Mavi,
 * Twist, Machka, Boyner, Zara grubu, H&M, Mango, Trendyol, Hepsiburada) listede yok.
 */

function womenQuery(q: string) {
  return /kad[iı]n/i.test(q) ? q : `kadın ${q}`
}

/* ------------------------------------------------------------------ */
/* Markalar                                                            */
/* ------------------------------------------------------------------ */

const lcw: Source = {
  id: 'lcw',
  name: 'LC Waikiki',
  segment: 'alt',
  searchUrl: q => `https://www.lcw.com/arama?q=${enc(womenQuery(q.full))}`,
  async run(q) {
    const html = await fetchPage(this.searchUrl(q))
    return findJsonObjects(html, '"ModelUrl":')
      .filter(o => !o.Gender || /kad[iı]n/i.test(str(o.Gender)) || /kad[iı]n/i.test(str(o.Category)))
      .map(o => {
        const current = parsePrice(o.PriceValue)
        const original = parsePrice(o.Price)
        return {
          store: 'LC Waikiki',
          segment: 'alt' as const,
          title: [o.Brand, o.ProductDescription].filter(Boolean).join(' '),
          url: absoluteUrl(str(o.ModelUrl), 'https://www.lcw.com'),
          price: current || original,
          originalPrice: original > current ? original : undefined,
          image: str(o.DefaultOptionImageUrl) || undefined,
          brand: str(o.Brand) || undefined,
        }
      })
  },
}

const koton: Source = {
  id: 'koton',
  name: 'Koton',
  segment: 'alt',
  searchUrl: q => `https://www.koton.com/list/?search_text=${enc(q.full)}`,
  async run(q) {
    const html = await fetchPage(this.searchUrl(q))
    const seen = new Set<string>()
    const out: RawItem[] = []
    for (const o of findJsonObjects(html, '"product_image_url"')) {
      const url = str(o.url)
      if (!url || seen.has(url)) continue
      seen.add(url)
      const sale = parsePrice(o.unit_sale_price)
      const list = parsePrice(o.unit_price)
      out.push({
        store: 'Koton',
        segment: 'alt',
        title: [str(o.name), str(o.color)].filter(Boolean).join(' '),
        url,
        price: sale || list,
        originalPrice: list > sale ? list : undefined,
        image: str(o.product_image_url) || undefined,
        brand: 'Koton',
      })
    }
    return out
  },
}

const penti: Source = {
  id: 'penti',
  name: 'Penti',
  segment: 'alt',
  searchUrl: q => `https://www.penti.com/tr/search?text=${enc(q.broad)}`,
  async run(q) {
    const html = await fetchPage(this.searchUrl(q))
    const $ = cheerio.load(html)
    const seen = new Set<string>()
    const out: RawItem[] = []
    $('a[href*="/p/"]').each((_, a) => {
      const href = $(a).attr('href')
      if (!href || seen.has(href)) return
      let card = $(a)
      for (let i = 0; i < 6 && !/₺/.test(card.text()); i++) card = card.parent()
      const prices = [...card.text().matchAll(/₺\s?([\d.,]+)/g)].map(m => parsePrice(m[1])).filter(p => p > 0)
      const img = card.find('img').first()
      const title = (img.attr('alt') || $(a).attr('title') || '').trim()
      if (!prices.length || !title) return
      seen.add(href)
      out.push({
        store: 'Penti',
        segment: 'alt',
        title: `Penti ${title}`,
        url: absoluteUrl(href, 'https://www.penti.com'),
        price: Math.min(...prices),
        originalPrice: Math.max(...prices) > Math.min(...prices) ? Math.max(...prices) : undefined,
        image: img.attr('src') || img.attr('data-src') || undefined,
        brand: 'Penti',
      })
    })
    return out
  },
}

const network: Source = {
  id: 'network',
  name: 'Network',
  segment: 'premium',
  searchUrl: q => `https://www.network.com.tr/search?q=${enc(q.full)}`,
  async run(q) {
    const html = await fetchPage(this.searchUrl(q))
    const seen = new Set<string>()
    const out: RawItem[] = []
    for (const o of findJsonObjects(html, '"FriendlyURI"')) {
      if (!o.DisplayName || !o.ID || seen.has(str(o.ID))) continue
      seen.add(str(o.ID))
      const p1 = parsePrice(o.Price1)
      const p2 = parsePrice(o.Price2)
      const price = p2 > 0 && p2 < p1 ? p2 : p1
      const media = (o.MediaList as Record<string, unknown>[] | undefined)?.[0]
      const file = (media?.ProductMediaFileDOList as Record<string, unknown>[] | undefined)?.[0]
      out.push({
        store: 'Network',
        segment: 'premium',
        title: `Network ${str(o.DisplayName)}`,
        url: `https://www.network.com.tr/${str(o.FriendlyURI)}-p-${str(o.ID)}`,
        price,
        originalPrice: p1 > price ? p1 : undefined,
        // Network görsel adresi boyut yer tutucusu içerir: .../mnresize/{width}/{height}/...
        image: str(file?.ImageResizePath).replace('{width}', '400').replace('{height}', '600') || undefined,
        brand: 'Network',
      })
    }
    return out
  },
}

function boynerGroupBrand(brand: 'İpekyol', host: string, id: string): Source {
  return {
    id,
    name: brand,
    segment: 'premium',
    searchUrl: q => `${host}/arama?q=${enc(q.broad)}`,
    async run(q) {
      const html = await fetchPage(this.searchUrl(q))
      const $ = cheerio.load(html)
      const seen = new Set<string>()
      const out: RawItem[] = []
      $('[data-test-id^="product_card_price"]').each((_, el) => {
        let card = $(el)
        for (let i = 0; i < 8 && card.find('a[href*="/urun/"]').length === 0; i++) card = card.parent()
        const href = card.find('a[href*="/urun/"]').first().attr('href')
        const name = card.find('[data-test-id^="product_card_name"]').first().text().trim()
        const prices = [...$(el).text().matchAll(/\d{1,3}(?:\.\d{3})*,\d{2}/g)].map(m => parsePrice(m[0])).filter(p => p > 0)
        if (!href || !name || !prices.length || seen.has(href)) return
        seen.add(href)
        const img = card.find('img').first()
        out.push({
          store: brand,
          segment: 'premium',
          title: `${brand} ${name}`,
          url: absoluteUrl(href, host),
          price: Math.min(...prices),
          originalPrice: Math.max(...prices) > Math.min(...prices) ? Math.max(...prices) : undefined,
          image: img.attr('src') || img.attr('data-src') || undefined,
          brand,
        })
      })
      return out
    },
  }
}

const ipekyol = boynerGroupBrand('İpekyol', 'https://www.ipekyol.com.tr', 'ipekyol')

/** Alt, orta ve premium segmentten markalar */
export const BRAND_SOURCES: Source[] = [
  // alt
  lcw, koton, colins, addax, tozlu, oxxo, penti,
  // orta
  jimmykey, mudo, setre, yargici, exquise,
  // premium (Nocturne fiyatları premium seviyesinde: ~10.000 TL)
  network, ipekyol, roman, sarar, beymenClub, perspective, { ...nocturne, segment: 'premium' },
]

/** İç giyim kategorilerinde Penti anlamlı; diğerlerinde Penti'yi atla */
export const LINGERIE_ONLY = new Set(['penti'])

/** Kullanıcının tek tıkla elle bakabileceği aramalar (pazaryerleri sunucumuzu engelliyor) */
export function manualLinks(q: SourceQuery) {
  return [
    { name: 'Trendyol', url: `https://www.trendyol.com/sr?q=${enc(womenQuery(q.full))}` },
    { name: 'Hepsiburada', url: `https://www.hepsiburada.com/ara?q=${enc(womenQuery(q.full))}` },
    { name: 'Google Alışveriş', url: `https://www.google.com/search?tbm=shop&hl=tr&gl=tr&q=${enc(womenQuery(q.full))}` },
  ]
}
