import * as cheerio from 'cheerio'
import { absoluteUrl, fetchPage, parsePrice } from '../fetch'
import { enc, str, type RawItem, type Source } from './_shared'

const BASE = 'https://www.colins.com.tr'

/**
 * Colin's arama motoru kelime sırasına duyarlı: "siyah elbise" boş dönerken "elbise siyah" sonuç verir,
 * "maxi elbise" gibi ikililer de bazen boş kalır. Bu yüzden sırayla birkaç varyant denenir.
 */
function variants(full: string, broad: string): string[] {
  const out: string[] = []
  const add = (s: string) => {
    const t = s.trim().replace(/\s+/g, ' ')
    if (t && !out.includes(t)) out.push(t)
  }
  for (const s of [full, broad]) {
    add(s)
    const w = s.trim().split(/\s+/)
    // Kategori (son kelime) öne: "siyah elbise" -> "elbise siyah"
    if (w.length > 1) add([w[w.length - 1], ...w.slice(0, -1)].join(' '))
  }
  const words = broad.trim().split(/\s+/)
  add(words[words.length - 1] || '')
  return out
}

async function search(term: string): Promise<RawItem[]> {
  const html = await fetchPage(`${BASE}/search?q=${enc(term)}`)
  const $ = cheerio.load(html)
  const out: RawItem[] = []
  const seen = new Set<string>()
  $('[data-variants]').each((_, el) => {
    const box = $(el)
    let ga: Record<string, unknown> = {}
    let v: Record<string, unknown> | undefined
    try {
      ga = JSON.parse(box.attr('data-ga') || '{}')
    } catch {}
    try {
      v = (JSON.parse(box.attr('data-variants') || '[]') as Record<string, unknown>[])[0]
    } catch {}
    if (!v) return
    // Yalnız kadın ürünleri ("Kadın Giyim", "Kadın Aksesuar"...)
    const category = str(ga.category)
    if (/erkek|çocuk|cocuk|kız|bebek/i.test(category)) return
    const name = str(v.name).replace(/\s+/g, ' ').trim()
    const url = absoluteUrl(str(v.url), BASE)
    if (!name || !url || seen.has(url)) return
    seen.add(url)
    const sale = parsePrice(v.price)
    const old = parsePrice(v.oldPrice)
    if (!sale) return
    const images = v.imageUrls as unknown[] | undefined
    out.push({
      store: "Colin's",
      segment: 'alt',
      // Ad rengi zaten içeriyor: "Regular Fit Baskılı Kadın Siyah Uzun Kol Elbise"
      title: `Colin's ${name}`,
      url,
      price: sale,
      originalPrice: old > sale ? old : undefined,
      image: str(images?.[0]) || undefined,
      brand: "Colin's",
    })
  })
  return out
}

export const colins: Source = {
  id: 'colins',
  name: "Colin's",
  segment: 'alt',
  // Kullanıcıya en çok sonuç veren sıra gösterilir ("elbise siyah")
  searchUrl: q => `${BASE}/search?q=${enc(variants(q.broad, q.broad)[1] || q.broad)}`,
  async run(q) {
    const out: RawItem[] = []
    const seen = new Set<string>()
    for (const term of variants(q.full, q.broad)) {
      for (const item of await search(term)) {
        if (seen.has(item.url)) continue
        seen.add(item.url)
        out.push(item)
      }
      if (out.length >= 4) break
    }
    return out
  },
}
