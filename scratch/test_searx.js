const cheerio = require('cheerio');

async function testSearx(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const searchUrl = `https://searx.be/search?q=${encodeURIComponent(`site:trendyol.com kadin ${cleanQuery}`)}&format=json`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      }
    });

    console.log(`Searx Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`Searx found ${data.results?.length} results:`);
      data.results?.slice(0, 5).forEach((r, i) => {
        console.log(`${i+1}. ${r.title}\n   URL: ${r.url}\n`);
      });
    }
  } catch (err) {
    console.error("Searx Error:", err.message);
  }
}

testSearx('tulum mint');
