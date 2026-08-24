const cheerio = require('cheerio');

async function searchBingForTrendyol(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(`site:trendyol.com kadin ${cleanQuery}`)}`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      }
    });

    console.log(`Bing Search Status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = [];

      $('li.b_algo h2 a, h2 a').each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim();

        if (href && href.includes('trendyol.com')) {
          items.push({ title, url: href });
        }
      });

      console.log(`Bing found ${items.length} Trendyol links:`);
      items.slice(0, 10).forEach((i, idx) => {
        console.log(`${idx + 1}. ${i.title}\n   URL: ${i.url}\n`);
      });
      return items;
    }
  } catch (err) {
    console.error("Bing Error:", err.message);
  }
  return [];
}

searchBingForTrendyol('tulum mint');
