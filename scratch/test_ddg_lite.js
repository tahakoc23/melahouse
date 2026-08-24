const cheerio = require('cheerio');

async function testDDGLite(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const searchUrl = `https://lite.duckduckgo.com/lite/`;

  try {
    const res = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      },
      body: `q=${encodeURIComponent(`site:trendyol.com kadin ${cleanQuery}`)}`
    });

    console.log(`DDG Lite Status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = [];

      $('a.result-link').each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim();

        if (href && href.includes('trendyol.com')) {
          let cleanUrl = href;
          if (href.includes('uddg=')) {
            const match = href.match(/uddg=([^&]+)/);
            if (match) cleanUrl = decodeURIComponent(match[1]);
          }
          items.push({ title, url: cleanUrl });
        }
      });

      console.log(`DDG Lite Found ${items.length} Trendyol links:`);
      items.slice(0, 10).forEach((i, idx) => {
        console.log(`${idx + 1}. ${i.title}\n   URL: ${i.url}\n`);
      });
      return items;
    }
  } catch (err) {
    console.error("DDG Lite Error:", err.message);
  }
}

testDDGLite('tulum mint');
