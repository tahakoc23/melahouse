const cheerio = require('cheerio');

async function testTrendyolApi(query) {
  const encoded = encodeURIComponent(query);
  // Test Trendyol public web search API or alternate User-Agent / Headers
  const urlsToTest = [
    `https://public.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/sr?q=${encoded}&pi=1`,
    `https://www.trendyol.com/sr?q=${encoded}`
  ];

  for (const url of urlsToTest) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'tr-TR,tr;q=0.9',
        }
      });
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data.result && data.result.products) {
            console.log(`API Products found: ${data.result.products.length}`);
            data.result.products.slice(0, 5).forEach(p => {
              console.log(`- ${p.name} (${p.price?.discountedPrice || p.price?.sellingPrice} TL): https://www.trendyol.com${p.url}`);
            });
          }
        } catch {
          console.log(`HTML Response length: ${text.length}`);
        }
      }
    } catch (err) {
      console.error(err.message);
    }
  }
}

testTrendyolApi('Saten Elbise');
