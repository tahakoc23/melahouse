const cheerio = require('cheerio');

async function testTrendyolGoogleSearch(query) {
  // Test Google Search / Bing Search / DuckDuckGo for direct Trendyol product links (-p-XXXXX)
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const searchQueries = [
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:trendyol.com "-p-" kadin ${cleanQuery}`)}`,
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:trendyol.com/ "p-" ${cleanQuery}`)}`,
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`trendyol.com kadin ${cleanQuery}`)}`
  ];

  for (const url of searchQueries) {
    try {
      console.log(`\nFetching: ${url}`);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'tr-TR,tr;q=0.9'
        }
      });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);
        const directLinks = [];

        $('a').each((_, el) => {
          const rawLink = $(el).attr('href') || $(el).text();
          let cleanUrl = '';
          if (rawLink.includes('uddg=')) {
            const match = rawLink.match(/uddg=([^&]+)/);
            if (match) cleanUrl = decodeURIComponent(match[1]);
          } else if (rawLink.startsWith('http')) {
            cleanUrl = rawLink;
          }

          if (cleanUrl && cleanUrl.includes('trendyol.com')) {
            // Check if it's a direct product URL (-p-XXXXXX)
            if (cleanUrl.includes('-p-') || cleanUrl.includes('/p/')) {
              const title = $(el).text().trim() || cleanQuery;
              if (!directLinks.some(l => l.url === cleanUrl)) {
                directLinks.push({ title, url: cleanUrl });
              }
            }
          }
        });

        console.log(`Found ${directLinks.length} DIRECT PRODUCT LINKS (-p-):`);
        directLinks.forEach((l, i) => {
          console.log(`${i+1}. ${l.title}`);
          console.log(`   URL: ${l.url}`);
        });
      }
    } catch (err) {
      console.error("Error:", err.message);
    }
  }
}

testTrendyolGoogleSearch('tulum mint');
