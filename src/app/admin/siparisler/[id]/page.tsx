'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { Check, Copy, Mail, PackageCheck, Phone, RotateCcw, Truck, X } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Select, TextArea, TextInput } from '@/components/admin/ui'
import { ConfirmDialog } from '@/components/admin/ui/AdminDialog'
import {
  ORDER_STATUSES,
  ORDER_STATUS_META,
  addressLines,
  addressOf,
  createAdminBrowserClient,
  customerEmailOf,
  customerNameOf,
  customerPhoneOf,
  errorMessage,
  formatDate,
  orderNo,
  parseReturnRequest,
  refreshAdminCounts,
  statusMeta,
  type OrderStatus,
} from '@/components/admin/ui/orderHelpers'
import { formatTL } from '@/lib/utils'

type ProductImage = { image_url: string; is_primary: boolean | null; sort_order: number | null }

type OrderItem = {
  id: string
  product_id: string | null
  product_name: string | null
  variant_info: string | null
  quantity: number | null
  unit_price: number | null
  total_price: number | null
  products: { slug: string | null; product_images: ProductImage[] | null } | null
}

type Order = {
  id: string
  order_number: string | null
  user_id: string | null
  status: string | null
  subtotal: number | null
  shipping_cost: number | null
  total: number | null
  shipping_address: unknown
  billing_address: unknown
  cargo_company: string | null
  cargo_tracking_number: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  order_items: OrderItem[] | null
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null
}

const CARGO_COMPANIES = [
  'Yurtiçi Kargo',
  'Aras Kargo',
  'MNG Kargo',
  'PTT Kargo',
  'Sürat Kargo',
  'Trendyol Express',
  'HepsiJet',
  'Kolay Gelsin',
]

/** Doğal akıştaki bir sonraki adım */
const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string; needsCargo?: boolean }>> = {
  siparis_alindi: { to: 'hazirlaniyor', label: 'Hazırlanıyor olarak işaretle' },
  odeme_alindi: { to: 'hazirlaniyor', label: 'Hazırlanıyor olarak işaretle' },
  hazirlaniyor: { to: 'kargoya_verildi', label: 'Kargoya ver', needsCargo: true },
  kargoya_verildi: { to: 'teslim_edildi', label: 'Teslim edildi olarak işaretle' },
}

function imageOf(item: OrderItem) {
  const imgs = item.products?.product_images || []
  const sorted = [...imgs].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
  return sorted[0]?.image_url || null
}

function statusWarning(from: string | null, to: OrderStatus) {
  if (to === 'iade_edildi' && from !== 'iade_edildi') return 'Siparişteki ürünler otomatik olarak stoğa geri eklenir.'
  if (from === 'iade_edildi' && to !== 'iade_edildi')
    return 'İade sırasında stoğa eklenen ürünler geri düşülmez. Gerekirse stoğu ürün sayfasından düzeltin.'
  if (to === 'iptal_edildi') return 'İptal, stoğu otomatik geri eklemez. Ürün stoğa dönecekse ürün sayfasından artırın.'
  if (to === 'odeme_bekliyor') return 'Bu durumdaki siparişler ciroya sayılmaz.'
  return null
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const supabase = useMemo(() => createAdminBrowserClient(), [])

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Kargo diyaloğu
  const [cargoOpen, setCargoOpen] = useState(false)
  const [cargoMode, setCargoMode] = useState<'ship' | 'edit'>('ship')
  const [cargoCompany, setCargoCompany] = useState(CARGO_COMPANIES[0])
  const [cargoOther, setCargoOther] = useState('')
  const [tracking, setTracking] = useState('')
  const [cargoError, setCargoError] = useState<string | null>(null)

  // Elle durum değiştirme diyaloğu
  const [statusOpen, setStatusOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('hazirlaniyor')

  const load = useCallback(async () => {
    if (!id) return
    const { data, error } = await supabase
      .from('orders')
      .select(
        '*, order_items(id, product_id, product_name, variant_info, quantity, unit_price, total_price, products(slug, product_images(image_url, is_primary, sort_order))), profiles(full_name, email, phone)',
      )
      .eq('id', id)
      .maybeSingle()
    if (error) setLoadError(errorMessage(error, 'Sipariş yüklenemedi.'))
    else if (!data) setLoadError('not-found')
    else {
      const o = data as unknown as Order
      setOrder(o)
      setNotes(o.notes || '')
      setLoadError(null)
    }
    setLoading(false)
  }, [id, supabase])

  // İlk yükleme: load() içindeki setState çağrıları istek tamamlandıktan sonra çalışır
  useEffect(() => {
    const run = () => {
      load().catch(() => {})
    }
    run()
  }, [load])

  /** Siparişi günceller; RLS sessizce reddederse (0 satır) hata verir */
  const updateOrder = async (patch: Partial<Order>, successMsg: string) => {
    if (!order) return false
    setBusy(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', order.id)
        .select('status, cargo_company, cargo_tracking_number, notes, updated_at')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Sipariş güncellenemedi. Sayfayı yenileyip tekrar deneyin.')
      setOrder(prev => (prev ? { ...prev, ...(data[0] as Partial<Order>) } : prev))
      toast.success(successMsg)
      refreshAdminCounts()
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Sipariş güncellenemedi.'))
      return false
    } finally {
      setBusy(false)
    }
  }

  const openCargo = (mode: 'ship' | 'edit') => {
    if (!order) return
    const current = order.cargo_company || ''
    if (current && !CARGO_COMPANIES.includes(current)) {
      setCargoCompany('__other')
      setCargoOther(current)
    } else {
      setCargoCompany(current || CARGO_COMPANIES[0])
      setCargoOther('')
    }
    setTracking(order.cargo_tracking_number || '')
    setCargoError(null)
    setCargoMode(mode)
    setCargoOpen(true)
  }

  const submitCargo = async () => {
    const company = cargoCompany === '__other' ? cargoOther.trim() : cargoCompany
    if (!company) return setCargoError('Kargo firmasının adını yazın.')
    if (!tracking.trim()) return setCargoError('Takip numarasını girin. Müşteri kargosunu bu numarayla izler.')
    const patch: Partial<Order> = { cargo_company: company, cargo_tracking_number: tracking.trim() }
    if (cargoMode === 'ship') patch.status = 'kargoya_verildi'
    const ok = await updateOrder(patch, cargoMode === 'ship' ? 'Sipariş kargoya verildi olarak kaydedildi.' : 'Kargo bilgisi güncellendi.')
    if (ok) setCargoOpen(false)
  }

  const runNextStep = () => {
    if (!order) return
    const step = NEXT_STEP[order.status as OrderStatus]
    if (!step) return
    if (step.needsCargo) return openCargo('ship')
    updateOrder({ status: step.to }, `Sipariş "${ORDER_STATUS_META[step.to].label}" olarak işaretlendi.`)
  }

  const submitStatus = async () => {
    if (!order) return
    if (targetStatus === 'kargoya_verildi' && !order.cargo_tracking_number) {
      setStatusOpen(false)
      openCargo('ship')
      return
    }
    const ok = await updateOrder({ status: targetStatus }, `Durum "${ORDER_STATUS_META[targetStatus].label}" olarak değiştirildi.`)
    if (ok) setStatusOpen(false)
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    await updateOrder({ notes: notes.trim() || null }, 'Not kaydedildi.')
    setSavingNotes(false)
  }

  const copyAddress = async (lines: string[]) => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast.success('Adres kopyalandı.')
    } catch {
      toast.error('Adres kopyalanamadı. Metni seçip elle kopyalayın.')
    }
  }

  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Sipariş yükleniyor">
        <div className="mb-6 h-9 w-64 animate-pulse rounded bg-[#ECE8E3]" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-72 animate-pulse rounded-lg bg-white lg:col-span-2" />
          <div className="h-72 animate-pulse rounded-lg bg-white" />
        </div>
      </div>
    )
  }

  if (loadError || !order) {
    return (
      <div>
        <PageHeader title="Sipariş" back={{ href: '/admin/siparisler', label: 'Siparişler' }} />
        <Card>
          <EmptyState
            title={loadError === 'not-found' ? 'Sipariş bulunamadı' : 'Sipariş yüklenemedi'}
            description={
              loadError === 'not-found'
                ? 'Bu sipariş silinmiş ya da bağlantı hatalı olabilir. Sipariş listesine dönüp tekrar seçin.'
                : loadError || undefined
            }
            action={<Button href="/admin/siparisler">Siparişlere dön</Button>}
          />
        </Card>
      </div>
    )
  }

  const status = order.status as OrderStatus
  const meta = statusMeta(order.status)
  const next = NEXT_STEP[status]
  const items = order.order_items || []
  const subtotal = Number(order.subtotal ?? items.reduce((s, i) => s + Number(i.total_price ?? (i.unit_price || 0) * (i.quantity || 1)), 0))
  const shipping = Number(order.shipping_cost ?? 0)
  const shipLines = addressLines(order.shipping_address)
  const billLines = addressLines(order.billing_address)
  const showBilling = billLines.length > 0 && billLines.join('|') !== shipLines.join('|')
  const returnReq = parseReturnRequest(order.notes)
  const email = customerEmailOf(order)
  const phone = customerPhoneOf(order)
  const warning = statusWarning(order.status, targetStatus)
  const notesDirty = (notes.trim() || '') !== (order.notes || '').trim()

  return (
    <div>
      <PageHeader
        title={`Sipariş ${orderNo(order)}`}
        description={`${formatDate(order.created_at, true)} tarihinde verildi`}
        back={{ href: '/admin/siparisler', label: 'Siparişler' }}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Sağ sütun (mobilde üstte): durum */}
        <div className="order-first space-y-6 lg:order-last">
          <Card title="Durum">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={meta.tone} className="text-[13px]">
                {meta.label}
              </Badge>
            </div>
            {meta.hint && <p className="mt-2 text-[13px] text-kul">{meta.hint}</p>}

            {status === 'odeme_bekliyor' && (
              <div className="mt-4">
                <Notice tone="warning">
                  Ödeme gelirse sipariş kendiliğinden Hazırlanıyor durumuna geçer. Bu sırada hazırlamaya başlamayın.
                </Notice>
              </div>
            )}

            {status === 'iade_talebi' && (
              <div className="mt-4 space-y-3">
                {returnReq && (
                  <Notice tone="warning" title="İade nedeni">
                    {returnReq.reason}
                    {returnReq.explanation && <span className="mt-1 block">{returnReq.explanation}</span>}
                  </Notice>
                )}
                <Button href="/admin/iadeler" className="w-full" icon={<RotateCcw className="h-4 w-4" />}>
                  İade talebini incele
                </Button>
              </div>
            )}

            {next && (
              <Button
                className="mt-4 w-full"
                onClick={runNextStep}
                loading={busy && !cargoOpen && !statusOpen}
                icon={next.needsCargo ? <Truck className="h-4 w-4" /> : next.to === 'teslim_edildi' ? <PackageCheck className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              >
                {next.label}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                setTargetStatus(status && ORDER_STATUSES.includes(status) ? status : 'hazirlaniyor')
                setStatusOpen(true)
              }}
            >
              Durumu elle değiştir
            </Button>

            {(order.cargo_company || order.cargo_tracking_number) && (
              <div className="mt-4 rounded-md border border-[#EFEBE6] bg-[#FAF9F7] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-kul">Kargo</p>
                    <p className="text-sm font-medium">{order.cargo_company || 'Firma girilmedi'}</p>
                    <p className="break-all text-[13px] tabular-nums text-ink">{order.cargo_tracking_number || 'Takip no girilmedi'}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openCargo('edit')}>
                    Düzenle
                  </Button>
                </div>
              </div>
            )}

            <Timeline order={order} />
          </Card>

          <Card title="Müşteri">
            <p className="font-medium">{customerNameOf(order)}</p>
            <div className="mt-2 space-y-1.5 text-[13px]">
              {email ? (
                <a href={`mailto:${email}`} className="flex items-center gap-2 break-all text-ink hover:underline">
                  <Mail className="h-4 w-4 shrink-0 text-kul" />
                  {email}
                </a>
              ) : (
                <p className="text-kul">E-posta yok</p>
              )}
              {phone && phone !== '-' && (
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-ink hover:underline">
                  <Phone className="h-4 w-4 shrink-0 text-kul" />
                  {phone}
                </a>
              )}
            </div>
            {!order.user_id && <p className="mt-2 text-xs text-kul">Misafir sipariş</p>}
          </Card>
        </div>

        {/* Sol sütun */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="Ürünler" description={`${items.reduce((s, i) => s + (i.quantity || 0), 0)} ürün`} padded={false}>
            <ul>
              {items.map(item => {
                const img = imageOf(item)
                const line = Number(item.total_price ?? (item.unit_price || 0) * (item.quantity || 1))
                return (
                  <li key={item.id} className="flex items-center gap-4 border-b border-[#F3F0EC] px-5 py-4 last:border-0">
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-[#F1EEEA]">
                      {img && <Image src={img} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.product_id ? (
                        <Link href={`/admin/urunler/${item.product_id}`} className="font-medium hover:underline">
                          {item.product_name || 'Ürün'}
                        </Link>
                      ) : (
                        <p className="font-medium">{item.product_name || 'Ürün (silinmiş)'}</p>
                      )}
                      {item.variant_info && <p className="text-[13px] text-kul">{item.variant_info}</p>}
                      <p className="text-[13px] text-kul tabular-nums">
                        {item.quantity} × {formatTL(item.unit_price)}
                      </p>
                    </div>
                    <p className="whitespace-nowrap font-medium tabular-nums">{formatTL(line)}</p>
                  </li>
                )
              })}
              {items.length === 0 && <li className="px-5 py-6 text-kul">Bu siparişte ürün kaydı yok.</li>}
            </ul>
            <dl className="space-y-1.5 border-t border-[#EFEBE6] bg-[#FAF9F7] px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-kul">Ara toplam</dt>
                <dd className="tabular-nums">{formatTL(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-kul">Kargo</dt>
                <dd className="tabular-nums">{shipping === 0 ? 'Ücretsiz' : formatTL(shipping)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-[15px] font-semibold">
                <dt>Toplam</dt>
                <dd className="tabular-nums">{formatTL(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <div className={`grid gap-6 ${showBilling ? 'md:grid-cols-2' : ''}`}>
            <Card
              title="Teslimat adresi"
              actions={
                shipLines.length > 0 ? (
                  <Button variant="ghost" size="sm" icon={<Copy className="h-4 w-4" />} onClick={() => copyAddress(shipLines)}>
                    Kopyala
                  </Button>
                ) : undefined
              }
            >
              {shipLines.length > 0 ? (
                <address className="space-y-0.5 not-italic">
                  {shipLines.map((l, i) => (
                    <p key={i} className={i === 0 ? 'font-medium' : 'text-[13px] text-ink'}>
                      {l}
                    </p>
                  ))}
                </address>
              ) : (
                <p className="text-kul">Adres girilmemiş.</p>
              )}
              {addressOf(order.shipping_address)?.email && (
                <p className="mt-2 text-[13px] text-kul">{addressOf(order.shipping_address)?.email}</p>
              )}
            </Card>
            {showBilling && (
              <Card title="Fatura adresi">
                <address className="space-y-0.5 not-italic">
                  {billLines.map((l, i) => (
                    <p key={i} className={i === 0 ? 'font-medium' : 'text-[13px]'}>
                      {l}
                    </p>
                  ))}
                </address>
              </Card>
            )}
          </div>

          <Card title="Notlar" description="Müşterinin sipariş notu ve iade nedeni de burada tutulur. Müşteri bu alanı görmez.">
            <TextArea
              aria-label="Sipariş notları"
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Örn. Hediye paketi yapılacak"
            />
            <div className="mt-3 flex justify-end gap-2">
              {notesDirty && (
                <Button variant="ghost" size="sm" onClick={() => setNotes(order.notes || '')} disabled={savingNotes}>
                  Geri al
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={saveNotes} loading={savingNotes} disabled={!notesDirty}>
                Notu kaydet
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Kargo diyaloğu */}
      <ConfirmDialog
        open={cargoOpen}
        onClose={() => setCargoOpen(false)}
        onConfirm={submitCargo}
        loading={busy}
        title={cargoMode === 'ship' ? 'Kargoya ver' : 'Kargo bilgisini düzenle'}
        message={cargoMode === 'ship' ? 'Takip numarası müşterinin sipariş sayfasında görünür.' : undefined}
        confirmLabel={cargoMode === 'ship' ? 'Kargoya verildi olarak kaydet' : 'Kargo bilgisini kaydet'}
      >
        <form
          className="space-y-4 pb-2"
          onSubmit={e => {
            e.preventDefault()
            submitCargo()
          }}
        >
          <Select label="Kargo firması" value={cargoCompany} onChange={e => setCargoCompany(e.target.value)} required>
            {CARGO_COMPANIES.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__other">Diğer</option>
          </Select>
          {cargoCompany === '__other' && (
            <TextInput label="Firma adı" value={cargoOther} onChange={e => setCargoOther(e.target.value)} required />
          )}
          <TextInput
            label="Takip numarası"
            value={tracking}
            onChange={e => setTracking(e.target.value)}
            inputMode="text"
            autoComplete="off"
            required
            data-autofocus
            error={cargoError}
          />
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </ConfirmDialog>

      {/* Elle durum değiştirme */}
      <ConfirmDialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={submitStatus}
        loading={busy}
        confirmDisabled={targetStatus === order.status}
        title="Durumu değiştir"
        message="Normal akış dışında bir durum seçmeniz gerektiğinde kullanın."
        confirmLabel={
          targetStatus === 'kargoya_verildi' && !order.cargo_tracking_number ? 'Devam et' : 'Durumu kaydet'
        }
      >
        <div className="space-y-3 pb-2">
          <Select label="Yeni durum" value={targetStatus} onChange={e => setTargetStatus(e.target.value as OrderStatus)}>
            {ORDER_STATUSES.map(s => (
              <option key={s} value={s}>
                {ORDER_STATUS_META[s].label}
                {s === order.status ? ' (şu anki)' : ''}
              </option>
            ))}
          </Select>
          {targetStatus !== order.status && warning && <Notice tone="warning">{warning}</Notice>}
          {targetStatus === 'kargoya_verildi' && !order.cargo_tracking_number && (
            <p className="text-[13px] text-kul">Sonraki adımda kargo firması ve takip numarasını gireceksiniz.</p>
          )}
        </div>
      </ConfirmDialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const FLOW: { key: OrderStatus; label: string }[] = [
  { key: 'siparis_alindi', label: 'Sipariş alındı' },
  { key: 'hazirlaniyor', label: 'Hazırlanıyor' },
  { key: 'kargoya_verildi', label: 'Kargoya verildi' },
  { key: 'teslim_edildi', label: 'Teslim edildi' },
]

const RANK: Partial<Record<OrderStatus, number>> = {
  odeme_bekliyor: 0,
  siparis_alindi: 1,
  odeme_alindi: 1,
  hazirlaniyor: 2,
  kargoya_verildi: 3,
  teslim_edildi: 4,
  iade_talebi: 4,
  iade_edildi: 4,
}

function Timeline({ order }: { order: Order }) {
  const status = order.status as OrderStatus
  const cancelled = status === 'iptal_edildi'
  const rank = RANK[status] ?? 0

  type Step = { label: string; state: 'done' | 'current' | 'todo' | 'stopped'; date?: string }
  const steps: Step[] = FLOW.map((s, i) => {
    const n = i + 1
    let state: Step['state'] = n < rank ? 'done' : n === rank ? 'current' : 'todo'
    if (cancelled) state = 'todo'
    if (status === 'teslim_edildi' || status === 'iade_talebi' || status === 'iade_edildi') state = 'done'
    const label = i === 0 && status === 'odeme_bekliyor' ? 'Ödeme bekleniyor' : s.label
    const date = i === 0 ? order.created_at ?? undefined : undefined
    return { label, state: i === 0 && status === 'odeme_bekliyor' ? 'current' : state, date }
  })
  if (status === 'iade_talebi') steps.push({ label: 'İade talebi', state: 'current' })
  if (status === 'iade_edildi') {
    steps.push({ label: 'İade talebi', state: 'done' })
    steps.push({ label: 'İade edildi', state: 'current' })
  }
  if (cancelled) steps.push({ label: 'İptal edildi', state: 'stopped' })

  return (
    <ol className="mt-5 border-t border-[#EFEBE6] pt-4" aria-label="Sipariş geçmişi">
      {steps.map((s, i) => {
        const last = i === steps.length - 1
        return (
          <li key={s.label + i} className="relative flex gap-3 pb-4 last:pb-0">
            {!last && (
              <span
                className={`absolute left-[9px] top-5 h-[calc(100%-12px)] w-px ${s.state === 'done' ? 'bg-murdum' : 'bg-[#E7E3DE]'}`}
                aria-hidden="true"
              />
            )}
            <span
              className={[
                'relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border',
                s.state === 'done' && 'border-murdum bg-murdum text-white',
                s.state === 'current' && 'border-murdum bg-white',
                s.state === 'todo' && 'border-[#DCD6CF] bg-white',
                s.state === 'stopped' && 'border-rose-700 bg-rose-700 text-white',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            >
              {s.state === 'done' && <Check className="h-3 w-3" />}
              {s.state === 'current' && <span className="h-2 w-2 rounded-full bg-murdum" />}
              {s.state === 'stopped' && <X className="h-3 w-3" />}
            </span>
            <div className="min-w-0">
              <p className={`text-sm ${s.state === 'todo' ? 'text-kul' : 'font-medium text-ink'}`}>
                {s.label}
                <span className="sr-only">
                  {s.state === 'done' ? ' (tamamlandı)' : s.state === 'current' ? ' (şu anki adım)' : s.state === 'todo' ? ' (bekliyor)' : ''}
                </span>
              </p>
              {s.date && <p className="text-xs text-kul">{formatDate(s.date, true)}</p>}
            </div>
          </li>
        )
      })}
      {order.updated_at && order.updated_at !== order.created_at && (
        <li className="mt-3 text-xs text-kul">Son güncelleme: {formatDate(order.updated_at, true)}</li>
      )}
    </ol>
  )
}
