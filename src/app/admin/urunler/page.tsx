'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Copy, ExternalLink, ImageOff, Loader2, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Tabs,
  Table,
  Td,
  Th,
} from '@/components/admin/ui'
import { ProductConfirmDialog } from '@/components/admin/ui/ProductConfirmDialog'
import { isVideoUrl } from '@/components/admin/ImageUploader'
import { formatTL } from '@/lib/utils'
import { LOW_STOCK_LIMIT, OUT_OF_STOCK_TAG, groupCategories, trLower, type CategoryRow } from '@/components/admin/product-form/constants'
import {
  deleteProduct,
  duplicateProduct,
  loadCategories,
  loadProductList,
  setProductActive,
  type ListProduct,
} from '@/components/admin/product-form/data'
import { ProductToaster, productToast } from '@/components/admin/product-form/toast'

type StatusTab = 'all' | 'active' | 'draft' | 'low' | 'out'
type SortKey = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'name'

interface Row extends ListProduct {
  stock: number
  hasVariants: boolean
  cover: string | null
  effective: number
  outFlag: boolean
  skuText: string
}

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

function toRow(p: ListProduct): Row {
  const variants = (p.product_variants || []).filter(v => v.is_active !== false)
  const stock = variants.reduce((s, v) => s + Math.max(0, Number(v.stock_quantity) || 0), 0)
  const imgs = [...(p.product_images || [])]
    .filter(i => i.image_url && !i.image_url.startsWith('blob:'))
    .sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const cover = imgs.find(i => !isVideoUrl(i.image_url as string))?.image_url || null
  const base = Number(p.base_price) || 0
  const sale = Number(p.sale_price) || 0
  const tags = Array.isArray(p.tags) ? p.tags : []
  return {
    ...p,
    stock,
    hasVariants: variants.length > 0,
    cover,
    effective: sale > 0 && sale < base ? sale : base,
    outFlag: p.is_out_of_stock === true || tags.includes(OUT_OF_STOCK_TAG),
    skuText: variants.map(v => v.sku || '').join(' '),
  }
}

const isOut = (r: Row) => r.outFlag || (r.hasVariants && r.stock === 0)
const isLow = (r: Row) => !isOut(r) && r.hasVariants && r.stock <= LOW_STOCK_LIMIT

export default function AdminProductsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [tab, setTab] = useState<StatusTab>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [busy, setBusy] = useState<Record<string, 'toggle' | 'copy' | 'delete'>>({})
  const [toDelete, setToDelete] = useState<Row | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [list, cats] = await Promise.all([loadProductList(), loadCategories()])
      setRows(list.map(toRow))
      setCategories(cats)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Ürünler yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([loadProductList(), loadCategories()])
      .then(([list, cats]) => {
        if (cancelled) return
        setRows(list.map(toRow))
        setCategories(cats)
      })
      .catch(err => !cancelled && setLoadError(err instanceof Error ? err.message : 'Ürünler yüklenemedi.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(
    () => ({
      all: rows.length,
      active: rows.filter(r => r.is_active !== false).length,
      draft: rows.filter(r => r.is_active === false).length,
      low: rows.filter(isLow).length,
      out: rows.filter(isOut).length,
    }),
    [rows],
  )

  const visible = useMemo(() => {
    const q = trLower(query.trim())
    const list = rows.filter(r => {
      if (tab === 'active' && r.is_active === false) return false
      if (tab === 'draft' && r.is_active !== false) return false
      if (tab === 'low' && !isLow(r)) return false
      if (tab === 'out' && !isOut(r)) return false
      if (category && r.category_id !== category) return false
      if (q && !trLower(`${r.name} ${r.slug} ${r.skuText}`).includes(q)) return false
      return true
    })
    const by: Record<SortKey, (a: Row, b: Row) => number> = {
      newest: (a, b) => (b.created_at || '').localeCompare(a.created_at || ''),
      oldest: (a, b) => (a.created_at || '').localeCompare(b.created_at || ''),
      price_asc: (a, b) => a.effective - b.effective,
      price_desc: (a, b) => b.effective - a.effective,
      stock_asc: (a, b) => a.stock - b.stock,
      stock_desc: (a, b) => b.stock - a.stock,
      name: (a, b) => a.name.localeCompare(b.name, 'tr'),
    }
    return [...list].sort(by[sort])
  }, [rows, query, category, tab, sort])

  const setRowBusy = (id: string, v?: 'toggle' | 'copy' | 'delete') =>
    setBusy(b => {
      const n = { ...b }
      if (v) n[id] = v
      else delete n[id]
      return n
    })

  const toggleActive = async (r: Row) => {
    const next = r.is_active === false
    setRowBusy(r.id, 'toggle')
    setRows(list => list.map(x => (x.id === r.id ? { ...x, is_active: next } : x)))
    try {
      await setProductActive(r.id, next)
      productToast.success(next ? `“${r.name}” yayında.` : `“${r.name}” taslağa alındı.`)
    } catch (err) {
      setRows(list => list.map(x => (x.id === r.id ? { ...x, is_active: !next } : x)))
      productToast.error(err instanceof Error ? err.message : 'Durum değiştirilemedi.')
    } finally {
      setRowBusy(r.id)
    }
  }

  const copy = async (r: Row) => {
    setRowBusy(r.id, 'copy')
    try {
      const created = await duplicateProduct(r.id)
      productToast.success(
        <span>
          Taslak kopya oluşturuldu.
          <Link href={`/admin/urunler/${created.id}`} className="ml-1 font-medium underline">
            Düzenle
          </Link>
        </span>,
        6000,
      )
      await fetchAll()
    } catch (err) {
      productToast.error(err instanceof Error ? err.message : 'Kopyalanamadı.')
    } finally {
      setRowBusy(r.id)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    const r = toDelete
    setRowBusy(r.id, 'delete')
    try {
      await deleteProduct(r.id)
      setRows(list => list.filter(x => x.id !== r.id))
      productToast.success(`“${r.name}” silindi.`)
      setToDelete(null)
    } catch (err) {
      productToast.error(err instanceof Error ? err.message : 'Silinemedi.')
    } finally {
      setRowBusy(r.id)
    }
  }

  const categoryGroups = useMemo(() => groupCategories(categories), [categories])
  const filtersActive = !!(query || category || tab !== 'all')

  return (
    <div>
      <ProductToaster />
      <PageHeader
        title="Ürünler"
        description="Ürün ekleyin, fiyat ve stokları takip edin, yayın durumunu tek tıkla değiştirin."
        actions={
          <Button href="/admin/urunler/yeni" icon={<Plus className="h-4 w-4" />}>
            Yeni ürün ekle
          </Button>
        }
      />

      <Tabs<StatusTab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'all', label: 'Tümü', count: counts.all },
          { value: 'active', label: 'Yayında', count: counts.active },
          { value: 'draft', label: 'Taslak', count: counts.draft },
          { value: 'low', label: 'Az stok', count: counts.low },
          { value: 'out', label: 'Tükendi', count: counts.out },
        ]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_190px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kul" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ürün adı ya da SKU ara"
            aria-label="Ürün ara"
            className="h-10 w-full rounded-md border border-[#DCD6CF] bg-white pl-9 pr-3 text-sm text-ink placeholder:text-[#A8A19A] focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>
        <Select aria-label="Kategori" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Tüm kategoriler</option>
          {categoryGroups.map(g => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
        <Select aria-label="Sıralama" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
          <option value="newest">En yeni</option>
          <option value="oldest">En eski</option>
          <option value="price_asc">Fiyat: düşükten yükseğe</option>
          <option value="price_desc">Fiyat: yüksekten düşüğe</option>
          <option value="stock_asc">Stok: azdan çoğa</option>
          <option value="stock_desc">Stok: çoktan aza</option>
          <option value="name">Ada göre (A–Z)</option>
        </Select>
      </div>

      <Card padded={false}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-kul" role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Ürünler yükleniyor…
          </div>
        ) : loadError ? (
          <EmptyState
            icon={<Package className="h-5 w-5" />}
            title="Ürünler yüklenemedi"
            description={loadError}
            action={
              <Button variant="secondary" onClick={() => { setLoading(true); fetchAll() }}>
                Yeniden dene
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Package className="h-5 w-5" />}
            title="Henüz ürün yok"
            description="İlk ürününüzü ekleyin. Toptancı linkini yapıştırarak bilgileri otomatik doldurabilirsiniz."
            action={
              <Button href="/admin/urunler/yeni" icon={<Plus className="h-4 w-4" />}>
                Yeni ürün ekle
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="Eşleşen ürün yok"
            description="Aramayı ya da filtreleri değiştirin."
            action={
              filtersActive ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('')
                    setCategory('')
                    setTab('all')
                  }}
                >
                  Filtreleri temizle
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Masaüstü tablo */}
            <div className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <Th className="w-[44%]">Ürün</Th>
                    <Th>Fiyat</Th>
                    <Th>Stok</Th>
                    <Th>Yayında</Th>
                    <Th className="text-right">
                      <span className="sr-only">İşlemler</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(r => (
                    <tr key={r.id} className="hover:bg-[#FCFBFA]">
                      <Td>
                        <div className="flex items-center gap-3">
                          <Thumb src={r.cover} />
                          <div className="min-w-0">
                            <Link href={`/admin/urunler/${r.id}`} className="line-clamp-2 font-medium text-ink hover:underline">
                              {r.name}
                            </Link>
                            <p className="mt-0.5 text-xs text-kul">{r.categories?.name || 'Kategorisiz'}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <PriceCell r={r} />
                      </Td>
                      <Td>
                        <StockCell r={r} />
                      </Td>
                      <Td>
                        <StatusSwitch r={r} busy={busy[r.id] === 'toggle'} onToggle={() => toggleActive(r)} />
                      </Td>
                      <Td className="text-right">
                        <RowActions r={r} busy={busy[r.id]} onCopy={() => copy(r)} onDelete={() => setToDelete(r)} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Mobil kartlar */}
            <ul className="divide-y divide-[#EFEBE6] md:hidden">
              {visible.map(r => (
                <li key={r.id} className="flex gap-3 p-4">
                  <Thumb src={r.cover} large />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/urunler/${r.id}`} className="line-clamp-2 text-sm font-medium text-ink">
                      {r.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-kul">{r.categories?.name || 'Kategorisiz'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <PriceCell r={r} />
                      <StockCell r={r} />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <StatusSwitch r={r} busy={busy[r.id] === 'toggle'} onToggle={() => toggleActive(r)} showLabel />
                      <RowActions r={r} busy={busy[r.id]} onCopy={() => copy(r)} onDelete={() => setToDelete(r)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="border-t border-[#EFEBE6] px-4 py-3 text-xs text-kul">
              {visible.length === rows.length ? `${rows.length} ürün` : `${visible.length} / ${rows.length} ürün gösteriliyor`}
            </p>
          </>
        )}
      </Card>

      <ProductConfirmDialog
        open={!!toDelete}
        title={`“${toDelete?.name ?? ''}” silinsin mi?`}
        description={
          <>
            Ürün, görselleri ve stok bilgileri kalıcı olarak silinir. Geçmiş siparişler etkilenmez. Geçici olarak gizlemek için silmek yerine
            taslağa alabilirsiniz.
          </>
        }
        confirmLabel="Ürünü sil"
        loading={!!toDelete && busy[toDelete.id] === 'delete'}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function Thumb({ src, large }: { src: string | null; large?: boolean }) {
  return (
    <div className={cx('shrink-0 overflow-hidden rounded-md bg-[#F1EEEA]', large ? 'h-20 w-16' : 'h-14 w-11')}>
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-kul">
          <ImageOff className="h-4 w-4" aria-hidden />
        </span>
      )}
    </div>
  )
}

function PriceCell({ r }: { r: Row }) {
  const base = Number(r.base_price) || 0
  if (!base) return <span className="text-sm text-kul">Fiyat yok</span>
  const discounted = r.effective < base
  return (
    <span className="text-sm">
      {discounted && <s className="mr-1.5 text-xs text-kul">{formatTL(base)}</s>}
      <span className={cx('font-medium', discounted ? 'text-murdum' : 'text-ink')}>{formatTL(r.effective)}</span>
    </span>
  )
}

function StockCell({ r }: { r: Row }) {
  if (!r.hasVariants) return <span className="text-sm text-kul">Beden yok</span>
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="text-ink">{r.stock} adet</span>
      {isOut(r) ? <Badge tone="danger">Tükendi</Badge> : isLow(r) ? <Badge tone="warning">Az stok</Badge> : null}
    </span>
  )
}

function StatusSwitch({ r, busy, onToggle, showLabel }: { r: Row; busy: boolean; onToggle: () => void; showLabel?: boolean }) {
  const on = r.is_active !== false
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`${r.name}: ${on ? 'yayında, taslağa almak için tıklayın' : 'taslak, yayınlamak için tıklayın'}`}
        disabled={busy}
        onClick={onToggle}
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
          on ? 'bg-ink' : 'bg-[#D8D2CB]',
        )}
      >
        <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </button>
      <span className={cx('text-xs', on ? 'text-ink' : 'text-kul', !showLabel && 'hidden lg:inline')}>{on ? 'Yayında' : 'Taslak'}</span>
    </span>
  )
}

function RowActions({
  r,
  busy,
  onCopy,
  onDelete,
}: {
  r: Row
  busy?: 'toggle' | 'copy' | 'delete'
  onCopy: () => void
  onDelete: () => void
}) {
  const btn =
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-kul hover:bg-[#F1EEEA] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-50 cursor-pointer'
  return (
    <div className="inline-flex items-center gap-0.5">
      <Link href={`/admin/urunler/${r.id}`} className={cx(btn, 'w-auto gap-1.5 px-2.5 text-[13px] font-medium text-ink')}>
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Düzenle
      </Link>
      {r.is_active !== false && (
        <a href={`/urunler/${r.slug}`} target="_blank" rel="noopener noreferrer" className={btn} title="Mağazada görüntüle" aria-label={`${r.name} mağazada görüntüle`}>
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      )}
      <button type="button" onClick={onCopy} disabled={!!busy} className={btn} title="Kopyala (taslak olarak)" aria-label={`${r.name} kopyala`}>
        {busy === 'copy' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      </button>
      <button type="button" onClick={onDelete} disabled={!!busy} className={cx(btn, 'hover:bg-rose-50 hover:text-rose-700')} title="Sil" aria-label={`${r.name} sil`}>
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
