async function testRealTrendyolProductUrls() {
  // Test various real product URLs on Trendyol to find ones that return HTTP 200 without 404
  const testUrls = [
    'https://www.trendyol.com/kadin-tulum-x-c104161',
    'https://www.trendyol.com/kadin-elbise-x-c56',
    'https://www.trendyol.com/kadin-gomlek-x-c75',
    'https://www.trendyol.com/kadin-ceket-x-c1030',
    'https://www.trendyol.com/kadin-pantolon-x-c70',
    'https://www.trendyol.com/sr?q=kadin+tulum&cg=1'
  ];

  for (const url of testUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept-Language': 'tr-TR,tr;q=0.9',
        }
      });
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.status}\n`);
    } catch (err) {
      console.error(`Error for ${url}:`, err.message);
    }
  }
}

testRealTrendyolProductUrls();
