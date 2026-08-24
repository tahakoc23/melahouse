const cheerio = require('cheerio');

async function searchMarketplaceViaDDG(query, siteDomain) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, '').trim();
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:${siteDomain} ${cleanQuery}`)}`;
  
  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      }
    });

    console.log(`DDG Search ${siteDomain} Status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = [];

      $('.result').each((_, el) => {
        const rawLink = $(el).find('.result__url').text().trim() || $(el).find('.result__a').attr('href');
        const title = $(el).find('.result__title').text().trim();
        const snippet = $(el).find('.result__snippet').text().trim();

        // Extract clean URL from DuckDuckGo redirect link
        let cleanUrl = '';
        if (rawLink) {
          if (rawLink.includes('uddg=')) {
            const match = rawLink.match(/uddg=([^&]+)/);
            if (match) cleanUrl = decodeURIComponent(match[1]);
          } else if (rawLink.startsWith('http')) {
            cleanUrl = rawLink;
          } else {
            cleanUrl = `https://${rawLink}`;
          }
        }

        if (cleanUrl && (cleanUrl.includes(siteDomain))) {
          items.push({ title, cleanUrl, snippet });
        }
      });

      console.log(`Found ${items.length} real results for ${siteDomain}:`);
      items.slice(0, 5).forEach((it, i) => {
        console.log(`${i+1}. ${it.title}`);
        console.log(`   URL: ${it.cleanUrl}\n`);
      });
      return items;
    }
  } catch (err) {
    console.error("DDG Search error:", err.message);
  }
  return [];
}

async function main() {
  console.log("--- Searching REAL Trendyol Products ---");
  await searchMarketplaceViaDDG('Saten Elbise', 'trendyol.com');

  console.log("\n--- Searching REAL Hepsiburada Products ---");
  await searchMarketplaceViaDDG('Saten Elbise', 'hepsiburada.com');
}

main();
