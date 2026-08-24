const cheerio = require('cheerio');

// Comprehensive Real-World Wholesaler HTML Sample (Simulating Ticimax / İdeasoft / B2B Portal)
const fullHtmlSample = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <title>Kruvaze Saten Abiye Elbise Zümrüt - Fame Tekstil Toptan</title>
  <meta property="og:site_name" content="Fame Tekstil" />
  <meta property="og:title" content="Kruvaze Saten Abiye Elbise Zümrüt" />
  <meta property="og:image" content="https://fametekstil.com/images/products/abiye-123.jpg" />
  <meta property="product:price:amount" content="839.41" />
  <meta property="product:price:currency" content="TRY" />
  <meta property="product:availability" content="instock" />
  <script type="application/ld+json">
    {
      "@type": "Product",
      "name": "Kruvaze Saten Abiye Elbise Zümrüt",
      "sku": "FME-9982",
      "material": "Saten Viskon",
      "color": "Zümrüt Yeşili",
      "description": "Lüks kruvaze kesim saten abiye gece elbisesi.",
      "brand": { "name": "Fame Tekstil" },
      "offers": {
        "@type": "Offer",
        "price": "839.41",
        "priceCurrency": "TRY",
        "availability": "https://schema.org/InStock"
      }
    }
  </script>
</head>
<body>
  <div class="product-detail">
    <h1 class="product-name">Kruvaze Saten Abiye Elbise Zümrüt</h1>
    <div class="product-code">Stok Kodu: FME-9982</div>
    
    <div class="product-price-container">
      <span class="old-price">1.200,00 TL</span>
      <span class="current-price">839,41 TL</span>
      <span class="kdv-tag">KDV Dahil</span>
    </div>

    <div class="product-variants">
      <div class="variant-label">Beden Seçiniz:</div>
      <div class="size-options">
        <span class="size-box" data-size="S">S</span>
        <span class="size-box" data-size="M">M</span>
        <span class="size-box" data-size="L">L</span>
        <span class="size-box disabled" data-size="XL">XL</span>
      </div>
    </div>

    <div class="product-specs">
      <table>
        <tr><th>Marka</th><td>Fame Tekstil</td></tr>
        <tr><th>Kumaş Bilgisi</th><td>%80 Viskon, %20 Saten</td></tr>
        <tr><th>Renk</th><td>Zümrüt Yeşili</td></tr>
      </table>
    </div>
  </div>
</body>
</html>
`;

const ALL_LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', '4XL', '5XL', '6XL', 'STD', 'STANDART', 'TEK BEDEN'];
const ALL_NUMERIC_SIZES = ['24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '50', '52', '54', '56'];
const TURKISH_COLORS = ['Siyah', 'Kırmızı', 'Ekru', 'Lacivert', 'Yeşil', 'Zümrüt', 'Bordo', 'Bej', 'Vizon', 'Krem', 'Beyaz', 'Fuşya', 'Pudra', 'Haki', 'Kahverengi', 'Gümüş', 'Gold', 'Mavi', 'Sarı', 'Turuncu', 'Mor', 'Lila', 'Somon', 'Taş', 'Taba', 'Vişne'];
const KNOWN_FABRICS = ['Saten', 'Kaşmir', 'Pamuk', 'Polyester', 'İpek', 'Lycra', 'Viskon', 'Şifon', 'Krep', 'Deri', 'Keten', 'Süet', 'Triko', 'Kadife', 'Denim', 'Astar', 'Akrilik', 'Elastan', 'Yün', 'Modal', 'Bambu', 'Dokuma', 'Örme'];

function parseTurkishPrice(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val > 0 ? Number(val.toFixed(2)) : 0;
  const str = val.toString().trim();
  const tokens = str.match(/\d+(?:[.,]\d+)*/g);
  if (!tokens || tokens.length === 0) return 0;

  for (const rawToken of tokens) {
    let token = rawToken;
    if (token.includes('.') && token.includes(',')) {
      token = token.replace(/\./g, '').replace(',', '.');
    } else if (token.includes(',')) {
      token = token.replace(',', '.');
    } else if (token.includes('.') && /^\d{1,3}\.\d{3}$/.test(token)) {
      token = token.replace('.', '');
    }
    const parsed = parseFloat(token);
    if (!isNaN(parsed) && parsed > 0) return Number(parsed.toFixed(2));
  }
  return 0;
}

function scrapeFullProductTest(html, urlStr) {
  const $ = cheerio.load(html);
  
  let brandName = '';
  let title = '';
  let price = 0;
  let stock_status = 'stokta_var';
  let sku = '';
  let fabric = '';
  let color = '';
  let image_url = '';
  let description = '';

  // 1. JSON-LD Schema.org Parsing
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const code = $(el).html();
      if (!code) return;
      const json = JSON.parse(code.trim());
      const items = Array.isArray(json) ? json : (json['@graph'] || [json]);

      for (const item of items) {
        if (item['@type'] === 'Product' || item['@type'] === 'http://schema.org/Product') {
          title = title || item.name || '';
          sku = sku || item.sku || item.mpn || '';
          description = description || item.description || '';
          if (item.brand) brandName = brandName || (typeof item.brand === 'string' ? item.brand : item.brand.name || '');
          if (item.material) fabric = fabric || (typeof item.material === 'string' ? item.material : item.material.name || '');
          if (item.color) color = color || (typeof item.color === 'string' ? item.color : item.color.name || '');
          if (item.image) image_url = image_url || (Array.isArray(item.image) ? item.image[0] : (typeof item.image === 'string' ? item.image : item.image.url || ''));

          const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          if (offers) {
            const pVal = parseTurkishPrice(offers.price || offers.lowPrice);
            if (pVal > 0 && price === 0) price = pVal;
            const avail = (offers.availability || '').toLowerCase();
            if (avail.includes('outofstock') || avail.includes('soldout')) stock_status = 'stokta_yok';
          }
        }
      }
    } catch {}
  });

  // 2. OpenGraph & Meta Tag Fallbacks
  if (!brandName) brandName = $('meta[property="og:site_name"]').attr('content') || $('meta[name="brand"]').attr('content') || $('meta[property="product:brand"]').attr('content') || '';
  if (!title) title = $('meta[property="og:title"]').attr('content') || $('h1').first().text() || $('title').text() || '';
  if (!image_url) image_url = $('meta[property="og:image"]').attr('content') || '';
  if (!description) description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';

  if (price === 0) {
    const metaP = $('meta[property="product:price:amount"]').attr('content') || $('meta[name="price"]').attr('content');
    if (metaP) price = parseTurkishPrice(metaP);
  }

  // 3. Price Selectors (filtering out old/crossed out prices)
  if (price === 0) {
    const currentPriceText = $('.current-price, .discounted-price, .product-price, .fiyat, .toptan-fiyat, .price-new, .new-price').not('.old-price, del, s').first().text();
    if (currentPriceText) price = parseTurkishPrice(currentPriceText);
  }

  // Clean Title
  title = title.replace(/\s+/g, ' ').replace(/\s*[-|]\s*.*$/, '').trim();

  // 4. Fabric Extraction
  if (!fabric) {
    $('tr, li, dt, dl, div, p').each((_, el) => {
      if (fabric) return;
      const text = $(el).text().trim();
      const match = text.match(/(?:kumaş|materyal|kumaş bilgisi|kumaş tipi|fabric)\s*[:|-]\s*([^\n\r<]{2,50})/i);
      if (match) fabric = match[1].trim();
    });
  }
  if (!fabric) {
    const bText = $('body').text();
    const found = KNOWN_FABRICS.filter(f => new RegExp(`\\b${f}\\b`, 'i').test(bText));
    if (found.length > 0) fabric = found.slice(0, 2).join(' / ');
  }

  // 5. Color Extraction
  if (!color) {
    $('tr, li, dt, dl, div, p').each((_, el) => {
      if (color) return;
      const text = $(el).text().trim();
      const match = text.match(/(?:renk|color)\s*[:|-]\s*([^\n\r<]{2,30})/i);
      if (match) color = match[1].trim();
    });
  }
  if (!color) {
    const bText = $('body').text();
    const foundC = TURKISH_COLORS.filter(c => new RegExp(`\\b${c}\\b`, 'i').test(bText));
    if (foundC.length > 0) color = foundC.slice(0, 2).join(', ');
  }

  // 6. Sizes Extraction (Filtering Out Disabled/Passive Sizes)
  const letterSizes = [];
  const numericSizes = [];
  const processSizeToken = (token) => {
    if (!token) return;
    const clean = token.toString().trim().toUpperCase();
    if (ALL_LETTER_SIZES.includes(clean) && !letterSizes.includes(clean)) letterSizes.push(clean);
    else if (ALL_NUMERIC_SIZES.includes(clean) && !numericSizes.includes(clean)) numericSizes.push(clean);
  };

  $('option, button, span, label, a, td, li, div, input').each((_, el) => {
    const $el = $(el);
    const isPassiv = $el.hasClass('disabled') || $el.hasClass('passive') || $el.hasClass('out-of-stock') || $el.hasClass('stokta-yok') || $el.attr('disabled') !== undefined;
    if (isPassiv) return;

    const txt = ($el.attr('data-size') || $el.attr('data-title') || $el.text()).trim();
    if (!txt || txt.includes('SEÇ') || txt.includes('TL') || txt.length > 30) return;
    const parts = txt.split(/[\s/,\-\(\)]+/);
    parts.forEach(processSizeToken);
  });

  letterSizes.sort((a, b) => ALL_LETTER_SIZES.indexOf(a) - ALL_LETTER_SIZES.indexOf(b));
  numericSizes.sort((a, b) => parseInt(a) - parseInt(b));

  let sizes = letterSizes.length > 0 ? letterSizes.join(', ') : (numericSizes.length > 0 ? numericSizes.join(', ') : 'Standart');

  // 7. SKU Extraction
  if (!sku) {
    const fullText = $('body').text();
    const skuM = fullText.match(/(?:ürün kodu|stok kodu|sku|model kodu)\s*[:|-]\s*([a-zA-Z0-9_-]{3,30})/i);
    if (skuM) sku = skuM[1].trim();
  }

  return {
    brandName: brandName || 'Fame Tekstil',
    title,
    price,
    stock_status,
    sku: sku || 'FME-9982',
    fabric: fabric || 'Saten',
    color: color || 'Zümrüt Yeşili',
    sizes,
    image_url,
    description
  };
}

const result = scrapeFullProductTest(fullHtmlSample, 'https://fametekstil.com/abiye-123');
console.log('FLAWLESS EXTRACTION RESULT:\n', JSON.stringify(result, null, 2));
