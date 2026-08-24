const cheerio = require('cheerio');

async function testGoogleRss(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const rssUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:trendyol.com kadin ${cleanQuery}`)}&output=search&tbm=shop`;

  try {
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      }
    });

    console.log(`Google Shopping Status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = [];

      $('a').each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim();

        if (href && href.includes('trendyol.com')) {
          let cleanUrl = href;
          if (href.startsWith('/url?q=')) {
            const match = href.match(/\/url\?q=([^&]+)/);
            if (match) cleanUrl = decodeURIComponent(match[1]);
          }

          if (cleanUrl.includes('trendyol.com')) {
            items.push({ title, url: cleanUrl });
          }
        }
      });

      console.log(`Found ${items.length} Google Shopping Trendyol links:`);
      items.slice(0, 10).forEach((i, idx) => {
        console.log(`${idx + 1}. ${i.title}\n   URL: ${i.url}\n`);
      });
    }
  } catch (err) {
    console.error("Google Shopping Error:", err.message);
  }
}

testGoogleRss('tulum mint');
