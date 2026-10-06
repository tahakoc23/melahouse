'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ExternalLink, ImageOff, LineChart, Loader2, Package, Pencil, Plus, RefreshCw, Search, Store, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Select, Table, Td, Th } from '@/components/admin/ui'
import { SiteRowMenu, type SiteRowMenuItem } from '@/components/admin/ui/SiteRowMenu'
import { formatTL } from '@/lib/utils'
import { cleanText, formatDateTime, isUnverifiedPrice, metaText, sizesOf, toNumber, urlIssue, type Supplier, type SupplierProduct } from './types'

type Filter = 'all' | 'attention' | 'out' | 'not_in_store'

export interface ProductRowActions {
  onEdit: (p: SupplierProduct) => void
  onDelete: (p: SupplierProduct) => void
  onResearch: (p: SupplierProduct) => void
  onRescan: (p: SupplierProduct) => void
}

function needsAttention(p: SupplierProduct) {
  return isUnverifiedPrice(p) || !!urlIssue(p.product_url) || toNumber(p.price) <= 0
}

function Thumb({ p }: { p: SupplierProduct }) {
  return (
    <div className="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded border border-[#E7E3DE] bg-[#F7F6F4]">
      {p.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <ImageOff className="h-4 w-4 text-kul" aria-label="Görsel yok" />
      )}
    </div>
  )
}

function Warnings({ p, onRescan, rescanning }: { p: SupplierProduct; onRescan: () => void; rescanning: boolean }) {
  const issue = urlIssue(p.product_url)
  const unverified = isUnverifiedPrice(p)
  const noPrice = toNumber(p.price) <= 0
  if (!issue && !unverified && !noPrice) return null
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {issue && (
        <Badge tone="danger">
          <AlertTriangle className="h-3 w-3" /> {issue}
        </Badge>
      )}
      {(unverified || noPrice) && (
        <>
          <Badge tone="warning">
            <AlertTriangle className="h-3 w-3" /> {unverified ? 'Fiyat doğrulanmadı' : 'Fiyat yok'}
          </Badge>
          {!issue && (
            <button
              type="button"
              onClick={onRescan}
              disabled={rescanning}
              className="inline-flex items-center gap-1 text-xs font-medium text-murdum underline-offset-2 hover:underline disabled:opacity-50"
            >
              {rescanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Tekrar tara
            </button>
          )}
        </>
      )}
    </div>
  )
}

function StockBadge({ p }: { p: SupplierProduct }) {
  return p.stock_status === 'stokta_yok' ? <Badge tone="danger">Tükendi</Badge> : <Badge tone="success">Stokta</Badge>
}

function Specs({ p }: { p: SupplierProduct }) {
  const fabric = cleanText(p.fabric)
  const color = cleanText(p.color)
  const sizes = sizesOf(p)
  const assortment = metaText(p, 'assortment')
  const season = metaText(p, 'season')
  if (![fabric, color, sizes, assortment, season].some(Boolean)) return <span className="text-kul">—</span>
  return (
    <div className="space-y-0.5 text-[13px]">
      <p className="line-clamp-2" title={fabric || undefined}>{fabric || '—'}</p>
      <p className="line-clamp-1 text-kul">{color || '—'}</p>
      {sizes && <p className="text-kul">Beden: {sizes}</p>}
      {(assortment || season) && (
        <p className="text-xs text-kul">{[assortment && `Asorti ${assortment}`, season].filter(Boolean).join(' · ')}</p>
      )}
    </div>
  )
}

export function SupplierProductsTab({
  products,
  suppliers,
  loading,
  rescanningId,
  onAdd,
  actions,
}: {
  products: SupplierProduct[]
  suppliers: Supplier[]
  loading: boolean
  rescanningId: string | null
  onAdd: () => void
  actions: ProductRowActions
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [supplierId, setSupplierId] = useState('')

  const attentionCount = useMemo(() => products.filter(needsAttention).length, [products])

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr')
    return products.filter(p => {
      if (supplierId && p.supplier_id !== supplierId) return false
      if (filter === 'attention' && !needsAttention(p)) return false
      if (filter === 'out' && p.stock_status !== 'stokta_yok') return false
      if (filter === 'not_in_store' && p.products) return false
      if (!q) return true
      return [p.title, p.sku, p.suppliers?.name, p.fabric, p.color, metaText(p, 'category')].some(v => (v || '').toLocaleLowerCase('tr').includes(q))
    })
  }, [products, query, filter, supplierId])

  const rowMenu = (p: SupplierProduct): SiteRowMenuItem[] => [
    { label: 'Linki aç', icon: <ExternalLink className="h-4 w-4" />, href: p.product_url, external: true, disabled: !!urlIssue(p.product_url) && urlIssue(p.product_url) !== 'Ürün sayfası değil' },
    { label: 'Fiyat araştır', icon: <LineChart className="h-4 w-4" />, onSelect: () => actions.onResearch(p) },
    p.products
      ? { label: 'Mağazadaki ürünü aç', icon: <Store className="h-4 w-4" />, href: `/admin/urunler/${p.products.id}` }
      : { label: 'Mağazaya ekle', icon: <Plus className="h-4 w-4" />, href: `/admin/urunler/yeni?from_supplier=${p.id}` },
    { label: 'Tekrar tara', icon: <RefreshCw className="h-4 w-4" />, onSelect: () => actions.onRescan(p), disabled: !!urlIssue(p.product_url) || rescanningId === p.id },
    { label: 'Düzenle', icon: <Pencil className="h-4 w-4" />, onSelect: () => actions.onEdit(p) },
    { label: 'Sil', icon: <Trash2 className="h-4 w-4" />, onSelect: () => actions.onDelete(p), tone: 'danger' },
  ]

  if (!loading && products.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="Henüz takip edilen ürün yok"
          description="Toptancının ürün linkini ekleyin; fiyat ve stok bilgisi otomatik çekilir."
          action={
            <Button onClick={onAdd} icon={<Plus className="h-4 w-4" />}>
              Ürün ekle (link ile)
            </Button>
          }
        />
      </Card>
    )
  }

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: `Tümü (${products.length})` },
    { value: 'attention', label: `Kontrol gerekenler (${attentionCount})` },
    { value: 'out', label: 'Tükenenler' },
    { value: 'not_in_store', label: 'Mağazada olmayanlar' },
  ]

  return (
    <Card padded={false}>
      <div className="flex flex-col gap-3 border-b border-[#EFEBE6] p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kul" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ürün adı, kod, firma ara"
            aria-label="Ürün ara"
            className="h-10 w-full rounded-md border border-[#DCD6CF] bg-white pl-9 pr-3 text-sm text-ink placeholder:text-[#A8A19A] focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>
        {suppliers.length > 0 && (
          <Select aria-label="Firmaya göre süz" value={supplierId} onChange={e => setSupplierId(e.target.value)} className="lg:w-56">
            <option value="">Tüm firmalar</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-[#EFEBE6] px-4 py-3" role="group" aria-label="Süzgeç">
        {filters.map(f => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`h-8 shrink-0 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium transition-colors ${
              filter === f.value ? 'border-ink bg-ink text-white' : 'border-[#DCD6CF] bg-white text-ink hover:border-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-kul">
          <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title="Eşleşen ürün yok" description="Aramayı ya da süzgeci değiştirin." />
      ) : (
        <>
          {/* Masaüstü tablo */}
          <div className="hidden md:block">
            <Table>
              <thead>
                <tr>
                  <Th>Ürün</Th>
                  <Th>Firma</Th>
                  <Th>Kumaş / renk / beden</Th>
                  <Th className="text-right">Alış fiyatı</Th>
                  <Th>Stok</Th>
                  <Th>Son kontrol</Th>
                  <Th className="text-right">
                    <span className="sr-only">İşlemler</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {visible.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAF9F7]">
                    <Td className="min-w-[260px]">
                      <div className="flex items-start gap-3">
                        <Thumb p={p} />
                        <div className="min-w-0">
                          <button type="button" onClick={() => actions.onEdit(p)} className="line-clamp-2 text-left font-medium text-ink hover:underline">
                            {p.title}
                          </button>
                          {p.sku && <p className="text-xs text-kul">Kod: {p.sku}</p>}
                          {p.products && (
                            <Badge tone="accent" className="mt-1">
                              Mağazada
                            </Badge>
                          )}
                          <Warnings p={p} onRescan={() => actions.onRescan(p)} rescanning={rescanningId === p.id} />
                        </div>
                      </div>
                    </Td>
                    <Td className="text-[13px]">{p.suppliers?.name || <span className="text-kul">—</span>}</Td>
                    <Td className="max-w-[220px]">
                      <Specs p={p} />
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      {toNumber(p.price) > 0 ? (
                        <>
                          <span className="font-medium tabular-nums">{formatTL(toNumber(p.price))}</span>
                          <span className="block text-xs text-kul">KDV dahil</span>
                        </>
                      ) : (
                        <span className="text-kul">—</span>
                      )}
                    </Td>
                    <Td>
                      <StockBadge p={p} />
                    </Td>
                    <Td className="whitespace-nowrap text-[13px] text-kul">{formatDateTime(p.last_scraped_at)}</Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="secondary" onClick={() => actions.onResearch(p)} icon={<LineChart className="h-3.5 w-3.5" />}>
                          Fiyat araştır
                        </Button>
                        <SiteRowMenu items={rowMenu(p)} label={`${p.title} için işlemler`} />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Mobil kart listesi */}
          <ul className="divide-y divide-[#F3F0EC] md:hidden">
            {visible.map(p => (
              <li key={p.id} className="flex gap-3 p-4">
                <Thumb p={p} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <button type="button" onClick={() => actions.onEdit(p)} className="line-clamp-2 text-left text-sm font-medium text-ink">
                      {p.title}
                    </button>
                    <SiteRowMenu items={rowMenu(p)} label={`${p.title} için işlemler`} />
                  </div>
                  <p className="text-xs text-kul">{p.suppliers?.name || 'Firma yok'}</p>
                  <div className="mt-1">
                    <Specs p={p} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium tabular-nums">
                      {toNumber(p.price) > 0 ? formatTL(toNumber(p.price)) : '—'}
                      {toNumber(p.price) > 0 && <span className="ml-1 text-xs font-normal text-kul">KDV dahil</span>}
                    </span>
                    <StockBadge p={p} />
                    {p.products && <Badge tone="accent">Mağazada</Badge>}
                  </div>
                  <Warnings p={p} onRescan={() => actions.onRescan(p)} rescanning={rescanningId === p.id} />
                  <p className="mt-1 text-xs text-kul">Son kontrol: {formatDateTime(p.last_scraped_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
