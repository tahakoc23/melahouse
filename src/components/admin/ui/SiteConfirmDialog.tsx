'use client'

/**
 * window.confirm yerine kullanılan onay penceresi.
 *
 * Doğrudan:   <SiteConfirmDialog open={...} title="..." onConfirm={...} onClose={...} />
 * Hook ile:   const [confirm, confirmDialog] = useSiteConfirm()
 *             if (await confirm({ title: 'Silinsin mi?', confirmLabel: 'Sil', tone: 'danger' })) { ... }
 *             ... JSX içinde {confirmDialog}
 */

import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from './index'
import { SiteDialog } from './SiteDialog'

export interface SiteConfirmOptions {
  title: string
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
}

export function SiteConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  tone = 'default',
  loading = false,
  onConfirm,
  onClose,
}: SiteConfirmOptions & {
  open: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <SiteDialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      role="alertdialog"
      busy={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            data-autofocus
            variant={tone === 'danger' ? 'danger' : 'primary'}
            className={tone === 'danger' ? 'border-rose-700! bg-rose-700! text-white! hover:bg-rose-800!' : undefined}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message ? <div className="text-sm text-kul">{message}</div> : null}
    </SiteDialog>
  )
}

/** Promise döndüren onay: `if (await confirm({...}))` */
export function useSiteConfirm(): [(opts: SiteConfirmOptions) => Promise<boolean>, ReactNode] {
  const [state, setState] = useState<SiteConfirmOptions | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback((opts: SiteConfirmOptions) => {
    resolver.current?.(false)
    setState(opts)
    return new Promise<boolean>(resolve => {
      resolver.current = resolve
    })
  }, [])

  const settle = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setState(null)
  }

  const element = state ? (
    <SiteConfirmDialog open {...state} onConfirm={() => settle(true)} onClose={() => settle(false)} />
  ) : null

  return [confirm, element]
}
