async function testTrendyolPublicApis(query) {
  const encodedQuery = encodeURIComponent(`kadin ${query}`);

  const apis = [
    `https://cdn.dsmcdn.com/search/sr?q=${encodedQuery}`,
    `https://public-sdc.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/sr?q=${encodedQuery}&pi=1`,
    `https://apigw.trendyol.com/discovery-web-searchgw-service/v2/api/filter/sr?q=${encodedQuery}`,
    `https://public.trendyol.com/discovery-web-searchgw-service/v2/api/filter/sr?q=${encodedQuery}`
  ];

  for (const api of apis) {
    try {
      console.log(`\nTesting API: ${api}`);
      const res = await fetch(api, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Origin': 'https://www.trendyol.com',
          'Referer': 'https://www.trendyol.com/'
        }
      });

      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const json = await res.json();
        console.log("JSON response keys:", Object.keys(json));
        const prods = json?.result?.products || json?.products || [];
        if (prods.length > 0) {
          console.log(`SUCCESS! Found ${prods.length} products!`);
          prods.slice(0, 5).forEach((p, idx) => {
            console.log(`${idx+1}. ${p.name} (${p.brand?.name || ''})`);
            console.log(`   Direct Link: https://www.trendyol.com${p.url}`);
            console.log(`   Price: ${p.price?.discountedPrice || p.price?.sellingPrice} TL\n`);
          });
        }
      }
    } catch (err) {
      console.error("Error:", err.message);
    }
  }
}

testTrendyolPublicApis('tulum mint');
