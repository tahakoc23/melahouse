'use client'

import { Check, Circle, ExternalLink, ImageOff } from 'lucide-react'
import { Badge } from '@/components/admin/ui'
import { formatTL } from '@/lib/utils'
import { isVideoUrl } from '@/components/admin/ImageUploader'
import { LOW_MARGIN_PERCENT } from './constants'
import { activeVariants, parseStock, priceNumbers, totalStock } from './logic'
import type { ProductFormState } from './types'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export default function SummaryAside({
  form,
  categoryName,
  statusLabel,
  dirty,
  storeUrl,
  children,
}: {
  form: ProductFormState
  categoryName: string
  statusLabel: { text: string; tone: 'success' | 'neutral' }
  dirty: boolean
  storeUrl: string | null
  /** Kaydet butonları */
  children: React.ReactNode
}) {
  const p = priceNumbers(form)
  const active = activeVariants(form)
  const total = totalStock(form)
  const cover = form.images.find(u => !isVideoUrl(u))
  const stocksFilled = active.length > 0 && active.every(v => {
    const n = parseStock(v.cell.stock)
    return n !== null && !Number.isNaN(n)
  })

  const checks = [
    { label: 'Ürün adı', ok: form.name.trim().length >= 3, href: '#pf-name' },
    { label: 'Kategori', ok: !!form.categoryId, href: '#pf-category' },
    { label: 'Görsel', ok: form.images.length > 0, href: '#pf-images', optional: true },
    { label: 'Beden ve stok', ok: stocksFilled, href: '#pf-variants' },
    { label: 'Satış fiyatı', ok: !!p.base && p.base > 0, href: '#pf-base' },
    { label: 'Alış fiyatı', ok: !!p.cost && p.cost > 0, href: '#pf-cost', optional: true },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#E7E3DE] bg-white">
        <div className="flex gap-3 border-b border-[#EFEBE6] p-4">
          <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-[#F1EEEA]">
            {cover ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-kul">
                <ImageOff className="h-5 w-5" aria-hidden />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold text-ink">{form.name.trim() || 'Adsız ürün'}</p>
            <p className="mt-0.5 text-xs text-kul">{categoryName || 'Kategori seçilmedi'}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Badge tone={statusLabel.tone}>{statusLabel.text}</Badge>
              {dirty && <Badge tone="warning">Kaydedilmedi</Badge>}
            </div>
          </div>
        </div>

        <dl className="space-y-2 p-4 text-sm">
          <Row label="Satış fiyatı">
            {p.effective !== null ? (
              <span>
                {p.sale && p.base && p.sale < p.base && <s className="mr-1.5 text-xs text-kul">{formatTL(p.base)}</s>}
                <span className="font-semibold">{formatTL(p.effective)}</span>
              </span>
            ) : (
              '—'
            )}
          </Row>
          <Row label="Alış fiyatı">{p.cost !== null && p.cost > 0 ? formatTL(p.cost) : '—'}</Row>
          <Row label="Brüt kâr">
            <span className={cx(p.profit !== null && p.profit < 0 && 'text-rose-700')}>{p.profit !== null ? formatTL(p.profit) : '—'}</span>
          </Row>
          <Row label="Marj">
            <span className={cx(p.marginPct !== null && p.marginPct < LOW_MARGIN_PERCENT && 'font-semibold text-amber-800')}>
              {p.marginPct !== null ? `%${p.marginPct.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}` : '—'}
            </span>
          </Row>
          <Row label="Toplam stok">
            {active.length ? `${total} adet · ${active.length} varyant` : '—'}
          </Row>
        </dl>

        <div className="space-y-2 border-t border-[#EFEBE6] p-4">{children}</div>
      </div>

      <div className="rounded-lg border border-[#E7E3DE] bg-white p-4">
        <p className="mb-2 text-[13px] font-medium text-ink">Kontrol listesi</p>
        <ul className="space-y-1.5">
          {checks.map(c => (
            <li key={c.label}>
              <a href={c.href} className="flex items-center gap-2 text-[13px] text-ink hover:underline">
                {c.ok ? (
                  <Check className="h-4 w-4 text-emerald-700" aria-hidden />
                ) : (
                  <Circle className={cx('h-4 w-4', c.optional ? 'text-[#CFC8C0]' : 'text-amber-700')} aria-hidden />
                )}
                <span className={cx(!c.ok && 'text-kul')}>
                  {c.label}
                  {!c.ok && c.optional && ' (önerilir)'}
                </span>
                <span className="sr-only">{c.ok ? 'tamam' : 'eksik'}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {storeUrl && (
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-md text-[13px] text-kul hover:text-ink"
        >
          Mağazada görüntüle <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-kul">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  )
}
