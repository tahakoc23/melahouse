/**
 * Piyasa araştırması sözlüğü: Türkçe normalizasyon, kategori/kumaş/renk eş anlamlıları
 * ve birbiriyle çelişen model detayları.
 *
 * Tüm eşleştirmeler normalizeTr() sonrası ASCII küçük harf metin üzerinde yapılır.
 */

/** "ELBİSE-Sİyah Şık" -> "elbise siyah sik" (Türkçe İ/ı doğru küçültülür, aksanlar atılır) */
export function normalizeTr(s: string): string {
  return (s || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim()
}

export function tokens(s: string): string[] {
  return normalizeTr(s).split(' ').filter(Boolean)
}

/**
 * Kök eşleşmesi: "elbisesi" -> "elbise".
 * 4 harf ve altındaki kökler tam kelime ister ("ipek" ≠ "ipekyol", "mini" ≠ "minimal", "tul" ≠ "tulum").
 * Çok kelimeli kökler kelime başından eşleşir ("uzun kol" -> "uzun kollu").
 */
export function hasRoot(toks: string[], root: string): boolean {
  if (root.includes(' ')) return ` ${toks.join(' ')}`.includes(` ${root}`)
  return toks.some(t => (root.length <= 4 ? t === root : t.startsWith(root)))
}

export function hasAny(toks: string[], roots: string[]): boolean {
  return roots.some(r => hasRoot(toks, r))
}

/* ------------------------------------------------------------------ */
/* Kategoriler                                                         */
/* ------------------------------------------------------------------ */

export interface CategoryDef {
  key: string
  label: string
  /** Başlıkta geçmesi gereken kökler */
  roots: string[]
  /** Aramada kullanılacak kelime */
  searchWord: string
}

// Sıra önemli: daha özel olan önce ("tulum elbise" -> tulum değil elbise sayılmasın diye elbise önce)
export const CATEGORIES: CategoryDef[] = [
  { key: 'abiye', label: 'Abiye', roots: ['abiye'], searchWord: 'abiye elbise' },
  { key: 'elbise', label: 'Elbise', roots: ['elbise'], searchWord: 'elbise' },
  { key: 'tulum', label: 'Tulum', roots: ['tulum'], searchWord: 'tulum' },
  { key: 'takim', label: 'Takım', roots: ['takim', 'ikili set', 'alt ust'], searchWord: 'takım' },
  { key: 'gomlek', label: 'Gömlek', roots: ['gomlek'], searchWord: 'gömlek' },
  { key: 'bluz', label: 'Bluz', roots: ['bluz', 'bluzu'], searchWord: 'bluz' },
  { key: 'tisort', label: 'T-shirt', roots: ['tisort', 'tshirt', 't shirt'], searchWord: 'tişört' },
  { key: 'crop', label: 'Crop', roots: ['crop'], searchWord: 'crop' },
  { key: 'body', label: 'Body', roots: ['body', 'badi'], searchWord: 'body' },
  { key: 'bustiyer', label: 'Büstiyer', roots: ['bustiyer', 'korse'], searchWord: 'büstiyer' },
  { key: 'kimono', label: 'Kimono', roots: ['kimono'], searchWord: 'kimono' },
  { key: 'sweatshirt', label: 'Sweatshirt', roots: ['sweatshirt', 'hoodie'], searchWord: 'sweatshirt' },
  { key: 'kazak', label: 'Kazak', roots: ['kazak', 'suveter'], searchWord: 'kazak' },
  { key: 'hirka', label: 'Hırka', roots: ['hirka'], searchWord: 'hırka' },
  { key: 'tunik', label: 'Tunik', roots: ['tunik'], searchWord: 'tunik' },
  { key: 'pantolon', label: 'Pantolon', roots: ['pantolon', 'palazzo'], searchWord: 'pantolon' },
  { key: 'jean', label: 'Jean', roots: ['jean', 'kot pantolon'], searchWord: 'jean' },
  { key: 'etek', label: 'Etek', roots: ['etek', 'etegi'], searchWord: 'etek' },
  { key: 'sort', label: 'Şort', roots: ['sort', 'sortu', 'sortlu'], searchWord: 'şort' },
  { key: 'tayt', label: 'Tayt', roots: ['tayt'], searchWord: 'tayt' },
  { key: 'esofman', label: 'Eşofman', roots: ['esofman', 'jogger'], searchWord: 'eşofman' },
  { key: 'trenckot', label: 'Trençkot', roots: ['trenckot', 'trench'], searchWord: 'trençkot' },
  { key: 'kaban', label: 'Kaban', roots: ['kaban'], searchWord: 'kaban' },
  { key: 'palto', label: 'Palto', roots: ['palto'], searchWord: 'palto' },
  { key: 'mont', label: 'Mont', roots: ['mont', 'sisme', 'puffer'], searchWord: 'mont' },
  { key: 'ceket', label: 'Ceket', roots: ['ceket', 'blazer'], searchWord: 'ceket' },
  { key: 'yelek', label: 'Yelek', roots: ['yelek'], searchWord: 'yelek' },
  { key: 'gecelik', label: 'Gecelik', roots: ['gecelik'], searchWord: 'gecelik' },
  { key: 'pijama', label: 'Pijama', roots: ['pijama'], searchWord: 'pijama takımı' },
  { key: 'sabahlik', label: 'Sabahlık', roots: ['sabahlik'], searchWord: 'sabahlık' },
  { key: 'sutyen', label: 'Sütyen', roots: ['sutyen', 'bralet'], searchWord: 'sütyen' },
  { key: 'kulot', label: 'Külot', roots: ['kulot', 'string'], searchWord: 'külot' },
  { key: 'kombinezon', label: 'Kombinezon', roots: ['kombinezon', 'jupon'], searchWord: 'kombinezon' },
]

/** Admin kategori adlarını (DB) araştırma kategorisine çevirir: "Üst Giyim" gibi grup adları kategori sayılmaz. */
export function categoryFromText(text: string): CategoryDef | null {
  const toks = tokens(text)
  return CATEGORIES.find(c => hasAny(toks, c.roots)) || null
}

/* ------------------------------------------------------------------ */
/* Kumaşlar                                                            */
/* ------------------------------------------------------------------ */

export interface FabricDef {
  key: string
  label: string
  roots: string[]
  /** Arama sorgusunda kullanılacak sıfat */
  adjective: string
}

export const FABRICS: FabricDef[] = [
  { key: 'saten', label: 'Saten', roots: ['saten', 'satin'], adjective: 'saten' },
  { key: 'ipek', label: 'İpek', roots: ['ipek', 'silk'], adjective: 'ipek' },
  { key: 'viskon', label: 'Viskon', roots: ['viskon', 'viskoz', 'viscose', 'viscon'], adjective: 'viskon' },
  { key: 'keten', label: 'Keten', roots: ['keten', 'linen'], adjective: 'keten' },
  { key: 'pamuk', label: 'Pamuk', roots: ['pamuk', 'pamuklu', 'cotton', 'poplin'], adjective: 'pamuklu' },
  { key: 'krep', label: 'Krep', roots: ['krep', 'crepe'], adjective: 'krep' },
  { key: 'sifon', label: 'Şifon', roots: ['sifon', 'chiffon'], adjective: 'şifon' },
  { key: 'triko', label: 'Triko', roots: ['triko', 'orgu', 'knit'], adjective: 'triko' },
  { key: 'kadife', label: 'Kadife', roots: ['kadife', 'velvet', 'velur'], adjective: 'kadife' },
  { key: 'deri', label: 'Deri', roots: ['deri', 'leather'], adjective: 'deri' },
  { key: 'suet', label: 'Süet', roots: ['suet', 'suede'], adjective: 'süet' },
  { key: 'denim', label: 'Denim', roots: ['denim', 'jean'], adjective: 'denim' },
  { key: 'dantel', label: 'Dantel', roots: ['dantel', 'lace'], adjective: 'dantelli' },
  { key: 'tul', label: 'Tül', roots: ['tul', 'tulle'], adjective: 'tül' },
  { key: 'modal', label: 'Modal', roots: ['modal'], adjective: 'modal' },
  { key: 'kasmir', label: 'Kaşmir', roots: ['kasmir', 'cashmere'], adjective: 'kaşmir' },
  { key: 'yun', label: 'Yün', roots: ['yun', 'wool'], adjective: 'yün' },
  { key: 'tuvit', label: 'Tüvit', roots: ['tuvit', 'tweed'], adjective: 'tüvit' },
  { key: 'scuba', label: 'Scuba', roots: ['scuba', 'skuba'], adjective: 'scuba' },
  { key: 'krinkil', label: 'Krinkıl', roots: ['krinkil', 'krinkıl'], adjective: 'krinkıl' },
  { key: 'gabardin', label: 'Gabardin', roots: ['gabardin'], adjective: 'gabardin' },
  { key: 'polyester', label: 'Polyester', roots: ['polyester'], adjective: '' },
]

/** "%58 Pamuk %42 Polyester" -> en yüksek oranlı kumaş; oran yoksa metinde geçen ilk kumaş */
export function fabricFromText(text: string): FabricDef | null {
  const norm = normalizeTr(text)
  let best: FabricDef | null = null
  let bestPct = -1
  for (const m of norm.matchAll(/%\s*(\d{1,3})\s+([a-z]+)/g)) {
    const pct = Number(m[1])
    const f = FABRICS.find(d => hasAny([m[2]], d.roots))
    if (f && pct > bestPct) {
      best = f
      bestPct = pct
    }
  }
  if (best) return best
  const toks = tokens(text)
  return FABRICS.find(f => hasAny(toks, f.roots)) || null
}

/* ------------------------------------------------------------------ */
/* Renkler                                                             */
/* ------------------------------------------------------------------ */

export interface ColorDef {
  key: string
  label: string
  roots: string[]
}

// Yakın tonlar aynı aile: vizon/bej/krem ararken bunlar çelişki sayılmaz
export const COLORS: (ColorDef & { family: string })[] = [
  { key: 'siyah', label: 'Siyah', roots: ['siyah', 'black'], family: 'siyah' },
  { key: 'beyaz', label: 'Beyaz', roots: ['beyaz', 'white'], family: 'beyaz' },
  { key: 'ekru', label: 'Ekru', roots: ['ekru'], family: 'acik' },
  { key: 'krem', label: 'Krem', roots: ['krem'], family: 'acik' },
  { key: 'bej', label: 'Bej', roots: ['bej', 'beige', 'tas'], family: 'acik' },
  { key: 'vizon', label: 'Vizon', roots: ['vizon'], family: 'kahve' },
  { key: 'kahverengi', label: 'Kahverengi', roots: ['kahverengi', 'kahve', 'taba', 'camel', 'kamel'], family: 'kahve' },
  { key: 'bordo', label: 'Bordo', roots: ['bordo', 'visne', 'murdum'], family: 'kirmizi' },
  { key: 'kirmizi', label: 'Kırmızı', roots: ['kirmizi', 'red'], family: 'kirmizi' },
  { key: 'pudra', label: 'Pudra', roots: ['pudra'], family: 'pembe' },
  { key: 'pembe', label: 'Pembe', roots: ['pembe', 'pink', 'fusya'], family: 'pembe' },
  { key: 'lacivert', label: 'Lacivert', roots: ['lacivert', 'navy'], family: 'mavi' },
  { key: 'mavi', label: 'Mavi', roots: ['mavi', 'blue', 'indigo'], family: 'mavi' },
  { key: 'yesil', label: 'Yeşil', roots: ['yesil', 'green', 'zumrut', 'mint'], family: 'yesil' },
  { key: 'haki', label: 'Haki', roots: ['haki', 'khaki'], family: 'yesil' },
  { key: 'gri', label: 'Gri', roots: ['gri', 'grey', 'gray', 'fume', 'antrasit'], family: 'gri' },
  { key: 'lila', label: 'Lila', roots: ['lila', 'mor', 'lavanta', 'purple'], family: 'mor' },
  { key: 'sari', label: 'Sarı', roots: ['sari', 'hardal', 'yellow'], family: 'sari' },
  { key: 'turuncu', label: 'Turuncu', roots: ['turuncu', 'oranj', 'somon', 'mercan'], family: 'turuncu' },
  { key: 'gold', label: 'Gold', roots: ['gold', 'altin'], family: 'metal' },
  { key: 'gumus', label: 'Gümüş', roots: ['gumus', 'silver'], family: 'metal' },
]

export function colorFromText(text: string): (typeof COLORS)[number] | null {
  const toks = tokens(text)
  return COLORS.find(c => hasAny(toks, c.roots)) || null
}

/** Başlıkta geçen renk aileleri */
export function colorFamiliesIn(toks: string[]): Set<string> {
  const out = new Set<string>()
  for (const c of COLORS) if (hasAny(toks, c.roots)) out.add(c.family)
  return out
}

/* ------------------------------------------------------------------ */
/* Model detayları ve çelişki grupları                                 */
/* ------------------------------------------------------------------ */

export interface DetailDef {
  key: string
  label: string
  roots: string[]
  /** Aynı gruptan farklı bir detay başlıkta geçiyorsa ürün uyumsuzdur (midi ararken mini) */
  group?: 'boy' | 'kol' | 'yaka' | 'kalip' | 'bel'
}

export const DETAILS: DetailDef[] = [
  { key: 'mini', label: 'Mini', roots: ['mini', 'kisa elbise', 'mini elbise'], group: 'boy' },
  { key: 'midi', label: 'Midi', roots: ['midi'], group: 'boy' },
  { key: 'maxi', label: 'Maxi', roots: ['maxi', 'maksi', 'uzun elbise', 'uzun abiye'], group: 'boy' },
  { key: 'askili', label: 'Askılı', roots: ['askili', 'ip askili'], group: 'kol' },
  { key: 'straplez', label: 'Straplez', roots: ['straplez', 'strapless'], group: 'kol' },
  { key: 'kolsuz', label: 'Kolsuz', roots: ['kolsuz'], group: 'kol' },
  { key: 'kisa-kollu', label: 'Kısa kollu', roots: ['kisa kollu', 'kisa kol'], group: 'kol' },
  { key: 'uzun-kollu', label: 'Uzun kollu', roots: ['uzun kollu', 'uzun kol'], group: 'kol' },
  { key: 'v-yaka', label: 'V yaka', roots: ['v yaka'], group: 'yaka' },
  { key: 'bisiklet-yaka', label: 'Bisiklet yaka', roots: ['bisiklet yaka', 'sifir yaka'], group: 'yaka' },
  { key: 'balikci-yaka', label: 'Balıkçı yaka', roots: ['balikci', 'boğazli', 'bogazli'], group: 'yaka' },
  { key: 'gomlek-yaka', label: 'Gömlek yaka', roots: ['gomlek yaka'], group: 'yaka' },
  { key: 'kayik-yaka', label: 'Kayık yaka', roots: ['kayik yaka'], group: 'yaka' },
  { key: 'halter-yaka', label: 'Halter yaka', roots: ['halter'], group: 'yaka' },
  { key: 'kare-yaka', label: 'Kare yaka', roots: ['kare yaka'], group: 'yaka' },
  { key: 'oversize', label: 'Oversize', roots: ['oversize', 'bol kesim', 'salas', 'relaxed'], group: 'kalip' },
  { key: 'dar-kesim', label: 'Dar kesim', roots: ['dar kesim', 'slim fit', 'bodycon', 'kalem'], group: 'kalip' },
  { key: 'yuksek-bel', label: 'Yüksek bel', roots: ['yuksek bel'], group: 'bel' },
  { key: 'dusuk-bel', label: 'Düşük bel', roots: ['dusuk bel'], group: 'bel' },
  { key: 'kruvaze', label: 'Kruvaze', roots: ['kruvaze', 'anvelop', 'wrap'] },
  { key: 'yirtmacli', label: 'Yırtmaçlı', roots: ['yirtmac'] },
  { key: 'dantelli', label: 'Dantelli', roots: ['dantel'] },
  { key: 'drapeli', label: 'Drapeli', roots: ['drape'] },
  { key: 'firfirli', label: 'Fırfırlı', roots: ['firfir', 'volan'] },
  { key: 'kemerli', label: 'Kemerli', roots: ['kemer', 'kusak'] },
  { key: 'pileli', label: 'Pileli', roots: ['pileli', 'pliseli'] },
  { key: 'dugmeli', label: 'Düğmeli', roots: ['dugme'] },
  { key: 'fermuarli', label: 'Fermuarlı', roots: ['fermuar'] },
  { key: 'genis-paca', label: 'Geniş paça', roots: ['genis paca', 'wide leg', 'palazzo', 'bol paca'] },
  { key: 'payetli', label: 'Payetli', roots: ['payet', 'pullu'] },
  { key: 'desenli', label: 'Desenli', roots: ['desenli', 'cicekli', 'cizgili', 'puantiyeli', 'baskili'] },
  { key: 'duz', label: 'Düz', roots: ['duz renk'] },
]

export function detailsFromText(text: string): DetailDef[] {
  const toks = tokens(text)
  return DETAILS.filter(d => hasAny(toks, d.roots))
}

/* ------------------------------------------------------------------ */
/* Kesin eleme kuralları                                               */
/* ------------------------------------------------------------------ */

/** Kadın giyim araştırmasında hiç istenmeyen sonuçlar ve nedenleri */
export const EXCLUDE_RULES: { roots: string[]; reason: string; unlessQueryHas?: string[] }[] = [
  { roots: ['erkek', 'men s', 'mens'], reason: 'Erkek ürünü' },
  { roots: ['cocuk', 'kiz cocuk', 'bebek', 'kids', 'genc kiz'], reason: 'Çocuk ürünü' },
  { roots: ['tesettur', 'namaz', 'ferace', 'esarp', 'hijab'], reason: 'Tesettür ürünü', unlessQueryHas: ['tesettur'] },
  { roots: ['buyuk beden', 'battal'], reason: 'Büyük beden', unlessQueryHas: ['buyuk beden'] },
  { roots: ['hamile', 'lohusa'], reason: 'Hamile giyim', unlessQueryHas: ['hamile'] },
  { roots: ['2 li', '3 lu', '4 lu', '5 li', 'li paket', 'lu paket', 'li set', 'lu set'], reason: 'Çoklu paket' },
  { roots: ['kostum', 'kostumu', 'cadilar', 'cosplay'], reason: 'Kostüm' },
  { roots: ['kumas metre', 'top kumas', 'metre kumas'], reason: 'Metre kumaş' },
  { roots: ['askisi', 'aski seti', 'kilif', 'hurc', 'canta', 'ayakkabi', 'terlik', 'cuzdan'], reason: 'Aksesuar / farklı ürün' },
]
