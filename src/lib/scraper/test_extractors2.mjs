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

// 1. MODANİSA SCRAPER
async function scrapeModanisa(category) {
  console.log(`\n========================================`);
  console.log(`SCRAPING MODANİSA FOR: ${category}`);
  console.log(`========================================`);

  const url = `https://www.modanisa.com/${category.toLowerCase()}.list`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });

    console.log("Modanisa Status:", res.status);
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const items = [];

    $('.product-item, div[class*="product"]').each((_, el) => {
      if (items.length >= 5) return;
      const $card = $(el);
      const linkEl = $card.find('a[href*="/"]').first();
      const href = linkEl.attr('href');
      const title = $card.find('.product-title, .title, img[alt]').attr('alt') || linkEl.text().trim();
      const priceText = $card.find('.price, .sales-price, span:contains("TL")').text().trim();
      const price = parseTurkishPrice(priceText);

      if (href && title && title.length > 5 && price >= 30) {
        const fullUrl = href.startsWith('http') ? href : `https://www.modanisa.com${href}`;
        if (!items.some(i => i.product_url === fullUrl)) {
          items.push({
            marketplace_name: 'Modanisa',
            product_title: title.slice(0, 75),
            product_url: fullUrl,
            price
          });
        }
      }
    });

    console.log(`Modanisa Scraped Products (${items.length}):`);
    items.forEach((item, i) => console.log(` ${i+1}. [${item.price} TL] ${item.product_title} -> ${item.product_url}`));
    return items;
  } catch(e) {
    console.error("Modanisa error:", e.message);
    return [];
  }
}

// 2. BEYMEN SCRAPER
async function scrapeBeymen(category) {
  console.log(`\n========================================`);
  console.log(`SCRAPING BEYMEN FOR: ${category}`);
  console.log(`========================================`);

  const url = `https://www.beymen.com/tr/kadin-giyim-10020`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });

    console.log("Beymen Status:", res.status);
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
      const price = parseTurkishPrice(priceText);

      if (href && name && price >= 30) {
        const fullUrl = href.startsWith('http') ? href : `https://www.beymen.com${href}`;
        if (!items.some(i => i.product_url === fullUrl)) {
          items.push({
            marketplace_name: 'Beymen (Lüks Giyim)',
            product_title: `${brand} ${name}`.trim(),
            product_url: fullUrl,
            price
          });
        }
      }
    });

    console.log(`Beymen Scraped Products (${items.length}):`);
    items.forEach((item, i) => console.log(` ${i+1}. [${item.price} TL] ${item.product_title} -> ${item.product_url}`));
    return items;
  } catch(e) {
    console.error("Beymen error:", e.message);
    return [];
  }
}

async function main() {
  await scrapeModanisa('elbise');
  await scrapeBeymen('elbise');
}

main();
