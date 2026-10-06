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
export async function scrapeSupplierProduct(targetUrl: string): Promise<ScrapedProductData> {
  const url = targetUrl.trim();
  const domain = extractDomain(url);
  const fallbackBrand = formatBrandFromDomain(domain);

  let html = '';
  try {
    const res = await fetch(url, {
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

    html = await res.text();
  } catch (err: any) {
    console.error(`Fetch failed for ${url}:`, err);
    throw new Error(`Toptancı sitesine bağlanılamadı: ${err.message}`);
  }

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

// Rakip/piyasa fiyat araştırması marketResearch.ts içinde (gerçek arama sonuçları).
export { researchMarketPrices as scrapeCompetitorMarketplaces } from './marketResearch';
export type { CompetitorItem, CompetitorAnalysisResult } from './marketResearch';
