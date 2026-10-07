/**
 * Ticimax altyapılı marka siteleri (Setre, Barrels and Oil, Perspective...).
 *
 * Arama sayfası (/arama?q=) ürünleri tarayıcıda çiziyor; veri sayfanın kendi çağırdığı uç noktadan gelir:
 *   GET /api/product/GetProductList?c=<önbellek anahtarı>&FilterJson={..SearchKeyword..}&PagingJson={..}
 * Fiyat alanları (KDV hariç + ayrı KDV tutarı):
 *   productPriceOriginal(+KDV) = vitrinde büyük yazan (indirimli) fiyat, productSellPrice(+KDV) = üstü çizili fiyat.
 *
 * Para birimi: Ticimax IP'ye göre seçer; Frankfurt'tan çerezsiz istek USD/EUR döner ve API "currency=try"
 * parametresini dikkate almaz. Önce /arama?...&currency=try ile CultureSettings çerezi alınır (301, gövde ~500 bayt),
 * API bu çerezle çağrılır; yine de TRY gelmezse kaynak hata verir (yanlış kurla fiyat yazmaktansa).
 *
 * Arama VEYA mantığıyla çalışıyor ("siyah elbise" → siyah pantolonlar da gelir) ve alaka sıralaması yok;
 * bu yüzden en yeni ürünlerden geniş bir sayfa alıp kategori kelimesini (sorgunun son kelimesi) içerenleri
 * tutuyor, eşleşen kelime sayısına göre sıralıyoruz.
 */
import { BROWSER_HEADERS, FetchError, fetchPage } from '../fetch'
import { type RawItem, type Segment, type Source, enc, str, fullThenBroad } from './_shared'

const PAGE_SIZE = 80
const COOKIE_TTL_MS = 15 * 60 * 1000

// createCacheKey(): dil + para birimi + ülke fiyat tipi + üye fiyat tipi + giriş + mobil
const CACHE_KEY = 'trtry0000'

const FILTER_BASE = {
  CategoryIdList: [],
  BrandIdList: [],
  SupplierIdList: [],
  TagIdList: [],
  TagId: -1,
  FilterObject: [],
  MinStockAmount: -1,
  IsShowcaseProduct: -1,
  IsOpportunityProduct: -1,
  FastShipping: -1,
  IsNewProduct: -1,
  IsBestSeller: -1,
  IsDiscountedProduct: -1,
  IsShippingFree: -1,
  IsProductCombine: -1,
  MinPrice: 0,
  MaxPrice: 0,
  Point: -1,
  SearchKeyword: '',
  StrProductIds: '',
  IsSimilarProduct: false,
  RelatedProductId: 0,
  ProductKeyword: '',
  PageContentId: 0,
  StrProductIDNotEqual: '',
  IsVariantList: -1,
  IsVideoProduct: -1,
  ShowBlokVideo: -1,
  VideoSetting: { ShowProductVideo: 0, AutoPlayVideo: -1 },
  ShowList: 1,
  VisibleImageCount: 0,
  ShowCounterProduct: -1,
  ImageSliderActive: false,
  ProductListPageId: 0,
  ShowGiftHintActive: false,
  IsInStock: false,
  IsPriceRequest: true,
}

// "Erkek yaka" bir yaka tipi; onu değil erkek/çocuk ürünlerini at
const NOT_WOMEN = /(^|[^a-z])(erkek(?!\s+yaka)|cocuk|bebek)([^a-z]|$)/

/** Türkçe harfleri sadeleştir: "Sıyah Gömlek" → "siyah gomlek" */
function fold(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[ıİ]/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
}

const cookieCache = new Map<string, { cookie: string; at: number }>()

/** TL para birimini seçen oturum çerezini al (CultureSettings + TcmxSID) */
async function tryCookie(origin: string): Promise<string> {
  const hit = cookieCache.get(origin)
  if (hit && Date.now() - hit.at < COOKIE_TTL_MS) return hit.cookie
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${origin}/arama?q=elbise&currency=try`, {
      headers: BROWSER_HEADERS,
      redirect: 'manual',
      signal: controller.signal,
      cache: 'no-store',
    })
    const cookie = res.headers
      .getSetCookie()
      .map(c => c.split(';')[0])
      .filter(c => /^(CultureSettings|TcmxSID|SERVERID)=/.test(c))
      .join('; ')
    res.body?.cancel().catch(() => {})
    if (cookie.includes('CultureSettings=')) cookieCache.set(origin, { cookie, at: Date.now() })
    return cookie
  } catch {
    return ''
  } finally {
    clearTimeout(timer)
  }
}

const money = (net: unknown, kdv: unknown) => {
  const n = typeof net === 'number' ? net : 0
  const k = typeof kdv === 'number' ? kdv : 0
  return Math.round((n + k) * 100) / 100
}

export function ticimaxBrand(id: string, name: string, host: string, segment: Segment): Source {
  const origin = (/^https?:\/\//.test(host) ? host : `https://${host}`).replace(/\/+$/, '')
  const searchUrl = (term: string) => `${origin}/arama?q=${enc(term)}`
  const apiUrl = (term: string) => {
    const filter = { ...FILTER_BASE, SearchKeyword: term }
    const paging = { PageItemCount: PAGE_SIZE, PageNumber: 1, OrderBy: 'UK.ID', OrderDirection: 'DESC' }
    return (
      `${origin}/api/product/GetProductList?c=${CACHE_KEY}` +
      `&FilterJson=${enc(JSON.stringify(filter))}&PagingJson=${enc(JSON.stringify(paging))}` +
      `&CreateFilter=false&TransitionOrder=0&PageType=10&PageId=0`
    )
  }

  return {
    id,
    name,
    segment,
    searchUrl: q => searchUrl(q.full),
    async run(q) {
      const cookie = await tryCookie(origin)
      return fullThenBroad(q, async term => {
        const body = await fetchPage(apiUrl(term), {
          headers: {
            Accept: 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            Referer: searchUrl(term),
            ...(cookie ? { Cookie: cookie } : {}),
          },
        })
        let data: { products?: Record<string, unknown>[]; isError?: boolean; errorMessage?: string }
        try {
          data = JSON.parse(body)
        } catch {
          throw new FetchError('beklenmeyen yanıt')
        }
        if (data.isError) throw new FetchError(data.errorMessage || 'site hata döndürdü')
        const products = data.products || []
        const foreign = products.find(p => p.currencyISOCode && p.currencyISOCode !== 'TRY')
        if (foreign) throw new FetchError(`fiyatlar TL değil (${str(foreign.currencyISOCode)})`)

        const words = fold(term).split(/\s+/).filter(w => w.length >= 2)
        const head = words[words.length - 1] || ''
        const seen = new Set<string>()
        const scored: { item: RawItem; score: number; order: number }[] = []
        products.forEach((p, order) => {
          const productName = str(p.name).replace(/\s+/g, ' ').trim()
          const url = str(p.url)
          if (!productName || !url || seen.has(url)) return
          if (p.inStock === false) return
          const hay = fold(`${productName} ${str(p.category)}`)
          if (NOT_WOMEN.test(hay)) return
          // VEYA aramasının gürültüsü: kategori kelimesi (elbise, gömlek...) geçmeyenleri at
          if (head && !hay.includes(head)) return
          const shown = money(p.productPriceOriginal, p.productPriceOriginalKDV)
          const sell = money(p.productSellPrice, p.productSellPriceKDV)
          const prices = [shown, sell].filter(v => v > 0)
          if (!prices.length) return
          const price = Math.min(...prices)
          const high = Math.max(...prices)
          seen.add(url)
          scored.push({
            score: words.filter(w => hay.includes(w)).length,
            order,
            item: {
              store: name,
              segment,
              title: `${name} ${productName}`,
              url: new URL(url, `${origin}/`).toString(),
              price,
              originalPrice: high > price ? high : undefined,
              image: str(p.imageThumbPath) || undefined,
              brand: name,
            },
          })
        })
        return scored.sort((a, b) => b.score - a.score || a.order - b.order).map(s => s.item)
      })
    },
  }
}

export const setre = ticimaxBrand('setre', 'Setre', 'https://www.setre.com', 'orta')
export const barrelsandoil = ticimaxBrand('barrelsandoil', 'Barrels and Oil', 'https://www.barrelsandoil.com', 'orta')
export const perspective = ticimaxBrand('perspective', 'Perspective', 'https://www.perspective.com.tr', 'premium')
