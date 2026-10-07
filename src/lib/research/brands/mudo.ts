/**
 * Mudo (Akinon). Liste sayfası ürün kartlarını sunucuda basıyor:
 * <div class="js-product-wrapper product-item" data-url data-price data-retail-price data-product-group-name="COLLECTION Kadın">
 * category_ids=7 → yalnızca "Kadın" ağacı (arama aksi halde erkek ürünlerini de getiriyor).
 */
import * as cheerio from 'cheerio'
import { absoluteUrl, fetchPage, parsePrice } from '../fetch'
import { enc, fullThenBroad, type RawItem, type Source } from './_shared'

const BASE = 'https://www.mudo.com.tr'
const KADIN = '7'

const listUrl = (term: string) => `${BASE}/list/?search_text=${enc(term)}&category_ids=${KADIN}`

export const mudo: Source = {
  id: 'mudo',
  name: 'Mudo',
  segment: 'orta',
  searchUrl: q => listUrl(q.full),
  run(q) {
    return fullThenBroad(q, async term => {
      const html = await fetchPage(listUrl(term))
      const $ = cheerio.load(html)
      const seen = new Set<string>()
      const out: RawItem[] = []
      $('.js-product-wrapper.product-item').each((_, el) => {
        const card = $(el)
        const group = card.attr('data-product-group-name') || ''
        // Kadın dışı (erkek, çocuk, ev) kartları at
        if (group && !/kad[ıi]n/i.test(group)) return
        const url = absoluteUrl(card.attr('data-url') || card.find('a.product-item__name').attr('href'), BASE)
        if (!url || seen.has(url)) return
        // Mudo bazı kadın ürünlerine "Erkek ..." adı veriyor (ör. "Erkek Siyah A Form Uzun Elbise" Kadın grubunda)
        const name = card.find('.product-item__name').first().text().replace(/\s+/g, ' ').trim().replace(/^Erkek\s+/i, 'Kadın ')
        const sale = parsePrice(card.attr('data-price'))
        const retail = parsePrice(card.attr('data-retail-price'))
        const price = sale || retail
        if (!name || !price) return
        seen.add(url)
        const img = card.find('img.js-main-image-desktop').attr('src') || card.find('img').first().attr('data-src')
        out.push({
          store: 'Mudo',
          segment: 'orta',
          title: `Mudo ${name}`,
          url,
          price,
          originalPrice: retail > price ? retail : undefined,
          image: img || undefined,
          brand: 'Mudo',
        })
      })
      return out
    })
  },
}
