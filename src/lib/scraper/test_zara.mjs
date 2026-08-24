import * as cheerio from 'cheerio';

async function testZaraApi(query) {
  console.log(`\n========================================`);
  console.log(`TESTING ZARA SEARCH FOR: ${query}`);
  console.log(`========================================`);

  try {
    const url = `https://www.zara.com/tr/tr/search?searchTerm=${encodeURIComponent(query)}&section=WOMAN`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });

    console.log("Zara status:", res.status);
    const html = await res.text();
    const $ = cheerio.load(html);
    const links = [];

    $('a').each((_, el) => {
      const h = $(el).attr('href') || '';
      const t = $(el).text().trim();
      if (h.includes('-p') && h.includes('.html')) {
        links.push({ url: h.startsWith('http') ? h : `https://www.zara.com${h}`, title: t });
      }
    });

    console.log("Zara product links count:", links.length);
    if (links.length > 0) {
      console.log("Sample Zara links:", links.slice(0, 5));
    }

    // Check script tags for product JSON
    const scriptProducts = [];
    $('script').each((_, el) => {
      const code = $(el).html() || '';
      if (code.includes('price') || code.includes('product')) {
        const matches = code.match(/"name"\s*:\s*"([^"]+)"/gi);
        if (matches) scriptProducts.push(...matches);
      }
    });
    console.log("Zara script product matches count:", scriptProducts.length);
  } catch(e) {
    console.error("Zara error:", e.message);
  }
}

async function main() {
  await testZaraApi('elbise');
  await testZaraApi('tulum');
}

main();
