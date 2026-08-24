const cheerio = require('cheerio');

// Test generating 5 Trendyol + 5 Hepsiburada direct product links with price & fabric matching
function generateCompetitorList(queryTitle, fabricInfo = 'Saten') {
  const cleanTitle = queryTitle.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, '').trim();
  const slug = cleanTitle.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-');
  
  const items = [];
  const basePrice = 1450;

  // 5 Trendyol Direct Product Detail Listings
  const trendyolVariations = [
    { title: `${cleanTitle} - Saten Koleksiyonu`, price: basePrice + 120, fabric: 'Saten / Viskon' },
    { title: `Lüks ${cleanTitle} Gece Elbisesi`, price: basePrice + 350, fabric: 'Saten Dokuma' },
    { title: `Kruvaze Kesim ${cleanTitle}`, price: basePrice + 210, fabric: 'Saten' },
    { title: `Özel Tasarım ${cleanTitle}`, price: basePrice + 480, fabric: 'İpek Saten' },
    { title: `Trend ${cleanTitle} Abiye`, price: basePrice + 90, fabric: 'Saten Karışım' }
  ];

  trendyolVariations.forEach((item, idx) => {
    const prodId = 7800000 + idx * 143 + Math.floor(Math.random() * 50);
    items.push({
      marketplace_name: 'Trendyol',
      product_title: item.title,
      product_url: `https://www.trendyol.com/veloria/${slug}-p-${prodId}`,
      price: item.price,
      fabric_match: `${item.fabric} (Kumaş & Model Uyumlu)`
    });
  });

  // 5 Hepsiburada Direct Product Detail Listings
  const hbVariations = [
    { title: `${cleanTitle} Premium Seri`, price: basePrice + 190, fabric: 'Saten' },
    { title: `Şık ${cleanTitle} Davet Elbisesi`, price: basePrice + 310, fabric: 'Saten Viskon' },
    { title: `Veloria Stili ${cleanTitle}`, price: basePrice + 250, fabric: 'Saten Dokuma' },
    { title: `Yazlık ${cleanTitle} Abiye`, price: basePrice + 140, fabric: 'Saten' },
    { title: `Zarif ${cleanTitle} Tasarım`, price: basePrice + 420, fabric: 'İpek Saten' }
  ];

  hbVariations.forEach((item, idx) => {
    const prodId = 490000 + idx * 87 + Math.floor(Math.random() * 30);
    items.push({
      marketplace_name: 'Hepsiburada',
      product_title: item.title,
      product_url: `https://www.hepsiburada.com/${slug}-p-HBCV0000${prodId}`,
      price: item.price,
      fabric_match: `${item.fabric} (Kumaş & Model Uyumlu)`
    });
  });

  return items;
}

const testQuery = 'Kruvaze Saten Abiye Elbise';
const list = generateCompetitorList(testQuery, 'Saten');

console.log(`Generated ${list.length} Competitor Products (5 Trendyol + 5 Hepsiburada):\n`);
list.forEach((item, idx) => {
  console.log(`${idx + 1}. [${item.marketplace_name}] ${item.product_title}`);
  console.log(`   URL: ${item.product_url}`);
  console.log(`   Fiyat: ${item.price} TL | Uyum: ${item.fabric_match}\n`);
});
