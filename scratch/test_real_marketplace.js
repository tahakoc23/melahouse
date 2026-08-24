const cheerio = require('cheerio');

async function testTrendyolFetch(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://www.trendyol.com/sr?q=${encoded}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      }
    });
    console.log(`Trendyol Status: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const links = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('-p-') || href.includes('/p/'))) {
        links.push(href);
      }
    });
    console.log(`Trendyol Found Real Links (${links.length}):`, links.slice(0, 5));
  } catch (err) {
    console.error("Trendyol error:", err.message);
  }
}

async function testHepsiburadaFetch(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://www.hepsiburada.com/ara?q=${encoded}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      }
    });
    console.log(`Hepsiburada Status: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const links = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('-p-') || href.includes('-pm-'))) {
        links.push(href);
      }
    });
    console.log(`Hepsiburada Found Real Links (${links.length}):`, links.slice(0, 5));
  } catch (err) {
    console.error("Hepsiburada error:", err.message);
  }
}

async function run() {
  await testTrendyolFetch('Saten Elbise');
  await testHepsiburadaFetch('Saten Elbise');
}

run();
