const cheerio = require('cheerio');

async function testWomensCategorySearch(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const encodedQuery = encodeURIComponent(`kadin giyim ${cleanQuery}`);

  // 1. Hepsiburada Kadın Giyim Search
  const hbUrl = `https://www.hepsiburada.com/ara?q=${encodedQuery}`;
  try {
    const res = await fetch(hbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      }
    });

    console.log(`HB Women's Search Status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const items = [];

      $('a').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim() || $(el).attr('title');

        if (href && (href.includes('-p-') || href.includes('-pm-'))) {
          const lower = (text || '').toLowerCase();
          const isBabyOrKids = lower.includes('bebek') || lower.includes('çocuk') || lower.includes('kız çocuk') || lower.includes('erkek');
          
          if (!isBabyOrKids) {
            const fullUrl = href.startsWith('http') ? href : `https://www.hepsiburada.com${href}`;
            if (!items.some(i => i.url === fullUrl)) {
              const cleanTitle = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
              items.push({ title: cleanTitle || `Kadın Giyim ${cleanQuery}`, url: fullUrl });
            }
          }
        }
      });

      console.log(`HB Found ${items.length} Women's Direct Links:`);
      items.slice(0, 5).forEach((i, idx) => console.log(`${idx+1}. ${i.title}\n   URL: ${i.url}\n`));
    }
  } catch (err) {
    console.error("HB Error:", err.message);
  }

  // 2. Trendyol Kadın Giyim Search
  const tyUrl = `https://www.trendyol.com/sr?q=${encodedQuery}&cg=1`;
  console.log(`Trendyol Women's Search URL: ${tyUrl}`);
}

testWomensCategorySearch('tulum');
