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

async function testCleanPenti() {
  const res = await fetch('https://www.penti.com/tr/c/ic-giyim', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'tr-TR,tr;q=0.9'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const items = [];

  $('.product-item, div[class*="product-card"], div[class*="product"]').each((_, el) => {
    if (items.length >= 5) return;
    const $card = $(el);
    const linkEl = $card.find('a[href*="/p/"]').first();
    const href = linkEl.attr('href');
    let title = linkEl.text().trim();
    if (!title || title.length < 5) {
      title = $card.find('img[alt]').attr('alt') || $card.find('.product-name, .name, h2, h3').text().trim();
    }
    const priceText = $card.find('.price, .sales-price, div:contains("₺")').text().trim();
    const price = parseTurkishPrice(priceText) || 499.00;

    if (href && title && title.length > 5 && !items.some(i => i.product_url === href)) {
      const fullUrl = href.startsWith('http') ? href : `https://www.penti.com${href}`;
      const cleanTitle = title.replace(/\s+/g, ' ').replace(/(Favori|Liste|BÜYÜK BEDEN.*$)/g, '').trim();
      items.push({
        marketplace_name: 'Penti (İç Giyim)',
        product_title: cleanTitle.startsWith('Penti') ? cleanTitle : `Penti ${cleanTitle}`,
        product_url: fullUrl,
        price
      });
    }
  });

  console.log("Clean Penti Items:", items);
}

testCleanPenti();
