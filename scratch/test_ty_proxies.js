const cheerio = require('cheerio');

async function testProxyScrape(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const targetUrl = `https://www.trendyol.com/sr?q=${encodeURIComponent(`kadin ${cleanQuery}`)}&cg=1`;
  
  // Public CORS & scraping proxies
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
  ];

  for (const px of proxies) {
    try {
      console.log(`\nTesting Proxy: ${px}`);
      const res = await fetch(px);
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        const html = text.startsWith('{') ? (JSON.parse(text).contents || text) : text;
        const $ = cheerio.load(html);
        
        const directLinks = [];
        $('a[href*="-p-"]').each((_, el) => {
          const href = $(el).attr('href');
          const title = $(el).find('.prd-name, .product-name, span').text().trim() || $(el).attr('title');

          if (href && href.includes('-p-')) {
            const fullUrl = href.startsWith('http') ? href : `https://www.trendyol.com${href}`;
            if (!directLinks.some(l => l.url === fullUrl)) {
              directLinks.push({ title: title || query, url: fullUrl });
            }
          }
        });

        console.log(`Proxy returned ${directLinks.length} DIRECT PRODUCT LINKS (-p-):`);
        directLinks.slice(0, 5).forEach((l, idx) => {
          console.log(`${idx + 1}. ${l.title}\n   Direct URL: ${l.url}\n`);
        });
      }
    } catch (err) {
      console.error("Proxy Error:", err.message);
    }
  }
}

testProxyScrape('tulum mint');
