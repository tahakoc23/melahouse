'use client'

/**
 * Uygulama içi onay penceresi (window.confirm yerine).
 * Erişilebilir: role="alertdialog", Esc ile kapanır, açıldığında "Vazgeç"e odaklanır, Tab pencere içinde kalır.
 */
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './index'

export function ProductConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Vazgeç',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const titleId = useId()
  const descId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        e.preventDefault()
        onCancel()
      }
      if (e.key === 'Tab' && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled])')
        if (!items.length) return
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
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, loading, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 sm:items-center" onMouseDown={() => !loading && onCancel()}>
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onMouseDown={e => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-[#E7E3DE] bg-white p-5 shadow-xl"
      >
        <div className="flex gap-3">
          {tone === 'danger' && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700">
              <AlertTriangle className="h-4 w-4" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15px] font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <div id={descId} className="mt-1 text-sm text-kul">
                {description}
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            loading={loading}
            className={tone === 'danger' ? 'bg-rose-700! hover:bg-rose-800!' : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProductConfirmDialog
