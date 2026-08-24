import * as cheerio from 'cheerio';

function parseTurkishPrice(val) {
  if (!val) return 0;
  const str = val.toString().trim();
  const m = str.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
  if (!m) return 0;
  let token = m[1];
  if (token.includes('.') && token.includes(',')) token = token.replace(/\./g, '').replace(',', '.');
  else if (token.includes(',')) token = token.replace(',', '.');
  const num = parseFloat(token);
  return (!isNaN(num) && num >= 30) ? Number(num.toFixed(2)) : 0;
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function extractCategoryKeywords(title) {
  const lower = title.toLowerCase();
  const cats = ['tulum', 'elbise', 'pantolon', 'ceket', 'bluz', 'gömlek', 'triko', 'etek', 'sütyen', 'sutyen', 'külot', 'kulot', 'gecelik', 'pijama', 'sabahlık', 'büstiyer', 'badi', 'body', 'kazak', 'hırka', 'hirka', 'tayt', 'şort', 'sort'];
  for (const c of cats) {
    if (lower.includes(c)) return c;
  }
  return '';
}

function extractFabricKeyword(fabricInput, titleInput) {
  const text = `${fabricInput || ''} ${titleInput || ''}`.toLowerCase();
  const fabrics = [
    'saten', 'pamuk', 'pamuklu', 'dantel', 'dantelli', 'deri', 'triko', 
    'keten', 'süet', 'suet', 'krep', 'şifon', 'sifon', 'viskon', 'kaşmir', 
    'kasmir', 'kadife', 'denim', 'kot', 'tül', 'tul', 'örme', 'orme', 'dokuma', 'modal'
  ];

  for (const f of fabrics) {
    if (text.includes(f)) return f;
  }
  return '';
}

// STORES DATABASE (KOTON, PENTİ, ZARA)
const STORE_CATALOGS = {
  koton: [
    { title: 'Koton Sandy Kumaş Kolsuz Omzu Açık Asimetrik Madonna Yaka Mini Elbise', fabric: 'Örme / Sandy Kumaş', url: 'https://www.koton.com/sandy-kumas-kolsuz-omzu-acik-asimetrik-madonna-yaka-mini-elbise-bordo-4191429/', price: 1499.99 },
    { title: 'Koton Drapeli Bisiklet Yaka Kolsuz Midi Elbise', fabric: 'Örme Kumaş', url: 'https://www.koton.com/drapeli-bisiklet-yaka-kolsuz-midi-elbise-bordo-4188830/', price: 749.99 },
    { title: 'Koton Kruvaze Yaka Saten Abiye Mini Elbise', fabric: 'Saten Kumaş', url: 'https://www.koton.com/kruvaze-yaka-saten-abiye-mini-elbise-4187010/', price: 1699.99 },
    { title: 'Koton Çiçek Desenli Pamuklu V Yaka Yazlık Elbise', fabric: 'Pamuklu Dokuma', url: 'https://www.koton.com/cicek-desenli-v-yaka-yazlik-elbise-4186020/', price: 899.99 },
    { title: 'Koton Yüksek Bel Geniş Paça Askılı Denim Tulum', fabric: 'Denim Kumaş', url: 'https://www.koton.com/kadin-yuksek-bel-wide-leg-tulum-4189020/', price: 1299.99 }
  ],
  penti: [
    { title: 'Penti Satin Touch Siyah Gecelik & Saten Tulum Set', fabric: 'Saten Kumaş', url: 'https://www.penti.com/tr/kadin/ic-giyim/gecelik/satin-touch-siyah-gecelik/p/PLSTNTCH19IY-SYH', price: 974.99 },
    { title: 'Penti Easy Pamuklu Trim Siyah Slip Külot', fabric: 'Pamuklu Dokuma', url: 'https://www.penti.com/tr/kadin/ic-giyim/kulot/slip/easy-pamuklu-trim-siyah-slip-kulot/p/PLG3QCCJ22IY-BK3', price: 219.99 },
    { title: 'Penti Lace Luxury Siyah Dantel Detaylı Gecelik', fabric: 'Dantel Kumaş', url: 'https://www.penti.com/tr/kadin/ic-giyim/gecelik/lace-luxury-siyah-gecelik/p/PLLCLX21IY-BK3', price: 1199.99 },
    { title: 'Penti Dekoltemiz Multiway Siyah Dolgulu Push Up Balenli Sütyen', fabric: 'Polyester / Elastan', url: 'https://www.penti.com/tr/kadin/ic-giyim/sutyen/destekli-sutyen/dekoltemiz-siyah-dolgulu-push-up-sutyen/p/PLNOBDSM19IY-SYH', price: 974.99 }
  ],
  zara: [
    { title: 'Zara Saten Kruvaze Mini Elbise', fabric: 'Saten Kumaş', url: 'https://www.zara.com/tr/tr/saten-kruvaze-mini-elbise-p02157050.html', price: 1990.00 },
    { title: 'Zara Drapeli Midi Poplin Pamuk Elbise', fabric: 'Pamuklu Poplin', url: 'https://www.zara.com/tr/tr/drapeli-midi-poplin-elbise-p04812040.html', price: 1790.00 },
    { title: 'Zara Saten Straplez Uzun Tulum', fabric: 'Saten Kumaş', url: 'https://www.zara.com/tr/tr/saten-straplez-uzun-tulum-p02157051.html', price: 2290.00 },
    { title: 'Zara V Yaka Askılı Keten Tulum', fabric: 'Keten Kumaş', url: 'https://www.zara.com/tr/tr/v-yaka-askili-keten-tulum-p04812030.html', price: 1990.00 },
    { title: 'Zara Suni Deri Biker Ceket', fabric: 'Deri Kumaş', url: 'https://www.zara.com/tr/tr/suni-deri-biker-ceket-p02010040.html', price: 2990.00 }
  ]
};

async function testStrictSearch(productTitle, fabricInfo) {
  console.log(`\n==================================================`);
  console.log(`SEARCHING FOR TITLE: "${productTitle}" | FABRIC: "${fabricInfo}"`);
  console.log(`==================================================`);

  const category = extractCategoryKeywords(productTitle);
  const fabricKey = extractFabricKeyword(fabricInfo, productTitle);

  console.log(`- Extracted Category: "${category}"`);
  console.log(`- Extracted Fabric Keyword: "${fabricKey}"`);

  const matchedItems = [];

  for (const storeName of ['koton', 'penti', 'zara']) {
    const items = STORE_CATALOGS[storeName];
    const storeMatches = items.filter(item => {
      const fullText = `${item.title} ${item.fabric}`.toLowerCase();
      const matchCat = category ? fullText.includes(category) : true;
      const matchFab = fabricKey ? fullText.includes(fabricKey) : true;
      return matchCat && matchFab;
    });

    for (const m of storeMatches) {
      matchedItems.push({
        marketplace_name: storeName === 'koton' ? 'Koton' : storeName === 'penti' ? 'Penti (İç Giyim)' : 'Zara',
        product_title: m.title,
        product_url: m.url,
        price: m.price,
        fabric_match: `Kumaş Uyumlu: ${m.fabric}`
      });
    }
  }

  console.log(`\nTOTAL MATCHING PRODUCTS FOUND: ${matchedItems.length}`);
  if (matchedItems.length === 0) {
    console.log(`❌ HİÇBİR ÜRÜN BULUNAMADI! (İstenildiği gibi boş liste dönüldü, zorlama ürün gösterilmiyor)`);
  } else {
    matchedItems.forEach((item, idx) => {
      console.log(` ${idx+1}. [${item.marketplace_name}] ${item.product_title} -> ${item.price} TL (${item.fabric_match})`);
    });
  }
}

async function main() {
  // Case 1: Searching Saten Elbise (Matches Koton Saten Elbise, Zara Saten Elbise, Penti Saten Gecelik Elbise)
  await testStrictSearch("Saten Kruvaze Mini Elbise", "Saten");

  // Case 2: Searching Keten Tulum (Matches Zara Keten Tulum)
  await testStrictSearch("Keten Tulum", "Keten");

  // Case 3: Searching Deri Elbise (No Deri Elbise in catalogs -> SHOULD RETURN 0 PRODUCTS!)
  await testStrictSearch("Deri Elbise", "Deri");
}

main();
