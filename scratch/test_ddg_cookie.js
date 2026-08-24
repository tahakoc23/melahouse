const cheerio = require('cheerio');

async function testDDGCookie(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:trendyol.com kadin ${cleanQuery}`)}`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Cookie': 'kl=tr-tr; df=1'
      }
    });

    console.log(`DDG Cookie Status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = [];

      $('.result__a').each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim();

        if (href) {
          let cleanUrl = href;
          if (href.includes('uddg=')) {
            const match = href.match(/uddg=([^&]+)/);
            if (match) cleanUrl = decodeURIComponent(match[1]);
          }

          if (cleanUrl.includes('trendyol.com')) {
            items.push({ title, url: cleanUrl });
          }
        }
      });

      console.log(`Found ${items.length} Trendyol links:`);
      items.slice(0, 10).forEach((i, idx) => {
        console.log(`${idx + 1}. ${i.title}\n   URL: ${i.url}\n`);
      });
    }
  } catch (err) {
    console.error("DDG Cookie Error:", err.message);
  }
}

testDDGCookie('tulum mint');
