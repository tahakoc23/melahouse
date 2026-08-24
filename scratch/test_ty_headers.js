async function testTrendyolHeaderVariations(query) {
  const encodedQuery = encodeURIComponent(query);
  
  const testConfigs = [
    {
      name: "Trendyol Public Search Gateway",
      url: `https://public.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/sr?q=${encodedQuery}&pi=1&culture=tr-TR&userGenderId=1&pId=0`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://www.trendyol.com',
        'Referer': `https://www.trendyol.com/sr?q=${encodedQuery}`
      }
    },
    {
      name: "Trendyol Mobile Web Gateway",
      url: `https://apigw.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/sr?q=${encodedQuery}&pi=1`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Referer': 'https://m.trendyol.com/'
      }
    },
    {
      name: "Trendyol Googlebot User-Agent",
      url: `https://www.trendyol.com/sr?q=${encodedQuery}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    }
  ];

  for (const cfg of testConfigs) {
    try {
      console.log(`\n=== Testing: ${cfg.name} ===`);
      const res = await fetch(cfg.url, { headers: cfg.headers });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        console.log(`Response length: ${text.length}`);
        if (text.startsWith('{')) {
          const json = JSON.parse(text);
          const products = json?.result?.products || json?.products || [];
          console.log(`SUCCESS! Found ${products.length} products!`);
          products.slice(0, 5).forEach((p, idx) => {
            console.log(`${idx + 1}. ${p.name} (${p.brand?.name})`);
            console.log(`   Direct Link: https://www.trendyol.com${p.url}\n`);
          });
        } else {
          console.log("HTML response received, checking for direct -p- links...");
          const matches = text.match(/\/([a-z0-9-]+-p-\d+)/gi);
          if (matches) {
            console.log(`SUCCESS! Found ${matches.length} direct product URLs in HTML:`);
            const unique = Array.from(new Set(matches));
            unique.slice(0, 5).forEach((m, idx) => {
              console.log(`${idx + 1}. https://www.trendyol.com${m}`);
            });
          }
        }
      }
    } catch (err) {
      console.error("Error:", err.message);
    }
  }
}

testTrendyolHeaderVariations('kadin tulum mint');
