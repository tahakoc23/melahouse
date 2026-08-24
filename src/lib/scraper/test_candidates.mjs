import * as cheerio from 'cheerio';

const CANDIDATE_SITES = [
  { name: 'Koton', url: 'https://www.koton.com/kadin-tulum/', searchUrl: 'https://www.koton.com/search/?q=tulum' },
  { name: 'DeFacto', url: 'https://www.defacto.com.tr/kadin-tulum', searchUrl: 'https://www.defacto.com.tr/ara?q=tulum' },
  { name: 'LC Waikiki', url: 'https://www.lcwaikiki.com/tr-TR/TR/kategori/kadin/tulum', searchUrl: 'https://www.lcwaikiki.com/tr-TR/TR/arama?q=tulum' },
  { name: 'Suwen (İç Giyim)', url: 'https://www.suwen.com.tr/kadin-ic-giyim', searchUrl: 'https://www.suwen.com.tr/arama?q=suvari' },
  { name: 'Penti (İç Giyim)', url: 'https://www.penti.com/tr/kategori/ic-giyim', searchUrl: 'https://www.penti.com/tr/search?q=gecelik' },
  { name: 'Beymen', url: 'https://www.beymen.com/tr/kadin-giyim-10020', searchUrl: 'https://www.beymen.com/tr/search?q=tulum' },
  { name: 'Mango', url: 'https://shop.mango.com/tr/tr/c/kadin/tulumlar', searchUrl: 'https://shop.mango.com/tr/tr/search?q=tulum' }
];

async function testCandidateSite(site) {
  console.log(`\n========================================`);
  console.log(`TESTING CANDIDATE: ${site.name}`);
  console.log(`URL: ${site.url}`);
  console.log(`========================================`);

  try {
    const res = await fetch(site.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
    });

    console.log(`Status HTTP: ${res.status} ${res.statusText}`);
    if (!res.ok) {
      console.log(`❌ BLOCKED or FAILED (HTTP ${res.status})`);
      return { name: site.name, ok: false, status: res.status, products: 0 };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Look for JSON-LD products or product links + prices
    let jsonLdCount = 0;
    const jsonLdPrices = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const content = $(el).html();
        if (!content) return;
        const json = JSON.parse(content.trim());
        const items = Array.isArray(json) ? json : (json['@graph'] || [json]);
        for (const item of items) {
          if (item['@type'] === 'Product' || item.offers || item.itemListElement) {
            jsonLdCount++;
            if (item.offers) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              if (offer.price || offer.lowPrice) {
                jsonLdPrices.push(offer.price || offer.lowPrice);
              }
            }
          }
        }
      } catch(e) {}
    });

    const productLinks = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (href && (href.includes('/p/') || href.includes('-p-') || href.includes('/product/') || href.includes('/urun/') || href.includes('-k-') || href.includes('/item/'))) {
        productLinks.push({ href, text });
      }
    });

    console.log(`✅ SUCCESS HTTP 200!`);
    console.log(`- JSON-LD Product Objects: ${jsonLdCount}`);
    console.log(`- Sample JSON-LD Prices: ${jsonLdPrices.slice(0, 5).join(', ')}`);
    console.log(`- Product Links Found: ${productLinks.length}`);
    if (productLinks.length > 0) {
      console.log(`- Sample Product Links:`, productLinks.slice(0, 3));
    }

    return {
      name: site.name,
      ok: true,
      status: res.status,
      jsonLdCount,
      productLinksCount: productLinks.length,
      sampleLink: productLinks[0]?.href
    };
  } catch(err) {
    console.log(`❌ ERROR: ${err.message}`);
    return { name: site.name, ok: false, error: err.message };
  }
}

async function main() {
  const results = [];
  for (const site of CANDIDATE_SITES) {
    const res = await testCandidateSite(site);
    results.push(res);
  }

  console.log(`\n========================================`);
  console.log(`FINAL CANDIDATE SUMMARY RESULTS:`);
  console.log(`========================================`);
  console.table(results);
}

main();
