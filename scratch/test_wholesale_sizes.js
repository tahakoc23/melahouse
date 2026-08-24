const cheerio = require('cheerio');

// Test Case 1: Wholesaler with options like "S (36)", "M (38)", "L (40)"
const html1 = `
  <select name="beden">
    <option>Beden Seçiniz</option>
    <option value="1">S (36)</option>
    <option value="2">M (38)</option>
    <option value="3">L (40)</option>
  </select>
`;

// Test Case 2: Wholesaler with number sizes 36, 38, 40, 42 in span buttons
const html2 = `
  <div class="variant-list">
    <span class="v-btn">36</span>
    <span class="v-btn">38</span>
    <span class="v-btn">40</span>
    <span class="v-btn">42</span>
  </div>
`;

// Test Case 3: Wholesaler with 1, 2, 3 (Seri Beden)
const html3 = `
  <div class="bedenler">
    <button>1 (S-M)</button>
    <button>2 (M-L)</button>
    <button>3 (L-XL)</button>
  </div>
`;

// Test Case 4: Wholesaler with "S-M-L-XL" in description table
const html4 = `
  <table class="product-info">
    <tr><th>Beden Seçenekleri</th><td>S - M - L - XL</td></tr>
  </table>
`;

const ALL_LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', '4XL', '5XL', '6XL', 'STD', 'STANDART', 'TEK BEDEN'];
const ALL_NUMERIC_SIZES = ['24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '50', '52', '54', '56'];

function extractAllWholesalerSizes(html) {
  const $ = cheerio.load(html);
  const letterSizes = [];
  const numericSizes = [];
  const compoundSizes = [];

  const addToken = (token) => {
    if (!token) return;
    const clean = token.trim().toUpperCase();

    // Check compound sizes like S-M, 36-38
    if (/^(S-M|M-L|L-XL|XL-2XL|36-38|38-40|40-42|42-44|44-46|46-48)$/.test(clean)) {
      if (!compoundSizes.includes(clean)) compoundSizes.push(clean);
      return;
    }

    if (ALL_LETTER_SIZES.includes(clean)) {
      if (!letterSizes.includes(clean)) letterSizes.push(clean);
    } else if (ALL_NUMERIC_SIZES.includes(clean)) {
      if (!numericSizes.includes(clean)) numericSizes.push(clean);
    }
  };

  const processText = (txt) => {
    if (!txt || txt.includes('SEÇ') || txt.includes('TL') || txt.length > 40) return;
    // Split by slash, comma, space, dash, or parentheses
    const parts = txt.split(/[\s/,\-\(\)]+/);
    parts.forEach(addToken);
  };

  // 1. Scan Inline Script tags for JS variables
  $('script').each((_, el) => {
    const code = $(el).html() || '';
    if (!code) return;
    const matches = code.match(/["']([A-Z0-9\s/,-]{1,30})["']/gi);
    if (matches) {
      matches.forEach(m => processText(m.replace(/["']/g, '')));
    }
  });

  // 2. Scan DOM Elements (option, button, span, label, a, td, li, div)
  $('option, button, span, label, a, td, li, div, input').each((_, el) => {
    const $el = $(el);
    if ($el.hasClass('disabled') || $el.hasClass('passive') || $el.hasClass('out-of-stock') || $el.attr('disabled') !== undefined) return;

    processText($el.attr('data-size'));
    processText($el.attr('data-title'));
    processText($el.attr('data-variant'));
    processText($el.text());
  });

  // Sort Letter sizes (XXS -> 6XL)
  letterSizes.sort((a, b) => ALL_LETTER_SIZES.indexOf(a) - ALL_LETTER_SIZES.indexOf(b));
  
  // Sort Numeric sizes (24 -> 56)
  numericSizes.sort((a, b) => parseInt(a) - parseInt(b));

  // Determine final formatted sizes string
  if (letterSizes.length > 0) {
    return letterSizes.join(', ');
  } else if (numericSizes.length > 0) {
    return numericSizes.join(', ');
  } else if (compoundSizes.length > 0) {
    return compoundSizes.join(', ');
  }

  return 'Standart';
}

console.log('Test 1 (S (36), M (38), L (40)):', extractAllWholesalerSizes(html1));
console.log('Test 2 (36, 38, 40, 42 Numbers):', extractAllWholesalerSizes(html2));
console.log('Test 3 (1 (S-M), 2 (M-L)):', extractAllWholesalerSizes(html3));
console.log('Test 4 (S - M - L - XL Description):', extractAllWholesalerSizes(html4));
