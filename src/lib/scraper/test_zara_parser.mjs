import * as cheerio from 'cheerio';

async function parseZaraScript(query) {
  console.log(`\n========================================`);
  console.log(`PARSING ZARA FOR: ${query}`);
  console.log(`========================================`);

  const url = `https://www.zara.com/tr/tr/search?searchTerm=${encodeURIComponent(query)}&section=WOMAN`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9'
    }
  });

  const html = await res.text();
  const $ = cheerio.load(html);
  const items = [];

  $('script').each((_, el) => {
    const code = $(el).html() || '';
    if (code.includes('price') || code.includes('Product') || code.includes('seo')) {
      const matches = code.match(/\{\s*"@type"\s*:\s*"Product"[\s\S]*?\}/g) ||
                      code.match(/\{\s*"name"\s*:\s*"[^"]+"[\s\S]*?"price"\s*:[\s\S]*?\}/g);
      if (matches) {
        for (const m of matches) {
          try {
            const obj = JSON.parse(m);
            if (obj.name) {
              const offers = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
              const price = offers?.price ? parseFloat(offers.price) : 0;
              const productUrl = obj.url || '';
              if (productUrl && price >= 30) {
                items.push({
                  title: `Zara ${obj.name}`,
                  url: productUrl.startsWith('http') ? productUrl : `https://www.zara.com${productUrl}`,
                  price
                });
              }
            }
          } catch(e) {}
        }
      }
    }
  });

  console.log(`Zara Parsed Products Count: ${items.length}`);
  if (items.length > 0) {
    console.log("Sample Zara Parsed Products:", items.slice(0, 5));
  }

  // Fallback: search for JSON-LD schema on Zara
  if (items.length === 0) {
    console.log("Testing Zara JSON-LD graph parser...");
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        const list = Array.isArray(json) ? json : (json['@graph'] || [json]);
        for (const item of list) {
          if (item['@type'] === 'Product' || item.name) {
            console.log("Found JSON-LD Product on Zara:", item.name);
          }
        }
      } catch(e) {}
    });
  }
}

parseZaraScript('elbise');
