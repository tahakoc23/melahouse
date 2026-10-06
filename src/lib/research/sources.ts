import * as cheerio from 'cheerio'
import { absoluteUrl, fetchPage, findJsonObjects, parsePrice } from './fetch'

import type { Segment } from './stats'

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
  /** Detaylı sorgu (renk + detay + kumaş + kategori) */
  full: string
  /** Geniş sorgu (renk + kategori): küçük kataloglu marka siteleri için */
  broad: string
}

export interface Source {
  id: string
  name: string
  segment: Segment
  /** Kullanıcıya gösterilecek arama sayfası */
  searchUrl: (q: SourceQuery) => string
  run: (q: SourceQuery) => Promise<RawItem[]>
}

const enc = encodeURIComponent
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

function womenQuery(q: string) {
  return /kad[iı]n/i.test(q) ? q : `kadın ${q}`
}

/* ------------------------------------------------------------------ */
/* Doğrudan okunan kaynaklar                                           */
/* ------------------------------------------------------------------ */

const n11: Source = {
  id: 'n11',
  name: 'n11',
  segment: 'pazaryeri',
  searchUrl: q => `https://www.n11.com/arama?q=${enc(womenQuery(q.full))}`,
  async run(q) {
    const html = await fetchPage(this.searchUrl(q))
    return findJsonObjects(html, '"sellerNickName"')
      .filter(o => /kad[iı]n/i.test(str(o.category1Name)) || !o.category1Name)
      .map(o => {
        const info = (o.priceInfo || {}) as Record<string, unknown>
        const price = parsePrice(info.finalPrice)
        const old = parsePrice(info.oldPrice)
        return {
          store: 'n11',
          segment: 'pazaryeri' as const,
          title: str(o.subtitle) || str(o.title),
          url: absoluteUrl(str(o.productUrl), 'https://www.n11.com'),
          price,
          originalPrice: old > price ? Math.round(old * 100) / 100 : undefined,
          image: str(o.imageUrl).replace('{0}', '500'),
          brand: str(o.brand) || undefined,
        }
      })
  },
}

const lcw: Source = {
  id: 'lcw',
  name: 'LC Waikiki',
  segment: 'marka',
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
          segment: 'marka' as const,
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
  segment: 'marka',
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
        segment: 'marka',
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
  segment: 'marka',
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
        segment: 'marka',
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
        image: str(file?.ImageResizePath) || undefined,
        brand: 'Network',
      })
    }
    return out
  },
}

const beymen: Source = {
  id: 'beymen',
  name: 'Beymen',
  segment: 'premium',
  searchUrl: q => `https://www.beymen.com/tr/search?q=${enc(q.full)}`,
  async run(q) {
    const html = await fetchPage(this.searchUrl(q))
    const seen = new Set<string>()
    const out: RawItem[] = []
    for (const o of findJsonObjects(html, '"actualPrice"')) {
      const url = str(o.productUrl)
      if (!url || !o.displayName || seen.has(url)) continue
      if (o.gender && !/kad[iı]n/i.test(str(o.gender))) continue
      seen.add(url)
      const actual = parsePrice(o.actualPrice)
      const original = parsePrice(o.originalPrice)
      const img = (o.images as unknown[] | undefined)?.[0]
      out.push({
        store: 'Beymen',
        segment: 'premium',
        title: [str(o.brandName), str(o.displayName), str(o.variant)].filter(Boolean).join(' '),
        url: absoluteUrl(url, 'https://www.beymen.com'),
        price: actual || original,
        originalPrice: original > actual ? original : undefined,
        image: typeof img === 'string' ? img.replace('{width}', '400').replace('{height}', '600') : undefined,
        brand: str(o.brandName) || undefined,
      })
    }
    return out
  },
}

function boynerGroupBrand(brand: 'İpekyol' | 'Twist', host: string, id: string): Source {
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

/* ------------------------------------------------------------------ */
/* Google Alışveriş (SerpApi): Trendyol, Hepsiburada ve markalar       */
/* ------------------------------------------------------------------ */

const MARKETPLACES = ['trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti', 'pttavm', 'modanisa', 'morhipo']
const PREMIUM = ['beymen', 'vakko', 'ipekyol', 'twist', 'machka', 'network', 'boyner', 'zara', 'mango', 'massimo', 'nocturne', 'roman', 'gizia', 'perspective', 'fabrika', 'adl', 'quzu']

function segmentForStore(store: string): Segment {
  const s = store.toLocaleLowerCase('tr')
  if (MARKETPLACES.some(m => s.includes(m))) return 'pazaryeri'
  if (PREMIUM.some(m => s.includes(m))) return 'premium'
  return 'marka'
}

export const googleShopping: Source = {
  id: 'google',
  name: 'Google Alışveriş (Trendyol, Hepsiburada, markalar)',
  segment: 'pazaryeri',
  searchUrl: q => `https://www.google.com/search?tbm=shop&hl=tr&gl=tr&q=${enc(womenQuery(q.full))}`,
  async run(q) {
    const key = process.env.SERPAPI_API_KEY
    if (!key) throw new Error('bağlantı kurulmadı')
    const params = new URLSearchParams({
      engine: 'google_shopping',
      q: womenQuery(q.full),
      gl: 'tr',
      hl: 'tr',
      google_domain: 'google.com.tr',
      num: '60',
      api_key: key,
    })
    const res = await fetch(`https://serpapi.com/search.json?${params}`, { cache: 'no-store' })
    const data = (await res.json()) as {
      error?: string
      shopping_results?: Record<string, unknown>[]
    }
    if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
    return (data.shopping_results || []).map(r => {
      const store = str(r.source) || 'Google Alışveriş'
      const price = parsePrice(r.extracted_price ?? r.price)
      const old = parsePrice(r.extracted_old_price ?? r.old_price)
      return {
        store,
        segment: segmentForStore(store),
        title: str(r.title),
        url: str(r.link) || str(r.product_link),
        price,
        originalPrice: old > price ? old : undefined,
        image: str(r.thumbnail) || undefined,
      }
    })
  },
}

export const DIRECT_SOURCES: Source[] = [n11, lcw, koton, penti, network, beymen, ipekyol]

/** İç giyim kategorilerinde Penti anlamlı; diğerlerinde Penti'yi atla */
export const LINGERIE_ONLY = new Set(['penti'])

/** Kullanıcının tek tıkla elle bakabileceği aramalar (her zaman gösterilir) */
export function manualLinks(q: SourceQuery) {
  return [
    { name: 'Trendyol', url: `https://www.trendyol.com/sr?q=${enc(womenQuery(q.full))}` },
    { name: 'Hepsiburada', url: `https://www.hepsiburada.com/ara?q=${enc(womenQuery(q.full))}` },
    { name: 'Beymen', url: `https://www.beymen.com/tr/search?q=${enc(q.full)}` },
    { name: 'Google Alışveriş', url: googleShopping.searchUrl(q) },
  ]
}
