/**
 * T-Soft altyapılı marka siteleri (Sarar, Roman...).
 * Arama sayfası (/arama?q=) ürünleri şu biçimde gömer:
 *   PRODUCT_DATA.push(JSON.parse('{\"id\":...,\"name\":...,\"total_sale_price\":...,\"url\":...}'))
 * total_sale_price = müşterinin ödediği (KDV dahil, indirimli) fiyat, total_base_price = indirimsiz fiyat.
 */
import { fetchPage, parsePrice, absoluteUrl } from '../fetch'
import { type RawItem, type Segment, type Source, enc, str, fullThenBroad } from './_shared'

export interface TsoftOptions {
  /** Başlıktan atılacak ek (ör. Roman: "Standart Renk") */
  stripName?: RegExp
  /** Stokta olmayanları (quantity 0) da al. Varsayılan: alma */
  includeOutOfStock?: boolean
}

// Kadın giyim araştırması: erkek / çocuk kategorilerini at
const NOT_WOMEN = /(^|[^a-zçğıöşü])(erkek|çocuk|cocuk|bebek)/

export function parseTsoftProducts(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  for (const m of html.matchAll(/PRODUCT_DATA\.push\(JSON\.parse\('((?:[^'\\]|\\.)*)'\)\)/g)) {
    try {
      out.push(JSON.parse(m[1].replace(/\\(.)/g, '$1')))
    } catch {
      // bozuk kayıt: atla
    }
  }
  return out
}

export function tsoftBrand(id: string, name: string, host: string, segment: Segment, opts: TsoftOptions = {}): Source {
  const searchUrl = (term: string) => `${host}/arama?q=${enc(term)}`
  return {
    id,
    name,
    segment,
    searchUrl: q => searchUrl(q.full),
    run(q) {
      return fullThenBroad(q, async term => {
        const html = await fetchPage(searchUrl(term))
        const seen = new Set<string>()
        const out: RawItem[] = []
        for (const o of parseTsoftProducts(html)) {
          if (!o.name || !o.url) continue
          if (!opts.includeOutOfStock && typeof o.quantity === 'number' && o.quantity <= 0) continue
          if (NOT_WOMEN.test(str(o.category_path).toLocaleLowerCase('tr'))) continue
          // url göreli: Sarar "sarar-nourris-siyah-elbise-18261", Roman "tr/products/17370/..."
          const url = absoluteUrl(str(o.url).replace(/^\/+/, ''), `${host}/`)
          if (!url || seen.has(url)) continue
          seen.add(url)
          const sale = parsePrice(o.total_sale_price)
          const base = parsePrice(o.total_base_price)
          const price = sale || base
          if (!price) continue
          let title = str(o.name).replace(/\s+/g, ' ').trim()
          if (opts.stripName) title = title.replace(opts.stripName, '').trim()
          const img = str(o.image)
          out.push({
            store: name,
            segment,
            // Sarar bazı ürün adlarında markayı zaten yazıyor ("Sarar Nourris ...")
            title: title.toLocaleLowerCase('tr').startsWith(name.toLocaleLowerCase('tr')) ? title : `${name} ${title}`,
            url,
            price,
            originalPrice: base > price ? base : undefined,
            image: img ? absoluteUrl(img, `${host}/`) || undefined : undefined,
            brand: name,
          })
        }
        return out
      })
    },
  }
}

export const sarar = tsoftBrand('sarar', 'Sarar', 'https://www.sarar.com', 'premium')

export const roman = tsoftBrand('roman', 'Roman', 'https://www.roman.com.tr', 'premium', {
  stripName: /\s*Standart Renk\s*$/i,
})
