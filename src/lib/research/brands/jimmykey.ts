import * as cheerio from 'cheerio'
import { absoluteUrl, fetchPage, parsePrice } from '../fetch'
import { enc, fullThenBroad, type RawItem, type Source } from './_shared'

const BASE = 'https://www.jimmykey.com'

export const jimmykey: Source = {
  id: 'jimmykey',
  name: 'Jimmy Key',
  segment: 'orta',
  searchUrl: q => `${BASE}/tr/p/Cat/NewSearch?sr=${enc(q.full)}`,
  run(q) {
    return fullThenBroad(q, async term => {
      const html = await fetchPage(`${BASE}/tr/p/Cat/NewSearch?sr=${enc(term)}`)
      const $ = cheerio.load(html)
      const out: RawItem[] = []
      const seen = new Set<string>()
      $('.ProductList article.Prd').each((_, el) => {
        const card = $(el)
        // Fiyat ve ad veri öznitelikleri: amountPsf = liste, amount = satış fiyatı
        const box = card.find('.PrdItemBox[data-productname]').first()
        const name = (box.attr('data-productname') || '').replace(/\s+/g, ' ').trim()
        const link = box.find('a[href]').first().attr('href') || card.find('a[href^="/tr/"]').first().attr('href')
        const url = absoluteUrl(link, BASE)
        if (!name || !url || seen.has(url)) return
        const list = parsePrice(box.attr('data-amountpsf'))
        const sale = parsePrice(box.attr('data-amount'))
        // Öznitelik yoksa görünen fiyatlara düş
        const shown = parsePrice(card.find('.DiscountedAmount').first().text()) || parsePrice(card.find('.PPrice').last().text())
        const price = sale || shown || list
        if (!price) return
        const original = list || parsePrice(card.find('.PPOldPrice').first().text())
        seen.add(url)
        out.push({
          store: 'Jimmy Key',
          segment: 'orta',
          title: `Jimmy Key ${name} ${box.attr('data-colorname') || ''}`.trim(),
          url,
          price,
          originalPrice: original > price ? original : undefined,
          image: card.find('picture source[data-srcset]').first().attr('data-srcset')?.split(/[\s,]/)[0] || undefined,
          brand: 'Jimmy Key',
        })
      })
      return out
    })
  },
}
