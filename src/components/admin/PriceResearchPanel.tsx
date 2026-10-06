'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, ExternalLink, ImageOff, RotateCcw, Search, Sparkles } from 'lucide-react'
import { formatTL } from '@/lib/utils'
import { computeStats, suggestPrices, SEGMENT_INFO, SEGMENT_ORDER, TIER_MAX_MULTIPLIER, TIER_MIN_MULTIPLIER, type Segment } from '@/lib/research/stats'
import type { ResearchItem, ResearchResult } from '@/lib/research/engine'
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

type ViewFilter = 'included' | 'excluded' | 'all'

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
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [view, setView] = useState<ViewFilter>('included')
  const [segment, setSegment] = useState<Segment | 'all'>('all')
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
      setOverrides({})
      setView('included')
      setSegment('all')
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

  const items: ResearchItem[] = useMemo(
    () => (result?.items || []).map(i => (i.id in overrides ? { ...i, included: overrides[i.id] } : i)),
    [result, overrides],
  )
  const costKnown = !!(costPrice && costPrice > 0)
  const stats = useMemo(() => computeStats(items, { costKnown }), [items, costKnown])
  const suggestions = useMemo(() => suggestPrices(stats, costPrice), [stats, costPrice])
  const recommended = suggestions.find(s => s.recommended)

  const counts = {
    included: items.filter(i => i.included).length,
    excluded: items.filter(i => !i.included).length,
  }
  const visible = items.filter(
    i =>
      (view === 'all' || (view === 'included' ? i.included : !i.included)) && (segment === 'all' || i.segment === segment),
  )

  const marginOf = (price: number) => (costPrice && costPrice > 0 && price > 0 ? ((price - costPrice) / price) * 100 : null)

  const apply = (price: number) => {
    onApplyPrice?.(price)
    setApplied(price)
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
              Benzer ürünleri {result?.googleEnabled === false ? 'n11 ve marka sitelerinde' : 'Trendyol, Hepsiburada, n11 ve marka sitelerinde'} arar,
              uymayanları eler.
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
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={e => {
                e.preventDefault()
                run(true)
              }}
            >
              <TextInput
                className="flex-1"
                label="Aranan ifade"
                hint="Sonuçlar beklediğiniz gibi değilse ifadeyi düzenleyip tekrar arayın."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Button type="submit" variant="secondary" loading={loading} icon={<RotateCcw className="h-4 w-4" />} className="sm:mb-[22px]">
                Tekrar ara
              </Button>
            </form>
          </div>
        )}

        {loading && !result && <p className="mt-3 text-[13px] text-kul">Mağazalar taranıyor, bu 5–20 saniye sürebilir…</p>}
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
            <Notice tone="warning" title="Fiyat hesabına girecek benzer ürün kalmadı">
              Aranan ifadeyi sadeleştirin (ör. “siyah midi elbise”) ya da “Elenenler” sekmesinden uygun ürünleri hesaba katın.
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
                    <p className="text-xs text-kul">Piyasa ortası</p>
                    <p className="mt-1 text-lg font-semibold text-ink">{formatTL(stats.median)}</p>
                    <p className="text-xs text-kul">
                      {stats.count} ürün
                      {costKnown ? ' · alışınızla karşılaştırılabilir' : ' · pazaryeri ve hızlı moda'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-kul">Çoğu ürün bu aralıkta</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {formatTL(stats.p25)} – {formatTL(stats.p75)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-kul">En düşük / en yüksek</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {formatTL(stats.min)} / {formatTL(stats.max)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 border-t border-[#EFEBE6] pt-4 sm:grid-cols-3">
                  {stats.segments.map(s => (
                    <button
                      key={s.segment}
                      type="button"
                      onClick={() => setSegment(segment === s.segment ? 'all' : s.segment)}
                      className={`rounded-md border px-3 py-2 text-left transition-colors cursor-pointer ${
                        segment === s.segment ? 'border-ink bg-[#F7F6F4]' : 'border-[#EFEBE6] hover:border-[#DCD6CF]'
                      }`}
                    >
                      <span className="block text-xs text-kul">{s.label}</span>
                      <span className="block text-sm font-semibold text-ink">{formatTL(s.median)}</span>
                      <span className="block text-[11px] text-kul">{s.count} ürün · {SEGMENT_INFO[s.segment].hint}</span>
                    </button>
                  ))}
                </div>
                {costKnown && (
                  <p className="mt-4 border-t border-[#EFEBE6] pt-3 text-xs text-kul">
                    Karşılaştırma bandı: {formatTL(costPrice! * TIER_MIN_MULTIPLIER)} – {formatTL(costPrice! * TIER_MAX_MULTIPLIER)} (alışın
                    {' '}
                    {TIER_MIN_MULTIPLIER.toLocaleString('tr-TR')}–{TIER_MAX_MULTIPLIER} katı). Daha ucuz ve lüks ürünler “Elenen”
                    sekmesinde; isterseniz hesaba katabilirsiniz.
                  </p>
                )}
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

          {/* Sonuç listesi */}
          <div className="rounded-lg border border-[#E7E3DE] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFEBE6] px-4 py-3">
              <div role="tablist" className="flex gap-1">
                {(
                  [
                    ['included', `Hesaba katılan (${counts.included})`],
                    ['excluded', `Elenen (${counts.excluded})`],
                    ['all', `Tümü (${items.length})`],
                  ] as [ViewFilter, string][]
                ).map(([v, label]) => (
                  <button
                    key={v}
                    role="tab"
                    type="button"
                    aria-selected={view === v}
                    onClick={() => setView(v)}
                    className={`rounded-md px-3 py-1.5 text-[13px] font-medium cursor-pointer ${
                      view === v ? 'bg-ink text-white' : 'text-kul hover:bg-[#F1EEEA] hover:text-ink'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {(['all', ...SEGMENT_ORDER] as (Segment | 'all')[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSegment(s)}
                    className={`rounded-full border px-2.5 py-1 text-xs cursor-pointer ${
                      segment === s ? 'border-ink text-ink' : 'border-[#E7E3DE] text-kul hover:text-ink'
                    }`}
                  >
                    {s === 'all' ? 'Tüm mağazalar' : SEGMENT_INFO[s].label}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-kul">Bu filtrede ürün yok.</p>
            ) : (
              <ul className={`grid gap-3 p-4 ${compact ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 md:grid-cols-4 xl:grid-cols-5'}`}>
                {visible.map(item => (
                  <li
                    key={item.id}
                    className={`flex flex-col overflow-hidden rounded-md border transition-colors ${
                      item.included ? 'border-[#E7E3DE]' : 'border-dashed border-[#DCD6CF] opacity-70'
                    }`}
                  >
                    <a href={item.url} target="_blank" rel="noreferrer noopener" className="group relative block aspect-[3/4] bg-[#F7F6F4]">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-kul">
                          <ImageOff className="h-6 w-6" />
                        </span>
                      )}
                      <span className="absolute left-2 top-2 rounded bg-white/95 px-1.5 py-0.5 text-[11px] font-medium text-ink">
                        {item.store}
                      </span>
                      <span
                        className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                          item.score >= 75 ? 'bg-emerald-600 text-white' : item.score >= 55 ? 'bg-amber-500 text-white' : 'bg-[#8A817A] text-white'
                        }`}
                        title="Uyum puanı"
                      >
                        %{item.score}
                      </span>
                      <span className="absolute bottom-2 right-2 hidden rounded bg-white/95 p-1 text-ink group-hover:block">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </a>
                    <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                      <p className="line-clamp-2 text-[13px] leading-snug text-ink" title={item.title}>
                        {item.title}
                      </p>
                      <p className="text-sm font-semibold text-ink">
                        {formatTL(item.price)}
                        {item.originalPrice && <span className="ml-1.5 text-xs font-normal text-kul line-through">{formatTL(item.originalPrice)}</span>}
                      </p>
                      {item.matched.length > 0 && (
                        <p className="text-[11px] text-emerald-700">✓ {item.matched.join(' · ')}</p>
                      )}
                      {item.conflicts.length > 0 && (
                        <p className="flex items-start gap-1 text-[11px] text-amber-700">
                          <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
                          {item.conflicts.join(' · ')}
                        </p>
                      )}
                      <label className="mt-auto flex cursor-pointer items-center gap-2 pt-1 text-xs text-ink">
                        <input
                          type="checkbox"
                          checked={item.included}
                          onChange={e => setOverrides(o => ({ ...o, [item.id]: e.target.checked }))}
                          className="h-4 w-4 accent-[#171214]"
                        />
                        Fiyat hesabına kat
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Kaynaklar */}
          <div className="space-y-2 text-xs text-kul">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {result.sources.map(s => (
                <a key={s.id} href={s.searchUrl} target="_blank" rel="noreferrer noopener" className="hover:text-ink">
                  <span className={s.ok && s.relevant > 0 ? 'text-emerald-700' : s.ok ? 'text-kul' : 'text-rose-700'}>●</span>{' '}
                  {s.name}: {s.ok ? `${s.relevant} uygun / ${s.found} sonuç` : s.message}
                </a>
              ))}
            </div>
            {!result.googleEnabled && (
              <p>
                Trendyol ve Hepsiburada sonuçları için Google Alışveriş bağlantısı (SerpApi anahtarı) gerekli. O zamana kadar elle
                bakabilirsiniz:
              </p>
            )}
            <div className="flex flex-wrap gap-2">
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
