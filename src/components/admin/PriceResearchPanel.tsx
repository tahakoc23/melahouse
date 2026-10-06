'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Search, Sparkles, XCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { CompetitorAnalysisResult, MarketSegment } from '@/lib/scraper/marketResearch'

const SEGMENT_STYLE: Record<MarketSegment, string> = {
  pazaryeri: 'bg-orange-50 text-orange-900 border-orange-200',
  hizli_moda: 'bg-sky-50 text-sky-900 border-sky-200',
  premium: 'bg-[#1A1A1A] text-[#E8D9BE] border-[#1A1A1A]',
}

const SEGMENT_HINT: Record<MarketSegment, string> = {
  pazaryeri: 'Hepsiburada satıcıları',
  hizli_moda: 'LC Waikiki, DeFacto',
  premium: 'İpekyol, Twist',
}

interface Props {
  /** Ürün adı (ör. "6948 ELBİSE-SİYAH" veya "Saten Kruvaze Midi Elbise") */
  initialQuery?: string
  /** Kumaş bilgisi (ör. "%58 Pamuk %42 Polyester") */
  fabric?: string
  /** Toptancı ürünü ise sonuçlar bu ürüne kaydedilir */
  supplierProductId?: string
  /** Alış fiyatı biliniyorsa kâr marjı gösterilir */
  costPrice?: number
  /** Verilirse her öneride "Bu fiyatı kullan" butonu çıkar */
  onApplyPrice?: (price: number) => void
  /** Sayfa içinde gömülü (ürün formu) kullanımda daha sade başlık */
  compact?: boolean
  /** Bileşen açılır açılmaz araştırmayı başlat */
  autoRun?: boolean
}

/** Psikolojik fiyat: 1.873 -> 1.899,90 ; 412 -> 419,90 */
function charmPrice(n: number): number {
  if (n <= 0) return 0
  const step = n >= 2000 ? 100 : n >= 500 ? 50 : 10
  return Math.ceil(n / step) * step - 0.1
}

export default function PriceResearchPanel({
  initialQuery = '',
  fabric = '',
  supplierProductId,
  costPrice,
  onApplyPrice,
  compact = false,
  autoRun = false,
}: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [fabricInput, setFabricInput] = useState(fabric)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CompetitorAnalysisResult | null>(null)
  const [segmentFilter, setSegmentFilter] = useState<MarketSegment | 'all'>('all')

  const run = async (q = query, f = fabricInput) => {
    if (!q.trim()) {
      setError('Araştırmak için ürün adını yazın.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    setSegmentFilter('all')
    try {
      const res = await fetch('/api/admin/suppliers/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, fabric: f, supplier_product_id: supplierProductId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Piyasa araştırması yapılamadı.')
      setResult(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Piyasa araştırması yapılamadı.')
    } finally {
      setLoading(false)
    }
  }

  const autoRan = useRef(false)
  useEffect(() => {
    if (autoRun && !autoRan.current && initialQuery.trim()) {
      autoRan.current = true
      run(initialQuery, fabric)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, initialQuery, fabric])

  const premium = result?.segments.find(s => s.segment === 'premium')
  const suggestions = result
    ? [
        { label: 'Pazar medyanı', note: 'Tüm kaynakların orta noktası', value: result.median_price },
        premium && { label: 'Premium segment', note: 'İpekyol / Twist medyanı', value: premium.median },
        costPrice && costPrice > 0 && { label: 'Alış × 2,5', note: 'Butik moda için yaygın çarpan', value: costPrice * 2.5 },
      ]
        .filter((s): s is { label: string; note: string; value: number } => !!s && s.value > 0)
        .map(s => ({ ...s, value: charmPrice(s.value) }))
    : []

  const visibleItems = result?.items.filter(i => segmentFilter === 'all' || i.segment === segmentFilter) ?? []

  return (
    <div className="space-y-4">
      <div className={compact ? 'space-y-3' : 'bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4'}>
        <div>
          <h3 className={`font-playfair font-semibold text-[#1A1A1A] ${compact ? 'text-sm' : 'text-lg'}`}>
            Piyasa Fiyat Araştırması
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Hepsiburada, LC Waikiki, DeFacto, İpekyol ve Twist&apos;te benzer ürünleri canlı arar; alakasız sonuçları
            eler ve segment bazında fiyat aralığını gösterir.
          </p>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault()
            run()
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ürün adı — ör. Saten Kruvaze Midi Elbise"
            className="flex-1 p-3 border border-gray-300 rounded-xs text-xs"
          />
          <input
            type="text"
            value={fabricInput}
            onChange={e => setFabricInput(e.target.value)}
            placeholder="Kumaş (isteğe bağlı) — ör. %100 Viskon"
            className="sm:w-56 p-3 border border-gray-300 rounded-xs text-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-6 py-3 rounded-xs font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 text-[#C5A572]" />}
            <span>{loading ? 'Taranıyor…' : 'Piyasayı Araştır'}</span>
          </button>
        </form>

        {loading && (
          <p className="text-[11px] text-gray-500">5 mağaza aynı anda taranıyor, bu işlem 5–20 saniye sürebilir.</p>
        )}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xs text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
            <span>
              Aranan: <strong className="text-[#1A1A1A]">“{result.search_terms}”</strong>
            </span>
            {result.detected.category && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full">Ürün tipi: {result.detected.category}</span>
            )}
            {result.detected.fabric && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full">Kumaş: {result.detected.fabric}</span>
            )}
            {result.detected.color && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full">Renk: {result.detected.color}</span>
            )}
          </div>

          {result.items.length === 0 ? (
            <div className="p-6 text-center bg-amber-50/60 border border-amber-200 rounded-xs space-y-1.5">
              <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
              <h4 className="font-bold text-amber-900 text-xs">Bu ürüne benzeyen sonuç bulunamadı</h4>
              <p className="text-[11px] text-amber-700">
                Ürün adını sadeleştirip (ör. “siyah midi elbise”) tekrar deneyin veya aşağıdaki linklerden elle bakın.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-amber-50 border border-amber-300 p-4 rounded-xs">
                  <span className="text-amber-900 text-[10px] font-bold uppercase tracking-wider block">Piyasa Medyanı</span>
                  <span className="text-2xl font-bold text-[#1A1A1A] font-playfair">{formatPrice(result.median_price)}</span>
                  <span className="block text-[10px] text-amber-800 mt-0.5">
                    {result.items.length} ürün · ort. {formatPrice(result.average_price)}
                  </span>
                </div>
                {result.segments.map(s => (
                  <button
                    key={s.segment}
                    type="button"
                    onClick={() => setSegmentFilter(segmentFilter === s.segment ? 'all' : s.segment)}
                    className={`text-left p-4 rounded-xs border transition-shadow cursor-pointer ${
                      segmentFilter === s.segment ? 'ring-2 ring-[#C5A572]' : ''
                    } ${SEGMENT_STYLE[s.segment]}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">{s.label}</span>
                    <span className="text-xl font-bold font-playfair">{formatPrice(s.median)}</span>
                    <span className="block text-[10px] opacity-75 mt-0.5">
                      {formatPrice(s.min)} – {formatPrice(s.max)} · {s.count} ürün
                    </span>
                    <span className="block text-[10px] opacity-60">{SEGMENT_HINT[s.segment]}</span>
                  </button>
                ))}
              </div>

              {suggestions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xs p-4 space-y-3">
                  <h4 className="font-bold text-xs text-[#1A1A1A] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A572]" /> Fiyat Önerileri
                  </h4>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {suggestions.map(s => {
                      const margin = costPrice && costPrice > 0 ? ((s.value - costPrice) / s.value) * 100 : null
                      return (
                        <div key={s.label} className="border border-gray-200 rounded-xs p-3 flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{s.label}</span>
                          <span className="text-lg font-bold font-playfair text-[#1A1A1A]">{formatPrice(s.value)}</span>
                          <span className="text-[10px] text-gray-500">{s.note}</span>
                          {margin !== null && (
                            <span className={`text-[10px] font-semibold ${margin >= 50 ? 'text-emerald-700' : margin >= 25 ? 'text-amber-700' : 'text-rose-700'}`}>
                              Brüt marj: %{margin.toFixed(0)} (alış {formatPrice(costPrice!)})
                            </span>
                          )}
                          {onApplyPrice && (
                            <button
                              type="button"
                              onClick={() => onApplyPrice(s.value)}
                              className="mt-1 px-2 py-1.5 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs text-[10px] font-semibold uppercase tracking-wider cursor-pointer transition-colors"
                            >
                              Bu fiyatı kullan
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Öneriler yalnızca yol göstericidir; kumaş kalitesi, işçilik ve marka konumlandırmanızı da hesaba katın.
                  </p>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xs overflow-hidden">
                <div className="p-3 border-b border-gray-200 font-bold text-xs text-[#1A1A1A] flex items-center justify-between">
                  <span>
                    Benzer Ürünler ({visibleItems.length})
                    {segmentFilter !== 'all' && (
                      <button type="button" onClick={() => setSegmentFilter('all')} className="ml-2 text-[10px] text-[#C5A572] underline cursor-pointer">
                        filtreyi kaldır
                      </button>
                    )}
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    {new Date(result.searched_at).toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                  {visibleItems.map(item => (
                    <div key={item.product_url} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/60">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEGMENT_STYLE[item.segment]}`}>
                          {item.marketplace_name}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-medium text-xs text-[#1A1A1A] truncate">{item.product_title}</h4>
                          <span className="text-[10px] text-emerald-700">✓ {item.matched.join(' · ')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="font-bold text-sm text-[#1A1A1A] block">{formatPrice(item.price)}</span>
                          {item.original_price && (
                            <span className="text-[10px] text-gray-400 line-through">{formatPrice(item.original_price)}</span>
                          )}
                        </div>
                        <a
                          href={item.product_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="p-1.5 border border-gray-200 hover:border-[#C5A572] hover:text-[#C5A572] rounded-xs"
                          title="Ürünü yeni sekmede aç"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-xs p-3 space-y-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
              {result.sources.map(s => (
                <a
                  key={s.name}
                  href={s.search_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 hover:underline"
                  title={s.error || `${s.found} sonuçtan ${s.used} tanesi alakalı bulundu`}
                >
                  {s.ok && s.used > 0 ? (
                    <CheckCircle2 size={12} className="text-emerald-600" />
                  ) : (
                    <XCircle size={12} className={s.ok ? 'text-gray-400' : 'text-rose-500'} />
                  )}
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-gray-500">{s.ok ? `${s.used} ürün` : s.error}</span>
                </a>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
              <span>Elle kontrol:</span>
              {result.manual_links.map(l => (
                <a
                  key={l.name}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-2 py-0.5 bg-white border border-gray-200 rounded-full hover:border-[#C5A572] inline-flex items-center gap-1"
                >
                  {l.name} <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
