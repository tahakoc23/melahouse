'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Check, Mail, Phone, RotateCcw, Search, X } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Tabs, TextArea, TextInput } from '@/components/admin/ui'
import { ConfirmDialog } from '@/components/admin/ui/AdminDialog'
import {
  createAdminBrowserClient,
  customerEmailOf,
  customerNameOf,
  customerPhoneOf,
  errorMessage,
  formatDate,
  orderNo,
  parseReturnRequest,
  refreshAdminCounts,
} from '@/components/admin/ui/orderHelpers'
import { formatTL } from '@/lib/utils'

type ReturnItem = {
  id: string
  product_name: string | null
  variant_info: string | null
  quantity: number | null
  unit_price: number | null
  total_price: number | null
  products: { name: string | null; product_images: { image_url: string; is_primary: boolean | null }[] | null } | null
}

type ReturnOrder = {
  id: string
  order_number: string | null
  status: string | null
  total: number | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  shipping_address: unknown
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null
  order_items: ReturnItem[] | null
}

type TabKey = 'bekleyen' | 'tamamlanan'

const REJECT_MAX = 300

export default function AdminReturnsPage() {
  const supabase = useMemo(() => createAdminBrowserClient(), [])
  const [orders, setOrders] = useState<ReturnOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('bekleyen')
  const [query, setQuery] = useState('')

  const [approveTarget, setApproveTarget] = useState<ReturnOrder | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ReturnOrder | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/returns', { cache: 'no-store' })
      const data = (await res.json().catch(() => ({}))) as { orders?: ReturnOrder[]; error?: string }
      if (!res.ok) throw new Error(data.error || 'İade talepleri alınamadı.')
      setOrders(data.orders || [])
      setError(null)
    } catch (err) {
      setError(errorMessage(err, 'İade talepleri alınamadı.'))
    } finally {
      setLoading(false)
    }
  }, [])

  // İlk yükleme: load() içindeki setState çağrıları istek tamamlandıktan sonra çalışır
  useEffect(() => {
    const run = () => {
      load().catch(() => {})
    }
    run()
  }, [load])

  const approve = async () => {
    if (!approveTarget) return
    setWorking(true)
    try {
      const res = await fetch('/api/admin/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: approveTarget.id }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'İade onaylanamadı.')
      const now = new Date().toISOString()
      setOrders(prev => prev.map(o => (o.id === approveTarget.id ? { ...o, status: 'iade_edildi', updated_at: now } : o)))
      toast.success(`${orderNo(approveTarget)} iadesi onaylandı. Ürünler stoğa eklendi.`)
      setApproveTarget(null)
      refreshAdminCounts()
    } catch (err) {
      toast.error(errorMessage(err, 'İade onaylanamadı. Sayfayı yenileyip tekrar deneyin.'))
    } finally {
      setWorking(false)
    }
  }

  const openReject = (o: ReturnOrder) => {
    setRejectTarget(o)
    setRejectReason('')
    setRejectError(null)
  }

  const reject = async () => {
    if (!rejectTarget) return
    const reason = rejectReason.trim()
    if (!reason) {
      setRejectError('Kısa bir neden yazın. Örn. "İade süresi geçmiş".')
      return
    }
    setWorking(true)
    try {
      const line = `[İADE REDDEDİLDİ] Nedeni: ${reason}`
      const notes = rejectTarget.notes ? `${rejectTarget.notes}\n${line}` : line
      const { data, error: err } = await supabase
        .from('orders')
        .update({ status: 'teslim_edildi', notes, updated_at: new Date().toISOString() })
        .eq('id', rejectTarget.id)
        .eq('status', 'iade_talebi')
        .select('id')
      if (err) throw err
      if (!data || data.length === 0) throw new Error('Bu talep artık beklemede değil. Sayfayı yenileyin.')
      setOrders(prev => prev.filter(o => o.id !== rejectTarget.id))
      toast.success(`${orderNo(rejectTarget)} iade talebi reddedildi.`)
      setRejectTarget(null)
      refreshAdminCounts()
    } catch (err) {
      toast.error(errorMessage(err, 'İade talebi reddedilemedi.'))
    } finally {
      setWorking(false)
    }
  }

  const searched = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr')
    if (!q) return orders
    return orders.filter(o => [orderNo(o), customerNameOf(o), customerEmailOf(o)].some(v => v.toLocaleLowerCase('tr').includes(q)))
  }, [orders, query])

  const pending = searched.filter(o => o.status === 'iade_talebi')
  const done = searched.filter(o => o.status === 'iade_edildi')
  const list = tab === 'bekleyen' ? pending : done

  return (
    <div>
      <PageHeader title="İadeler" description="Müşterilerin iade taleplerini onaylayın veya reddedin." />

      <div className="mb-4 max-w-md">
        <TextInput
          type="search"
          aria-label="İadelerde ara"
          placeholder="Sipariş no, müşteri adı veya e-posta"
          prefix={<Search className="h-4 w-4" />}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <Tabs
        tabs={[
          { value: 'bekleyen' as TabKey, label: 'Bekleyen', count: pending.length },
          { value: 'tamamlanan' as TabKey, label: 'Tamamlanan', count: done.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      {error && (
        <div className="mb-4">
          <Notice tone="danger" title="İadeler yüklenemedi">
            <p>{error}</p>
            <button
              type="button"
              className="mt-1 font-medium underline"
              onClick={() => {
                setLoading(true)
                load()
              }}
            >
              Tekrar dene
            </button>
          </Notice>
        </div>
      )}

      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="İadeler yükleniyor">
          {[0, 1].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-lg border border-[#E7E3DE] bg-white" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<RotateCcw className="h-5 w-5" />}
            title={query ? 'Aramanızla eşleşen iade yok' : tab === 'bekleyen' ? 'Bekleyen iade talebi yok' : 'Tamamlanmış iade yok'}
            description={
              query
                ? 'Sipariş numarasını veya müşteri adını kontrol edin.'
                : tab === 'bekleyen'
                  ? 'Müşteri bir iade talebi gönderdiğinde burada görünecek.'
                  : 'Onayladığınız iadeler burada listelenir.'
            }
          />
        </Card>
      ) : (
        <ul className="space-y-4">
          {list.map(o => (
            <li key={o.id}>
              <ReturnCard order={o} onApprove={() => setApproveTarget(o)} onReject={() => openReject(o)} />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={approve}
        loading={working}
        title={approveTarget ? `${orderNo(approveTarget)} iadesini onayla` : 'İadeyi onayla'}
        message="Sipariş İade edildi durumuna geçer ve ürünler stoğa geri eklenir."
        confirmLabel="İadeyi onayla"
      >
        {approveTarget && (
          <div className="pb-2">
            <Notice tone="info">
              Para iadesi otomatik yapılmaz. {formatTL(approveTarget.total)} tutarını müşteriye ödeme yönteminden ayrıca iade edin.
            </Notice>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={reject}
        loading={working}
        tone="danger"
        title={rejectTarget ? `${orderNo(rejectTarget)} iade talebini reddet` : 'İade talebini reddet'}
        message="Sipariş Teslim edildi durumuna döner. Neden, sipariş notlarına eklenir; müşteri bu notu görmez, ayrıca bilgilendirin."
        confirmLabel="Talebi reddet"
      >
        <div className="pb-2">
          <TextArea
            label="Ret nedeni"
            rows={3}
            maxLength={REJECT_MAX}
            value={rejectReason}
            onChange={e => {
              setRejectReason(e.target.value)
              if (rejectError) setRejectError(null)
            }}
            placeholder="Örn. Ürün kullanılmış olarak geldi"
            hint={`${rejectReason.length}/${REJECT_MAX}`}
            error={rejectError}
            required
            data-autofocus
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}

function ReturnCard({ order, onApprove, onReject }: { order: ReturnOrder; onApprove: () => void; onReject: () => void }) {
  const pending = order.status === 'iade_talebi'
  const req = parseReturnRequest(order.notes)
  const email = customerEmailOf(order)
  const phone = customerPhoneOf(order)
  const items = order.order_items || []

  return (
    <article className="rounded-lg border border-[#E7E3DE] bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EFEBE6] px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/siparisler/${order.id}`} className="font-semibold tabular-nums text-ink hover:underline">
              {orderNo(order)}
            </Link>
            {pending ? <Badge tone="warning">Onay bekliyor</Badge> : <Badge tone="success">İade tamamlandı</Badge>}
          </div>
          <p className="mt-0.5 text-[13px] text-kul">
            {pending ? 'Talep' : 'Onay'}: {formatDate(order.updated_at, true)} · Sipariş: {formatDate(order.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-kul">İade tutarı</p>
          <p className="text-[15px] font-semibold tabular-nums">{formatTL(order.total)}</p>
        </div>
      </header>

      <div className="grid gap-5 px-5 py-4 md:grid-cols-3">
        <div className="space-y-1 text-[13px]">
          <p className="text-xs text-kul">Müşteri</p>
          <p className="text-sm font-medium">{customerNameOf(order)}</p>
          {email && (
            <a href={`mailto:${email}`} className="flex items-center gap-1.5 break-all hover:underline">
              <Mail className="h-3.5 w-3.5 shrink-0 text-kul" />
              {email}
            </a>
          )}
          {phone && phone !== '-' && (
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:underline">
              <Phone className="h-3.5 w-3.5 shrink-0 text-kul" />
              {phone}
            </a>
          )}
        </div>

        <div className="md:col-span-2">
          <p className="text-xs text-kul">İade nedeni</p>
          {req ? (
            <>
              <p className="text-sm font-medium">{req.reason || 'Belirtilmemiş'}</p>
              {req.explanation && <p className="mt-0.5 whitespace-pre-line text-[13px] text-ink">{req.explanation}</p>}
            </>
          ) : (
            <p className="text-sm text-kul">Müşteri neden belirtmemiş.</p>
          )}
        </div>
      </div>

      <ul className="border-t border-[#EFEBE6]">
        {items.map(item => {
          const img =
            item.products?.product_images?.find(i => i.is_primary)?.image_url || item.products?.product_images?.[0]?.image_url
          return (
            <li key={item.id} className="flex items-center gap-3 border-b border-[#F3F0EC] px-5 py-3 last:border-0">
              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-[#F1EEEA]">
                {img && <Image src={img} alt="" fill sizes="40px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.product_name || item.products?.name || 'Ürün'}</p>
                <p className="text-[13px] text-kul">
                  {[item.variant_info, `${item.quantity} adet`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <p className="whitespace-nowrap tabular-nums">
                {formatTL(item.total_price ?? (item.unit_price || 0) * (item.quantity || 1))}
              </p>
            </li>
          )
        })}
      </ul>

      {pending && (
        <footer className="flex flex-col-reverse gap-2 border-t border-[#EFEBE6] bg-[#FAF9F7] px-5 py-3 sm:flex-row sm:justify-end">
          <Button variant="danger" onClick={onReject} icon={<X className="h-4 w-4" />}>
            Reddet
          </Button>
          <Button onClick={onApprove} icon={<Check className="h-4 w-4" />}>
            İadeyi onayla
          </Button>
        </footer>
      )}
    </article>
  )
}
