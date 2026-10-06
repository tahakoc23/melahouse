'use client'

import { ArrowRight, BellRing, CheckCheck, ExternalLink, Loader2, Package, Tag } from 'lucide-react'
import { Badge, Button, Card, EmptyState } from '@/components/admin/ui'
import { formatDateTime, type SupplierChange } from './types'

const FIELD_LABEL: Record<string, string> = {
  price: 'Alış fiyatı',
  stock_status: 'Stok durumu',
}

export function SupplierChangesTab({
  changes,
  unreadCount,
  loading,
  markingAll,
  onMarkAllRead,
  onRefresh,
}: {
  changes: SupplierChange[]
  unreadCount: number
  loading: boolean
  markingAll: boolean
  onMarkAllRead: () => void
  onRefresh: () => void
}) {
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-kul">
          <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
        </div>
      </Card>
    )
  }

  if (changes.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<BellRing className="h-5 w-5" />}
          title="Henüz değişiklik yok"
          description="Toptancı sitelerinde fiyat ya da stok değiştiğinde burada listelenir. Kontrol için ürünleri güncelleyin."
          action={
            <Button variant="secondary" onClick={onRefresh}>
              Tümünü güncelle
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <Card
      padded={false}
      title="Fiyat ve stok değişiklikleri"
      description={unreadCount > 0 ? `${unreadCount} yeni değişiklik` : 'Tüm değişiklikler görüldü'}
      actions={
        unreadCount > 0 ? (
          <Button size="sm" variant="secondary" onClick={onMarkAllRead} loading={markingAll} icon={<CheckCheck className="h-4 w-4" />}>
            Tümünü okundu say
          </Button>
        ) : undefined
      }
    >
      <ul className="divide-y divide-[#F3F0EC]">
        {changes.map(c => {
          const prod = c.supplier_products
          const unread = !c.is_read
          const isPrice = c.field_changed === 'price'
          return (
            <li key={c.id} className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center ${unread ? 'bg-murdum/[0.04]' : ''}`}>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  aria-hidden
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? 'bg-murdum' : 'bg-transparent'}`}
                />
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F1EEEA] text-kul">
                  {isPrice ? <Tag className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`truncate text-sm ${unread ? 'font-semibold' : 'font-medium'} text-ink`}>{prod?.title || 'Silinmiş ürün'}</p>
                    {unread && <Badge tone="accent">Yeni</Badge>}
                  </div>
                  <p className="text-xs text-kul">
                    {prod?.suppliers?.name ? `${prod.suppliers.name} · ` : ''}
                    {formatDateTime(c.created_at)}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px]">
                    <span className="text-kul">{FIELD_LABEL[c.field_changed] || c.field_changed}:</span>
                    <span className="text-kul line-through">{c.old_value || '—'}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-kul" aria-label="yeni değer" />
                    <span className="font-semibold text-ink">{c.new_value || '—'}</span>
                  </p>
                </div>
              </div>
              {prod?.product_url && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<ExternalLink className="h-3.5 w-3.5" />}
                  onClick={() => window.open(prod.product_url!, '_blank', 'noopener,noreferrer')}
                  className="self-start sm:self-center"
                >
                  Linki aç
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
