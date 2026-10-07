import * as cheerio from 'cheerio'
import { absoluteUrl, fetchPage, parsePrice } from '../fetch'
import { enc, fullThenBroad, type RawItem, type Source } from './_shared'

const BASE = 'https://www.tozlu.com'

export const tozlu: Source = {
  id: 'tozlu',
  name: 'Tozlu',
  segment: 'alt',
  searchUrl: q => `${BASE}/aramasonucu?q=${enc(q.full)}`,
  run(q) {
    return fullThenBroad(q, async term => {
      const html = await fetchPage(`${BASE}/aramasonucu?q=${enc(term)}`)
      const $ = cheerio.load(html)
      const out: RawItem[] = []
      const seen = new Set<string>()
      $('.tzl-urun-karti[data-product-url]').each((_, el) => {
        const card = $(el)
        const url = absoluteUrl(card.attr('data-product-url'), BASE)
        if (!url || seen.has(url)) return
        const img = card.find('img.tzl-urun-resmi').first()
        // alt metni rengi de taşır: "Gülseli Tesettür Triko Elbise Siyah"
        const name = (img.attr('alt') || card.find('.tzl-urun-adi-metni').text()).replace(/\s+/g, ' ').trim()
        if (!name) return
        const list = parsePrice(card.find('.tzl-fiyat').first().text())
        const struck = parsePrice(card.find('.tzl-cizikli-fiyat').first().text())
        // "Sepette 1.709,99 TL": müşterinin ödediği fiyat
        const basket = parsePrice(card.find('.tzl-promosyon-metni-pembe-fiyat').first().text())
        const price = basket > 0 && basket < (list || Infinity) ? basket : list
        if (!price) return
        const original = Math.max(struck, list)
        seen.add(url)
        out.push({
          store: 'Tozlu',
          segment: 'alt',
          title: `Tozlu ${name}`,
          url,
          price,
          originalPrice: original > price ? original : undefined,
          image: img.attr('src') || img.attr('data-src') || undefined,
          brand: 'Tozlu',
        })
      })
      return out
    })
  },
}
