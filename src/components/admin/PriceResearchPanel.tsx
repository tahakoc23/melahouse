'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, ExternalLink, ImageOff, Minus, Plus, RefreshCw, RotateCcw, Search, Sparkles } from 'lucide-react'
import { formatTL } from '@/lib/utils'
import { computeStats, suggestPrices, SEGMENT_INFO, SEGMENT_ORDER } from '@/lib/research/stats'
import type { BrandReport, ResearchItem, ResearchResult } from '@/lib/research/engine'
import { Badge, Button, Notice, TextInput } from '@/components/admin/ui'

export interface ResearchAttributesInput {
  name?: string
  category?: string
  color?: string
  fabric?: string
  details?: string[]
}

interface Props {
  /** Yapılandırılmış ürün bilgisi (önerilen kullanım) */
  attributes?: ResearchAttributesInput
  /** Eski kullanım: ürün adı */
  initialQuery?: string
  /** Eski kullanım: kumaş */
  fabric?: string
  supplierProductId?: string
  /** Alış fiyatı: marj ve alt sınır hesabı için */
  costPrice?: number
  /** Verilirse "Bu fiyatı kullan" butonları çıkar */
  onApplyPrice?: (price: number) => void
  /** Ürün formu içinde daha sade görünüm */
  compact?: boolean
  /** Açılır açılmaz araştır */
  autoRun?: boolean
}

/** Marka kimliği -> fiyatı alınan ürünün kimliği (null: marka hesapta değil) */
type Choice = Record<string, string | null>

const initialChoice = (r: ResearchResult): Choice =>
  Object.fromEntries(r.brands.map(b => [b.id, b.selected && b.pickId ? b.pickId : null]))

export default function PriceResearchPanel({
  attributes,
  initialQuery = '',
  fabric = '',
  supplierProductId,
  costPrice,
  onApplyPrice,
  compact = false,
  autoRun = false,
}: Props) {
  const attrs: ResearchAttributesInput = useMemo(
    () => ({
      ...attributes,
      name: attributes?.name || initialQuery,
      fabric: attributes?.fabric || fabric,
    }),
    [attributes, initialQuery, fabric],
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [choice, setChoice] = useState<Choice>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [applied, setApplied] = useState<number | null>(null)

  const hasInput = !!(attrs.name?.trim() || attrs.category?.trim())

  const run = async (useEditedQuery = false) => {
    if (!hasInput && !searchQuery.trim()) {
      setError('Araştırma için önce ürün adını ya da kategorisini girin.')
      return
    }
    setLoading(true)
    setError('')
    setApplied(null)
    try {
      const res = await fetch('/api/admin/suppliers/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attributes: attrs,
          searchQuery: useEditedQuery ? searchQuery : undefined,
          supplier_product_id: supplierProductId,
          costPrice: costPrice && costPrice > 0 ? costPrice : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Piyasa araştırması yapılamadı.')
      const r = data.result as ResearchResult
      setResult(r)
      setSearchQuery(r.plan.query.full)
      setChoice(initialChoice(r))
      setExpanded(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Piyasa araştırması yapılamadı.')
    } finally {
      setLoading(false)
    }
  }

  const autoRan = useRef(false)
  useEffect(() => {
    if (autoRun && !autoRan.current && hasInput) {
      autoRan.current = true
      run()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, hasInput])

  const itemById = useMemo(() => new Map((result?.items || []).map(i => [i.id, i])), [result])
  const itemsByBrand = useMemo(() => {
    const m = new Map<string, ResearchItem[]>()
    for (const i of result?.items || []) m.set(i.brandId, [...(m.get(i.brandId) || []), i])
    return m
  }, [result])

  const brands = result?.brands || []
  const pickedOf = (b: BrandReport) => (choice[b.id] ? itemById.get(choice[b.id]!) : undefined)
  const counted = brands.filter(b => pickedOf(b))
  // Hesapta olmayan ama benzer ürünü olan markalar: tek tıkla eklenebilir
  const reserve = brands.filter(b => !pickedOf(b) && b.pickId)
  const missing = brands.filter(b => !b.pickId)

  const stats = useMemo(
    () => computeStats(counted.map(b => ({ ...pickedOf(b)!, included: true }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [choice, result],
  )
  const suggestions = useMemo(() => suggestPrices(stats, costPrice), [stats, costPrice])
  const recommended = suggestions.find(s => s.recommended)

  const marginOf = (price: number) => (costPrice && costPrice > 0 && price > 0 ? ((price - costPrice) / price) * 100 : null)

  const apply = (price: number) => {
    onApplyPrice?.(price)
    setApplied(price)
  }
  const setBrand = (brandId: string, itemId: string | null) => {
    setChoice(c => ({ ...c, [brandId]: itemId }))
    setApplied(null)
  }

  /* -------------------------------------------------------------- */

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {/* Arama */}
      <div className={compact ? 'rounded-lg border border-[#E7E3DE] bg-[#FAF9F7] p-4' : 'rounded-lg border border-[#E7E3DE] bg-white p-5'}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">Piyasa araştırması</h3>
            <p className="mt-0.5 text-[13px] text-kul">
              Alt, orta ve premium segmentten 10 markanın sitesinde arar; her markadan en benzer ürünün fiyatını alır.
            </p>
          </div>
          {!result && (
            <Button type="button" onClick={() => run()} loading={loading} icon={<Search className="h-4 w-4" />} disabled={!hasInput}>
              Piyasayı araştır
            </Button>
          )}
        </div>

        {!hasInput && !result && (
          <p className="mt-3 text-[13px] text-kul">Önce ürün adını ve kategorisini girin; araştırma bu bilgilerle yapılır.</p>
        )}

        {result && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {result.plan.category && <Badge>Ürün tipi: {result.plan.category.label}</Badge>}
              {result.plan.color && <Badge>Renk: {result.plan.color.label}</Badge>}
              {result.plan.fabric && <Badge>Kumaş: {result.plan.fabric.label}</Badge>}
              {result.plan.details.map(d => (
                <Badge key={d.key}>{d.label}</Badge>
              ))}
              {!result.plan.category && <Badge tone="warning">Ürün tipi anlaşılamadı: kategori seçin</Badge>}
            </div>
            {/* Panel ürün formunun içinde kullanılıyor: iç içe <form> geçersiz olduğundan div + Enter */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <TextInput
                className="flex-1"
                label="Aranan ifade"
                hint="Sonuçlar beklediğiniz gibi değilse ifadeyi düzenleyip tekrar arayın."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (!loading) run(true)
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => run(true)}
                loading={loading}
                icon={<RotateCcw className="h-4 w-4" />}
                className="sm:mb-[22px]"
              >
                Tekrar ara
              </Button>
            </div>
          </div>
        )}

        {loading && !result && <p className="mt-3 text-[13px] text-kul">Marka siteleri taranıyor, bu 5–20 saniye sürebilir…</p>}
        {error && (
          <div className="mt-3">
            <Notice tone="danger">{error}</Notice>
          </div>
        )}
      </div>

      {result && (
        <>
          {/* Özet ve öneri */}
          {stats.count === 0 ? (
            <Notice tone="warning" title="Hiçbir markada benzer ürün bulunamadı">
              Aranan ifadeyi sadeleştirin (ör. “siyah midi elbise”) ve tekrar arayın.
            </Notice>
          ) : (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
              {recommended && (
                <div className="rounded-lg bg-ink p-5 text-white">
                  <p className="text-[13px] text-white/70">Önerilen satış fiyatı</p>
                  <p className="mt-1 font-display text-4xl leading-none">{formatTL(recommended.value)}</p>
                  <p className="mt-2 text-xs text-white/70">{recommended.note}</p>
                  {marginOf(recommended.value) !== null && (
                    <p className="mt-1 text-xs text-white/90">Brüt marj %{marginOf(recommended.value)!.toFixed(0)}</p>
                  )}
                  {onApplyPrice && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      icon={applied === recommended.value ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      onClick={() => apply(recommended.value)}
                    >
                      {applied === recommended.value ? 'Fiyat alanına yazıldı' : 'Bu fiyatı kullan'}
                    </Button>
                  )}
                </div>
              )}
              <div className="rounded-lg border border-[#E7E3DE] bg-white p-5">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-kul">Ortalama</p>
                    <p className="mt-1 text-lg font-semibold text-ink">{formatTL(stats.average)}</p>
                    <p className="text-xs text-kul">{stats.count} markanın fiyatı</p>
                  </div>
                  <div>
                    <p className="text-xs text-kul">Piyasa ortası (medyan)</p>
                    <p className="mt-1 text-lg font-semibold text-ink">{formatTL(stats.median)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-kul">En düşük / en yüksek</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {formatTL(stats.min)} / {formatTL(stats.max)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 border-t border-[#EFEBE6] pt-4 sm:grid-cols-3">
                  {SEGMENT_ORDER.map(seg => {
                    const s = stats.segments.find(x => x.segment === seg)
                    const names = counted.filter(b => b.segment === seg).map(b => b.name)
                    return (
                      <div key={seg} className="rounded-md border border-[#EFEBE6] px-3 py-2">
                        <span className="block text-xs text-kul">{SEGMENT_INFO[seg].label} ortalaması</span>
                        <span className="block text-sm font-semibold text-ink">{s ? formatTL(s.average) : '—'}</span>
                        <span className="block text-[11px] text-kul">{names.length ? names.join(', ') : 'marka yok'}</span>
                      </div>
                    )
                  })}
                </div>
                {onApplyPrice && suggestions.filter(s => !s.recommended).length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EFEBE6] pt-4">
                    <span className="text-xs text-kul">Diğer seçenekler:</span>
                    {suggestions
                      .filter(s => !s.recommended)
                      .map(s => (
                        <Button key={s.key + s.value} type="button" variant="secondary" size="sm" onClick={() => apply(s.value)}>
                          {s.label}: {formatTL(s.value)}
                          {marginOf(s.value) !== null && <span className="text-kul">· %{marginOf(s.value)!.toFixed(0)}</span>}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Markalar: segment segment, her markadan bir ürün */}
          <div className="rounded-lg border border-[#E7E3DE] bg-white">
            <div className="border-b border-[#EFEBE6] px-4 py-3">
              <p className="text-[14px] font-semibold text-ink">Fiyatı alınan markalar ({counted.length})</p>
              <p className="text-xs text-kul">
                Her markadan en benzer ürün seçildi. Uymayan ürünü “Değiştir” ile değiştirin ya da markayı hesaptan çıkarın.
              </p>
            </div>
            {SEGMENT_ORDER.map(seg => {
              const rows = counted.filter(b => b.segment === seg)
              if (!rows.length) return null
              return (
                <div key={seg} className="border-b border-[#EFEBE6] last:border-b-0">
                  <p className="bg-[#FAF9F7] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-kul">
                    {SEGMENT_INFO[seg].label}
                  </p>
                  <ul className="divide-y divide-[#F1EEEA]">
                    {rows.map(b => (
                      <BrandRow
                        key={b.id}
                        brand={b}
                        item={pickedOf(b)!}
                        alternatives={itemsByBrand.get(b.id) || []}
                        open={expanded === b.id}
                        onToggle={() => setExpanded(expanded === b.id ? null : b.id)}
                        onSelect={id => {
                          setBrand(b.id, id)
                          setExpanded(null)
                        }}
                        onRemove={() => setBrand(b.id, null)}
                      />
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {reserve.length > 0 && (
            <div className="rounded-lg border border-dashed border-[#DCD6CF] bg-white px-4 py-3">
              <p className="text-[13px] font-semibold text-ink">Yedek markalar</p>
              <p className="mb-2 text-xs text-kul">Benzer ürünü olan ama hesaba katılmayan markalar. Eklemek için tıklayın.</p>
              <div className="flex flex-wrap gap-2">
                {reserve.map(b => {
                  const it = itemById.get(b.pickId!)!
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBrand(b.id, b.pickId!)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E7E3DE] px-3 py-1 text-xs text-ink hover:border-ink"
                      title={it.title}
                    >
                      <Plus className="h-3 w-3" />
                      {b.name} · {SEGMENT_INFO[b.segment].label.replace(' segment', '')} · {formatTL(it.price)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Kaynak durumu ve elle bakma bağlantıları */}
          <div className="space-y-2 text-xs text-kul">
            {missing.length > 0 && (
              <p>
                Benzer ürün bulunamayan markalar:{' '}
                {missing.map((b, i) => (
                  <span key={b.id}>
                    {i > 0 && ', '}
                    <a href={b.searchUrl} target="_blank" rel="noreferrer noopener" className="underline-offset-2 hover:text-ink hover:underline">
                      {b.name}
                    </a>
                    {!b.ok && <span className="text-rose-700"> (erişilemedi)</span>}
                  </span>
                ))}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span>Pazaryerlerine elle bakın:</span>
              {result.manualLinks.map(l => (
                <a
                  key={l.name}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 rounded-full border border-[#E7E3DE] bg-white px-2.5 py-1 text-ink hover:border-ink"
                >
                  {l.name} <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Thumb({ item, className }: { item: ResearchItem; className: string }) {
  return (
    <a href={item.url} target="_blank" rel="noreferrer noopener" className={`block shrink-0 overflow-hidden rounded bg-[#F7F6F4] ${className}`}>
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={item.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-kul">
          <ImageOff className="h-4 w-4" />
        </span>
      )}
    </a>
  )
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[11px] font-semibold text-white ${
        score >= 75 ? 'bg-emerald-600' : score >= 55 ? 'bg-amber-500' : 'bg-[#8A817A]'
      }`}
      title="Benzerlik puanı"
    >
      %{score}
    </span>
  )
}

function BrandRow({
  brand,
  item,
  alternatives,
  open,
  onToggle,
  onSelect,
  onRemove,
}: {
  brand: BrandReport
  item: ResearchItem
  alternatives: ResearchItem[]
  open: boolean
  onToggle: () => void
  onSelect: (id: string) => void
  onRemove: () => void
}) {
  const others = alternatives.filter(a => a.id !== item.id)
  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <Thumb item={item} className="h-16 w-12" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-ink">{brand.name}</span>
            <ScoreBadge score={item.score} />
            {!item.eligible && (
              <span
                className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-800"
                title="Bu markada birebir aynı model yok; en yakın model alındı"
              >
                Yakın model
              </span>
            )}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer noopener"
            className="line-clamp-1 text-[13px] text-ink/80 underline-offset-2 hover:underline"
            title={item.title}
          >
            {item.title}
          </a>
          {item.matched.length > 0 && <p className="text-[11px] text-emerald-700">✓ {item.matched.join(' · ')}</p>}
          {item.conflicts.length > 0 && (
            <p className="flex items-start gap-1 text-[11px] text-amber-700">
              <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
              {item.conflicts.join(' · ')}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-ink">{formatTL(item.price)}</p>
          {item.originalPrice && <p className="text-xs text-kul line-through">{formatTL(item.originalPrice)}</p>}
          <div className="mt-1 flex justify-end gap-1">
            {others.length > 0 && (
              <button
                type="button"
                onClick={onToggle}
                className="inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-kul hover:bg-[#F1EEEA] hover:text-ink"
              >
                <RefreshCw className="h-3 w-3" /> Değiştir
              </button>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-kul hover:bg-[#F1EEEA] hover:text-ink"
            >
              <Minus className="h-3 w-3" /> Çıkar
            </button>
          </div>
        </div>
      </div>

      {open && (
        <ul className="mt-3 grid gap-2 rounded-md bg-[#FAF9F7] p-2 sm:grid-cols-2">
          {others.map(a => (
            <li key={a.id} className={`flex items-center gap-2 rounded bg-white p-2 ${a.eligible || a.near ? '' : 'opacity-60'}`}>
              <Thumb item={a} className="h-12 w-9" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-xs text-ink" title={a.title}>
                  {a.title}
                </p>
                <p className="text-xs font-semibold text-ink">
                  {formatTL(a.price)} <ScoreBadge score={a.score} />
                </p>
                {a.conflicts.length > 0 && <p className="line-clamp-1 text-[11px] text-amber-700">{a.conflicts.join(' · ')}</p>}
              </div>
              <button
                type="button"
                onClick={() => onSelect(a.id)}
                className="shrink-0 cursor-pointer rounded border border-[#E7E3DE] px-2 py-1 text-[11px] text-ink hover:border-ink"
              >
                Bunu seç
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

