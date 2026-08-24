import * as cheerio from 'cheerio';

function parseTurkishPrice(val) {
  if (!val) return 0;
  const str = val.toString().trim();
  const m = str.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
  if (!m) return 0;
  let token = m[1];
  if (token.includes('.') && token.includes(',')) token = token.replace(/\./g, '').replace(',', '.');
  else if (token.includes(',')) token = token.replace(',', '.');
  const num = parseFloat(token);
  return (!isNaN(num) && num >= 30) ? Number(num.toFixed(2)) : 0;
}

// 1. KOTON SCRAPER ENGINE
async function fetchKotonProducts(category) {
  const catMap = {
    tulum: 'kadin-tulum',
    elbise: 'kadin-elbise',
    pantolon: 'kadin-pantolon',
    ceket: 'kadin-ceket',
    bluz: 'kadin-bluz',
    gömlek: 'kadin-gomlek',
    icgiyim: 'kadin-ic-giyim',
    pijama: 'kadin-pijama'
  };

  const slug = catMap[category.toLowerCase()] || 'kadin-elbise';
  const url = `https://www.koton.com/${slug}/`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const items = [];

    $('script').each((_, el) => {
      if (items.length >= 5) return;
      const code = $(el).html() || '';
      const matches = code.match(/\{\s*"id"\s*:\s*"[^"]+"\s*,\s*"name"\s*:\s*"[^"]+"[\s\S]*?\}/g);
      if (matches) {
        for (const m of matches) {
          if (items.length >= 5) break;
          try {
            const obj = JSON.parse(m);
            if (obj.name && obj.url && (obj.unit_sale_price || obj.unit_price)) {
              const fullUrl = obj.url.startsWith('http') ? obj.url : `https://www.koton.com${obj.url}`;
              const price = Number(obj.unit_sale_price || obj.unit_price);
              if (!items.some(i => i.product_url === fullUrl) && price >= 30) {
                items.push({
                  marketplace_name: 'Koton',
                  product_title: `Koton ${obj.name}`,
                  product_url: fullUrl,
                  price,
                  fabric_match: 'Kadın Giyim (Koton Canlı Sayfa)'
                });
              }
            }
          } catch(e) {}
        }
      }
    });
    return items;
  } catch(e) {
    return [];
  }
}

// 2. PENTİ SCRAPER ENGINE (KADIN İÇ GİYİM)
async function fetchPentiProducts() {
  const url = `https://www.penti.com/tr/c/ic-giyim`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const items = [];

    $('a').each((_, el) => {
      if (items.length >= 5) return;
      const href = $(el).attr('href') || '';
      const title = $(el).attr('title') || $(el).text().trim();

      if (href.includes('/p/') || href.includes('-p-') || href.includes('/urun/')) {
        const fullUrl = href.startsWith('http') ? href : `https://www.penti.com${href}`;
        const card = $(el).closest('div, li');
        const priceText = card.find('.price, span:contains("TL"), div:contains("TL")').text().trim();
        const price = parseTurkishPrice(priceText) || 499.00;

        if (title && title.length > 8 && !title.includes('Kategori') && !items.some(i => i.product_url === fullUrl)) {
          items.push({
            marketplace_name: 'Penti (İç Giyim)',
            product_title: title.startsWith('Penti') ? title : `Penti ${title}`,
            product_url: fullUrl,
            price,
            fabric_match: 'Kadın İç Giyim (Penti Canlı Sayfa)'
          });
        }
      }
    });
    return items;
  } catch(e) {
    return [];
  }
}

// 3. BEYMEN SCRAPER ENGINE (LÜKS KADIN GİYİM)
async function fetchBeymenProducts() {
  const url = `https://www.beymen.com/tr/kadin-giyim-10020`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const items = [];

    $('.m-productCard, div[class*="productCard"]').each((_, el) => {
      if (items.length >= 5) return;
      const $card = $(el);
      const linkEl = $card.find('a[href*="/p_"]').first();
      const href = linkEl.attr('href');
      const brand = $card.find('.m-productCard__title').text().trim();
      const name = $card.find('.m-productCard__desc').text().trim();
      const priceText = $card.find('.m-productCard__newPrice').text().trim();
      let price = parseTurkishPrice(priceText);
      if (price > 0 && price < 1000 && priceText.includes('.')) {
        price = price * 1000;
      }

      if (href && name && price >= 30) {
        const fullUrl = href.startsWith('http') ? href : `https://www.beymen.com${href}`;
        if (!items.some(i => i.product_url === fullUrl)) {
          items.push({
            marketplace_name: 'Beymen (Lüks Giyim)',
            product_title: `${brand} ${name}`.trim(),
            product_url: fullUrl,
            price,
            fabric_match: 'Lüks Kadın Giyim (Beymen Canlı Sayfa)'
          });
        }
      }
    });
    return items;
  } catch(e) {
    return [];
  }
}

async function testUnifiedScraper(query) {
  console.log(`\n========================================`);
  console.log(`UNIFIED MULTI-SITE SCRAPER FOR: "${query}"`);
  console.log(`========================================\n`);

  const kotonItems = await fetchKotonProducts(query);
  const pentiItems = await fetchPentiProducts();
  const beymenItems = await fetchBeymenProducts();

  console.log(`1. KOTON LIVE PRODUCTS (${kotonItems.length}):`);
  kotonItems.forEach((i, idx) => console.log(`   ${idx+1}. [${i.price} TL] ${i.product_title} -> ${i.product_url}`));

  console.log(`\n2. PENTİ İÇ GİYİM PRODUCTS (${pentiItems.length}):`);
  pentiItems.forEach((i, idx) => console.log(`   ${idx+1}. [${i.price} TL] ${i.product_title} -> ${i.product_url}`));

  console.log(`\n3. BEYMEN LÜKS GİYİM PRODUCTS (${beymenItems.length}):`);
  beymenItems.forEach((i, idx) => console.log(`   ${idx+1}. [${i.price} TL] ${i.product_title} -> ${i.product_url}`));
}

testUnifiedScraper("elbise");
