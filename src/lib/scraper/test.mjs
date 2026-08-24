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

async function testCategoryQuery(queryTitle) {
  console.log(`\n========================================`);
  console.log(`CATEGORY QUERY TEST FOR: "${queryTitle}"`);
  console.log(`========================================\n`);

  let coreCategory = 'elbise';
  const categories = ['tulum', 'elbise', 'pantolon', 'ceket', 'bluz', 'gömlek', 'triko', 'kaban', 'etek', 'şort', 'kazak', 'sweatshirt', 'tayt', 'tunik'];
  for (const cat of categories) {
    if (queryTitle.toLowerCase().includes(cat)) {
      coreCategory = cat;
      break;
    }
  }

  const hbItems = [];
  try {
    const encoded = encodeURIComponent(`kadin ${coreCategory}`);
    const res = await fetch(`https://www.hepsiburada.com/ara?q=${encoded}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
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
          const cardBox = $(el).closest('[data-test-id="product-card"], li, div');
          
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

          let formattedTitle = rawText.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
          if (!formattedTitle || formattedTitle.length < 5) {
            const match = fullUrl.match(/\/([^\/]+)-p-/);
            if (match) formattedTitle = match[1].replace(/-/g, ' ');
          }

          const lowerTitle = formattedTitle.toLowerCase();
          const lowerUrl = fullUrl.toLowerCase();
          const isPhoneOrTech = lowerTitle.includes('galaxy') || lowerTitle.includes('iphone') || lowerTitle.includes('honor') || lowerTitle.includes('telefon') || lowerUrl.includes('telefon');

          if (!isPhoneOrTech) {
            if (!hbItems.some(i => i.product_url === fullUrl)) {
              hbItems.push({
                marketplace_name: 'Hepsiburada',
                product_title: formattedTitle.slice(0, 75),
                product_url: fullUrl,
                price: priceVal
              });
            }
          }
        }
      });
    }
  } catch (e) { console.error("Hepsiburada fetch error:", e); }

  console.log(`HEPSIBURADA PRODUCTS (${hbItems.length}):`);
  hbItems.forEach((item, i) => console.log(` ${i+1}. [${item.price} TL] ${item.product_title} -> ${item.product_url.slice(0, 70)}...`));
}

testCategoryQuery("Olala Boutique Kadın Mint Saten Tulum");
