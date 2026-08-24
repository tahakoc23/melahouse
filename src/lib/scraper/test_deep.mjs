import * as cheerio from 'cheerio';

const TEST_URLS = [
  { name: 'Beymen (Elbise)', url: 'https://www.beymen.com/tr/kadin-elbise-10022' },
  { name: 'Vakko (Elbise)', url: 'https://www.vakko.com/kadin/giyim/elbise/' },
  { name: 'Modanisa (Elbise)', url: 'https://www.modanisa.com/elbise.list' },
  { name: 'Sefamerve (Elbise)', url: 'https://www.sefamerve.com/kategori/elbise.html' },
  { name: 'Koton (Elbise)', url: 'https://www.koton.com/kadin-elbise/' },
  { name: 'DeFacto (Elbise)', url: 'https://www.defacto.com.tr/kadin-elbise' },
  { name: 'LC Waikiki (Elbise)', url: 'https://www.lcwaikiki.com/tr-TR/TR/kategori/kadin/elbise' },
  { name: 'Penti (İç Giyim)', url: 'https://www.penti.com/tr/c/ic-giyim' },
  { name: 'Suwen (İç Giyim)', url: 'https://www.suwen.com.tr/ic-giyim-c-100' },
  { name: 'Zara (Elbise)', url: 'https://www.zara.com/tr/tr/kadin-elbise-l1064.html' }
];

async function testUrl(target) {
  console.log(`\n========================================`);
  console.log(`TESTING: ${target.name} (${target.url})`);
  console.log(`========================================`);

  try {
    const res = await fetch(target.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    console.log(`HTTP Status: ${res.status}`);
    if (!res.ok) {
      console.log(`❌ Failed with HTTP ${res.status}`);
      return;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Look for product cards / links / prices
    const foundLinks = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (href && href.length > 5 && !href.startsWith('#') && !href.startsWith('javascript')) {
        foundLinks.push({ href, text });
      }
    });

    console.log(`Found total <a> links: ${foundLinks.length}`);

    // Inspect script tags or JSON-LD
    let scriptProducts = [];
    $('script').each((_, el) => {
      const code = $(el).html() || '';
      if (code.includes('price') || code.includes('Product') || code.includes('itemListElement')) {
        const matches = code.match(/"name"\s*:\s*"([^"]{5,80})"/gi);
        if (matches) {
          scriptProducts.push(...matches.map(m => m.replace(/"name"\s*:\s*"/i, '').replace(/"$/, '')));
        }
      }
    });

    console.log(`Script Product Names found: ${scriptProducts.length}`);
    if (scriptProducts.length > 0) {
      console.log(`Sample Product Names:`, [...new Set(scriptProducts)].slice(0, 5));
    }

    // Inspect price tags
    const priceText = [];
    $('.price, .m-productCard__newPrice, .product-price, [data-price], .prc-box, span:contains("TL")').each((_, el) => {
      const t = $(el).text().trim();
      if (t && t.includes('TL')) priceText.push(t);
    });

    console.log(`Sample Price Tags found:`, [...new Set(priceText)].slice(0, 5));
  } catch(e) {
    console.log(`❌ Error: ${e.message}`);
  }
}

async function main() {
  for (const t of TEST_URLS) {
    await testUrl(t);
  }
}

main();
