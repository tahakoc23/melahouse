import {
  CATEGORIES,
  COLORS,
  DETAILS,
  EXCLUDE_RULES,
  FABRICS,
  PATTERN_ROOTS,
  categoryFromText,
  colorFamiliesIn,
  colorFromText,
  detailsFromText,
  fabricFromText,
  hasAny,
  normalizeTr,
  tokens,
  type CategoryDef,
  type DetailDef,
  type FabricDef,
} from './dictionary'
import { BRAND_SOURCES, LINGERIE_ONLY, manualLinks, type RawItem, type Source, type SourceQuery } from './sources'
import { SEGMENT_ORDER, computeStats, suggestPrices, type PriceStats, type PriceSuggestion, type Segment } from './stats'

export interface ResearchAttributes {
  name?: string
  category?: string
  color?: string
  fabric?: string
  details?: string[]
}

export interface ResearchPlan {
  category: { key: string; label: string } | null
  color: { key: string; label: string } | null
  fabric: { key: string; label: string } | null
  details: { key: string; label: string }[]
  query: SourceQuery
  /** Ürün adı + elle yazılan ifade: desen/abiye gibi istisnaların aranan üründe olup olmadığı */
  text: string
}

export interface ResearchItem {
  id: string
  /** Marka kaynağının kimliği (BrandReport.id) */
  brandId: string
  store: string
  segment: Segment
  title: string
  url: string
  price: number
  originalPrice?: number
  image?: string
  /** 0-100 uyum puanı */
  score: number
  /** Aranan ürünle karşılaştırılabilir mi (çelişki yok, puan eşiğin üstünde) */
  eligible: boolean
  /** Birebir değil ama yakın model (aynı ürün tipi ve renk; boy/yaka/kol farklı olabilir) */
  near: boolean
  matched: string[]
  conflicts: string[]
}

export interface BrandReport {
  id: string
  name: string
  segment: Segment
  ok: boolean
  /** Sitede bulunan ürün sayısı */
  found: number
  /** Karşılaştırılabilir ürün sayısı */
  eligible: number
  /** Markayı temsil eden (en uygun) ürün */
  pickId?: string
  /** Markada birebir eşleşme yok, yakın model alındı */
  approximate: boolean
  /** Varsayılan 10 markaya girdi mi (girmeyenler yedek) */
  selected: boolean
  searchUrl: string
  message?: string
}

export interface ResearchResult {
  plan: ResearchPlan
  items: ResearchItem[]
  brands: BrandReport[]
  stats: PriceStats
  suggestions: PriceSuggestion[]
  manualLinks: { name: string; url: string }[]
  searchedAt: string
}

/** Araştırma sonucunda fiyatı alınan marka sayısı */
export const BRAND_TARGET = 10
/** Segment sırası: dengeli seçimde önce orta, sonra alt ve premium */
const PICK_ORDER: Segment[] = ['orta', 'alt', 'premium']

const LINGERIE_CATEGORIES = new Set(['gecelik', 'pijama', 'sabahlik', 'sutyen', 'kulot', 'kombinezon', 'body'])
const MIN_PRICE = 50
const MAX_PRICE = 500_000
const INCLUDE_THRESHOLD = 55

/* ------------------------------------------------------------------ */
/* Plan                                                                */
/* ------------------------------------------------------------------ */

function detailByLabel(label: string): DetailDef | undefined {
  const n = normalizeTr(label)
  return DETAILS.find(d => normalizeTr(d.label) === n || d.key === n.replace(/ /g, '-'))
}

export function buildPlan(attrs: ResearchAttributes, queryOverride?: string): ResearchPlan {
  const name = attrs.name || ''
  const category: CategoryDef | null =
    (attrs.category && categoryFromText(attrs.category)) || categoryFromText(name) || categoryFromText(queryOverride || '')
  const fabric: FabricDef | null =
    (attrs.fabric && fabricFromText(attrs.fabric)) || fabricFromText(name) || fabricFromText(queryOverride || '')
  const color = (attrs.color && colorFromText(attrs.color)) || colorFromText(name) || colorFromText(queryOverride || '')

  const detailMap = new Map<string, DetailDef>()
  for (const label of attrs.details || []) {
    const d = detailByLabel(label)
    if (d) detailMap.set(d.key, d)
  }
  for (const d of detailsFromText(`${name} ${queryOverride || ''}`)) detailMap.set(d.key, d)
  // Kumaşla aynı anlama gelen detayı tekrar sayma ("dantelli" + kumaş dantel)
  if (fabric?.key === 'dantel') detailMap.delete('dantelli')
  const details = [...detailMap.values()]

  // Arama ifadesi mağazaların kullandığı dile yakın olmalı: "siyah maxi gömlek elbise".
  // Mağaza aramaları kelimeleri VE ile eşler; uzun ifade sonucu sıfırlar. Bu yüzden en fazla
  // 2 detay kelimesi (önce boy, sonra stil/yaka, kalıp, kol) alınır; kumaş yalnız yer kalırsa eklenir.
  const GROUP_RANK: Record<string, number> = { boy: 0, yaka: 1, kalip: 2, kol: 3, bel: 4 }
  const ranked = [...details].sort(
    (a, b) => (a.group ? GROUP_RANK[a.group] : 9) - (b.group ? GROUP_RANK[b.group] : 9),
  )
  const picked = ranked.slice(0, 2)
  // "Gömlek yaka elbise" yerine mağazalardaki adıyla "gömlek elbise"
  const detailWords = picked.map(d => (d.key === 'gomlek-yaka' && category ? 'gömlek' : d.label.toLocaleLowerCase('tr')))
  const full =
    queryOverride?.trim() ||
    [
      color?.label.toLocaleLowerCase('tr'),
      ...detailWords,
      picked.length < 2 ? fabric?.adjective : undefined,
      category?.searchWord,
    ]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    name.replace(/\b\d+\b/g, '').trim()
  const broad =
    [color?.label.toLocaleLowerCase('tr'), category?.searchWord].filter(Boolean).join(' ') || full

  return {
    category: category ? { key: category.key, label: category.label } : null,
    color: color ? { key: color.key, label: color.label } : null,
    fabric: fabric ? { key: fabric.key, label: fabric.label } : null,
    details: details.map(d => ({ key: d.key, label: d.label })),
    query: { full, broad },
    text: `${name} ${queryOverride || ''}`.trim(),
  }
}

/* ------------------------------------------------------------------ */
/* Uyum puanı                                                          */
/* ------------------------------------------------------------------ */

function scoreItem(
  item: RawItem,
  plan: ResearchPlan,
): { score: number; included: boolean; near: boolean; matched: string[]; conflicts: string[] } {
  // "Erkek yaka" bir gömlek yaka türüdür; erkek ürünü sanılmasın
  const toks = tokens(item.title.replace(/erkek\s+yaka/gi, 'gömlek yaka'))
  const queryToks = tokens(`${plan.query.full} ${plan.text}`)
  const matched: string[] = []
  const conflicts: string[] = []
  let hardExclude = false
  // Bambaşka ürün (erkek, çocuk, abiye, farklı ürün tipi...): yakın model olarak bile alınmaz
  let different = false
  let colorConflict = false
  let score = 0

  for (const rule of EXCLUDE_RULES) {
    if (hasAny(toks, rule.roots) && !(rule.unlessQueryHas && hasAny(queryToks, rule.unlessQueryHas))) {
      conflicts.push(rule.reason)
      hardExclude = true
      different = true
    }
  }

  // Ürün tipi (zorunlu)
  if (plan.category) {
    const def = CATEGORIES.find(c => c.key === plan.category!.key)!
    const roots = def.key === 'abiye' ? [...def.roots, 'elbise'] : def.roots
    if (hasAny(toks, roots)) {
      score += 40
      matched.push(def.label)
    } else {
      conflicts.push('Ürün tipi farklı')
      hardExclude = true
      different = true
    }
  } else {
    score += 25
  }

  // Kumaş
  if (plan.fabric) {
    const def = FABRICS.find(f => f.key === plan.fabric!.key)!
    if (hasAny(toks, def.roots)) {
      score += 20
      matched.push(def.label)
    } else {
      // Dantel/tül çoğu üründe süsleme olarak geçer; ana kumaş çelişkisi sayılmaz
      const other = FABRICS.find(
        f => f.key !== def.key && !['polyester', 'dantel', 'tul'].includes(f.key) && hasAny(toks, f.roots),
      )
      if (other) {
        score -= 25
        conflicts.push(`Kumaş farklı (${other.label})`)
      }
    }
  } else {
    score += 10
  }

  // Renk (aynı ton ailesi kabul)
  if (plan.color) {
    const def = COLORS.find(c => c.key === plan.color!.key)!
    const families = colorFamiliesIn(toks)
    if (hasAny(toks, def.roots) || families.has(def.family)) {
      score += 15
      matched.push(def.label)
    } else if (families.size > 0) {
      score -= 30
      colorConflict = true
      const other = COLORS.find(c => c.family !== def.family && hasAny(toks, c.roots))
      conflicts.push(`Renk farklı${other ? ` (${other.label})` : ''}`)
    } else {
      score += 8 // renk belirtilmemiş (çoğu marka adda rengi yazmaz): nötr
    }
  } else {
    score += 10
  }

  // Desen: aranan ürün düz ise desenli ürün karşılaştırılamaz (fiyat ve stil farklı)
  if (!hasAny(queryToks, PATTERN_ROOTS) && hasAny(toks, PATTERN_ROOTS)) {
    score -= 20
    conflicts.push('Desenli ürün')
  }

  // Model detayları: eşleşen +10 (en fazla 30); aynı gruptan farklı detay çelişkidir
  let detailPoints = 0
  for (const pd of plan.details) {
    const def = DETAILS.find(d => d.key === pd.key)!
    if (hasAny(toks, def.roots)) {
      detailPoints += 10
      matched.push(def.label)
    } else if (def.group) {
      const rival = DETAILS.find(d => d.group === def.group && d.key !== def.key && hasAny(toks, d.roots))
      if (rival) {
        conflicts.push(`${def.label} değil, ${rival.label.toLocaleLowerCase('tr')}`)
        hardExclude = true
        // Yakın modeller arasında daha az farklı olan öne geçsin
        score -= 8
      }
    }
  }
  score += Math.min(detailPoints, 30)
  if (!plan.details.length) score += 10

  score = Math.max(0, Math.min(100, Math.round(score)))
  return {
    score,
    included: !hardExclude && score >= INCLUDE_THRESHOLD,
    // Birebir eşleşme yoksa markayı temsil edebilecek yakın model: aynı ürün tipi ve renk, farklı boy/yaka/kol olabilir
    near: !different && !colorConflict,
    matched,
    conflicts,
  }
}

/* ------------------------------------------------------------------ */
/* Ana akış                                                            */
/* ------------------------------------------------------------------ */

/**
 * Markanın temsilci ürünü: en uyumlu ürün. Puanı en yüksek olana 5 puan yakın birden çok ürün
 * varsa aralarından fiyatı ortadaki seçilir (tek bir indirimli ya da özel ürün markayı temsil etmesin).
 */
function pickRepresentative(items: ResearchItem[]): ResearchItem | undefined {
  let eligible = items.filter(i => i.eligible)
  // Birebir eşleşme yoksa markanın en yakın modeli (her markadan bir fiyat alınabilsin)
  if (!eligible.length) eligible = items.filter(i => i.near)
  if (!eligible.length) return undefined
  const top = Math.max(...eligible.map(i => i.score))
  const close = eligible.filter(i => i.score >= top - 5).sort((a, b) => a.price - b.price)
  return close[Math.floor((close.length - 1) / 2)]
}

/**
 * 10 markayı segmentlere dengeli dağıtır: orta → alt → premium sırasıyla, her turda o segmentin
 * en uyumlu markası seçilir. Bir segmentte marka kalmazsa diğerlerinden devam edilir.
 */
function selectBalanced(brands: { id: string; segment: Segment; score: number }[], target: number): Set<string> {
  const queues = new Map<Segment, { id: string; score: number }[]>()
  for (const seg of SEGMENT_ORDER) {
    queues.set(seg, brands.filter(b => b.segment === seg).sort((a, b) => b.score - a.score))
  }
  const chosen = new Set<string>()
  while (chosen.size < target) {
    let added = false
    for (const seg of PICK_ORDER) {
      const next = queues.get(seg)!.shift()
      if (next && chosen.size < target) {
        chosen.add(next.id)
        added = true
      }
    }
    if (!added) break
  }
  return chosen
}

export async function runResearch(
  attrs: ResearchAttributes,
  queryOverride?: string,
  costPrice?: number,
): Promise<ResearchResult> {
  const plan = buildPlan(attrs, queryOverride)
  const lingerie = plan.category ? LINGERIE_CATEGORIES.has(plan.category.key) : false
  const sources: Source[] = BRAND_SOURCES.filter(s => !LINGERIE_ONLY.has(s.id) || lingerie)

  const settled = await Promise.allSettled(sources.map(s => s.run(plan.query)))

  const items: ResearchItem[] = []
  const reports: BrandReport[] = sources.map((src, i) => {
    const r = settled[i]
    const base = {
      id: src.id,
      name: src.name,
      segment: src.segment,
      searchUrl: src.searchUrl(plan.query),
      selected: false,
      approximate: false,
    }
    if (r.status === 'rejected') {
      return { ...base, ok: false, found: 0, eligible: 0, message: r.reason instanceof Error ? r.reason.message : 'erişilemedi' }
    }
    const seen = new Set<string>()
    const own: ResearchItem[] = []
    for (const raw of r.value as RawItem[]) {
      if (!raw.title || !raw.url || !(raw.price >= MIN_PRICE && raw.price <= MAX_PRICE)) continue
      const dedupeKey = `${normalizeTr(raw.title)}|${Math.round(raw.price)}`
      if (seen.has(raw.url) || seen.has(dedupeKey)) continue
      seen.add(raw.url)
      seen.add(dedupeKey)
      const s = scoreItem(raw, plan)
      own.push({
        id: `${src.id}:${own.length}`,
        brandId: src.id,
        store: src.name,
        segment: src.segment,
        title: raw.title.replace(/\s+/g, ' ').trim(),
        url: raw.url,
        price: Math.round(raw.price * 100) / 100,
        originalPrice: raw.originalPrice,
        image: raw.image,
        score: s.score,
        eligible: s.included,
        near: s.near,
        matched: s.matched,
        conflicts: s.conflicts,
      })
    }
    // Markadan en uyumlu 12 ürün yeter (ekranda alternatif olarak gösterilir)
    own.sort(
      (a, b) => Number(b.eligible) - Number(a.eligible) || Number(b.near) - Number(a.near) || b.score - a.score || a.price - b.price,
    )
    const kept = own.slice(0, 12)
    items.push(...kept)
    const pick = pickRepresentative(kept)
    return {
      ...base,
      ok: true,
      found: r.value.length,
      eligible: kept.filter(i => i.eligible).length,
      pickId: pick?.id,
      approximate: !!pick && !pick.eligible,
      message: r.value.length === 0 ? 'sonuç yok' : !pick ? 'benzer ürün yok' : undefined,
    }
  })

  const picks = reports
    .filter(b => b.pickId)
    // Birebir eşleşen markalar yakın modelli markalardan önce seçilir
    .map(b => ({ id: b.id, segment: b.segment, score: (b.approximate ? 0 : 100) + items.find(i => i.id === b.pickId)!.score }))
  const chosen = selectBalanced(picks, BRAND_TARGET)
  for (const b of reports) b.selected = chosen.has(b.id)

  const priced = reports
    .filter(b => b.selected && b.pickId)
    .map(b => ({ ...items.find(i => i.id === b.pickId)!, included: true }))
  const stats = computeStats(priced)
  return {
    plan,
    items,
    brands: reports,
    stats,
    suggestions: suggestPrices(stats, costPrice),
    manualLinks: manualLinks(plan.query),
    searchedAt: new Date().toISOString(),
  }
}
