const cheerio = require('cheerio');

// Test Case E: Single string with slash "S/M/L" in JSON or JS
const htmlE = `
  <script>
    var item = {
      "id": 55,
      "beden_secenekleri": "S/M/L",
      "renk": "Kırmızı"
    };
  </script>
`;

const ALLOWED_SIZES = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'STD', 'STANDART',
  '32', '34', '36', '38', '40', '42', '44', '46', '48', '50'
];

function extractSizesDeep(html) {
  const $ = cheerio.load(html);
  const detected = [];

  const addSize = (val) => {
    if (!val) return;
    const clean = val.toString().trim().toUpperCase();
    if (ALLOWED_SIZES.includes(clean) && !detected.includes(clean)) {
      detected.push(clean);
    }
  };

  // Layer 1: Scan ALL <script> tags for JSON objects, variant strings, or slash/dash series (e.g. "S/M/L")
  $('script').each((_, el) => {
    const code = $(el).html() || '';
    if (!code) return;

    // Match individual quoted sizes or series strings like "S/M/L" or "36-38-40"
    const seriesMatches = code.match(/["']([A-Z0-9\s/,-]{1,30})["']/gi);
    if (seriesMatches) {
      seriesMatches.forEach(sm => {
        const cleanSm = sm.replace(/["']/g, '');
        const tokens = cleanSm.match(/\b(XXS|XS|S|M|L|XL|2XL|XXL|3XL|STD|Standart|32|34|36|38|40|42|44|46|48|50)\b/gi);
        if (tokens && tokens.length > 0) {
          tokens.forEach(addSize);
        }
      });
    }
  });

  // Layer 2: Scan DOM Elements, Labels, Radios, Options, and Attributes
  if (detected.length === 0) {
    $('*').each((_, el) => {
      const $el = $(el);

      // Check attributes
      const dataVar = $el.attr('data-variant-values') || $el.attr('data-size') || $el.attr('data-title') || $el.attr('data-name') || '';
      if (dataVar) {
        const tokens = dataVar.match(/\b(XXS|XS|S|M|L|XL|2XL|XXL|3XL|STD|STANDART|32|34|36|38|40|42|44|46|48|50)\b/gi);
        if (tokens) tokens.forEach(addSize);
      }

      // Check text content of short elements
      const tagName = el.name;
      if (['option', 'label', 'span', 'button', 'a', 'td', 'div', 'li'].includes(tagName)) {
        const txt = $el.text().trim();
        if (txt && txt.length <= 25 && !txt.includes('SEÇ') && !txt.includes('TL')) {
          const tokens = txt.match(/\b(XXS|XS|S|M|L|XL|2XL|XXL|3XL|STD|STANDART|TEK BEDEN|32|34|36|38|40|42|44|46|48|50)\b/gi);
          if (tokens) tokens.forEach(addSize);
        }
      }
    });
  }

  // Layer 3: Scan Body Text for "Beden: S-M-L" or "Bedenler: 36, 38, 40"
  if (detected.length === 0) {
    const bodyText = $('body').text();
    const bedenMatch = bodyText.match(/(?:beden(?:ler)?|sizes?|ölçü(?:ler)?)\s*[:|-]?\s*([^\n\r<]{2,40})/i);
    if (bedenMatch) {
      const tokens = bedenMatch[1].match(/\b(XXS|XS|S|M|L|XL|2XL|XXL|3XL|34|36|38|40|42|44|46|48|50)\b/gi);
      if (tokens) tokens.forEach(addSize);
    }
  }

  // Layer 4: Global Text Token Match for Size Series (e.g. S / M / L or 36-38-40)
  if (detected.length === 0) {
    const bodyText = $('body').text();
    const seriesMatch = bodyText.match(/\b(XXS|XS|S|M|L|XL|2XL|XXL|3XL|34|36|38|40|42|44|46|48|50)\s*[/,-]\s*(XXS|XS|S|M|L|XL|2XL|XXL|3XL|34|36|38|40|42|44|46|48|50)/gi);
    if (seriesMatch) {
      seriesMatch.forEach(s => {
        const tokens = s.match(/\b(XXS|XS|S|M|L|XL|2XL|XXL|3XL|34|36|38|40|42|44|46|48|50)\b/gi);
        if (tokens) tokens.forEach(addSize);
      });
    }
  }

  // Sort sizes in natural clothing size order
  detected.sort((a, b) => ALLOWED_SIZES.indexOf(a) - ALLOWED_SIZES.indexOf(b));
  return detected.length > 0 ? detected.join(', ') : 'Standart';
}

console.log('Test E (Single string "S/M/L" in JSON):', extractSizesDeep(htmlE));
