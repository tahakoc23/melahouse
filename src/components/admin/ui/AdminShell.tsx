'use client'

/**
 * Admin kabuğu: gruplu kenar çubuğu (mobilde çekmece), üst çubuk (konum, mağaza bağlantısı, çıkış)
 * ve tek <Toaster/>. Yetki kontrolü src/app/admin/layout.tsx içinde sunucuda yapılır.
 */

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { Toaster } from 'react-hot-toast'
import {
  Building2,
  ChevronRight,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Package,
  PackagePlus,
  RotateCcw,
  ShoppingBag,
  Tags,
  Users,
  X,
} from 'lucide-react'
import { ACTION_NEEDED_STATUSES, ADMIN_COUNTS_EVENT, createAdminBrowserClient } from './orderHelpers'

type BadgeKey = 'orders' | 'returns' | 'suppliers' | 'reviews'

type NavItem = {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  badge?: BadgeKey
  /** Rozet açıklaması (ekran okuyucu) */
  badgeLabel?: string
}

type NavGroup = { title?: string; items: NavItem[] }

const NAV: NavGroup[] = [
  { items: [{ label: 'Genel bakış', href: '/admin', icon: LayoutDashboard }] },
  {
    title: 'Satış',
    items: [
      { label: 'Siparişler', href: '/admin/siparisler', icon: ShoppingBag, badge: 'orders', badgeLabel: 'hazırlanacak sipariş' },
      { label: 'İadeler', href: '/admin/iadeler', icon: RotateCcw, badge: 'returns', badgeLabel: 'bekleyen iade talebi' },
    ],
  },
  {
    title: 'Katalog',
    items: [
      { label: 'Ürünler', href: '/admin/urunler', icon: Package },
      { label: 'Yeni ürün', href: '/admin/urunler/yeni', icon: PackagePlus },
      { label: 'Fiyat araştırması', href: '/admin/fiyat-arastirmasi', icon: LineChart },
      { label: 'Kategoriler', href: '/admin/kategoriler', icon: Tags },
    ],
  },
  {
    title: 'Tedarik',
    items: [
      { label: 'Toptancılar', href: '/admin/toptancilar', icon: Building2, badge: 'suppliers', badgeLabel: 'okunmamış toptancı değişikliği' },
    ],
  },
  {
    title: 'Müşteriler',
    items: [
      { label: 'Kullanıcılar', href: '/admin/kullanicilar', icon: Users },
      { label: 'Yorumlar', href: '/admin/yorumlar', icon: MessageSquare, badge: 'reviews', badgeLabel: 'onay bekleyen yorum' },
    ],
  },
  {
    title: 'Site',
    items: [
      { label: 'İçerik', href: '/admin/icerik', icon: FileText },
      { label: 'E-posta', href: '/admin/email', icon: Mail },
    ],
  },
]

const ALL_ITEMS = NAV.flatMap(g => g.items.map(i => ({ ...i, group: g.title })))

/** Alt sayfa adları (ör. /admin/siparisler/[id]) */
const DETAIL_LABELS: Record<string, string> = {
  '/admin/siparisler': 'Sipariş detayı',
  '/admin/urunler': 'Ürünü düzenle',
}

function findActive(pathname: string) {
  let best: (typeof ALL_ITEMS)[number] | null = null
  for (const item of ALL_ITEMS) {
    const match = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'))
    if (match && (!best || item.href.length > best.href.length)) best = item
  }
  if (!best && (pathname === '/admin' || pathname === '/admin/')) best = ALL_ITEMS[0]
  return best
}

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function AdminShell({
  userName,
  userEmail,
  children,
}: {
  userName: string
  userEmail: string
  children: React.ReactNode
}) {
  const pathname = usePathname() || '/admin'
  const router = useRouter()
  const supabase = useMemo(() => createAdminBrowserClient(), [])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [counts, setCounts] = useState<Record<BadgeKey, number>>({ orders: 0, returns: 0, suppliers: 0, reviews: 0 })

  const active = findActive(pathname)

  const loadCounts = useCallback(async () => {
    const head = { count: 'exact' as const, head: true }
    const [orders, returns, reviews, suppliers] = await Promise.all([
      supabase.from('orders').select('id', head).in('status', ACTION_NEEDED_STATUSES),
      supabase.from('orders').select('id', head).eq('status', 'iade_talebi'),
      supabase.from('reviews').select('id', head).eq('is_approved', false),
      fetch('/api/admin/suppliers', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null) as Promise<{ unreadCount?: number } | null>,
    ])
    setCounts({
      orders: orders.count ?? 0,
      returns: returns.count ?? 0,
      reviews: reviews.count ?? 0,
      suppliers: suppliers?.unreadCount ?? 0,
    })
  }, [supabase])

  useEffect(() => {
    let cancelled = false
    const run = () => {
      if (!cancelled) loadCounts().catch(() => {})
    }
    run()
    window.addEventListener(ADMIN_COUNTS_EVENT, run)
    return () => {
      cancelled = true
      window.removeEventListener(ADMIN_COUNTS_EVENT, run)
    }
  }, [loadCounts, pathname])

  // Çekmece açıkken Esc ile kapat
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const signOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isDetail = active && pathname !== active.href && pathname.startsWith(active.href + '/')
  const crumbs = [
    active?.group,
    active?.label ?? 'Yönetim',
    isDetail ? DETAIL_LABELS[active.href] || 'Ayrıntı' : undefined,
  ].filter(Boolean) as string[]

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link
          href="/admin"
          onClick={() => setDrawerOpen(false)}
          className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <span className="block font-display text-xl leading-none tracking-[0.08em] text-ink">MELA HOUSE</span>
          <span className="mt-1 block text-xs text-kul">Yönetim</span>
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Menüyü kapat"
          className="rounded-md p-2 text-kul hover:bg-[#F1EEEA] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Yönetim menüsü" className="flex-1 overflow-y-auto px-3 pb-6">
        {NAV.map((group, gi) => (
          <div key={group.title ?? gi} className={gi === 0 ? 'mt-2' : 'mt-6'}>
            {group.title && <p className="mb-1.5 px-3 text-xs font-medium text-kul">{group.title}</p>}
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon
                const isActive = active?.href === item.href
                const count = item.badge ? counts[item.badge] : 0
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cx(
                        'flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink',
                        isActive ? 'bg-murdum font-medium text-white' : 'text-ink hover:bg-[#F1EEEA]',
                      )}
                    >
                      <Icon className={cx('h-[18px] w-[18px] shrink-0', isActive ? 'text-white' : 'text-kul')} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {count > 0 && (
                        <span
                          className={cx(
                            'min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-xs font-semibold',
                            isActive ? 'bg-white text-murdum' : 'bg-murdum text-white',
                          )}
                        >
                          {count > 99 ? '99+' : count}
                          <span className="sr-only"> {item.badgeLabel}</span>
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F7F6F4] text-sm text-ink">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        İçeriğe geç
      </a>

      {/* Masaüstü kenar çubuğu */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[#E7E3DE] bg-white lg:block">{sidebar}</aside>

      {/* Mobil çekmece */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Yönetim menüsü">
          <div className="absolute inset-0 bg-ink/40" aria-hidden="true" onClick={() => setDrawerOpen(false)} />
          <aside className="relative h-full w-[min(18rem,85vw)] bg-white shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#E7E3DE] bg-white/95 px-4 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menüyü aç"
            aria-expanded={drawerOpen}
            className="-ml-2 rounded-md p-2 text-ink hover:bg-[#F1EEEA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav aria-label="Konum" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 text-[13px] text-kul">
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1
                return (
                  <li key={c + i} className={cx('flex min-w-0 items-center gap-1.5', !last && 'hidden sm:flex')}>
                    {i > 0 && <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" aria-hidden="true" />}
                    {!last && i === crumbs.length - 2 && isDetail && active ? (
                      <Link href={active.href} className="truncate hover:text-ink">
                        {c}
                      </Link>
                    ) : (
                      <span className={cx('truncate', last && 'font-medium text-ink')} aria-current={last ? 'page' : undefined}>
                        {c}
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-[13px] font-medium text-ink hover:bg-[#F1EEEA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Mağazayı görüntüle</span>
            <span className="sr-only sm:hidden">Mağazayı görüntüle (yeni sekme)</span>
          </a>

          <div className="hidden h-6 w-px bg-[#E7E3DE] sm:block" aria-hidden="true" />

          <div className="flex items-center gap-2">
            <div className="hidden text-right md:block" title={userEmail}>
              <p className="max-w-[12rem] truncate text-[13px] font-medium leading-tight text-ink">{userName}</p>
              <p className="text-xs leading-tight text-kul">Yönetici</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-[13px] font-medium text-ink hover:bg-[#F1EEEA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{signingOut ? 'Çıkılıyor…' : 'Çıkış yap'}</span>
              <span className="sr-only sm:hidden">Çıkış yap</span>
            </button>
          </div>
        </header>

        <main id="admin-main" tabIndex={-1} className="px-4 py-6 outline-none md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { background: '#171214', color: '#fff', fontSize: '14px', borderRadius: '8px', padding: '10px 14px', maxWidth: '420px' },
          success: { iconTheme: { primary: '#6EE7B7', secondary: '#171214' } },
          error: { duration: 6000, iconTheme: { primary: '#FDA4AF', secondary: '#171214' } },
        }}
      />
    </div>
  )
}
