/**
 * Beymen Club — Beymen'in kendi markası. Beymen araması (/tr/search?q=) ürünleri
 * "actualPrice" içeren JSON nesneleri olarak gömer. Sorgunun başına "beymen club" eklemek
 * aramayı bu markaya daraltıyor (deneme: 29/29 sonuç Beymen Club); yine de marka adına göre süzeriz.
 * Fiyat: actualPrice (indirimli etiket fiyatı). Ek olarak koşulsuz "Sepette" kampanyası varsa
 * (productPromotions[].campaignTitle = "Sepette") müşteri sepette o fiyatı öder; onu kullanırız.
 * "2 ve Üzeri" gibi koşullu kampanyalar yok sayılır.
 */
import { fetchPage, findJsonObjects, parsePrice, absoluteUrl } from '../fetch'
import { type RawItem, type Source, enc, str, fullThenBroad } from './_shared'

const HOST = 'https://www.beymen.com'
const BRAND_RE = /^beymen(\s+(club|collection))?$/i

const searchUrl = (term: string) => `${HOST}/tr/search?q=${enc(`beymen club ${term}`)}`

interface Promotion {
  campaignTitle?: string
  campaignDesc?: string
  promotedPrice?: number | string
  showPrice?: boolean
  showOnWeb?: boolean
}

function basketPrice(o: Record<string, unknown>): number {
  const promos = o.productPromotions as Promotion[] | undefined
  if (!Array.isArray(promos)) return 0
  let best = 0
  for (const p of promos) {
    if (p.showPrice === false || p.showOnWeb === false) continue
    if (!/^sepette$/i.test(str(p.campaignTitle).trim()) && !/^sepette$/i.test(str(p.campaignDesc).trim())) continue
    const v = parsePrice(p.promotedPrice)
    if (v > 0 && (!best || v < best)) best = v
  }
  return best
}

export const beymenClub: Source = {
  id: 'beymenclub',
  name: 'Beymen Club',
  segment: 'premium',
  searchUrl: q => searchUrl(q.full),
  run(q) {
    return fullThenBroad(q, async term => {
      const html = await fetchPage(searchUrl(term))
      const seen = new Set<string>()
      const out: RawItem[] = []
      for (const o of findJsonObjects(html, '"actualPrice"', 300)) {
        const path = str(o.productUrl)
        if (!path || !o.displayName || seen.has(path)) continue
        if (!BRAND_RE.test(str(o.brandName).trim())) continue
        if (o.gender && !/kad[iı]n/i.test(str(o.gender))) continue
        seen.add(path)
        const actual = parsePrice(o.actualPrice)
        const original = parsePrice(o.originalPrice)
        const tag = actual || original
        if (!tag) continue
        const basket = basketPrice(o)
        const price = basket && basket < tag ? basket : tag
        const img = (o.images as unknown[] | undefined)?.[0]
        const name = str(o.displayName).replace(/\s+/g, ' ').trim()
        const color = str(o.variant).trim()
        const withColor = color && !name.toLocaleLowerCase('tr').includes(color.toLocaleLowerCase('tr')) ? `${name} ${color}` : name
        out.push({
          store: 'Beymen Club',
          segment: 'premium',
          title: `Beymen Club ${withColor}`,
          url: absoluteUrl(path, HOST),
          price,
          originalPrice: original > price ? original : undefined,
          image: typeof img === 'string' ? img.replace('{width}', '400').replace('{height}', '600').replace(/ /g, '%20') : undefined,
          brand: 'Beymen Club',
        })
      }
      return out
    })
  },
}
