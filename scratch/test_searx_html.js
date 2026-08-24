const cheerio = require('cheerio');

async function testSearxHtml(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const searchUrl = `https://searx.be/search?q=${encodeURIComponent(`site:trendyol.com kadin ${cleanQuery}`)}`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      }
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = [];

      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && (href.includes('trendyol') || href.includes('http'))) {
          items.push({ title: $(el).text().trim(), url: href });
        }
      });

      console.log(`Searx total links found: ${items.length}`);
      items.slice(0, 10).forEach((i, idx) => {
        console.log(`${idx + 1}. ${i.title}\n   URL: ${i.url}\n`);
      });
    }
  } catch (err) {
    console.error("Searx Error:", err.message);
  }
}

testSearxHtml('tulum mint');
