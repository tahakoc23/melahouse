'use client'

import { Card } from '@/components/admin/ui'
import PriceResearchPanel from '@/components/admin/PriceResearchPanel'
import { formatTurkishPrice } from '@/app/admin/urunler/_lib/price'
import { formatTL } from '@/lib/utils'
import { LOW_MARGIN_PERCENT } from './constants'
import { PriceInput, StepTitle } from './fields'
import { priceNumbers } from './logic'
import type { FieldErrors, ProductFormState } from './types'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export interface ResearchAttributes {
  name?: string
  category?: string
  color?: string
  fabric?: string
  details?: string[]
}

export default function PriceCard({
  form,
  onChange,
  errors,
  step,
  research,
  supplierProductId,
  costHint,
}: {
  form: ProductFormState
  onChange: (patch: Partial<Pick<ProductFormState, 'cost' | 'base' | 'sale'>>) => void
  errors: FieldErrors
  step: number
  research: ResearchAttributes
  supplierProductId?: string
  /** Alış fiyatı altındaki not (ör. KDV bilgisi) */
  costHint?: string | null
}) {
  const p = priceNumbers(form)
  const low = p.marginPct !== null && p.marginPct < LOW_MARGIN_PERCENT
  const discountPct = p.base && p.sale && p.sale < p.base ? Math.round((1 - p.sale / p.base) * 100) : null

  return (
    <div id="pf-price" className="scroll-mt-24">
      <Card title={<StepTitle n={step}>Fiyat</StepTitle>} description="Tutarları 1.299,90 biçiminde yazın.">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <PriceInput
              id="pf-cost"
              label="Alış fiyatı"
              value={form.cost}
              onChange={v => onChange({ cost: v })}
              error={errors.cost}
              hint={costHint || "Sadece siz görürsünüz."}
              placeholder="0"
            />
            <PriceInput
              id="pf-base"
              label="Satış fiyatı"
              required
              value={form.base}
              onChange={v => onChange({ base: v })}
              error={errors.base}
              placeholder="0"
            />
            <PriceInput
              id="pf-sale"
              label="İndirimli fiyat"
              value={form.sale}
              onChange={v => onChange({ sale: v })}
              error={errors.sale}
              hint={discountPct ? `%${discountPct} indirim` : 'Boş bırakılırsa indirim yok.'}
              placeholder="İsteğe bağlı"
            />
          </div>

          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-[#E7E3DE] bg-[#E7E3DE] text-center">
            <div className="bg-[#FAF9F7] px-2 py-3">
              <dt className="text-xs text-kul">Müşteri öder</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink">{p.effective !== null ? formatTL(p.effective) : '—'}</dd>
            </div>
            <div className="bg-[#FAF9F7] px-2 py-3">
              <dt className="text-xs text-kul">Brüt kâr</dt>
              <dd className={cx('mt-0.5 text-sm font-semibold', p.profit !== null && p.profit < 0 ? 'text-rose-700' : 'text-ink')}>
                {p.profit !== null ? formatTL(p.profit) : '—'}
              </dd>
            </div>
            <div className="bg-[#FAF9F7] px-2 py-3">
              <dt className="text-xs text-kul">Marj</dt>
              <dd className={cx('mt-0.5 text-sm font-semibold', low ? 'text-amber-800' : 'text-ink')}>
                {p.marginPct !== null ? `%${p.marginPct.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}` : '—'}
              </dd>
            </div>
          </dl>
          {p.cost === null && <p className="-mt-3 text-xs text-kul">Kâr ve marj için alış fiyatını yazın.</p>}
          {low && (
            <p role="status" className="-mt-3 text-xs text-amber-800">
              {p.marginPct! < 0
                ? 'Satış fiyatı alış fiyatının altında; bu fiyatla zarar edersiniz.'
                : `Marj %${LOW_MARGIN_PERCENT}’un altında. Kargo, komisyon ve iade payı düşünülünce düşük kalabilir.`}
            </p>
          )}

          <div className="border-t border-[#EFEBE6] pt-5">
            <h3 className="mb-1 text-sm font-semibold text-ink">Piyasa fiyat araştırması</h3>
            <p className="mb-3 text-xs text-kul">
              Alt, orta ve premium segmentten 10 markada en benzer ürünün fiyatını bulur. Önerilen fiyatı tek tıkla satış fiyatına
              yazabilirsiniz.
            </p>
            <PriceResearchPanel
              compact
              attributes={research}
              costPrice={p.cost && p.cost > 0 ? p.cost : undefined}
              supplierProductId={supplierProductId}
              onApplyPrice={price => onChange({ base: formatTurkishPrice(price) })}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
