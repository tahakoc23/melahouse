import * as cheerio from 'cheerio';

export interface ScrapedProductData {
  brand_name: string;
  title: string;
  domain: string;
  product_url: string;
  price: number;
  stock_status: 'stokta_var' | 'stokta_yok';
  color: string;
  fabric: string;
  sizes: string;
  sku: string;
  description: string;
  image_url: string;
  raw_metadata: Record<string, any>;
}

const DEFAULT_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0'
];

function getRandomUserAgent() {
  return DEFAULT_USER_AGENTS[Math.floor(Math.random() * DEFAULT_USER_AGENTS.length)];
}

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'Bilinmeyen Toptancı';
  }
}

function formatBrandFromDomain(domain: string): string {
  const clean = domain.replace(/\.(com|net|org|com\.tr|gov\.tr|edu\.tr|co)$/i, '').replace(/[-_]/g, ' ');
  return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Bulletproof Turkish Currency Price Parser
 */
function parseTurkishPrice(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val >= 30 ? Number(val.toFixed(2)) : 0;

  const str = val.toString().trim();
  if (!str) return 0;

  const currencyMatch = str.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:₺|TL|TRY)/i) ||
                        str.match(/(?:₺|TL|TRY)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i);

  let rawToken = currencyMatch ? currencyMatch[1] : '';

  if (!rawToken) {
    const tokens = str.match(/\d+(?:[.,]\d+)*/g);
    if (!tokens || tokens.length === 0) return 0;

    for (const tok of tokens) {
      let cleanTok = tok;
      if (cleanTok.includes('.') && cleanTok.includes(',')) {
        cleanTok = cleanTok.replace(/\./g, '').replace(',', '.');
      } else if (cleanTok.includes(',')) {
        cleanTok = cleanTok.replace(',', '.');
      } else if (cleanTok.includes('.') && /^\d{1,3}\.\d{3}$/.test(cleanTok)) {
        cleanTok = cleanTok.replace('.', '');
      }

      const num = parseFloat(cleanTok);
      if (!isNaN(num) && num >= 30 && num <= 500000) {
        return Number(num.toFixed(2));
      }
    }
    return 0;
  }

  let token = rawToken;
  if (token.includes('.') && token.includes(',')) {
    token = token.replace(/\./g, '').replace(',', '.');
  } else if (token.includes(',')) {
    token = token.replace(',', '.');
  } else if (token.includes('.') && /^\d{1,3}\.\d{3}$/.test(token)) {
    token = token.replace('.', '');
  }

  const parsed = parseFloat(token);
  if (!isNaN(parsed) && parsed >= 30 && parsed <= 500000) {
    return Number(parsed.toFixed(2));
  }

  return 0;
}

/**
 * Open-Source Cheerio Supplier HTML & JSON-LD Scraper for Wholesalers
 */

/* ------------------------------------------------------------------ */
/* Ticimax altyapılı toptancı siteleri (ör. fame.com.tr)                */
/* Ürün verisi sayfadaki "var productDetailModel = {...}" nesnesindedir. */
/* ------------------------------------------------------------------ */

function extractJsonAssignment(html: string, marker: string): Record<string, any> | null {
  const start = html.indexOf(marker)
  if (start === -1) return null
  const i = start + marker.length
  let depth = 0
  let inStr = false
  let e = i
  for (; e < html.length; e++) {
    const c = html[e]
    if (inStr) {
      if (c === '\\') e++
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') inStr = true
    else if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) break
    }
  }
  try {
    return JSON.parse(html.slice(i, e + 1))
  } catch {
    return null
  }
}

const titleCaseTr = (v: string) =>
  v
    .toLocaleLowerCase('tr')
    .split(' ')
    .map(w => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1))
    .join(' ')

function parseTicimax(html: string, url: string, domain: string): ScrapedProductData | null {
  const m = extractJsonAssignment(html, 'var productDetailModel = ')
  if (!m || !m.productName) return null
  const products: any[] = Array.isArray(m.products) ? m.products : []
  const first = products[0] || {}

  // Toptancı fiyatları genelde KDV hariç gösterir; maliyet KDV dahil hesaplanmalı.
  // Sunucu (yurt dışı IP) isteklerinde bazı alanlar 0 ya da boş gelebiliyor: ilk pozitif değeri al.
  const pos = (...vals: unknown[]) => {
    for (const v of vals) {
      const n = Number(v)
      if (Number.isFinite(n) && n > 0) return n
    }
    return 0
  }
  const vatRate = pos(first.kdvOrani, m.productVatRate, m.kdvOrani)
  // Yabancı para birimindeki tutar TL sanılmasın (maliyet hesabını bozar)
  const currency = String(m.productCurrency || first.paraBirimi || 'TRY').toUpperCase()
  const isTry = currency === 'TRY' || currency === 'TL'
  let net = isTry ? pos(first.urunSepetFiyati, first.indirimliFiyati, first.satisFiyati, m.productPrice) : 0
  const vat = pos(first.urunSepetFiyatiKDV, first.indirimliKDV, first.satisKDV)
  const vatIncluded = first.kdvDahil === true
  let priceWithVat = !isTry
    ? 0
    : pos(m.productPriceKDVIncluded) || (net ? (vatIncluded ? net : net + (vat || (net * vatRate) / 100)) : 0)
  let priceSource = priceWithVat ? 'productDetailModel' : ''
  if (!priceWithVat) {
    // Son çare: JSON-LD Offer. Ticimax burada vitrindeki fiyatı (KDV hariç) yayınlar;
    // oran okunamadıysa giyimdeki %10 KDV varsayılır ve kaynakta belirtilir.
    const ld = html.match(/"@type"\s*:\s*"Offer"[\s\S]{0,400}?"price"\s*:\s*"?([\d.,]+)"?/)
    const ldTry = /"priceCurrency"\s*:\s*"(try|tl)"/i.test(ld?.[0] || '')
    const ldPrice = ld && ldTry ? parseFloat(ld[1].replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')) : 0
    if (ldPrice > 0) {
      const rate = vatRate || 10
      net = ldPrice
      priceWithVat = vatIncluded ? ldPrice : ldPrice * (1 + rate / 100)
      priceSource = vatRate ? 'json-ld' : 'json-ld (KDV %10 varsayıldı)'
    }
  }

  const variants: any[] = Array.isArray(m.productVariantData) ? m.productVariantData : []
  const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))]
  const colors = uniq(variants.filter(v => /renk/i.test(v.ekSecenekTipiTanim || '')).map(v => titleCaseTr(String(v.tanim || '').trim())))
  const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', 'STD', 'STANDART']
  const sizeRank = (v: string) => {
    const i = SIZE_ORDER.indexOf(v.toLocaleUpperCase('tr'))
    return i >= 0 ? i : 100 + (parseFloat(v) || 0)
  }
  const sizes = uniq(variants.filter(v => /beden/i.test(v.ekSecenekTipiTanim || '')).map(v => String(v.tanim || '').trim())).sort(
    (a, b) => sizeRank(a) - sizeRank(b),
  )

  const tech: Record<string, string> = {}
  for (const t of Array.isArray(m.customTechnicalDetails) ? m.customTechnicalDetails : []) {
    const values = (t.degerler || []).map((d: any) => d.tanim).filter(Boolean).join(', ')
    if (t.tanim && values) tech[t.tanim] = values
  }
  const fabricContent = tech['Kumaş İçeriği'] || ''
  const fabricName = tech['Kumaş Adı'] || ''
  const fabric = [fabricName, fabricContent].filter(Boolean).join(' · ')

  const images: string[] = uniq(
    (Array.isArray(m.productImages) ? m.productImages : [])
      .sort((a: any, b: any) => (a.imageOrder ?? 0) - (b.imageOrder ?? 0))
      .map((im: any) => String(im.bigImagePath || im.imagePath || '')),
  )
  const breadcrumb: any[] = Array.isArray(m.breadCrumb) ? m.breadCrumb : []
  // En özel kategori: başka bir kategorinin üst kategorisi olmayan kayıt ("Üst Giyim" değil "Elbise")
  const parentIds = new Set(breadcrumb.map(b => b.pid))
  const leaf = breadcrumb.find(b => !parentIds.has(b.id)) || breadcrumb[0]
  const category = leaf ? String(leaf.tanim || '') : ''
  const totalStock = Number(m.totalStockAmount ?? products.reduce((a, p) => a + Number(p.stokAdedi || 0), 0))

  return {
    brand_name: String(m.brandName || formatBrandFromDomain(domain)),
    title: String(m.productName).trim(),
    domain,
    product_url: url,
    price: Math.round(priceWithVat * 100) / 100,
    stock_status: totalStock > 0 ? 'stokta_var' : 'stokta_yok',
    color: colors.join(', '),
    fabric,
    sizes: sizes.join(', '),
    sku: String(m.stockCode || first.stokKodu || ''),
    description: String(m.productShortDescription || category || '').trim(),
    image_url: images[0] || String(first.spotResimBuyukYolu || ''),
    raw_metadata: {
      platform: 'ticimax',
      images,
      category,
      colors,
      sizes,
      fabric_name: fabricName,
      fabric_content: fabricContent,
      technical: tech,
      price_without_vat: net ? Math.round(net * 100) / 100 : null,
      vat_rate: vatRate || (priceSource.startsWith('json-ld') ? 10 : null),
      price_includes_vat: true,
      price_source: priceSource || null,
      price_debug: priceWithVat
        ? undefined
        : { products: products.length, productPrice: m.productPrice ?? null, currency: m.productCurrency ?? null },
      assortment: tech['Asorti Bilgisi'] || null,
      season: tech['Sezon'] || null,
      total_stock: totalStock,
    },
  }
}

export async function scrapeSupplierProduct(targetUrl: string): Promise<ScrapedProductData> {
  const url = targetUrl.trim();
  const domain = extractDomain(url);
  const fallbackBrand = formatBrandFromDomain(domain);

  const fetchHtml = async (pageUrl: string) => {
    try {
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9',
          'Cache-Control': 'no-cache'
        },
        next: { revalidate: 0 }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.text();
    } catch (err: any) {
      console.error(`Fetch failed for ${pageUrl}:`, err);
      throw new Error(`Toptancı sitesine bağlanılamadı: ${err.message}`);
    }
  };

  let html = await fetchHtml(url);

  // Ticimax sunucu IP'sine göre para birimi seçer: Vercel (Frankfurt) EUR görür ve fiyat 0 gelir.
  // "currency=try" parametresi bu seçimi ezer; TL dışı bir sayfa geldiyse TL ile tekrar çek.
  if (html.includes('var productDetailModel') && /"productCurrency"\s*:\s*"(?!TRY")/.test(html)) {
    try {
      const tryUrl = new URL(url);
      tryUrl.searchParams.set('currency', 'try');
      html = await fetchHtml(tryUrl.toString());
    } catch (err) {
      console.error('TL sayfası alınamadı:', err);
    }
  }

  // Ticimax sitelerinde zengin ürün modeli var: renk, beden, kumaş, KDV dahil fiyat, tüm görseller
  const ticimax = parseTicimax(html, url, domain);
  if (ticimax) return ticimax;

  const $ = cheerio.load(html);

  let brand_name = '';
  let title = '';
  let price = 0;
  let stock_status: 'stokta_var' | 'stokta_yok' = 'stokta_var';
  let color = '';
  let fabric = '';
  let sizes = '';
  let sku = '';
  let description = '';
  let image_url = '';
  const rawMetadata: Record<string, any> = {};

  try {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const content = $(el).html();
        if (!content) return;
        const json = JSON.parse(content.trim());
        
        const rawItems = Array.isArray(json) ? json : (json['@graph'] || [json]);
        for (const item of rawItems) {
          if (item['@type'] === 'Product' || item['@type'] === 'http://schema.org/Product') {
            title = title || item.name || '';
            description = description || item.description || '';
            sku = sku || item.sku || item.mpn || '';
            if (item.brand) brand_name = brand_name || (typeof item.brand === 'string' ? item.brand : item.brand.name || '');
            if (item.material) fabric = fabric || (typeof item.material === 'string' ? item.material : item.material.name || '');
            if (item.color) color = color || (typeof item.color === 'string' ? item.color : item.color.name || '');
            
            if (item.image) {
              image_url = image_url || (Array.isArray(item.image) ? item.image[0] : (typeof item.image === 'string' ? item.image : item.image.url || ''));
            }

            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offers) {
              const parsedP = parseTurkishPrice(offers.price || offers.lowPrice || offers.highPrice);
              if (parsedP > 0 && price === 0) price = parsedP;

              const avail = (offers.availability || '').toString().toLowerCase();
              if (avail.includes('outofstock') || avail.includes('soldout')) {
                stock_status = 'stokta_yok';
              }
            }
            rawMetadata['jsonld'] = item;
          }
        }
      } catch {}
    });
  } catch {}

  if (!brand_name) brand_name = $('meta[property="og:site_name"]').attr('content') || fallbackBrand;
  if (!title) title = $('meta[property="og:title"]').attr('content') || $('h1').first().text() || $('title').text() || '';
  if (!description) description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
  if (!image_url) image_url = $('meta[property="og:image"]').attr('content') || '';

  if (price === 0) {
    const metaP = $('meta[property="product:price:amount"]').attr('content') || $('meta[property="og:price:amount"]').attr('content');
    if (metaP) price = parseTurkishPrice(metaP);
  }

  // Sadece " - Site Adı" / " | Site Adı" sonekini at; "6948 ELBİSE-SİYAH" gibi adlar bozulmasın
  title = title.replace(/\s+/g, ' ').replace(/\s+[-|]\s+[^-|]*$/, '').trim() || `${domain} Toptan Ürün`;
  description = description.replace(/\s+/g, ' ').trim().slice(0, 500);

  return {
    brand_name: brand_name || fallbackBrand,
    title,
    domain,
    product_url: url,
    price: price || 0,
    stock_status,
    color: color || '',
    fabric: fabric || '',
    sizes: sizes || '',
    sku: sku || '',
    description: description || 'Toptancı sitesinden çekildi.',
    image_url,
    raw_metadata: rawMetadata
  };
}

// Piyasa fiyat araştırması: src/lib/research/engine.ts
