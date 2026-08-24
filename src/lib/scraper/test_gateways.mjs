import * as cheerio from 'cheerio';

async function testGoogleDetailed() {
  console.log("--- GOOGLE DETAILED SEARCH FOR TRENDYOL -P- ---");
  try {
    const res = await fetch('https://www.google.com/search?q=' + encodeURIComponent('site:trendyol.com "kadin" "tulum"'), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Find all links and matches in entire html
    const matches = html.match(/https?:\/\/(?:www\.)?trendyol\.com\/[^\s"'<>&]+-p-\d+/gi) || [];
    console.log("Regex matches count:", matches.length);
    if (matches.length > 0) {
      console.log("Sample Regex matches:", [...new Set(matches)].slice(0, 5));
    }

    const allHref = [];
    $('a').each((_, el) => {
      let href = $(el).attr('href') || '';
      if (href.includes('trendyol.com')) allHref.push(href);
    });
    console.log("All Google hrefs containing trendyol count:", allHref.length);
    if (allHref.length > 0) {
      console.log("Sample Google hrefs:", allHref.slice(0, 5));
    }
  } catch(e) { console.error("Google Error:", e.message); }
}

testGoogleDetailed();
