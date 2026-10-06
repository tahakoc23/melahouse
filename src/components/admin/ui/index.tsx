'use client'

/**
 * MELA HOUSE admin arayüz kiti.
 * Tüm admin sayfaları bu bileşenleri kullanır; renk/ölçü kararları burada verilir.
 *
 * Renkler (globals.css @theme): ink #171214 (birincil), murdum #3A1D2A (vurgu/seçili),
 * tas #ECE6DF (yüzey), kul #77706B (ikincil metin). Admin zemini: bg-[#F7F6F4].
 * Tipografi: gövde 14px (text-sm), etiket 13px, yardım metni 12px. Sayfa başlıkları font-display.
 */

import Link from 'next/link'
import { forwardRef, useId } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/* Sayfa iskeleti                                                      */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string
  description?: string
  actions?: ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-block text-[13px] text-kul hover:text-ink">
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-[28px] leading-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-kul">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section className={cx('rounded-lg border border-[#E7E3DE] bg-white', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-[#EFEBE6] px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-kul">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'p-5' : undefined}>{children}</div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Butonlar                                                            */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-murdum',
  accent: 'bg-murdum text-white hover:bg-ink',
  secondary: 'bg-white text-ink border border-[#DCD6CF] hover:border-ink',
  ghost: 'text-ink hover:bg-[#F1EEEA]',
  danger: 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50',
}
const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  href?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, href, className, children, disabled, ...rest },
  ref,
) {
  const cls = cx(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
    'disabled:cursor-not-allowed disabled:opacity-50',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  )
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </>
  )
  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    )
  }
  return (
    <button ref={ref} className={cls} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  )
})

/* ------------------------------------------------------------------ */
/* Form alanları                                                       */
/* ------------------------------------------------------------------ */

const FIELD_BASE =
  'w-full rounded-md border border-[#DCD6CF] bg-white px-3 text-sm text-ink placeholder:text-[#A8A19A] ' +
  'focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:bg-[#F7F6F4] disabled:text-kul'

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
  className,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: string | null
  required?: boolean
  children: ReactNode
  htmlFor?: string
  className?: string
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink">
          {label}
          {required && <span className="ml-0.5 text-murdum">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-rose-700">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-kul">{hint}</p>
      )}
    </div>
  )
}

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: ReactNode
  hint?: ReactNode
  error?: string | null
  suffix?: ReactNode
  prefix?: ReactNode
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, hint, error, suffix, prefix, className, id, required, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={className}>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-kul">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error || undefined}
          className={cx(FIELD_BASE, 'h-10', !!prefix && 'pl-8', !!suffix && 'pr-10', !!error && 'border-rose-400')}
          {...rest}
        />
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-kul">{suffix}</span>}
      </div>
    </Field>
  )
})

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: string | null
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, className, id, required, rows = 4, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={className}>
      <textarea ref={ref} id={inputId} rows={rows} required={required} className={cx(FIELD_BASE, 'py-2.5 leading-relaxed')} {...rest} />
    </Field>
  )
})

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: string | null
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, required, children, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={className}>
      <select ref={ref} id={inputId} required={required} className={cx(FIELD_BASE, 'h-10 pr-8')} {...rest}>
        {children}
      </select>
    </Field>
  )
})

/** Açık/kapalı anahtar (aktif, öne çıkan vb.) */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  return (
    <label className={cx('flex cursor-pointer items-start justify-between gap-4', disabled && 'cursor-not-allowed opacity-60')}>
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-kul">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-ink' : 'bg-[#D8D2CB]',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  )
}

/** Çoklu seçilebilir küçük çipler (beden, model detayı vb.) */
export function ChipGroup({
  options,
  value,
  onChange,
  multiple = true,
}: {
  options: { value: string; label?: string }[]
  value: string[]
  onChange: (v: string[]) => void
  multiple?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => {
              if (multiple) onChange(on ? value.filter(v => v !== o.value) : [...value, o.value])
              else onChange(on ? [] : [o.value])
            }}
            className={cx(
              'h-9 min-w-[2.75rem] rounded-md border px-3 text-[13px] font-medium transition-colors cursor-pointer',
              on ? 'border-ink bg-ink text-white' : 'border-[#DCD6CF] bg-white text-ink hover:border-ink',
            )}
          >
            {o.label ?? o.value}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Görsel öğeler                                                       */
/* ------------------------------------------------------------------ */

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent'
const TONES: Record<Tone, string> = {
  neutral: 'bg-[#F1EEEA] text-ink',
  success: 'bg-emerald-50 text-emerald-800',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-800',
  accent: 'bg-murdum/10 text-murdum',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {children}
    </span>
  )
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E7E3DE] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-kul">{label}</p>
        {icon && <span className="text-kul">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-[28px] leading-none text-ink">{value}</p>
      {hint && <p className="mt-2 text-xs text-kul">{hint}</p>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F1EEEA] text-kul">{icon}</div>}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-kul">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-[#E7E3DE]">
      {tabs.map(t => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            '-mb-px whitespace-nowrap border-b-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors cursor-pointer',
            value === t.value ? 'border-ink text-ink' : 'border-transparent text-kul hover:text-ink',
          )}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className="ml-1.5 rounded-full bg-[#F1EEEA] px-1.5 py-0.5 text-[11px] text-kul">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/** Tablo: sütun başlıkları ve satırlar için ince sarmalayıcılar */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  )
}
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cx('border-b border-[#EFEBE6] bg-[#FAF9F7] px-4 py-3 text-xs font-medium text-kul', className)}>{children}</th>
  )
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cx('border-b border-[#F3F0EC] px-4 py-3 align-middle text-ink', className)}>{children}</td>
}

/** Sayfa altında sabit kaydet çubuğu (uzun formlar için) */
export function StickyActions({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-[#E7E3DE] bg-white/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="text-[13px] text-kul">{note}</div>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </div>
  )
}

/** Satır içi uyarı/bilgi kutusu */
export function Notice({ tone = 'info', title, children }: { tone?: Tone; title?: ReactNode; children?: ReactNode }) {
  return (
    <div className={cx('rounded-md px-4 py-3 text-[13px]', TONES[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-0.5' : undefined}>{children}</div>}
    </div>
  )
}
