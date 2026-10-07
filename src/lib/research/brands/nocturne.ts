/**
 * Nocturne (kendi altyapısı). Arama sayfası (/Ara?q=) kartları sunucuda basıyor:
 *   <div class="pitem" data-product-id> .product-name a[href] ; .product-price → .oneprice | .newprice + .oldprice
 * Renk kartta yok; sayfadaki pushImpressionEcommerce('kod','ad','Nocturne','TRY',sıra,...,fiyat,eskiFiyat,'Siyah','görsel','url',...)
 * çağrılarından url'ye göre alınır. Arama VE mantığıyla çalışır; detaylı sorgu boş dönerse geniş sorguya düşülür.
 * Marka yalnızca kadın giyim satıyor.
 */
import * as cheerio from 'cheerio'
import { absoluteUrl, fetchPage, parsePrice } from '../fetch'
import { enc, fullThenBroad, type RawItem, type Source } from './_shared'

const BASE = 'https://www.nocturne.com.tr'

const searchUrl = (term: string) => `${BASE}/Ara?q=${enc(term)}`

const pathOf = (u: string) => {
  try {
    return new URL(u, BASE).pathname
  } catch {
    return ''
  }
}

/** pushImpressionEcommerce(...) argümanlarından url yolu → renk */
function colorsByPath(html: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const m of html.matchAll(/pushImpressionEcommerce\(([\s\S]*?)\)\s*[;\n]/g)) {
    const args = [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'|(-?\d+(?:\.\d+)?)/g)].map(a => a[1] ?? a[2])
    // ..., fiyat, eskiFiyat, renk, görsel, url, ...
    const urlIdx = args.findIndex(a => /^https?:\/\/[^/]*nocturne\.com\.tr\//.test(a))
    if (urlIdx < 3) continue
    const color = args[urlIdx - 2]
    if (color && !/^[\d.]+$/.test(color) && !/^https?:/.test(color)) map.set(pathOf(args[urlIdx]), color)
  }
  return map
}

export const nocturne: Source = {
  id: 'nocturne',
  name: 'Nocturne',
  segment: 'orta',
  searchUrl: q => searchUrl(q.full),
  run(q) {
    return fullThenBroad(q, async term => {
      const html = await fetchPage(searchUrl(term))
      const $ = cheerio.load(html)
      const colors = colorsByPath(html)
      const seen = new Set<string>()
      const out: RawItem[] = []
      $('.pitem').each((_, el) => {
        const card = $(el)
        const link = card.find('.product-name a').first()
        const href = link.attr('href') || card.find('a.item-main-photo').attr('href')
        const url = absoluteUrl(href, BASE)
        const name = (link.text() || link.attr('title') || '').replace(/\s+/g, ' ').trim()
        if (!url || !name || seen.has(url)) return
        const box = card.find('.product-price')
        const now = parsePrice(box.find('.newprice').text() || box.find('.oneprice').text())
        const old = parsePrice(box.find('.oldprice').text())
        const price = now || old
        if (!price) return
        seen.add(url)
        const color = colors.get(pathOf(url))
        const img = card.find('img.product-image-item').first()
        out.push({
          store: 'Nocturne',
          segment: 'orta',
          title: ['Nocturne', name, color && !name.toLocaleLowerCase('tr').includes(color.toLocaleLowerCase('tr')) ? color : '']
            .filter(Boolean)
            .join(' '),
          url,
          price,
          originalPrice: old > price ? old : undefined,
          image: img.attr('src') || img.attr('data-src') || undefined,
          brand: 'Nocturne',
        })
      })
      return out
    })
  },
}
