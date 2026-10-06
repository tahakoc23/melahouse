'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, Search, ShoppingBag } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Table, Tabs, Td, TextInput, Th } from '@/components/admin/ui'
import {
  createAdminBrowserClient,
  customerEmailOf,
  customerNameOf,
  errorMessage,
  formatDate,
  orderNo,
  statusMeta,
  type OrderStatus,
} from '@/components/admin/ui/orderHelpers'
import { formatTL } from '@/lib/utils'

type OrderRow = {
  id: string
  order_number: string | null
  status: string | null
  total: number | null
  created_at: string | null
  shipping_address: unknown
  profiles: { full_name: string | null; email: string | null } | null
  order_items: { quantity: number | null }[] | null
}

type TabKey = 'tumu' | 'yeni' | 'hazirlaniyor' | 'kargoda' | 'teslim' | 'odeme' | 'iptal'

const TAB_STATUSES: Record<Exclude<TabKey, 'tumu'>, OrderStatus[]> = {
  yeni: ['siparis_alindi', 'odeme_alindi'],
  hazirlaniyor: ['hazirlaniyor'],
  kargoda: ['kargoya_verildi'],
  teslim: ['teslim_edildi'],
  odeme: ['odeme_bekliyor'],
  iptal: ['iptal_edildi', 'iade_talebi', 'iade_edildi'],
}

const TAB_LABELS: Record<TabKey, string> = {
  tumu: 'Tümü',
  yeni: 'Yeni',
  hazirlaniyor: 'Hazırlanıyor',
  kargoda: 'Kargoda',
  teslim: 'Teslim edildi',
  odeme: 'Ödeme bekliyor',
  iptal: 'İptal / iade',
}

const TAB_ORDER: TabKey[] = ['tumu', 'yeni', 'hazirlaniyor', 'kargoda', 'teslim', 'odeme', 'iptal']

const EMPTY_TEXT: Record<TabKey, string> = {
  tumu: 'Henüz sipariş yok. İlk sipariş geldiğinde burada görünecek.',
  yeni: 'Hazırlanmayı bekleyen yeni sipariş yok.',
  hazirlaniyor: 'Şu an hazırlanan sipariş yok.',
  kargoda: 'Kargoda bekleyen sipariş yok.',
  teslim: 'Teslim edilmiş sipariş yok.',
  odeme: 'Ödemesi beklenen kart siparişi yok.',
  iptal: 'İptal edilen veya iade edilen sipariş yok.',
}

const PAGE_SIZE = 50

function matchesTab(status: string | null, tab: TabKey) {
  if (tab === 'tumu') return true
  return TAB_STATUSES[tab].includes(status as OrderStatus)
}

function itemCount(o: OrderRow) {
  return (o.order_items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0)
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersList />
    </Suspense>
  )
}

function OrdersList() {
  const supabase = useMemo(() => createAdminBrowserClient(), [])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const paramTab = searchParams.get('durum') as TabKey | null
  const tab: TabKey = paramTab && TAB_ORDER.includes(paramTab) ? paramTab : 'tumu'

  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at, shipping_address, profiles(full_name, email), order_items(quantity)')
      .order('created_at', { ascending: false })
    if (err) {
      setError(errorMessage(err, 'Siparişler yüklenemedi.'))
    } else {
      setOrders((data || []) as unknown as OrderRow[])
      setError(null)
    }
    setLoading(false)
  }, [supabase])

  // İlk yükleme: load() içindeki setState çağrıları istek tamamlandıktan sonra çalışır
  useEffect(() => {
    const run = () => {
      load().catch(() => {})
    }
    run()
  }, [load])

  const setTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'tumu') params.delete('durum')
    else params.set('durum', next)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    setVisible(PAGE_SIZE)
  }

  const searched = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr')
    if (!q) return orders
    return orders.filter(o =>
      [orderNo(o), customerNameOf(o), customerEmailOf(o)].some(v => v.toLocaleLowerCase('tr').includes(q)),
    )
  }, [orders, query])

  const tabs = TAB_ORDER.map(t => ({
    value: t,
    label: TAB_LABELS[t],
    count: searched.filter(o => matchesTab(o.status, t)).length,
  }))

  const filtered = searched.filter(o => matchesTab(o.status, tab))
  const shown = filtered.slice(0, visible)

  return (
    <div>
      <PageHeader
        title="Siparişler"
        description={loading ? undefined : `${orders.length} sipariş`}
      />

      <div className="mb-4 max-w-md">
        <TextInput
          type="search"
          aria-label="Siparişlerde ara"
          placeholder="Sipariş no, müşteri adı veya e-posta"
          prefix={<Search className="h-4 w-4" />}
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setVisible(PAGE_SIZE)
          }}
        />
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {error && (
        <div className="mb-4">
          <Notice tone="danger" title="Siparişler yüklenemedi">
            <p>{error}</p>
            <button type="button" className="mt-1 font-medium underline" onClick={() => { setLoading(true); load() }}>
              Tekrar dene
            </button>
          </Notice>
        </div>
      )}

      {loading ? (
        <OrdersSkeleton bare />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ShoppingBag className="h-5 w-5" />}
            title={query ? 'Aramanızla eşleşen sipariş yok' : 'Bu listede sipariş yok'}
            description={query ? 'Sipariş numarasını veya müşteri adını kontrol edin ya da aramayı temizleyin.' : EMPTY_TEXT[tab]}
            action={
              query ? (
                <Button variant="secondary" onClick={() => setQuery('')}>
                  Aramayı temizle
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          {/* Masaüstü: tablo */}
          <Card padded={false} className="hidden md:block">
            <Table>
              <thead>
                <tr>
                  <Th>Sipariş no</Th>
                  <Th>Tarih</Th>
                  <Th>Müşteri</Th>
                  <Th className="text-right">Ürün</Th>
                  <Th className="text-right">Tutar</Th>
                  <Th>Durum</Th>
                  <Th className="w-10">
                    <span className="sr-only">Detay</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {shown.map(o => {
                  const meta = statusMeta(o.status)
                  return (
                    <tr
                      key={o.id}
                      className="cursor-pointer transition-colors hover:bg-[#FAF9F7]"
                      onClick={() => router.push(`/admin/siparisler/${o.id}`)}
                    >
                      <Td>
                        <Link
                          href={`/admin/siparisler/${o.id}`}
                          onClick={e => e.stopPropagation()}
                          className="font-medium tabular-nums text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
                        >
                          {orderNo(o)}
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap text-kul">{formatDate(o.created_at, true)}</Td>
                      <Td>
                        <p className="max-w-[14rem] truncate">{customerNameOf(o)}</p>
                        {customerEmailOf(o) && <p className="max-w-[14rem] truncate text-xs text-kul">{customerEmailOf(o)}</p>}
                      </Td>
                      <Td className="text-right tabular-nums text-kul">{itemCount(o)}</Td>
                      <Td className="whitespace-nowrap text-right font-medium tabular-nums">{formatTL(o.total)}</Td>
                      <Td>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </Td>
                      <Td className="text-kul">
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </Card>

          {/* Mobil: kart listesi */}
          <ul className="space-y-2 md:hidden">
            {shown.map(o => {
              const meta = statusMeta(o.status)
              return (
                <li key={o.id}>
                  <Link
                    href={`/admin/siparisler/${o.id}`}
                    className="block rounded-lg border border-[#E7E3DE] bg-white p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium tabular-nums">{orderNo(o)}</p>
                        <p className="truncate text-[13px] text-kul">{customerNameOf(o)}</p>
                      </div>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[13px]">
                      <span className="text-kul">
                        {formatDate(o.created_at)} · {itemCount(o)} ürün
                      </span>
                      <span className="font-medium tabular-nums text-ink">{formatTL(o.total)}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          {filtered.length > visible && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-[13px] text-kul">
                {filtered.length} siparişten {visible} tanesi gösteriliyor
              </span>
              <Button variant="secondary" size="sm" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                Daha fazla göster
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function OrdersSkeleton({ bare = false }: { bare?: boolean }) {
  const rows = (
    <div className="rounded-lg border border-[#E7E3DE] bg-white" aria-busy="true" aria-label="Siparişler yükleniyor">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-[#F3F0EC] px-4 py-4 last:border-0">
          <div className="h-4 w-28 animate-pulse rounded bg-[#F1EEEA]" />
          <div className="h-4 w-24 animate-pulse rounded bg-[#F1EEEA]" />
          <div className="h-4 flex-1 animate-pulse rounded bg-[#F1EEEA]" />
          <div className="h-4 w-20 animate-pulse rounded bg-[#F1EEEA]" />
        </div>
      ))}
    </div>
  )
  if (bare) return rows
  return (
    <div>
      <PageHeader title="Siparişler" />
      {rows}
    </div>
  )
}
