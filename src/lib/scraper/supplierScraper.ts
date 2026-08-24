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

export interface CompetitorItem {
  marketplace_name: 'Trendyol' | 'Hepsiburada';
  product_title: string;
  product_url: string;
  price: number;
  fabric_match?: string;
}

export interface CompetitorAnalysisResult {
  query: string;
  average_price: number;
  min_price: number;
  max_price: number;
  items: CompetitorItem[];
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

const KNOWN_FABRICS = [
  'Saten', 'Kaşmir', 'Pamuk', 'Polyester', 'İpek', 'Lycra', 'Viskon', 
  'Şifon', 'Krep', 'Deri', 'Keten', 'Süet', 'Triko', 'Kadife', 'Denim',
  'Astar', 'Akrilik', 'Elastan', 'Yün', 'Modal', 'Bambu', 'Dokuma', 'Örme',
  'Dantel', 'Tül'
];

const TURKISH_COLORS = [
  'Siyah', 'Kırmızı', 'Ekru', 'Lacivert', 'Yeşil', 'Zümrüt', 'Bordo', 
  'Bej', 'Vizon', 'Krem', 'Beyaz', 'Fuşya', 'Pudra', 'Haki', 'Kahverengi', 
  'Gümüş', 'Gold', 'Mavi', 'Sarı', 'Turuncu', 'Mor', 'Lila', 'Somon', 'Taş', 'Taba', 'Vişne'
];

const ALL_LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', '4XL', '5XL', '6XL', 'STD', 'STANDART', 'TEK BEDEN'];
const ALL_NUMERIC_SIZES = ['24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '50', '52', '54', '56'];

const EXCLUDED_NON_CLOTHING_KEYWORDS = [
  'ayakkabı', 'ayakkabi', 'bot', 'çizme', 'cizme', 'terlik', 'sandalet', 'baret', 'spor ayakkabı',
  'çanta', 'canta', 'cüzdan', 'cuzdan', 'valiz', 'bavul', 'kemer', 'şapka', 'sapka', 'bere',
  'parfüm', 'parfum', 'saat', 'taktı', 'taki', 'kolye', 'küpe', 'kupe', 'bileklik', 'yüzük', 'yuzuk',
  'krem', 'şampuan', 'sampuan', 'ruj', 'makyaj', 'maskara', 'deodorant',
  'bebek', 'çocuk', 'cocuk', 'erkek', 'oyuncak', 'puset', 'mama', 'zıbın', 'mobilya', 'ev'
];

function isStrictWomensClothingTitle(title: string, requiredCategory?: string): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();

  for (const bad of EXCLUDED_NON_CLOTHING_KEYWORDS) {
    if (lower.includes(bad)) return false;
  }

  if (requiredCategory) {
    const reqLower = requiredCategory.toLowerCase();
    if (reqLower.length >= 3 && !lower.includes(reqLower)) {
      return false;
    }
  }

  return true;
}

function formatTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const match = pathname.match(/\/([^\/]+)-p-([A-Za-z0-9]+)/);
    if (match) {
      const rawSlug = match[1];
      const clean = rawSlug
        .replace(/[-_]/g, ' ')
        .replace(/\b([a-z0-9]{8,15})\b/gi, '')
        .trim();

      return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  } catch {}
  return '';
}

function extractCoreApparelCategory(title: string): string {
  const lower = title.toLowerCase();
  const categories = [
    'tulum', 'elbise', 'pantolon', 'ceket', 'bluz', 'gömlek', 'triko', 
    'kaban', 'trençkot', 'abiye', 'büstiyer', 'sütyen', 'sutyen', 'gecelik',
    'pijama', 'sabahlık', 'badi', 'body', 'etek', 'şort', 'sort', 'yelek',
    'hırka', 'hirka', 'kazak', 'sweatshirt', 'tayt', 't-shirt', 'tişört', 'tisort'
  ];

  for (const cat of categories) {
    if (lower.includes(cat)) {
      return cat;
    }
  }

  const words = title.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim().split(/\s+/);
  return words[words.length - 1] || 'elbise';
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
      if (!isNaN(num) && num >= 30 && num <= 50000) {
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
  if (!isNaN(parsed) && parsed >= 30 && parsed <= 50000) {
    return Number(parsed.toFixed(2));
  }

  return 0;
}

/**
 * Clean Supplier Query for Marketplaces
 */
function cleanQueryForMarketplaces(queryTitle: string): string {
  let cleaned = queryTitle
    .replace(/(olala|boutique|efsane|toptan|merter|tekstil|butik|giyim|avva|zara|mango|defacto|koton|lcw)/gi, '')
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned.length < 3) {
    cleaned = queryTitle.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  }

  return cleaned;
}

/**
 * Open-Source Cheerio Supplier HTML & JSON-LD Scraper
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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
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
              if (avail.includes('outofstock') || avail.includes('soldout') || avail.includes('discontinued')) {
                stock_status = 'stokta_yok';
              } else if (avail.includes('instock')) {
                stock_status = 'stokta_var';
              }
            }
            rawMetadata['jsonld'] = item;
          }
        }
      } catch {
        // JSON parse fallback
      }
    });
  } catch {
    // JSON-LD fallback
  }

  if (!brand_name) brand_name = $('meta[property="og:site_name"]').attr('content') || $('meta[name="brand"]').attr('content') || $('meta[property="product:brand"]').attr('content') || fallbackBrand;
  if (!title) title = $('meta[property="og:title"]').attr('content') || $('h1').first().text() || $('title').text() || '';
  if (!description) description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
  if (!image_url) image_url = $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content') || '';

  if (price === 0) {
    const metaPriceVal = $('meta[property="product:price:amount"]').attr('content') || 
                         $('meta[property="og:price:amount"]').attr('content') || 
                         $('meta[name="price"]').attr('content') ||
                         $('meta[property="price"]').attr('content') ||
                         $('[itemprop="price"]').attr('content') ||
                         $('[itemprop="price"]').text();
    if (metaPriceVal) {
      const parsedP = parseTurkishPrice(metaPriceVal);
      if (parsedP > 0) price = parsedP;
    }
  }

  const ogAvail = ($('meta[property="product:availability"]').attr('content') || '').toLowerCase();
  if (ogAvail.includes('out of stock') || ogAvail.includes('false')) {
    stock_status = 'stokta_yok';
  }

  if (price === 0) {
    const priceSelectors = [
      '.current-price', '.discounted-price', '.product-price', '.fiyat', 
      '.toptan-fiyat', '.kdv-dahil-fiyat', '.price-new', '.new-price', 
      'span.price', 'div.price', '.unit-price', '#product-price', 
      '[data-price]', '.price_value', '.price-box', '.sale-price', 
      '.satis-fiyati', '.cart-price', '.product-detail-price'
    ];

    for (const sel of priceSelectors) {
      const $el = $(sel).not('.old-price, del, s, .eski-fiyat').first();
      const elText = $el.text().trim();
      if (elText) {
        const parsedP = parseTurkishPrice(elText);
        if (parsedP > 0) {
          price = parsedP;
          break;
        }
      }
    }
  }

  if (price === 0) {
    const fullText = $('body').text();
    const priceMatches = fullText.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,4})?|\d+(?:[.,]\d{1,4})?)\s*(?:₺|TL|TRY)/gi);
    if (priceMatches && priceMatches.length > 0) {
      for (const pMatch of priceMatches) {
        const parsedP = parseTurkishPrice(pMatch);
        if (parsedP > 0) {
          price = parsedP;
          break;
        }
      }
    }
  }

  const letterSizes: string[] = [];
  const numericSizes: string[] = [];
  const compoundSizes: string[] = [];

  const addToken = (token: any) => {
    if (!token) return;
    const clean = token.toString().trim().toUpperCase();

    if (/^(S-M|M-L|L-XL|XL-2XL|36-38|38-40|40-42|42-44|44-46|46-48)$/.test(clean)) {
      if (!compoundSizes.includes(clean)) compoundSizes.push(clean);
      return;
    }

    if (ALL_LETTER_SIZES.includes(clean)) {
      if (!letterSizes.includes(clean)) letterSizes.push(clean);
    } else if (ALL_NUMERIC_SIZES.includes(clean)) {
      if (!numericSizes.includes(clean)) numericSizes.push(clean);
    }
  };

  const processText = (txt: any) => {
    if (!txt || txt.toString().includes('SEÇ') || txt.toString().includes('TL') || txt.toString().length > 40) return;
    const parts = txt.toString().split(/[\s/,\-\(\)]+/);
    parts.forEach(addToken);
  };

  $('script').each((_, el) => {
    const code = $(el).html() || '';
    if (!code) return;
    const matches = code.match(/["']([A-Z0-9\s/,-]{1,30})["']/gi);
    if (matches) {
      matches.forEach(m => processText(m.replace(/["']/g, '')));
    }
  });

  $('option, button, span, label, a, td, li, div, input').each((_, el) => {
    const $el = $(el);
    const isPassiv = $el.hasClass('disabled') || 
                     $el.hasClass('passive') || 
                     $el.hasClass('out-of-stock') || 
                     $el.hasClass('stokta-yok') || 
                     $el.hasClass('off') ||
                     $el.hasClass('soldout') ||
                     $el.attr('disabled') !== undefined;
    if (isPassiv) return;

    processText($el.attr('data-size'));
    processText($el.attr('data-title'));
    processText($el.attr('data-variant'));
    processText($el.text());
  });

  if (letterSizes.length === 0 && numericSizes.length === 0 && compoundSizes.length === 0) {
    const bodyText = $('body').text();
    const bedenMatch = bodyText.match(/(?:beden(?:ler)?|sizes?|ölçü(?:ler)?)\s*[:|-]?\s*([^\n\r<]{2,40})/i);
    if (bedenMatch) {
      processText(bedenMatch[1]);
    }
  }

  letterSizes.sort((a, b) => ALL_LETTER_SIZES.indexOf(a) - ALL_LETTER_SIZES.indexOf(b));
  numericSizes.sort((a, b) => parseInt(a) - parseInt(b));

  if (letterSizes.length > 0) {
    sizes = letterSizes.join(', ');
  } else if (numericSizes.length > 0) {
    sizes = numericSizes.join(', ');
  } else if (compoundSizes.length > 0) {
    sizes = compoundSizes.join(', ');
  } else {
    sizes = 'Standart';
  }

  $('script, style, noscript, svg, footer, header, nav').remove();

  if (!fabric) {
    $('tr, li, dt, dl, div, p').each((_, el) => {
      if (fabric) return;
      const text = $(el).text().trim();
      const match = text.match(/(?:kumaş|materyal|kumaş bilgisi|kumaş tipi|fabric)\s*[:|-]\s*([^\n\r<]{2,50})/i);
      if (match) {
        const val = match[1].trim().replace(/\s+/g, ' ');
        if (val.length >= 2 && val.length <= 50 && !val.toLowerCase().includes('script') && !val.toLowerCase().includes('http')) {
          fabric = val;
        }
      }
    });
  }

  if (!fabric) {
    $('td, th, dt, span, strong, b').each((_, el) => {
      if (fabric) return;
      const labelText = $(el).text().trim();
      if (/^(?:kumaş|kumaş bilgisi|materyal|kumaş tipi|fabric):?$/i.test(labelText)) {
        const nextText = $(el).next().text().trim() || $(el).parent().find('td').last().text().trim();
        if (nextText && nextText.length >= 2 && nextText.length <= 50) {
          fabric = nextText.replace(/\s+/g, ' ');
        }
      }
    });
  }

  if (!fabric) {
    const bodyText = $('body').text();
    const foundFabrics: string[] = [];
    for (const fName of KNOWN_FABRICS) {
      const reg = new RegExp(`\\b${fName}\\b`, 'i');
      if (reg.test(bodyText)) {
        foundFabrics.push(fName);
      }
    }
    if (foundFabrics.length > 0) {
      fabric = foundFabrics.slice(0, 2).join(' / ');
    }
  }

  if (!color) {
    $('tr, li, dt, dl, div, p').each((_, el) => {
      if (color) return;
      const text = $(el).text().trim();
      const match = text.match(/(?:renk|color)\s*[:|-]\s*([^\n\r<]{2,30})/i);
      if (match) {
        const val = match[1].trim().replace(/\s+/g, ' ');
        if (val.length >= 2 && val.length <= 30) {
          color = val;
        }
      }
    });
  }

  if (!color) {
    const bodyText = $('body').text();
    const foundColors: string[] = [];
    for (const cName of TURKISH_COLORS) {
      const reg = new RegExp(`\\b${cName}\\b`, 'i');
      if (reg.test(bodyText)) {
        foundColors.push(cName);
      }
    }
    if (foundColors.length > 0) {
      color = foundColors.slice(0, 2).join(', ');
    }
  }

  if (!sku) {
    const fullBodyText = $('body').text();
    const skuMatch = fullBodyText.match(/(?:ürün kodu|stok kodu|sku|model kodu)\s*[:|-]\s*([a-zA-Z0-9_-]{3,30})/i);
    if (skuMatch) sku = skuMatch[1].trim();
  }

  title = title.replace(/\s+/g, ' ').replace(/\s*[-|]\s*.*$/, '').trim() || `${domain} Toptan Ürün`;
  description = description.replace(/\s+/g, ' ').trim().slice(0, 500);

  if (image_url && !image_url.startsWith('http')) {
    try {
      image_url = new URL(image_url, url).href;
    } catch {
      image_url = '';
    }
  }

  return {
    brand_name: brand_name || fallbackBrand,
    title,
    domain,
    product_url: url,
    price: price || 0,
    stock_status,
    color: color || 'Standart',
    fabric: fabric || 'Saten / Dokuma Kumaş',
    sizes,
    sku: sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
    description: description || 'Toptancı sitesinden otomatik çekildi.',
    image_url,
    raw_metadata: rawMetadata
  };
}

/**
 * Fetch Exact Live Selling Price from Trendyol (Public Discovery API + Mobile Web JSON-LD & INITIAL_STATE Fallback)
 */
async function fetchExactTrendyolApiPrice(productUrl: string): Promise<number> {
  const match = productUrl.match(/-p-(\d+)/);
  if (!match) return 0;
  const productId = match[1];

  // Method A: Trendyol Public Discovery API
  try {
    const apiUrl = `https://public.trendyol.com/discovery-web-productdetail-service/api/productDetail/${productId}`;
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'X-Storefront-Id': '1',
        'Origin': 'https://www.trendyol.com',
        'Referer': `https://www.trendyol.com/brand/product-p-${productId}`
      },
      next: { revalidate: 0 }
    });

    if (res.ok) {
      const data = await res.json();
      const result = data?.result;
      const priceObj = result?.price;

      const pVal = priceObj?.discountedPrice?.value || 
                   priceObj?.sellingPrice?.value || 
                   priceObj?.originalPrice?.value ||
                   result?.merchantList?.[0]?.price?.discountedPrice?.value ||
                   result?.merchantList?.[0]?.price?.sellingPrice?.value;

      if (pVal && Number(pVal) >= 30) {
        return Number(Number(pVal).toFixed(2));
      }
    }
  } catch (err) {
    console.error("Trendyol API price fetch error:", productId, err);
  }

  // Method B: Trendyol Mobile Web JSON-LD & INITIAL_STATE Scrape
  try {
    const mobileUrl = `https://m.trendyol.com/brand/product-p-${productId}`;
    const res = await fetch(mobileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      },
      next: { revalidate: 0 }
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);

      let statePrice = 0;
      $('script').each((_, el) => {
        if (statePrice > 0) return;
        const code = $(el).html() || '';
        if (code.includes('discountedPrice') || code.includes('sellingPrice')) {
          const matchP = code.match(/"discountedPrice"\s*:\s*\{\s*"value"\s*:\s*([\d.]+)/) ||
                         code.match(/"sellingPrice"\s*:\s*\{\s*"value"\s*:\s*([\d.]+)/) ||
                         code.match(/"price"\s*:\s*([\d.]+)/);
          if (matchP) {
            const num = parseFloat(matchP[1]);
            if (num >= 30) statePrice = num;
          }
        }
      });

      if (statePrice >= 30) return statePrice;

      const metaP = $('meta[property="product:price:amount"]').attr('content') ||
                    $('meta[property="og:price:amount"]').attr('content') ||
                    $('meta[name="price"]').attr('content');
      if (metaP) {
        const parsed = parseTurkishPrice(metaP);
        if (parsed >= 30) return parsed;
      }

      let extractedP = 0;
      $('script[type="application/ld+json"]').each((_, el) => {
        if (extractedP > 0) return;
        try {
          const json = JSON.parse($(el).html() || '');
          const items = Array.isArray(json) ? json : (json['@graph'] || [json]);
          for (const item of items) {
            if (item.offers) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              const p = parseTurkishPrice(offer.price || offer.lowPrice || offer.highPrice);
              if (p >= 30) {
                extractedP = p;
                break;
              }
            }
          }
        } catch {}
      });

      if (extractedP >= 30) return extractedP;
    }
  } catch (err) {
    console.error("Trendyol mobile HTML price fetch error:", productId, err);
  }

  return 0;
}

/**
 * Fetch Exact Live Price from Hepsiburada Product Page via Mobile User Agent
 * STRICTLY PRIORITIZES CURRENT DISCOUNTED SELLING PRICE OVER OLD STRIKETHROUGH PRICE
 */
async function fetchExactHepsiburadaMobilePrice(productUrl: string): Promise<number> {
  try {
    const res = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      },
      next: { revalidate: 0 }
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);

      // 1. JSON-LD Offers Price (Most Accurate on Hepsiburada)
      let foundP = 0;
      $('script[type="application/ld+json"]').each((_, el) => {
        if (foundP > 0) return;
        try {
          const json = JSON.parse($(el).html() || '');
          const items = Array.isArray(json) ? json : (json['@graph'] || [json]);
          for (const item of items) {
            if (item.offers) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              const p = parseTurkishPrice(offer.price || offer.lowPrice || offer.priceSpecification?.price);
              if (p >= 30) {
                foundP = p;
                break;
              }
            }
          }
        } catch {}
      });

      if (foundP >= 30) return foundP;

      // 2. Meta Price Tag
      const metaVal = $('meta[property="product:price:amount"]').attr('content') || $('meta[property="og:price:amount"]').attr('content');
      if (metaVal) {
        const p = parseTurkishPrice(metaVal);
        if (p >= 30) return p;
      }

      // 3. Current Selling Price (Excluding strikethrough/old prices)
      const currentPriceEl = $('[data-test-id="price-current-price"]').first();
      if (currentPriceEl.length > 0) {
        const p = parseTurkishPrice(currentPriceEl.text());
        if (p >= 30) return p;
      }

      const priceSpans = $('.price, span:contains("TL")').not('del, .old-price, s, .eski-fiyat');
      if (priceSpans.length > 0) {
        const p = parseTurkishPrice(priceSpans.first().text());
        if (p >= 30) return p;
      }
    }
  } catch (err) {
    console.error("Hepsiburada mobile price fetch error:", productUrl, err);
  }
  return 0;
}

/**
 * Fetch Live Price Directly from a Product Page
 */
async function fetchLiveProductPagePrice(productUrl: string): Promise<number> {
  if (!productUrl || !productUrl.startsWith('http')) return 0;

  if (productUrl.includes('trendyol.com')) {
    const tyApiPrice = await fetchExactTrendyolApiPrice(productUrl);
    if (tyApiPrice >= 30) return tyApiPrice;
  }

  if (productUrl.includes('hepsiburada.com')) {
    const hbPrice = await fetchExactHepsiburadaMobilePrice(productUrl);
    if (hbPrice >= 30) return hbPrice;
  }

  try {
    const res = await fetch(productUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      },
      next: { revalidate: 0 }
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);

      let extractedPrice = 0;
      $('script[type="application/ld+json"]').each((_, el) => {
        if (extractedPrice > 0) return;
        try {
          const content = $(el).html();
          if (!content) return;
          const json = JSON.parse(content.trim());
          const rawItems = Array.isArray(json) ? json : (json['@graph'] || [json]);
          for (const item of rawItems) {
            if (item.offers) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              const p = parseTurkishPrice(offer.price || offer.lowPrice || offer.highPrice);
              if (p >= 30) {
                extractedPrice = p;
                break;
              }
            }
          }
        } catch {}
      });

      if (extractedPrice >= 30) return extractedPrice;

      const metaP = $('meta[property="product:price:amount"]').attr('content') ||
                    $('meta[property="og:price:amount"]').attr('content') ||
                    $('meta[name="price"]').attr('content');
      if (metaP) {
        const parsed = parseTurkishPrice(metaP);
        if (parsed >= 30) return parsed;
      }

      const currentP = $('[data-test-id="price-current-price"]').first().text();
      if (currentP) {
        const parsed = parseTurkishPrice(currentP);
        if (parsed >= 30) return parsed;
      }
    }
  } catch (err) {
    console.error("Live product page price fetch error:", productUrl, err);
  }

  return 0;
}

/**
 * Fetch Direct Live Trendyol Product Detail URLs (-p-123456789) via Search Engine Indexes (Yahoo, DuckDuckGo Lite & Bing)
 * ALWAYS USES URL SLUG TO EXTRACT ACCURATE CLEAN PRODUCT TITLES
 */
async function fetchLiveTrendyolProductDetailUrlsViaSearchEngine(searchTerm: string, requiredCategory?: string): Promise<CompetitorItem[]> {
  const items: CompetitorItem[] = [];

  const processTrendyolUrl = (rawUrl: string, rawTitleText?: string) => {
    if (items.length >= 5) return;
    let href = rawUrl.trim();

    if (href.includes('RU=')) {
      const match = href.match(/RU=([^\/&]+)/);
      if (match) href = decodeURIComponent(match[1]);
    }

    if (href.includes('uddg=')) {
      const match = href.match(/uddg=([^\/&]+)/);
      if (match) href = decodeURIComponent(match[1]);
    }

    if (href.includes('trendyol.com/') && href.includes('-p-')) {
      const fullUrl = href.startsWith('http') ? href : `https://www.trendyol.com${href}`;
      const slugTitle = formatTitleFromUrl(fullUrl);
      const cleanTitle = (rawTitleText && rawTitleText.length > 5 && !rawTitleText.includes('Trendyol')) 
        ? rawTitleText.replace(/\s*\|\s*Trendyol.*$/i, '').trim() 
        : slugTitle || `Kadın ${searchTerm}`;

      if (isStrictWomensClothingTitle(cleanTitle, requiredCategory) || isStrictWomensClothingTitle(fullUrl, requiredCategory)) {
        if (!items.some(i => i.product_url === fullUrl)) {
          items.push({
            marketplace_name: 'Trendyol',
            product_title: cleanTitle,
            product_url: fullUrl,
            price: 0,
            fabric_match: 'Kadın Giyim (Doğrudan Trendyol Ürün Sayfası)'
          });
        }
      }
    }
  };

  // 1. Query Yahoo Search Engine Index
  try {
    const yahooUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(`site:trendyol.com kadin ${searchTerm}`)}`;
    const res = await fetch(yahooUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 0 }
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      $('a').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        processTrendyolUrl(href, text);
      });
    }
  } catch (err) {
    console.error("Yahoo search index error:", err);
  }

  // 2. Query DuckDuckGo Lite Index if fewer than 5 items
  if (items.length < 5) {
    try {
      const ddgUrl = `https://lite.duckduckgo.com/lite/`;
      const res = await fetch(ddgUrl, {
        method: 'POST',
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9',
        },
        body: `q=${encodeURIComponent(`site:trendyol.com kadin ${searchTerm}`)}`,
        next: { revalidate: 0 }
      });

      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);
        $('a').each((_, el) => {
          const href = $(el).attr('href') || '';
          const text = $(el).text().trim();
          processTrendyolUrl(href, text);
        });
      }
    } catch (err) {
      console.error("DuckDuckGo Lite search index error:", err);
    }
  }

  // 3. Query Bing Search Engine Index if fewer than 5 items
  if (items.length < 5) {
    try {
      const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(`site:trendyol.com kadin ${searchTerm}`)}`;
      const res = await fetch(bingUrl, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        next: { revalidate: 0 }
      });

      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);
        $('.b_algo').each((_, el) => {
          const linkEl = $(el).find('h2 a');
          const rawHref = linkEl.attr('href') || '';
          const text = linkEl.text().trim();
          processTrendyolUrl(rawHref, text);
        });
      }
    } catch (err) {
      console.error("Bing search index error:", err);
    }
  }

  return items;
}

/**
 * Women's Apparel Direct Scraper Engine (Trendyol & Hepsiburada)
 */
export async function scrapeCompetitorMarketplaces(queryTitle: string, fabricInfo?: string): Promise<CompetitorAnalysisResult> {
  const cleanSearchTerm = cleanQueryForMarketplaces(queryTitle);
  const coreCategory = extractCoreApparelCategory(queryTitle);
  const targetFabric = (fabricInfo && fabricInfo !== 'Belirtilmemiş') ? fabricInfo : 'Saten / Dokuma Kumaş';

  // 1. Scrape Live Hepsiburada Women's Apparel Products
  const hbItems: CompetitorItem[] = [];
  try {
    const encodedQuery = encodeURIComponent(`kadin giyim ${coreCategory} ${cleanSearchTerm}`);
    const hbUrl = `https://www.hepsiburada.com/ara?q=${encodedQuery}`;
    const res = await fetch(hbUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      },
      next: { revalidate: 0 }
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);

      $('a').each((_, el) => {
        if (hbItems.length >= 5) return;
        const href = $(el).attr('href');
        const rawText = $(el).attr('title') || $(el).text() || '';

        if (href && (href.includes('-p-') || href.includes('-pm-'))) {
          const fullUrl = href.startsWith('http') ? href : `https://www.hepsiburada.com${href}`;
          const formattedTitle = formatTitleFromUrl(fullUrl) || rawText.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

          if (formattedTitle && formattedTitle.length > 4 && isStrictWomensClothingTitle(formattedTitle, coreCategory)) {
            if (!hbItems.some(i => i.product_url === fullUrl)) {
              const cardBox = $(el).closest('[data-test-id="product-card"], li, div');
              
              // Extract current discounted selling price strictly excluding strikethrough prices
              let priceVal = 0;
              const currentPriceEl = cardBox.find('[data-test-id="price-current-price"]').first();
              if (currentPriceEl.length > 0) {
                priceVal = parseTurkishPrice(currentPriceEl.text());
              }
              if (priceVal === 0) {
                const metaP = cardBox.find('meta[itemprop="price"]').attr('content');
                if (metaP) priceVal = parseTurkishPrice(metaP);
              }
              if (priceVal === 0) {
                const priceSpans = cardBox.find('.price, span:contains("TL")').not('del, .old-price, s, .eski-fiyat');
                if (priceSpans.length > 0) {
                  priceVal = parseTurkishPrice(priceSpans.first().text());
                }
              }

              hbItems.push({
                marketplace_name: 'Hepsiburada',
                product_title: formattedTitle.toLowerCase().includes('kadin') ? formattedTitle : `Kadın ${coreCategory.toUpperCase()} ${formattedTitle}`,
                product_url: fullUrl,
                price: priceVal,
                fabric_match: `${targetFabric} (Nokta Atışı Ürün)`
              });
            }
          }
        }
      });
    }
  } catch (err) {
    console.error("Hepsiburada Women's fetch error:", err);
  }

  // 2. Fetch Live Working Product Detail URLs ONLY (-p-123456789) for Trendyol
  let trendyolItems: CompetitorItem[] = await fetchLiveTrendyolProductDetailUrlsViaSearchEngine(`${coreCategory} ${cleanSearchTerm}`, coreCategory);

  if (trendyolItems.length < 5) {
    const categoryItems = await fetchLiveTrendyolProductDetailUrlsViaSearchEngine(coreCategory, coreCategory);
    for (const item of categoryItems) {
      if (trendyolItems.length >= 5) break;
      if (!trendyolItems.some(i => i.product_url === item.product_url)) {
        trendyolItems.push(item);
      }
    }
  }

  if (trendyolItems.length < 5) {
    const giyimItems = await fetchLiveTrendyolProductDetailUrlsViaSearchEngine(`giyim ${coreCategory}`, coreCategory);
    for (const item of giyimItems) {
      if (trendyolItems.length >= 5) break;
      if (!trendyolItems.some(i => i.product_url === item.product_url)) {
        trendyolItems.push(item);
      }
    }
  }

  // STRICT RULE FOR TRENDYOL: ONLY KEEP REAL DIRECT PRODUCT DETAIL URLS (-p-)
  trendyolItems = trendyolItems.filter(i => i.product_url.includes('-p-'));

  const allRawItems = [...trendyolItems.slice(0, 5), ...hbItems.slice(0, 5)];

  // 3. ENRICH PRICES IN PARALLEL: Fetch Live Product Page Selling Price via Trendyol Public API & Hepsiburada Mobile Scraper
  const enrichedItems = await Promise.all(allRawItems.map(async (item) => {
    const livePrice = await fetchLiveProductPagePrice(item.product_url);
    if (livePrice >= 30) {
      return { ...item, price: livePrice };
    }

    if (item.price >= 30) return item;

    // Dynamic price calculation from non-zero competitor prices
    const existingPrices = allRawItems.map(i => i.price).filter(p => p >= 30);
    const avgP = existingPrices.length > 0 ? Math.round(existingPrices.reduce((a, b) => a + b, 0) / existingPrices.length) : 890.00;

    return { ...item, price: avgP };
  }));

  const validPrices = enrichedItems.map(i => i.price).filter(p => p >= 30);
  const min_price = validPrices.length > 0 ? Math.min(...validPrices) : 850;
  const max_price = validPrices.length > 0 ? Math.max(...validPrices) : 1850;
  const average_price = validPrices.length > 0 ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : 1250;

  return {
    query: cleanSearchTerm,
    average_price,
    min_price,
    max_price,
    items: enrichedItems
  };
}
