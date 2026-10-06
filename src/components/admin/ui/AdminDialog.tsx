'use client'

/**
 * Admin diyalogları: Dialog (genel), ConfirmDialog (onay), SidePanel (sağdan açılan panel).
 * window.confirm / alert yerine kullanılır. Esc ile kapanır, odak diyalog içinde kalır,
 * kapanınca odak açan öğeye döner.
 */

import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from './index'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Açık diyalog yığını: Esc ve Tab yalnızca en üstteki diyaloğu etkiler */
const modalStack: object[] = []

function useModalBehavior(open: boolean, onClose: () => void, dismissible: boolean) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const dismissibleRef = useRef(dismissible)

  useEffect(() => {
    onCloseRef.current = onClose
    dismissibleRef.current = dismissible
  })

  useEffect(() => {
    if (!open) return
    const token = {}
    modalStack.push(token)
    const previouslyFocused = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // İlk odaklanabilir alana (yoksa panele) odaklan
    const t = window.setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      const auto = panel.querySelector<HTMLElement>('[data-autofocus]')
      const first = auto || panel.querySelector<HTMLElement>(FOCUSABLE)
      ;(first || panel).focus()
    }, 0)

    const onKey = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== token) return
      if (e.key === 'Escape' && dismissibleRef.current) {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      window.clearTimeout(t)
      const idx = modalStack.indexOf(token)
      if (idx >= 0) modalStack.splice(idx, 1)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  return panelRef
}

/* ------------------------------------------------------------------ */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** false iken (ör. kayıt sürerken) Esc ve dış tıklama kapatmaz */
  dismissible?: boolean
}) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useModalBehavior(open, onClose, dismissible)

  if (!open || typeof document === 'undefined') return null

  const width = size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md'

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink/40"
        aria-hidden="true"
        onClick={() => dismissible && onClose()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative flex max-h-[90vh] w-full flex-col rounded-t-xl bg-white shadow-xl outline-none sm:rounded-lg ${width}`}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <div id={descId} className="mt-1 text-sm text-kul">
                {description}
              </div>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="-mr-1 -mt-1 rounded-md p-1.5 text-kul hover:bg-[#F1EEEA] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {children && <div className="overflow-y-auto px-5 pb-2 text-sm text-ink">{children}</div>}
        {footer && (
          <div className="mt-2 flex flex-col-reverse gap-2 border-t border-[#EFEBE6] px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Vazgeç',
  tone = 'primary',
  loading = false,
  confirmDisabled = false,
  children,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: ReactNode
  message?: ReactNode
  /** Butonda tam olarak ne olacağını yazın: "İadeyi onayla", "Yorumu sil" */
  confirmLabel: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  loading?: boolean
  confirmDisabled?: boolean
  /** Ek alanlar (ör. gerekçe, takip no) */
  children?: ReactNode
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            className={tone === 'danger' ? 'bg-rose-700! text-white! border-rose-700! hover:bg-rose-800!' : undefined}
            onClick={onConfirm}
            loading={loading}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */

/** Sağdan açılan ayrıntı paneli (mobilde tam ekran) */
export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  const titleId = useId()
  const panelRef = useModalBehavior(open, onClose, true)

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="absolute inset-0 bg-ink/30" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex h-full w-full flex-col bg-white shadow-xl outline-none sm:max-w-lg"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EFEBE6] px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-base font-semibold text-ink">
              {title}
            </h2>
            {subtitle && <div className="mt-0.5 text-[13px] text-kul">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Paneli kapat"
            className="-mr-1 rounded-md p-1.5 text-kul hover:bg-[#F1EEEA] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-[#EFEBE6] px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
