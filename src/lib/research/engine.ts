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
import { DIRECT_SOURCES, LINGERIE_ONLY, googleShopping, manualLinks, type RawItem, type Source, type SourceQuery } from './sources'
import { TIER_MAX_MULTIPLIER, TIER_MIN_MULTIPLIER, computeStats, suggestPrices, type PriceStats, type PriceSuggestion, type Segment } from './stats'

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
  store: string
  segment: Segment
  title: string
  url: string
  price: number
  originalPrice?: number
  image?: string
  /** 0-100 uyum puanı */
  score: number
  /** Varsayılan olarak fiyat hesabına dahil mi */
  included: boolean
  matched: string[]
  conflicts: string[]
}

export interface SourceReport {
  id: string
  name: string
  ok: boolean
  found: number
  relevant: number
  searchUrl: string
  message?: string
}

export interface ResearchResult {
  plan: ResearchPlan
  items: ResearchItem[]
  stats: PriceStats
  suggestions: PriceSuggestion[]
  sources: SourceReport[]
  manualLinks: { name: string; url: string }[]
  googleEnabled: boolean
  searchedAt: string
}

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

function scoreItem(item: RawItem, plan: ResearchPlan): { score: number; included: boolean; matched: string[]; conflicts: string[] } {
  const toks = tokens(item.title)
  const queryToks = tokens(`${plan.query.full} ${plan.text}`)
  const matched: string[] = []
  const conflicts: string[] = []
  let hardExclude = false
  let score = 0

  for (const rule of EXCLUDE_RULES) {
    if (hasAny(toks, rule.roots) && !(rule.unlessQueryHas && hasAny(queryToks, rule.unlessQueryHas))) {
      conflicts.push(rule.reason)
      hardExclude = true
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
      }
    }
  }
  score += Math.min(detailPoints, 30)
  if (!plan.details.length) score += 10

  score = Math.max(0, Math.min(100, Math.round(score)))
  return { score, included: !hardExclude && score >= INCLUDE_THRESHOLD, matched, conflicts }
}

/* ------------------------------------------------------------------ */
/* Ana akış                                                            */
/* ------------------------------------------------------------------ */

export async function runResearch(
  attrs: ResearchAttributes,
  queryOverride?: string,
  costPrice?: number,
): Promise<ResearchResult> {
  const plan = buildPlan(attrs, queryOverride)
  const googleEnabled = !!process.env.SERPAPI_API_KEY
  const lingerie = plan.category ? LINGERIE_CATEGORIES.has(plan.category.key) : false

  const sources: Source[] = [
    ...(googleEnabled ? [googleShopping] : []),
    ...DIRECT_SOURCES.filter(s => !LINGERIE_ONLY.has(s.id) || lingerie),
  ]

  const settled = await Promise.allSettled(sources.map(s => s.run(plan.query)))

  const items: ResearchItem[] = []
  const reports: SourceReport[] = sources.map((src, i) => {
    const r = settled[i]
    if (r.status === 'rejected') {
      return {
        id: src.id,
        name: src.name,
        ok: false,
        found: 0,
        relevant: 0,
        searchUrl: src.searchUrl(plan.query),
        message: r.reason instanceof Error ? r.reason.message : 'erişilemedi',
      }
    }
    const seen = new Set<string>()
    let relevant = 0
    for (const raw of r.value) {
      if (!raw.title || !raw.url || !(raw.price >= MIN_PRICE && raw.price <= MAX_PRICE)) continue
      const dedupeKey = `${normalizeTr(raw.title)}|${Math.round(raw.price)}`
      if (seen.has(raw.url) || seen.has(dedupeKey)) continue
      seen.add(raw.url)
      seen.add(dedupeKey)
      const s = scoreItem(raw, plan)
      // Fiyat segmenti: alışa göre çok ucuz ya da lüks ürünler karşılaştırılabilir değildir
      if (costPrice && costPrice > 0 && s.included) {
        if (raw.price < costPrice * TIER_MIN_MULTIPLIER) {
          s.included = false
          s.conflicts.push('Daha ucuz segment')
        } else if (raw.price > costPrice * TIER_MAX_MULTIPLIER) {
          s.included = false
          s.conflicts.push('Lüks segment')
        }
      }
      if (s.included) relevant++
      items.push({
        id: `${src.id}:${items.length}`,
        store: raw.store,
        segment: raw.segment,
        title: raw.title.replace(/\s+/g, ' ').trim(),
        url: raw.url,
        price: Math.round(raw.price * 100) / 100,
        originalPrice: raw.originalPrice,
        image: raw.image,
        ...s,
      })
    }
    return {
      id: src.id,
      name: src.name,
      ok: true,
      found: r.value.length,
      relevant,
      searchUrl: src.searchUrl(plan.query),
      message: r.value.length === 0 ? 'sonuç yok' : undefined,
    }
  })

  // Her mağazadan en fazla 12 ürün (en uyumlu olanlar); toplamda uyuma göre sıralı
  const perStore = new Map<string, number>()
  const limited = items
    .sort((a, b) => b.score - a.score || a.price - b.price)
    .filter(it => {
      const n = perStore.get(it.store) || 0
      if (n >= 12) return false
      perStore.set(it.store, n + 1)
      return true
    })

  const stats = computeStats(limited, { costKnown: !!(costPrice && costPrice > 0) })
  return {
    plan,
    items: limited,
    stats,
    suggestions: suggestPrices(stats, costPrice),
    sources: reports,
    manualLinks: manualLinks(plan.query),
    googleEnabled,
    searchedAt: new Date().toISOString(),
  }
}
