'use client'

/** Ürün formuna özel küçük alan bileşenleri */
import type { ReactNode } from 'react'
import { TextInput } from '@/components/admin/ui'
import { formatTurkishPrice, parseTurkishPrice, sanitizePriceInput } from '@/app/admin/urunler/_lib/price'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/** Türkçe biçimli fiyat alanı: yazarken serbest, alandan çıkınca "1.299,90" biçimine döner */
export function PriceInput({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  placeholder,
}: {
  id: string
  label: ReactNode
  value: string
  onChange: (v: string) => void
  error?: string | null
  hint?: ReactNode
  required?: boolean
  placeholder?: string
}) {
  return (
    <TextInput
      id={id}
      label={label}
      value={value}
      required={required}
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      suffix="₺"
      error={error}
      hint={hint}
      onChange={e => onChange(sanitizePriceInput(e.target.value))}
      onBlur={() => {
        const n = parseTurkishPrice(value)
        if (value.trim() && n !== null) onChange(formatTurkishPrice(n))
      }}
    />
  )
}

/** Bir metin alanının altında hızlı seçim önerileri */
export function QuickChips({
  options,
  isActive,
  onPick,
  label,
  swatches,
}: {
  options: string[]
  isActive: (o: string) => boolean
  onPick: (o: string) => void
  label: string
  swatches?: Record<string, string>
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map(o => {
        const on = isActive(o)
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(o)}
            className={cx(
              'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors cursor-pointer',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink',
              on ? 'border-murdum bg-murdum text-white' : 'border-[#E2DDD7] bg-white text-ink hover:border-ink',
            )}
          >
            {swatches?.[o] && (
              <span
                aria-hidden
                className="h-3 w-3 rounded-full border border-black/10"
                style={{
                  background:
                    o === 'Çok renkli'
                      ? 'conic-gradient(#C21E2B, #E8C547, #3C6E47, #3A6EA5, #B9A3CF, #C21E2B)'
                      : swatches[o],
                }}
              />
            )}
            {o}
          </button>
        )
      })}
    </div>
  )
}

/** Bölüm numarası + başlık (kart başlığında) */
export function StepTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F1EEEA] text-xs font-semibold text-ink">
        {n}
      </span>
      {children}
    </span>
  )
}
