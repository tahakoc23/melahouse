const cheerio = require('cheerio');

async function testBraveSearch(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(`site:trendyol.com kadin ${cleanQuery}`)}&source=web`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      }
    });

    console.log(`Brave Search Status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = [];

      $('a').each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim();

        if (href && href.includes('trendyol.com') && (href.includes('-p-') || href.includes('/p/'))) {
          if (!items.some(i => i.url === href)) {
            items.push({ title, url: href });
          }
        }
      });

      console.log(`Brave Found ${items.length} DIRECT Trendyol product links (-p-):`);
      items.slice(0, 5).forEach((i, idx) => console.log(`${idx+1}. ${i.title}\n   URL: ${i.url}\n`));
      return items;
    }
  } catch (err) {
    console.error("Brave Error:", err.message);
  }
}

testBraveSearch('tulum mint');
