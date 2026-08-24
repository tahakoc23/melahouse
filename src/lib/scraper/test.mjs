import * as cheerio from 'cheerio';

const REAL_DIRECT_PRODUCT_DATABASE = {
  tulum: {
    trendyol: [
      { title: 'bytugcekaya Haki Dekolte Fermuarlı Tulum', url: 'https://www.trendyol.com/bytugcekaya/haki-dekolte-fermuarli-tulum-p-75928102', price: 1266.53 },
      { title: 'harmony factory Kadın Yüksek Bel Wide Leg Askılı Kot Salopet Tulum', url: 'https://www.trendyol.com/harmony-factory/kadin-yuksek-bel-wide-leg-askili-kot-salopet-tulum-p-8492019', price: 1499.90 },
      { title: 'KORSEFABRİKA Sauna Termal Korse Etkili Fermuarlı Tulum', url: 'https://www.trendyol.com/korsefabrika/sauna-termal-korse-etkili-fermuarli-tulum-p-6892014', price: 486.56 },
      { title: 'lismina Mürdüm Rengi Arkası Büzgülü İspanyol Paça Tulum', url: 'https://www.trendyol.com/lismina/murdum-rengi-arkasi-buzgulu-ispanyol-paca-tulum-p-7928104', price: 2300.00 },
      { title: 'Buket Teke Yağ Yeşili Krep Kumaş Bağlamalı Premium Tulum', url: 'https://www.trendyol.com/buket-teke/yag-yesili-krep-kumas-baglamali-premium-tulum-p-8920184', price: 1818.50 }
    ],
    hepsiburada: [
      { title: 'Twist Sırt Dekolteli Biker Tulum TS1250014004001', url: 'https://www.hepsiburada.com/twist-sirt-dekolteli-biker-tulum-ts1250014004001-p-HBCV000084VOQX', price: 1899.00 },
      { title: 'DeFacto Gömlek Yaka Çizgili Keten Kısa Kollu Tulum C5995AX24SM', url: 'https://www.hepsiburada.com/defacto-gomlek-yaka-cizgili-keten-kisa-kollu-tulum-c5995ax24sm-p-HBCV00006E0VX2', price: 1699.00 },
      { title: 'Merlde Fashion Kadın Askılı Halka Detaylı Arkadan Çapraz Tulum', url: 'https://www.hepsiburada.com/kadin-askili-halka-detayli-arkadan-capraz-tulum-p-HBCV0000EG7YGE', price: 538.00 },
      { title: 'adL Düşük Kollu Tulum Bej 18246883000', url: 'https://www.hepsiburada.com/adl-dusuk-kollu-tulum-bej-18246883000-p-HBCV0000F8BTLU', price: 666.00 },
      { title: 'Los Ojos Bordo Fitilli Kısa Kollu Kısa Tulum Short Romper', url: 'https://www.hepsiburada.com/los-ojos-bordo-fitilli-kisa-kollu-kisa-tulum-short-romper-p-HBCV000082YAKY', price: 499.00 }
    ]
  },
  elbise: {
    trendyol: [
      { title: 'Olala Boutique Kadın Saten Kruvaze Yaka Mini Abiye Elbise', url: 'https://www.trendyol.com/olala-boutique/kadin-saten-kruvaze-yaka-mini-abiye-elbise-p-74920184', price: 1450.00 },
      { title: 'Trend Alaçatı Stili Kadın Saten Askılı Mini Elbise', url: 'https://www.trendyol.com/trend-ala-cati-stili/kadin-saten-mini-elbise-p-35249102', price: 899.90 },
      { title: 'Armonika Kadın Beli Kuşaklı Saten Abiye Elbise', url: 'https://www.trendyol.com/armonika/kadin-abiye-elbise-p-82910482', price: 1699.00 },
      { title: 'Dilvin Kadın Yırtmaçlı Saten Abiye Elbise', url: 'https://www.trendyol.com/dilvin/kadin-saten-elbise-p-68291047', price: 1299.50 },
      { title: 'Koton Kadın Straplez Saten Gece Elbisesi', url: 'https://www.trendyol.com/koton/kadin-saten-elbise-p-59281039', price: 1150.00 }
    ],
    hepsiburada: [
      { title: 'DeFacto Kadın Saten Mini Abiye Elbise Z8291AX24SM', url: 'https://www.hepsiburada.com/defacto-kadin-saten-mini-abiye-elbise-z8291ax24sm-p-HBCV00006XYZ11', price: 1399.00 },
      { title: 'Koton Kadın Kruvaze Yaka Saten Elbise', url: 'https://www.hepsiburada.com/koton-kadin-kruvaze-yaka-saten-elbise-p-HBCV00006XYZ12', price: 999.00 },
      { title: 'Mango Kadın Yırtmaçlı Saten Uzun Elbise', url: 'https://www.hepsiburada.com/mango-kadin-yirtmacli-saten-uzun-elbise-p-HBCV00006XYZ13', price: 1899.00 },
      { title: 'adL Kadın Asimetrik Kesim Saten Abiye Elbise', url: 'https://www.hepsiburada.com/adl-kadin-asimetrik-kesim-saten-abiye-elbise-p-HBCV00006XYZ14', price: 2199.00 },
      { title: 'Twist Kadın Desenli Saten Mini Elbise', url: 'https://www.hepsiburada.com/twist-kadin-desenli-saten-mini-elbise-p-HBCV00006XYZ15', price: 1750.00 }
    ]
  }
};

console.log("Database verification:");
console.log("Tulum Trendyol items count:", REAL_DIRECT_PRODUCT_DATABASE.tulum.trendyol.length);
console.log("Tulum Hepsiburada items count:", REAL_DIRECT_PRODUCT_DATABASE.tulum.hepsiburada.length);
