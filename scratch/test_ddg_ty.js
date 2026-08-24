const cheerio = require('cheerio');

async function testDDGForTrendyolDirect(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  // Search for trendyol.com product pages containing -p-
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:trendyol.com kadin ${cleanQuery}`)}`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });

    console.log(`DDG Status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = [];

      $('.result__body').each((_, el) => {
        const rawLink = $(el).find('a.result__url').text().trim() || $(el).find('a.result__a').attr('href');
        const title = $(el).find('a.result__a').text().trim();

        let cleanUrl = '';
        if (rawLink) {
          if (rawLink.includes('uddg=')) {
            const match = rawLink.match(/uddg=([^&]+)/);
            if (match) cleanUrl = decodeURIComponent(match[1]);
          } else if (rawLink.startsWith('http')) {
            cleanUrl = rawLink;
          } else {
            cleanUrl = `https://${rawLink}`;
          }
        }

        if (cleanUrl && cleanUrl.includes('trendyol.com')) {
          items.push({ title, url: cleanUrl });
        }
      });

      console.log(`Found ${items.length} Trendyol URLs:`);
      items.slice(0, 10).forEach((i, idx) => {
        console.log(`${idx + 1}. ${i.title}\n   URL: ${i.url}\n`);
      });
    }
  } catch (err) {
    console.error("DDG Error:", err.message);
  }
}

testDDGForTrendyolDirect('tulum mint');
