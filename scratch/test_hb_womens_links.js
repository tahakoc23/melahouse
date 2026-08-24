const cheerio = require('cheerio');

async function testHbWomensDirectLinks(query) {
  const encodedQuery = encodeURIComponent(`kadin ${query}`);
  const url = `https://www.hepsiburada.com/bayan-giyim-c-60000074?q=${encodedQuery}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      }
    });

    console.log(`HB Women's Cat Fetch Status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = [];

      $('a').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim() || $(el).attr('title');

        if (href && (href.includes('-p-') || href.includes('-pm-')) && text && text.length > 5) {
          const lower = text.toLowerCase();
          if (!lower.includes('bebek') && !lower.includes('çocuk') && !lower.includes('erkek')) {
            const fullUrl = href.startsWith('http') ? href : `https://www.hepsiburada.com${href}`;
            if (!items.some(i => i.url === fullUrl)) {
              items.push({ title: text, url: fullUrl });
            }
          }
        }
      });

      console.log(`Found ${items.length} Women's Direct Product Detail Links:`);
      items.slice(0, 5).forEach((i, idx) => console.log(`${idx+1}. ${i.title}\n   URL: ${i.url}\n`));
    }
  } catch (err) {
    console.error("HB Fetch Error:", err.message);
  }
}

testHbWomensDirectLinks('Tulum');
