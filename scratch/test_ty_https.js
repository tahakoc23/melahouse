const https = require('https');
const cheerio = require('cheerio');

function fetchTrendyolDirect(query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(`kadin ${query}`);
    const options = {
      hostname: 'www.trendyol.com',
      port: 443,
      path: `/sr?q=${encoded}&cg=1`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const $ = cheerio.load(data);
          const links = [];
          
          // Check for product cards in HTML
          $('.p-card-chldrn a, .product-card a, a[href*="-p-"]').each((_, el) => {
            const href = $(el).attr('href');
            const title = $(el).find('.prd-name, .product-name').text().trim() || $(el).attr('title');

            if (href && href.includes('-p-')) {
              const fullUrl = href.startsWith('http') ? href : `https://www.trendyol.com${href}`;
              if (!links.some(l => l.url === fullUrl)) {
                links.push({ title: title || query, url: fullUrl });
              }
            }
          });

          console.log(`Found ${links.length} DIRECT Trendyol product links (-p-)!`);
          links.slice(0, 5).forEach((l, idx) => console.log(`${idx+1}. ${l.title}\n   URL: ${l.url}\n`));
          resolve(links);
        } else {
          console.log(`Header response length: ${data.length}`);
          resolve([]);
        }
      });
    });

    req.on('error', err => reject(err));
    req.end();
  });
}

fetchTrendyolDirect('tulum mint');
