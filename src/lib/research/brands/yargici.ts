/**
 * Yargıcı (Next.js / Inveon). Arama sayfası ürünleri __NEXT_DATA__ içinde verir:
 *   props.pageProps.productList.products.data[] → productName, slug, color, price.newPrice/oldPrice,
 *   breadcrumb[] / categories[], pictures[].url
 * URL'deki sorgu parametreleri doğrudan filtreye dönüşür:
 *   pageSize=48 → sayfa boyu (varsayılan 12), Cinsiyet=34669 → yalnız KADIN.
 * Arama alaka sırası zayıf (gözlük, sepet, kolye de gelir), o yüzden giyim dışını eleriz.
 */
import { fetchPage, parsePrice } from '../fetch'
import { type RawItem, type Source, enc, str, fullThenBroad } from './_shared'

const HOST = 'https://www.yargici.com'
const KADIN = '34669' // "Cinsiyet" filtresindeki KADIN değeri

const searchUrl = (term: string) => `${HOST}/arama?q=${enc(term)}&Cinsiyet=${KADIN}&pageSize=48`

const lower = (s: string) => s.toLocaleLowerCase('tr')
const NOT_WOMEN = /(^|[^a-zçğıöşü])(erkek|çocuk|cocuk|bebek)/
// Aranan şey aksesuar / ayakkabı / ev ürünü değilse yalnız giyimi tut
// (kelime bazında: "kemerli elbise" giyimdir, "kemer" değildir)
const NON_APPAREL_WORD =
  /^(aksesuar|kolye|küpe|bileklik|yüzük|çanta|canta|cüzdan|ayakkabı|ayakkabi|bot|çizme|sandalet|terlik|babet|gözlük|gozluk|şapka|kemer|şal|eşarp|fular|takı|homeworks)(ı|i|u|ü|sı|si|su|sü|lar|ler|ları|leri)?$/
const isNonApparelQuery = (term: string) => lower(term).split(/\s+/).some(w => NON_APPAREL_WORD.test(w))

interface Named {
  name?: string
}

function categoryText(p: Record<string, unknown>): string {
  const names = (v: unknown) => (Array.isArray(v) ? (v as Named[]).map(c => str(c?.name)) : [])
  return lower([...names(p.breadcrumb), ...names(p.categories)].join(' > '))
}

function breadcrumbText(p: Record<string, unknown>): string {
  return lower(Array.isArray(p.breadcrumb) ? (p.breadcrumb as Named[]).map(c => str(c?.name)).join(' > ') : '')
}

function firstImage(p: Record<string, unknown>): string | undefined {
  const pics = p.pictures as { url?: string }[] | undefined
  if (Array.isArray(pics) && pics[0]?.url) return pics[0].url
  const rv = p.relatedVariants as { isSelected?: boolean; pictures?: { url?: string }[] }[] | undefined
  if (Array.isArray(rv)) {
    const v = rv.find(x => x.isSelected) ?? rv[0]
    if (v?.pictures?.[0]?.url) return v.pictures[0].url
  }
  return undefined
}

export const yargici: Source = {
  id: 'yargici',
  name: 'Yargıcı',
  segment: 'orta',
  searchUrl: q => `${HOST}/arama?q=${enc(q.full)}&Cinsiyet=${KADIN}`,
  run(q) {
    return fullThenBroad(q, async term => {
      const html = await fetchPage(searchUrl(term))
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
      if (!m) return []
      let products: Record<string, unknown>[] = []
      try {
        products = JSON.parse(m[1])?.props?.pageProps?.productList?.products?.data ?? []
      } catch {
        return []
      }
      const apparelOnly = !isNonApparelQuery(term)
      const seen = new Set<string>()
      const out: RawItem[] = []
      for (const p of products) {
        const name = str(p.productName).replace(/\s+/g, ' ').trim()
        const slug = str(p.slug)
        if (!name || !slug) continue
        const cats = categoryText(p)
        if (NOT_WOMEN.test(cats)) continue
        // Giyim ürünlerinin breadcrumb'ı "... > KADIN GİYİM > Elbise" biçiminde
        if (apparelOnly && !/giyim/.test(breadcrumbText(p))) continue
        const url = `${HOST}/${slug.replace(/^\/+/, '')}`
        if (seen.has(url)) continue
        seen.add(url)
        const price = p.price as Record<string, unknown> | undefined
        const sale = parsePrice(price?.newPrice)
        const old = parsePrice(price?.oldPrice)
        const amount = sale || old
        if (!amount) continue
        const color = str(p.color).trim()
        const withColor = color && color !== 'ST' && !lower(name).includes(lower(color)) ? `${name} ${color}` : name
        out.push({
          store: 'Yargıcı',
          segment: 'orta',
          title: `Yargıcı ${withColor}`,
          url,
          price: amount,
          originalPrice: old > amount ? old : undefined,
          image: firstImage(p),
          brand: 'Yargıcı',
        })
      }
      return out
    })
  },
}
