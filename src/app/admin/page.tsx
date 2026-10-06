'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronRight,
  Clock,
  MessageSquare,
  PackageOpen,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Stat, Table, Td, Th } from '@/components/admin/ui'
import {
  NON_REVENUE_STATUSES,
  createAdminBrowserClient,
  customerNameOf,
  formatDate,
  orderNo,
  statusMeta,
} from '@/components/admin/ui/orderHelpers'
import { formatTL } from '@/lib/utils'

const LOW_STOCK_LIMIT = 2
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

type RevenueOrder = { id: string; status: string | null; total: number | null; created_at: string }
type RecentOrder = {
  id: string
  order_number: string | null
  status: string | null
  total: number | null
  created_at: string | null
  shipping_address: unknown
  profiles: { full_name: string | null } | null
}
type LowStock = {
  id: string
  product_id: string
  color_name: string | null
  size: string | null
  stock_quantity: number
  products: { name: string | null } | null
}
type VisitorStats = { today: number; week: number; month: number; year: number }

type Dashboard = {
  revenueOrders: RevenueOrder[]
  recent: RecentOrder[]
  lowStock: LowStock[]
  counts: { newOrders: number; preparing: number; returns: number; reviews: number; supplierChanges: number; customers: number }
  visitors: VisitorStats | null
  partialError: boolean
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export default function AdminDashboard() {
  const supabase = useMemo(() => createAdminBrowserClient(), [])
  const [data, setData] = useState<Dashboard | null>(null)
  const [fatal, setFatal] = useState<string | null>(null)
  const [range, setRange] = useState<'30d' | '12m'>('30d')

  const load = useCallback(async () => {
    const now = new Date()
    // Grafiğin 12 aylık görünümü için 11 ay öncesinin başından itibaren yeterli
    const since = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString()
    const head = { count: 'exact' as const, head: true }

    const [rev, recent, low, newO, prep, ret, rvw, sup, cust, vis] = await Promise.all([
      supabase
        .from('orders')
        .select('id, status, total, created_at')
        .gte('created_at', since)
        .not('status', 'in', `(${NON_REVENUE_STATUSES.join(',')})`),
      supabase
        .from('orders')
        .select('id, order_number, status, total, created_at, shipping_address, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('product_variants')
        .select('id, product_id, color_name, size, stock_quantity, products!inner(name, is_active)')
        .eq('is_active', true)
        .eq('products.is_active', true)
        .lte('stock_quantity', LOW_STOCK_LIMIT)
        .order('stock_quantity', { ascending: true })
        .limit(200),
      supabase.from('orders').select('id', head).in('status', ['siparis_alindi', 'odeme_alindi']),
      supabase.from('orders').select('id', head).eq('status', 'hazirlaniyor'),
      supabase.from('orders').select('id', head).eq('status', 'iade_talebi'),
      supabase.from('reviews').select('id', head).eq('is_approved', false),
      supabase.from('supplier_changes').select('id', head).eq('is_read', false),
      supabase.from('profiles').select('id', head).neq('role', 'admin'),
      supabase.rpc('get_visitor_stats', { target_year: now.getFullYear() }),
    ])

    if (rev.error && recent.error) {
      setFatal('Veriler yüklenemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin.')
      return
    }

    const partialError = [rev, recent, low, newO, prep, ret, rvw, cust].some(r => r.error)

    setData({
      revenueOrders: (rev.data || []) as RevenueOrder[],
      recent: (recent.data || []) as unknown as RecentOrder[],
      lowStock: (low.data || []) as unknown as LowStock[],
      counts: {
        newOrders: newO.count ?? 0,
        preparing: prep.count ?? 0,
        returns: ret.count ?? 0,
        reviews: rvw.count ?? 0,
        supplierChanges: sup.error ? 0 : sup.count ?? 0,
        customers: cust.count ?? 0,
      },
      visitors: vis.error || !vis.data ? null : (vis.data as VisitorStats),
      partialError,
    })
    setFatal(null)
  }, [supabase])

  // İlk yükleme: load() içindeki setState çağrıları istek tamamlandıktan sonra çalışır
  useEffect(() => {
    const run = () => {
      load().catch(() => {})
    }
    run()
  }, [load])

  const view = useMemo(() => {
    if (!data) return null
    const now = new Date()
    const today = startOfDay(now).getTime()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const orders = data.revenueOrders.map(o => ({ t: new Date(o.created_at).getTime(), total: Number(o.total) || 0 }))

    const sum = (from: number, to = Infinity) => orders.filter(o => o.t >= from && o.t < to)
    const todayOrders = sum(today)
    const monthOrders = sum(monthStart)

    const daily = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i))
      const start = d.getTime()
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime()
      return {
        label: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        ciro: sum(start, end).reduce((s, o) => s + o.total, 0),
      }
    })
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
      return {
        label: `${MONTHS[d.getMonth()]}${d.getMonth() === 0 || i === 0 ? ` ${String(d.getFullYear()).slice(2)}` : ''}`,
        ciro: sum(d.getTime(), end).reduce((s, o) => s + o.total, 0),
      }
    })

    return {
      todayRevenue: todayOrders.reduce((s, o) => s + o.total, 0),
      todayCount: todayOrders.length,
      monthRevenue: monthOrders.reduce((s, o) => s + o.total, 0),
      monthCount: monthOrders.length,
      daily,
      monthly,
      year: now.getFullYear(),
    }
  }, [data])

  if (fatal) {
    return (
      <div>
        <PageHeader title="Genel bakış" />
        <Notice tone="danger" title="Genel bakış yüklenemedi">
          {fatal}
        </Notice>
      </div>
    )
  }

  if (!data || !view) return <DashboardSkeleton />

  const { counts } = data
  const toPrepare = counts.newOrders + counts.preparing
  const outOfStock = data.lowStock.filter(v => v.stock_quantity <= 0).length
  const chartData = range === '30d' ? view.daily : view.monthly
  const chartTotal = chartData.reduce((s, d) => s + d.ciro, 0)

  const todos: TodoItem[] = [
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      count: toPrepare,
      title: 'Hazırlanacak sipariş',
      detail: toPrepare ? `${counts.newOrders} yeni · ${counts.preparing} hazırlanıyor` : 'Bekleyen sipariş yok',
      href: counts.newOrders > 0 ? '/admin/siparisler?durum=yeni' : '/admin/siparisler?durum=hazirlaniyor',
    },
    {
      icon: <RotateCcw className="h-5 w-5" />,
      count: counts.returns,
      title: 'İade talebi',
      detail: counts.returns ? 'Onaylayın veya reddedin' : 'Bekleyen iade yok',
      href: '/admin/iadeler',
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      count: counts.reviews,
      title: 'Onay bekleyen yorum',
      detail: counts.reviews ? 'Yayınlamadan önce okuyun' : 'Bekleyen yorum yok',
      href: '/admin/yorumlar',
    },
    {
      icon: <PackageOpen className="h-5 w-5" />,
      count: data.lowStock.length,
      title: 'Stoğu azalan ürün',
      detail: data.lowStock.length
        ? `${LOW_STOCK_LIMIT} adet veya daha az${outOfStock ? ` · ${outOfStock} tükendi` : ''}`
        : 'Stok sorunu yok',
      href: '#az-kalan-stok',
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      count: counts.supplierChanges,
      title: 'Toptancı fiyat/stok değişikliği',
      detail: counts.supplierChanges ? 'Fiyatlarınızı kontrol edin' : 'Yeni değişiklik yok',
      href: '/admin/toptancilar',
    },
  ]
  const openTodos = todos.filter(t => t.count > 0).length

  return (
    <div className="space-y-8">
      <PageHeader title="Genel bakış" description={new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} />

      {data.partialError && (
        <Notice tone="warning">Bazı veriler yüklenemedi; sayılar eksik olabilir. Sayfayı yenileyip tekrar deneyin.</Notice>
      )}

      {/* Bugün yapılacaklar */}
      <Card
        title="Bugün yapılacaklar"
        description={openTodos ? `${openTodos} konu ilginizi bekliyor` : 'Her şey yolunda, bekleyen iş yok.'}
        padded={false}
      >
        <ul className="divide-y divide-[#F3F0EC]">
          {todos.map(t => (
            <li key={t.title}>
              <TodoRow item={t} />
            </li>
          ))}
        </ul>
      </Card>

      {/* Göstergeler */}
      <section aria-label="Özet" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat label="Bugünkü ciro" value={formatTL(view.todayRevenue)} hint={`${view.todayCount} sipariş`} icon={<Wallet className="h-4 w-4" />} />
        <Stat label="Bu ay ciro" value={formatTL(view.monthRevenue)} hint={`${view.monthCount} sipariş`} icon={<TrendingUp className="h-4 w-4" />} />
        <Link
          href="/admin/siparisler?durum=yeni"
          className="rounded-lg transition-shadow hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Stat label="Bekleyen sipariş" value={toPrepare} hint="Hazırlanıp kargoya verilecek" icon={<Clock className="h-4 w-4" />} />
        </Link>
        <Link
          href="/admin/kullanicilar"
          className="rounded-lg transition-shadow hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Stat label="Toplam müşteri" value={counts.customers} hint="Kayıtlı üye" icon={<Users className="h-4 w-4" />} />
        </Link>
      </section>

      {/* Ciro grafiği */}
      <Card
        title="Ciro"
        description="İptal, iade ve ödemesi tamamlanmamış kart siparişleri dahil değil."
        actions={
          <div role="group" aria-label="Zaman aralığı" className="flex rounded-md border border-[#DCD6CF] p-0.5">
            {(
              [
                ['30d', 'Son 30 gün'],
                ['12m', 'Aylık'],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                aria-pressed={range === v}
                onClick={() => setRange(v)}
                className={`h-8 rounded px-3 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
                  range === v ? 'bg-ink text-white' : 'text-kul hover:text-ink'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        }
      >
        <p className="mb-4 text-[13px] text-kul">
          {range === '30d' ? 'Son 30 günde' : 'Son 12 ayda'} toplam{' '}
          <span className="font-semibold text-ink tabular-nums">{formatTL(chartTotal)}</span>
        </p>
        <div className="h-72 w-full" role="img" aria-label={`${range === '30d' ? 'Son 30 gün günlük' : 'Son 12 ay aylık'} ciro grafiği`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap={range === '30d' ? 2 : 8}>
              <CartesianGrid vertical={false} stroke="#EFEBE6" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#77706B' }}
                interval={range === '30d' ? 4 : 0}
                minTickGap={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fontSize: 12, fill: '#77706B' }}
                tickFormatter={v => new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(v))}
              />
              <Tooltip
                cursor={{ fill: '#F1EEEA' }}
                formatter={v => [formatTL(Number(v)), 'Ciro']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E7E3DE', fontSize: 13, color: '#171214' }}
                labelStyle={{ color: '#77706B', marginBottom: 2 }}
              />
              <Bar dataKey="ciro" fill="#3A1D2A" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Son siparişler */}
        <Card
          title="Son siparişler"
          className="lg:col-span-2"
          padded={false}
          actions={
            <Button variant="ghost" size="sm" href="/admin/siparisler">
              Tümünü gör
            </Button>
          }
        >
          {data.recent.length === 0 ? (
            <EmptyState icon={<ShoppingBag className="h-5 w-5" />} title="Henüz sipariş yok" description="İlk sipariş geldiğinde burada görünecek." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Sipariş</Th>
                  <Th className="hidden sm:table-cell">Müşteri</Th>
                  <Th>Durum</Th>
                  <Th className="text-right">Tutar</Th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map(o => {
                  const m = statusMeta(o.status)
                  return (
                    <tr key={o.id} className="hover:bg-[#FAF9F7]">
                      <Td>
                        <Link href={`/admin/siparisler/${o.id}`} className="font-medium tabular-nums hover:underline">
                          {orderNo(o)}
                        </Link>
                        <p className="text-xs text-kul">{formatDate(o.created_at, true)}</p>
                      </Td>
                      <Td className="hidden max-w-[12rem] truncate sm:table-cell">{customerNameOf(o)}</Td>
                      <Td>
                        <Badge tone={m.tone}>{m.label}</Badge>
                      </Td>
                      <Td className="whitespace-nowrap text-right tabular-nums">{formatTL(o.total)}</Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </Card>

        {/* Ziyaretçiler */}
        <Card title="Ziyaretçiler" description="Siteye giren farklı kişi sayısı">
          {data.visitors ? (
            <dl className="grid grid-cols-2 gap-4">
              {(
                [
                  ['Bugün', data.visitors.today],
                  ['Son 7 gün', data.visitors.week],
                  ['Bu ay', data.visitors.month],
                  [String(view.year), data.visitors.year],
                ] as const
              ).map(([l, v]) => (
                <div key={l}>
                  <dt className="text-[13px] text-kul">{l}</dt>
                  <dd className="mt-1 font-display text-2xl leading-none tabular-nums text-ink">
                    {Number(v || 0).toLocaleString('tr-TR')}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[13px] text-kul">Ziyaretçi verisi şu an alınamadı. Sayfayı yenileyip tekrar deneyin.</p>
          )}
        </Card>
      </div>

      {/* Az kalan stok */}
      <Card
        title="Az kalan stok"
        description={`Aktif ürünlerde ${LOW_STOCK_LIMIT} adet veya daha az kalan seçenekler`}
        padded={false}
        className="scroll-mt-24"
      >
        <div id="az-kalan-stok" className="scroll-mt-24" />
        {data.lowStock.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-5 text-sm text-kul">
            <Check className="h-4 w-4 text-emerald-700" /> Tüm aktif ürünlerde yeterli stok var.
          </div>
        ) : (
          <ul className="divide-y divide-[#F3F0EC]">
            {data.lowStock.slice(0, 12).map(v => (
              <li key={v.id}>
                <Link
                  href={`/admin/urunler/${v.product_id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#FAF9F7] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{v.products?.name || 'Ürün'}</p>
                    <p className="text-[13px] text-kul">{[v.color_name, v.size].filter(Boolean).join(' · ') || 'Standart'}</p>
                  </div>
                  {v.stock_quantity <= 0 ? (
                    <Badge tone="danger">
                      <AlertTriangle className="h-3 w-3" /> Tükendi
                    </Badge>
                  ) : (
                    <Badge tone="warning">{v.stock_quantity} adet</Badge>
                  )}
                </Link>
              </li>
            ))}
            {data.lowStock.length > 12 && (
              <li className="px-5 py-3 text-[13px] text-kul">
                ve {data.lowStock.length - 12} seçenek daha.{' '}
                <Link href="/admin/urunler" className="font-medium text-ink underline">
                  Ürünlere git
                </Link>
              </li>
            )}
          </ul>
        )}
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */

type TodoItem = { icon: ReactNode; count: number; title: string; detail: string; href: string }

function TodoRow({ item }: { item: TodoItem }) {
  const active = item.count > 0
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#FAF9F7] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          active ? 'bg-murdum/10 text-murdum' : 'bg-[#F1EEEA] text-kul'
        }`}
        aria-hidden="true"
      >
        {active ? item.icon : <Check className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${active ? 'font-medium text-ink' : 'text-kul'}`}>
          {active && <span className="mr-1.5 tabular-nums">{item.count}</span>}
          {item.title}
        </p>
        <p className="text-[13px] text-kul">{item.detail}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-kul transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Genel bakış yükleniyor">
      <PageHeader title="Genel bakış" />
      <div className="h-72 animate-pulse rounded-lg border border-[#E7E3DE] bg-white" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-28 animate-pulse rounded-lg border border-[#E7E3DE] bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg border border-[#E7E3DE] bg-white" />
    </div>
  )
}
