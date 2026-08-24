import * as cheerio from 'cheerio';

async function testZaraHtml() {
  const url = `https://www.zara.com/tr/tr/kadin-elbise-l1064.html`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9'
    }
  });

  const html = await res.text();
  console.log("HTML length:", html.length);
  const $ = cheerio.load(html);

  const zaraLinks = [];
  $('a').each((_, el) => {
    const h = $(el).attr('href') || '';
    const t = $(el).text().trim() || $(el).attr('aria-label') || '';
    if (h.includes('-p') || h.includes('.html')) {
      zaraLinks.push({ href: h, text: t });
    }
  });

  console.log("Zara links found:", zaraLinks.length);
  if (zaraLinks.length > 0) {
    console.log("Sample links:", zaraLinks.slice(0, 10));
  }

  // Search window.__ZARA__ or window.zara or script contents
  $('script').each((i, el) => {
    const code = $(el).html() || '';
    if (code.includes('price') || code.includes('detail') || code.includes('product') || code.includes('item')) {
      console.log(`Script #${i} snippet:`, code.slice(0, 300));
    }
  });
}

testZaraHtml();
