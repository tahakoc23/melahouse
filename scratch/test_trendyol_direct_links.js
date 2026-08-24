const cheerio = require('cheerio');

async function getTrendyolDirectProductLinks(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const encodedQuery = encodeURIComponent(`kadin ${cleanQuery}`);

  // Test endpoints to get direct product URLs (-p-XXXXX)
  const endpoints = [
    `https://apigw.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/sr?q=${encodedQuery}&pi=1&culture=tr-TR&storefrontId=1`,
    `https://public.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/sr?q=${encodedQuery}&pi=1`,
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:trendyol.com/ "p-" kadin ${cleanQuery}`)}`
  ];

  for (const ep of endpoints) {
    try {
      console.log(`\nTesting Endpoint: ${ep}`);
      const res = await fetch(ep, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/html, */*',
          'Accept-Language': 'tr-TR,tr;q=0.9'
        }
      });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        if (text.startsWith('{')) {
          const data = JSON.parse(text);
          const products = data?.result?.products || data?.products || [];
          console.log(`Found ${products.length} JSON products!`);
          products.slice(0, 5).forEach((p, idx) => {
            console.log(`${idx + 1}. ${p.name}`);
            console.log(`   Direct URL: https://www.trendyol.com${p.url}`);
            console.log(`   Price: ${p.price?.discountedPrice || p.price?.sellingPrice} TL\n`);
          });
        } else {
          const $ = cheerio.load(text);
          const directLinks = [];
          $('.result').each((_, el) => {
            const rawLink = $(el).find('.result__url').text().trim() || $(el).find('.result__a').attr('href');
            const title = $(el).find('.result__title').text().trim();
            
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

            if (cleanUrl && cleanUrl.includes('trendyol.com') && (cleanUrl.includes('-p-') || cleanUrl.includes('/p/'))) {
              directLinks.push({ title, url: cleanUrl });
            }
          });
          console.log(`Found ${directLinks.length} DDG direct product links!`);
          directLinks.slice(0, 5).forEach((l, idx) => {
            console.log(`${idx + 1}. ${l.title}\n   Direct URL: ${l.url}\n`);
          });
        }
      }
    } catch (err) {
      console.error("Endpoint Error:", err.message);
    }
  }
}

getTrendyolDirectProductLinks('tulum mint');
