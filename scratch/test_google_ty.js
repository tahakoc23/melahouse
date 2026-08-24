const cheerio = require('cheerio');

async function testGoogleSearchForTrendyol(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:trendyol.com kadin ${cleanQuery}`)}&hl=tr`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      }
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = [];

      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('trendyol.com')) {
          let cleanUrl = href;
          if (href.startsWith('/url?q=')) {
            const match = href.match(/\/url\?q=([^&]+)/);
            if (match) cleanUrl = decodeURIComponent(match[1]);
          }
          const title = $(el).find('h3').text().trim() || $(el).text().trim();
          items.push({ title, url: cleanUrl });
        }
      });

      console.log(`Google Found ${items.length} Trendyol links:`);
      items.slice(0, 10).forEach((i, idx) => {
        console.log(`${idx + 1}. ${i.title}\n   URL: ${i.url}\n`);
      });
    }
  } catch (err) {
    console.error("Google Error:", err.message);
  }
}

testGoogleSearchForTrendyol('tulum mint');
