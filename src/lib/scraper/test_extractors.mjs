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

// 1. KOTON SCRAPER
async function scrapeKoton(category) {
  console.log(`\n========================================`);
  console.log(`SCRAPING KOTON FOR: ${category}`);
  console.log(`========================================`);

  const categoryMap = {
    tulum: 'kadin-tulum',
    elbise: 'kadin-elbise',
    pantolon: 'kadin-pantolon',
    ceket: 'kadin-ceket',
    bluz: 'kadin-bluz',
    gömlek: 'kadin-gomlek',
    icgiyim: 'kadin-ic-giyim'
  };

  const catSlug = categoryMap[category.toLowerCase()] || 'kadin-elbise';
  const url = `https://www.koton.com/${catSlug}/`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
                  price
                });
              }
            }
          } catch(e) {}
        }
      }
    });

    console.log(`Koton Scraped Products (${items.length}):`);
    items.forEach((item, i) => console.log(` ${i+1}. [${item.price} TL] ${item.product_title} -> ${item.product_url}`));
    return items;
  } catch(e) {
    console.error("Koton error:", e.message);
    return [];
  }
}

// 2. LC WAIKIKI SCRAPER
async function scrapeLCWaikiki(category) {
  console.log(`\n========================================`);
  console.log(`SCRAPING LC WAIKIKI FOR: ${category}`);
  console.log(`========================================`);

  const categoryMap = {
    tulum: 'tulum',
    elbise: 'elbise',
    pantolon: 'pantolon',
    ceket: 'ceket',
    bluz: 'bluz',
    gömlek: 'gomlek',
    icgiyim: 'ic-giyim'
  };

  const catSlug = categoryMap[category.toLowerCase()] || 'elbise';
  const url = `https://www.lcwaikiki.com/tr-TR/TR/kategori/kadin/${catSlug}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const items = [];

    $('.product-card, .product-item, div[class*="product"]').each((_, el) => {
      if (items.length >= 5) return;
      const $card = $(el);
      const linkEl = $card.find('a[href*="/urun/"]').first();
      const href = linkEl.attr('href');
      const title = $card.find('.product-title, .title, h3, h2').text().trim() || linkEl.text().trim();
      const priceText = $card.find('.raw-price, .discount-price, .price, span:contains("TL")').text().trim();
      const price = parseTurkishPrice(priceText);

      if (href && title && title.length > 5 && price >= 30) {
        const fullUrl = href.startsWith('http') ? href : `https://www.lcwaikiki.com${href}`;
        if (!items.some(i => i.product_url === fullUrl)) {
          items.push({
            marketplace_name: 'LC Waikiki',
            product_title: title.startsWith('LCW') ? title : `LC Waikiki ${title}`,
            product_url: fullUrl,
            price
          });
        }
      }
    });

    console.log(`LC Waikiki Scraped Products (${items.length}):`);
    items.forEach((item, i) => console.log(` ${i+1}. [${item.price} TL] ${item.product_title} -> ${item.product_url}`));
    return items;
  } catch(e) {
    console.error("LC Waikiki error:", e.message);
    return [];
  }
}

// 3. PENTİ (KADIN İÇ GİYİM) SCRAPER
async function scrapePenti(category) {
  console.log(`\n========================================`);
  console.log(`SCRAPING PENTİ (KADIN İÇ GİYİM) FOR: ${category}`);
  console.log(`========================================`);

  const url = `https://www.penti.com/tr/c/ic-giyim`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
            price
          });
        }
      }
    });

    console.log(`Penti Scraped Products (${items.length}):`);
    items.forEach((item, i) => console.log(` ${i+1}. [${item.price} TL] ${item.product_title} -> ${item.product_url}`));
    return items;
  } catch(e) {
    console.error("Penti error:", e.message);
    return [];
  }
}

async function main() {
  await scrapeKoton('elbise');
  await scrapeKoton('tulum');
  await scrapeLCWaikiki('elbise');
  await scrapePenti('icgiyim');
}

main();
