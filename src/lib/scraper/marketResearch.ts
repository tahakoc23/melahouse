import * as cheerio from 'cheerio';

/**
 * Piyasa fiyat araştırması.
 *
 * Gerçek arama sayfalarını çeker, ürün adı + fiyat + link çıkarır, aranan ürünle
 * alakasız sonuçları eler ve istatistik üretir. Hiçbir sabit/uydurma ürün yoktur:
 * bir kaynağa erişilemezse sonuçta "erişilemedi" olarak raporlanır.
 */

export type MarketSegment = 'pazaryeri' | 'hizli_moda' | 'premium';

export const SEGMENT_LABELS: Record<MarketSegment, string> = {
  pazaryeri: 'Pazaryeri',
  hizli_moda: 'Hızlı Moda',
  premium: 'Premium Marka',
};

export interface CompetitorItem {
  marketplace_name: string;
  segment: MarketSegment;
  product_title: string;
  product_url: string;
  price: number;
  original_price?: number;
  relevance: number;
  matched: string[];
}

export interface SourceStatus {
  name: string;
  segment: MarketSegment;
  ok: boolean;
  found: number;
  used: number;
  search_url: string;
  error?: string;
}

export interface SegmentStats {
  segment: MarketSegment;
  label: string;
  count: number;
  median: number;
  min: number;
  max: number;
}

export interface CompetitorAnalysisResult {
  query: string;
  search_terms: string;
  detected: { category: string; fabric: string; color: string };
  average_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  items: CompetitorItem[];
  segments: SegmentStats[];
  sources: SourceStatus[];
  manual_links: { name: string; url: string }[];
  searched_at: string;
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 20000;
const MAX_ITEMS_PER_SOURCE = 8;
const MIN_PRICE = 50;
const MAX_PRICE = 250000;

// ---------------------------------------------------------------------------
// Türkçe metin normalizasyonu
// ---------------------------------------------------------------------------

/** "ELBİSE-Sİyah" -> "elbise siyah". toLowerCase() Türkçe İ'yi "i̇" yaptığı için locale şart. */
export function normalizeTr(s: string): string {
  return (s || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim();
}

function tokens(s: string): string[] {
  return normalizeTr(s).split(' ').filter(Boolean);
}

// Kategori: kanonik ad -> eşleşecek kelime kökleri (kelime başı eşleşmesi)
const CATEGORIES: Record<string, string[]> = {
  elbise: ['elbise', 'abiye'],
  tulum: ['tulum'],
  pantolon: ['pantolon', 'jean', 'palazzo'],
  etek: ['etek'],
  sort: ['sort'],
  gomlek: ['gomlek'],
  bluz: ['bluz'],
  ceket: ['ceket', 'blazer'],
  kaban: ['kaban'],
  mont: ['mont', 'sisme', 'puffer'],
  trenckot: ['trenckot', 'trench'],
  yelek: ['yelek'],
  hirka: ['hirka'],
  kazak: ['kazak', 'suveter'],
  sweatshirt: ['sweatshirt', 'sweat', 'hoodie'],
  tisort: ['tisort', 'tshirt', 't shirt', 'atlet'],
  crop: ['crop'],
  kimono: ['kimono'],
  tayt: ['tayt'],
  esofman: ['esofman'],
  takim: ['takim'],
  tunik: ['tunik'],
  bustiyer: ['bustiyer', 'korse'],
  body: ['body', 'badi'],
  gecelik: ['gecelik'],
  pijama: ['pijama'],
  sabahlik: ['sabahlik'],
  sutyen: ['sutyen', 'bralet'],
  kulot: ['kulot', 'string', 'slip'],
};

const FABRICS: Record<string, string[]> = {
  saten: ['saten', 'satin'],
  pamuk: ['pamuk', 'pamuklu', 'cotton', 'poplin'],
  keten: ['keten'],
  viskon: ['viskon', 'viskoz'],
  ipek: ['ipek'],
  kadife: ['kadife'],
  deri: ['deri'],
  suet: ['suet', 'suede'],
  dantel: ['dantel'],
  sifon: ['sifon'],
  krep: ['krep'],
  triko: ['triko', 'orgu'],
  denim: ['denim', 'kot'],
  modal: ['modal'],
  kasmir: ['kasmir'],
  yun: ['yun'],
  tul: ['tul'],
  scuba: ['scuba', 'skuba'],
  krinkil: ['krinkil'],
  gabardin: ['gabardin'],
  polyester: ['polyester'],
};

const FABRIC_ADJECTIVE: Record<string, string> = {
  pamuk: 'pamuklu',
  saten: 'saten',
  keten: 'keten',
  viskon: 'viskon',
  ipek: 'ipek',
  kadife: 'kadife',
  deri: 'deri',
  suet: 'süet',
  dantel: 'dantelli',
  sifon: 'şifon',
  krep: 'krep',
  triko: 'triko',
  denim: 'denim',
  kasmir: 'kaşmir',
  tul: 'tül',
  scuba: 'scuba',
  gabardin: 'gabardin',
};

const COLORS = [
  'siyah', 'beyaz', 'ekru', 'bej', 'krem', 'kirmizi', 'bordo', 'lacivert', 'mavi', 'yesil', 'haki',
  'zumrut', 'vizon', 'kahverengi', 'kahve', 'taba', 'gri', 'antrasit', 'pembe', 'pudra', 'fusya', 'mor',
  'lila', 'sari', 'hardal', 'turuncu', 'somon', 'mercan', 'gold', 'altin', 'gumus', 'mint', 'indigo', 'tas',
];

// Arama sorgusuna girmeyecek kelimeler
const STOPWORDS = new Set([
  'kadin', 'bayan', 'yeni', 'sezon', 'model', 'urun', 'ozel', 'tasarim', 'adet', 'ithal', 'kalite', 've',
  'ile', 'icin', 'standart', 'std', 'renk', 'beden', 'tek', 'toptan', 'kod',
]);

function startsWithAny(tok: string, roots: string[]): boolean {
  return roots.some(r => (r.includes(' ') ? false : tok.startsWith(r)));
}

function textHas(toks: string[], joined: string, roots: string[]): boolean {
  return roots.some(r => (r.includes(' ') ? joined.includes(r) : toks.some(t => t.startsWith(r))));
}

function detectCategory(toks: string[], joined: string): string {
  for (const [cat, roots] of Object.entries(CATEGORIES)) {
    if (textHas(toks, joined, roots)) return cat;
  }
  return '';
}

/** "%58 Pamuk %42 Polyester" -> en yüksek oranlı kumaş. Oran yoksa ilk bulunan. */
function detectFabric(fabricInfo: string, title: string): string {
  const fabricNorm = normalizeTr(fabricInfo);
  let best = '';
  let bestPct = -1;
  for (const m of fabricNorm.matchAll(/%\s*(\d{1,3})\s+([a-z]+)/g)) {
    const pct = Number(m[1]);
    const word = m[2];
    const fab = Object.entries(FABRICS).find(([, roots]) => startsWithAny(word, roots))?.[0];
    if (fab && pct > bestPct) {
      best = fab;
      bestPct = pct;
    }
  }
  if (best) return best;
  const toks = tokens(`${title} ${fabricInfo}`);
  for (const [fab, roots] of Object.entries(FABRICS)) {
    // "tul" tulum'a, "kot" koton'a takılmasın: kısa köklerde tam eşleşme
    if (toks.some(t => roots.some(r => (r.length <= 3 ? t === r : t.startsWith(r))))) return fab;
  }
  return '';
}

function detectColor(toks: string[]): string {
  return COLORS.find(c => toks.includes(c)) || '';
}

interface QueryPlan {
  category: string;
  fabric: string;
  color: string;
  descriptors: string[];
  searchTerms: string;
}

function planQuery(title: string, fabricInfo: string): QueryPlan {
  const toks = tokens(title);
  const joined = toks.join(' ');
  const category = detectCategory(toks, joined);
  const fabric = detectFabric(fabricInfo, title);
  const color = detectColor(toks);

  const categoryRoots = category ? CATEGORIES[category] : [];
  const fabricRoots = fabric ? FABRICS[fabric] : [];
  // Ürün kodları (6948, VEL2026...) ve tek harfli parçalar aramaya girmez
  const descriptors = toks.filter(
    t =>
      t.length > 2 &&
      !/\d/.test(t) &&
      !STOPWORDS.has(t) &&
      t !== color &&
      !startsWithAny(t, categoryRoots) &&
      !startsWithAny(t, fabricRoots),
  );

  // Sorguyu orijinal yazımla (Türkçe karakterli) kur: kaynak siteler Türkçe arıyor
  const originalWords = (title || '').replace(/[-_/|]+/g, ' ').split(/\s+/).filter(Boolean);
  const pickOriginal = (normWord: string) =>
    originalWords.find(w => normalizeTr(w) === normWord)?.toLocaleLowerCase('tr') || normWord;

  const parts: string[] = [];
  if (color) parts.push(pickOriginal(color));
  parts.push(...descriptors.slice(0, 3).map(pickOriginal));
  if (fabric && FABRIC_ADJECTIVE[fabric] && parts.length < 4) parts.push(FABRIC_ADJECTIVE[fabric]);
  if (category) {
    const catWord = originalWords.find(w => startsWithAny(normalizeTr(w), categoryRoots));
    parts.push(catWord ? catWord.toLocaleLowerCase('tr') : category);
  }
  const searchTerms = (parts.length ? parts : toks.filter(t => !/\d/.test(t))).join(' ').trim();

  return { category, fabric, color, descriptors, searchTerms };
}

/** 0 = alakasız. Kategori biliniyorsa sonuçta da geçmek zorunda. */
function scoreRelevance(productTitle: string, plan: QueryPlan): { score: number; matched: string[] } {
  const toks = tokens(productTitle);
  const joined = toks.join(' ');
  const matched: string[] = [];
  let score = 0;

  if (plan.category) {
    if (!textHas(toks, joined, CATEGORIES[plan.category])) return { score: 0, matched };
    // "elbise" ararken "elbise askısı", "tesettür" vb. kayma olmasın
    if (/\b(aski|kilif|canta|ayakkabi|kemer|cocuk|kiz|erkek|bebek|tesettur|namaz)\b/.test(joined)) {
      return { score: 0, matched };
    }
    score += 3;
    matched.push('ürün tipi');
  }
  if (plan.fabric && toks.some(t => FABRICS[plan.fabric].some(r => (r.length <= 3 ? t === r : t.startsWith(r))))) {
    score += 2;
    matched.push('kumaş');
  }
  if (plan.color && toks.includes(plan.color)) {
    score += 1;
    matched.push('renk');
  }
  const overlap = plan.descriptors.filter(d => toks.some(t => t.startsWith(d))).length;
  if (overlap) {
    score += overlap;
    matched.push('model detayı');
  }
  if (!plan.category && overlap === 0) return { score: 0, matched };
  return { score, matched };
}

// ---------------------------------------------------------------------------
// Fiyat yardımcıları
// ---------------------------------------------------------------------------

/** "1.299,90 TL" -> 1299.9 ; "849,15" -> 849.15 ; sayı gelirse olduğu gibi */
export function parseTrPrice(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const s = String(val ?? '').replace(/\s/g, '');
  const m = s.match(/\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?|\d+(?:\.\d{1,2})?/);
  if (!m) return 0;
  let tok = m[0];
  if (tok.includes(',')) tok = tok.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(tok)) tok = tok.replace(/\./g, '');
  const n = parseFloat(tok);
  return Number.isFinite(n) ? n : 0;
}

function allTrPrices(text: string): number[] {
  return [...text.matchAll(/\d{1,3}(?:\.\d{3})*,\d{2}/g)].map(m => parseTrPrice(m[0])).filter(p => p > 0);
}

function validPrice(p: number): boolean {
  return p >= MIN_PRICE && p <= MAX_PRICE;
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.5',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}${res.status === 403 || res.status === 429 ? ' (bot koruması)' : ''}`);
    return await res.text();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw new Error('zaman aşımı');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** HTML içine gömülü JSON'da `key` geçen konumu saran nesneyi çıkarır. */
function extractEnclosingObject(text: string, index: number): Record<string, unknown> | null {
  let depth = 0;
  let start = index;
  for (; start > 0; start--) {
    const c = text[start];
    if (c === '}') depth++;
    else if (c === '{') {
      if (depth === 0) break;
      depth--;
    }
  }
  let end = start;
  let d = 0;
  let inStr = false;
  for (; end < text.length; end++) {
    const c = text[end];
    if (inStr) {
      if (c === '\\') end++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') d++;
    else if (c === '}') {
      d--;
      if (d === 0) break;
    }
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function findJsonObjects(text: string, key: string, limit = 120): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  let idx = text.indexOf(key);
  while (idx !== -1 && out.length < limit) {
    const obj = extractEnclosingObject(text, idx);
    if (obj) out.push(obj);
    idx = text.indexOf(key, idx + key.length);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Kaynaklar
// ---------------------------------------------------------------------------

interface RawItem {
  title: string;
  url: string;
  price: number;
  original_price?: number;
}

interface Source {
  name: string;
  segment: MarketSegment;
  /** Kadın ürünleri satmayan genel sitelerde sorguya "kadın" eklenir */
  addWomen: boolean;
  /** Küçük kataloglu markalarda detaylı sorgu sonuç vermez; renk + ürün tipiyle aranır */
  broadQuery?: boolean;
  searchUrl: (q: string) => string;
  parse: (html: string) => RawItem[];
}

const SOURCES: Source[] = [
  {
    name: 'Hepsiburada',
    segment: 'pazaryeri',
    addWomen: true,
    searchUrl: q => `https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}`,
    parse: html => {
      const $ = cheerio.load(html);
      const items: RawItem[] = [];
      $('h2[id^="product-title"]').each((_, el) => {
        const label = $(el).attr('aria-label') || '';
        const a = $(el).find('a').first();
        const title = a.attr('title') || a.text().trim();
        const href = a.attr('href');
        const price = parseTrPrice(label.match(/fiyat:\s*([\d.,]+)/i)?.[1]);
        if (title && href && price) {
          items.push({ title, url: href.startsWith('http') ? href : `https://www.hepsiburada.com${href}`, price });
        }
      });
      return items;
    },
  },
  {
    name: 'LC Waikiki',
    segment: 'hizli_moda',
    addWomen: true,
    searchUrl: q => `https://www.lcw.com/arama?q=${encodeURIComponent(q)}`,
    parse: html =>
      findJsonObjects(html, '"ModelUrl":')
        .filter(o => !o.Gender || /kad[iı]n/i.test(String(o.Gender)) || /kad[iı]n/i.test(String(o.Category || '')))
        .map(o => {
          const current = parseTrPrice(o.PriceValue);
          const original = parseTrPrice(o.Price);
          return {
            title: [o.Brand, o.ProductDescription].filter(Boolean).join(' '),
            url: `https://www.lcw.com${o.ModelUrl}`,
            price: current || original,
            original_price: original > current ? original : undefined,
          };
        }),
  },
  {
    name: 'DeFacto',
    segment: 'hizli_moda',
    addWomen: true,
    searchUrl: q => `https://www.defacto.com.tr/arama?q=${encodeURIComponent(q)}`,
    parse: html =>
      findJsonObjects(html, '"SeoName":')
        .filter(o => o.Name && o.ProductVariantIndex && (!o.SubDivision || o.SubDivision === 'Woman'))
        .map(o => {
          const list = parseTrPrice(o.Price);
          const shelf = parseTrPrice(o.DiscountedPrice) || list;
          return {
            title: `DeFacto ${o.Name}`,
            url: `https://www.defacto.com.tr/${o.SeoName}-${o.ProductVariantIndex}`,
            price: shelf,
            original_price: list > shelf ? list : undefined,
          };
        }),
  },
  ...(['İpekyol', 'Twist'] as const).map<Source>(brand => {
    const host = brand === 'İpekyol' ? 'https://www.ipekyol.com.tr' : 'https://www.twist.com.tr';
    return {
      name: brand,
      segment: 'premium',
      addWomen: false,
      broadQuery: true,
      searchUrl: q => `${host}/arama?q=${encodeURIComponent(q)}`,
      parse: html => {
        const $ = cheerio.load(html);
        const items: RawItem[] = [];
        $('[data-test-id^="product_card_price"]').each((_, el) => {
          let card = $(el);
          for (let i = 0; i < 8 && card.find('a[href*="/urun/"]').length === 0; i++) card = card.parent();
          const href = card.find('a[href*="/urun/"]').first().attr('href');
          const name = card.find('[data-test-id^="product_card_name"]').first().text().trim();
          const prices = allTrPrices($(el).text());
          if (!href || !name || prices.length === 0) return;
          const price = Math.min(...prices);
          const original = Math.max(...prices);
          items.push({
            title: `${brand} ${name}`,
            url: href.startsWith('http') ? href : `${host}${href}`,
            price,
            original_price: original > price ? original : undefined,
          });
        });
        return items;
      },
    };
  }),
];

const MANUAL_LINKS = (q: string) => [
  { name: 'Trendyol', url: `https://www.trendyol.com/sr?q=${encodeURIComponent(q)}` },
  { name: 'Hepsiburada', url: `https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}` },
  { name: 'Beymen', url: `https://www.beymen.com/tr/search?text=${encodeURIComponent(q)}` },
  { name: 'Google Alışveriş', url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}` },
];

// ---------------------------------------------------------------------------
// İstatistik
// ---------------------------------------------------------------------------

function median(sorted: number[]): number {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** IQR ile uç değerleri ayıklar (5+ veri varsa). */
function withoutOutliers(prices: number[]): number[] {
  const sorted = [...prices].sort((a, b) => a - b);
  if (sorted.length < 5) return sorted;
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  return sorted.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Ana fonksiyon
// ---------------------------------------------------------------------------

export async function researchMarketPrices(queryTitle: string, fabricInfo = ''): Promise<CompetitorAnalysisResult> {
  const plan = planQuery(queryTitle, fabricInfo);
  const baseQuery = plan.searchTerms || queryTitle.trim();
  // Sorgunun son kelimesi ürün tipidir; geniş sorgu = renk (varsa) + ürün tipi
  const broadQuery = plan.category
    ? baseQuery
        .split(' ')
        .filter((w, i, arr) => i === arr.length - 1 || normalizeTr(w) === plan.color)
        .join(' ')
    : baseQuery;
  const queryFor = (src: Source) => {
    const q = src.broadQuery ? broadQuery : baseQuery;
    return src.addWomen && !/kad[iı]n/i.test(q) ? `kadın ${q}` : q;
  };

  const settled = await Promise.allSettled(
    SOURCES.map(async src => {
      const url = src.searchUrl(queryFor(src));
      const html = await fetchText(url);
      return { url, raw: src.parse(html) };
    }),
  );

  const items: CompetitorItem[] = [];
  const sources: SourceStatus[] = SOURCES.map((src, i) => {
    const r = settled[i];
    const fallbackUrl = src.searchUrl(queryFor(src));
    if (r.status === 'rejected') {
      return {
        name: src.name,
        segment: src.segment,
        ok: false,
        found: 0,
        used: 0,
        search_url: fallbackUrl,
        error: r.reason instanceof Error ? r.reason.message : 'erişilemedi',
      };
    }

    const seen = new Set<string>();
    const relevant = r.value.raw
      .filter(it => {
        // Aynı ilanın renk varyantları ayrı link olarak gelebiliyor: başlık+fiyat ile de tekilleştir
        const key = `${normalizeTr(it.title)}|${Math.round(it.price)}`;
        if (!validPrice(it.price) || seen.has(it.url) || seen.has(key)) return false;
        seen.add(it.url);
        seen.add(key);
        return true;
      })
      .map(it => ({ it, ...scoreRelevance(it.title, plan) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ITEMS_PER_SOURCE);

    for (const x of relevant) {
      items.push({
        marketplace_name: src.name,
        segment: src.segment,
        product_title: x.it.title.replace(/\s+/g, ' ').trim(),
        product_url: x.it.url,
        price: round2(x.it.price),
        original_price: x.it.original_price ? round2(x.it.original_price) : undefined,
        relevance: x.score,
        matched: x.matched,
      });
    }

    return {
      name: src.name,
      segment: src.segment,
      ok: true,
      found: r.value.raw.length,
      used: relevant.length,
      search_url: r.value.url,
      error: r.value.raw.length === 0 ? 'sayfa yapısı okunamadı veya sonuç yok' : undefined,
    };
  });

  const clean = withoutOutliers(items.map(i => i.price));
  const segments: SegmentStats[] = (Object.keys(SEGMENT_LABELS) as MarketSegment[])
    .map(segment => {
      const ps = withoutOutliers(items.filter(i => i.segment === segment).map(i => i.price));
      return {
        segment,
        label: SEGMENT_LABELS[segment],
        count: ps.length,
        median: round2(median(ps)),
        min: ps.length ? ps[0] : 0,
        max: ps.length ? ps[ps.length - 1] : 0,
      };
    })
    .filter(s => s.count > 0);

  items.sort((a, b) => b.relevance - a.relevance || a.price - b.price);

  return {
    query: `${queryTitle}${fabricInfo ? ` (${fabricInfo})` : ''}`.trim(),
    search_terms: baseQuery,
    detected: { category: plan.category, fabric: plan.fabric, color: plan.color },
    average_price: clean.length ? Math.round(clean.reduce((a, b) => a + b, 0) / clean.length) : 0,
    median_price: round2(median(clean)),
    min_price: clean.length ? clean[0] : 0,
    max_price: clean.length ? clean[clean.length - 1] : 0,
    items,
    segments,
    sources,
    manual_links: MANUAL_LINKS(baseQuery),
    searched_at: new Date().toISOString(),
  };
}
