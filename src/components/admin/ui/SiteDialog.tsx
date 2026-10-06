'use client'

/**
 * Admin diyalog ve yan panel.
 * - Esc ve arka plana tıklama kapatır (busy iken kapatmaz)
 * - Açılınca ilk odaklanabilir öğeye odaklanır, kapanınca odağı geri verir
 * - Tab tuşu diyalog içinde döner, sayfa kaydırması kilitlenir
 */

import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type DialogSize = 'sm' | 'md' | 'lg' | 'xl'

const CENTER_SIZES: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}
const SIDE_SIZES: Record<DialogSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface SiteDialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Alt buton satırı */
  footer?: ReactNode
  size?: DialogSize
  /** 'side': sağdan açılan geniş panel */
  variant?: 'center' | 'side'
  /** İşlem sürerken kapatmayı engeller */
  busy?: boolean
  role?: 'dialog' | 'alertdialog'
}

export function SiteDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  variant = 'center',
  busy = false,
  role = 'dialog',
}: SiteDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()
  const onCloseRef = useRef(onClose)
  const busyRef = useRef(busy)

  useEffect(() => {
    onCloseRef.current = onClose
    busyRef.current = busy
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFirst = window.setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      const preferred = panel.querySelector<HTMLElement>('[data-autofocus]')
      const first = preferred || panel.querySelector<HTMLElement>(`[data-dialog-body] ${FOCUSABLE}`) || panel
      first.focus()
    }, 20)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!busyRef.current) {
          e.stopPropagation()
          onCloseRef.current()
        }
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null)
      if (items.length === 0) return
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
      window.clearTimeout(focusFirst)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  const side = variant === 'side'

  return createPortal(
    <div className={cx('fixed inset-0 z-[60] flex', side ? 'justify-end' : 'items-end justify-center p-0 sm:items-center sm:p-4')}>
      <div
        aria-hidden
        className="absolute inset-0 bg-ink/50"
        onClick={() => {
          if (!busy) onClose()
        }}
      />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cx(
          'relative flex w-full flex-col bg-white shadow-xl outline-none',
          side
            ? cx('h-full', SIDE_SIZES[size])
            : cx('max-h-[92vh] rounded-t-xl sm:rounded-lg', CENTER_SIZES[size]),
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EFEBE6] px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15px] font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-0.5 text-[13px] text-kul">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Kapat"
            className="-mr-1 rounded-md p-1.5 text-kul transition-colors hover:bg-[#F1EEEA] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div data-dialog-body className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-sm text-ink">
          {children}
        </div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#EFEBE6] px-5 py-3">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
