'use client'

/**
 * Satır işlemleri için "..." menüsü. Tablo kaydırma alanında kesilmemesi için
 * menü ekrana sabit konumlanır. Ok tuşları, Esc ve dışarı tıklama desteklenir.
 */

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { MoreHorizontal } from 'lucide-react'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export interface SiteRowMenuItem {
  label: string
  icon?: ReactNode
  onSelect?: () => void
  href?: string
  external?: boolean
  tone?: 'danger'
  disabled?: boolean
}

export function SiteRowMenu({ items, label = 'İşlemler' }: { items: SiteRowMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const menuH = items.length * 40 + 12
    const below = r.bottom + 4
    const top = below + menuH > window.innerHeight ? Math.max(8, r.top - menuH - 4) : below
    setPos({ top, right: Math.max(8, window.innerWidth - r.right) })
  }

  useEffect(() => {
    if (!open) return
    const focusFirst = window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus()
    }, 0)
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false)
    }
    const onClose = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('resize', onClose)
    window.addEventListener('scroll', onClose, true)
    return () => {
      window.clearTimeout(focusFirst)
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [open])

  const onMenuKey = (e: React.KeyboardEvent) => {
    const els = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') || [])
    const i = els.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      els[(i + 1) % els.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      els[(i - 1 + els.length) % els.length]?.focus()
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault()
      setOpen(false)
      btnRef.current?.focus()
    }
  }

  const itemCls = (it: SiteRowMenuItem) =>
    cx(
      'flex h-9 w-full items-center gap-2 rounded px-2.5 text-left text-sm outline-none transition-colors',
      it.disabled ? 'cursor-not-allowed text-kul/60' : 'cursor-pointer focus:bg-[#F1EEEA] hover:bg-[#F1EEEA]',
      it.tone === 'danger' && !it.disabled ? 'text-rose-700' : 'text-ink',
    )

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          if (!open) place()
          setOpen(o => !o)
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-kul transition-colors hover:bg-[#F1EEEA] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            onKeyDown={onMenuKey}
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-[70] min-w-[180px] rounded-md border border-[#E7E3DE] bg-white p-1 shadow-lg"
          >
            {items.map(it => {
              const content = (
                <>
                  {it.icon && <span className="flex h-4 w-4 items-center justify-center text-current">{it.icon}</span>}
                  {it.label}
                </>
              )
              if (it.href && !it.disabled) {
                return it.external ? (
                  <a
                    key={it.label}
                    role="menuitem"
                    href={it.href}
                    target="_blank"
                    rel="noreferrer"
                    className={itemCls(it)}
                    onClick={() => setOpen(false)}
                  >
                    {content}
                  </a>
                ) : (
                  <Link key={it.label} role="menuitem" href={it.href} className={itemCls(it)} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                )
              }
              return (
                <button
                  key={it.label}
                  type="button"
                  role="menuitem"
                  aria-disabled={it.disabled || undefined}
                  className={itemCls(it)}
                  onClick={() => {
                    if (it.disabled) return
                    setOpen(false)
                    it.onSelect?.()
                  }}
                >
                  {content}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}
