import * as cheerio from 'cheerio'
import { absoluteUrl, fetchPage, parsePrice } from '../fetch'
import { enc, fullThenBroad, type RawItem, type Source } from './_shared'

const BASE = 'https://www.oxxo.com.tr'

export const oxxo: Source = {
  id: 'oxxo',
  name: 'Oxxo',
  segment: 'alt',
  searchUrl: q => `${BASE}/tr/p/Cat/NewSearch?sr=${enc(q.full)}`,
  run(q) {
    return fullThenBroad(q, async term => {
      const html = await fetchPage(`${BASE}/tr/p/Cat/NewSearch?sr=${enc(term)}`)
      const $ = cheerio.load(html)
      const out: RawItem[] = []
      const seen = new Set<string>()
      $('.ProductList .Prd').each((_, el) => {
        const card = $(el)
        const link = card.find('a[data-productName]').first()
        const name = (link.attr('data-productName') || card.find('.PName').first().text()).replace(/\s+/g, ' ').trim()
        const url = absoluteUrl(link.attr('href') || card.find('.product-info a').attr('href'), BASE)
        if (!name || !url || seen.has(url)) return
        // Görsel alt metni rengi başta taşır: "Siyah Boyundan Bağlamalı Midi Elbise"
        const alt = (card.find('img.PImage').first().attr('alt') || '').replace(/\s+/g, ' ').trim()
        const color = alt.toLocaleLowerCase('tr').endsWith(name.toLocaleLowerCase('tr')) ? alt.slice(0, alt.length - name.length).trim() : ''
        // İndirimde eski/yeni fiyat ayrı span'larda gelebilir; yoksa tek PPrice
        const area = card.find('.PriceArea').first()
        const old = parsePrice(area.find('.PPOldPrice, .OldPrice').first().text())
        const discounted = parsePrice(area.find('.DiscountedAmount, .NewPrice').first().text())
        const single = parsePrice(area.find('.PPrice').last().text()) || parsePrice(link.attr('data-price'))
        const price = discounted || single
        if (!price) return
        seen.add(url)
        out.push({
          store: 'Oxxo',
          segment: 'alt',
          title: `Oxxo ${name} ${color}`.trim(),
          url,
          price,
          originalPrice: old > price ? old : undefined,
          image: card.find('picture source[data-srcset]').first().attr('data-srcset')?.split(/[\s,]/)[0] || undefined,
          brand: 'Oxxo',
        })
      })
      return out
    })
  },
}
