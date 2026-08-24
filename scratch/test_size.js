const cheerio = require('cheerio');

const htmlSample1 = `
  <div class="product-variants-container">
    <div class="variant-title">Beden Seçiniz:</div>
    <div class="sub-button-item"><span>S</span></div>
    <div class="sub-button-item"><span>M</span></div>
    <div class="sub-button-item"><span>L</span></div>
  </div>
`;

const htmlSample2 = `
  <script>
    var productSubProducts = [
      { id: 1, name: "S", inStock: true },
      { id: 2, name: "M", inStock: true },
      { id: 3, name: "L", inStock: true }
    ];
  </script>
`;

const htmlSample3 = `
  <div class="product-spec">
    <table>
      <tr><th>Bedenler</th><td>S, M, L</td></tr>
    </table>
  </div>
`;

const htmlSample4 = `
  <select name="variant_beden" class="form-control">
    <option value="">Beden Seçiniz</option>
    <option value="1">S</option>
    <option value="2">M</option>
    <option value="3">L</option>
  </select>
`;

function extractSizesFromHtml(html) {
  const $ = cheerio.load(html);
  const detected = [];
  const ALLOWED = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'STD', 'STANDART', '34', '36', '38', '40', '42', '44', '46', '48', '50'];

  // 1. Scan Inline Script tags BEFORE stripping scripts from DOM
  $('script').each((_, el) => {
    const code = $(el).html() || '';
    if (/beden|subProduct|variant|option|size/i.test(code)) {
      const matches = code.match(/["'](XXS|XS|S|M|L|XL|2XL|XXL|3XL|STD|Standart|34|36|38|40|42|44|46|48|50)["']/gi);
      if (matches) {
        matches.forEach(m => {
          const val = m.replace(/["']/g, '').toUpperCase();
          if (ALLOWED.includes(val) && !detected.includes(val)) detected.push(val);
        });
      }
    }
  });

  // 2. Scan DOM elements for size containers and dropdown options
  if (detected.length === 0) {
    const sizeSelectors = [
      'select[name*="beden"] option', 'select[name*="size"] option', 'select option',
      '.size-box', '.beden-box', '.variant-size', '.size-item', '[data-size]', 
      '.variant-box', 'ul.size-list li', '.size-options span', '.variant-item', 
      'div.beden-secimi button', '.size-wrapper label', '.beden-listesi span',
      '.product-variants span', '.sub-item', '.sizes span', '.variantProperty',
      'td', 'th', 'li', 'span', 'button', 'a', 'div'
    ];

    $(sizeSelectors.join(', ')).each((_, el) => {
      const $el = $(el);
      
      const isPassiv = $el.hasClass('disabled') || 
                       $el.hasClass('passive') || 
                       $el.hasClass('out-of-stock') || 
                       $el.hasClass('stokta-yok') || 
                       $el.hasClass('off') ||
                       $el.hasClass('soldout') ||
                       $el.attr('disabled') !== undefined;
      
      if (isPassiv) return;

      const elementText = $el.text().trim();
      const txt = ($el.attr('data-size') || $el.attr('data-title') || elementText || $el.attr('value') || '').toUpperCase();
      if (!txt || txt.includes('SEÇ') || txt.includes('BEDEN SEÇİNİZ') || txt.length > 20) return;

      const tokens = txt.match(/\b(XXS|XS|S|M|L|XL|2XL|XXL|3XL|STD|STANDART|TEK BEDEN|32|34|36|38|40|42|44|46|48|50)\b/gi);
      if (tokens) {
        tokens.forEach(tk => {
          const val = tk.toUpperCase();
          if (ALLOWED.includes(val) && !detected.includes(val)) {
            detected.push(val);
          }
        });
      }
    });
  }

  // Sort sizes in natural clothing order
  detected.sort((a, b) => ALLOWED.indexOf(a) - ALLOWED.indexOf(b));
  return detected.length > 0 ? detected.join(', ') : 'Standart';
}

console.log('Sample 1 (Ticimax/İdeasoft DOM) Sizes:', extractSizesFromHtml(htmlSample1));
console.log('Sample 2 (JS Script Variable) Sizes:', extractSizesFromHtml(htmlSample2));
console.log('Sample 3 (Table Spec Text) Sizes:', extractSizesFromHtml(htmlSample3));
console.log('Sample 4 (Select Dropdown) Sizes:', extractSizesFromHtml(htmlSample4));
