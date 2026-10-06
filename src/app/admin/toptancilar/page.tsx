'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button, Notice, PageHeader, Tabs } from '@/components/admin/ui'
import { useSiteConfirm } from '@/components/admin/ui/SiteConfirmDialog'
import { notify } from '@/components/admin/ui/siteToast'
import { AddByLinkDialog } from '@/components/admin/suppliers/AddByLinkDialog'
import { PriceResearchDrawer } from '@/components/admin/suppliers/PriceResearchDrawer'
import { SupplierChangesTab } from '@/components/admin/suppliers/SupplierChangesTab'
import { SupplierCompanyDialog } from '@/components/admin/suppliers/SupplierCompanyDialog'
import { SupplierProductDialog } from '@/components/admin/suppliers/SupplierProductDialog'
import { SupplierProductsTab } from '@/components/admin/suppliers/SupplierProductsTab'
import { SuppliersTab } from '@/components/admin/suppliers/SuppliersTab'
import { buildSaveBody } from '@/components/admin/suppliers/SupplierProductFields'
import {
  productToDraft,
  readJson,
  urlIssue,
  type Supplier,
  type SupplierChange,
  type SupplierProduct,
  type SupplierProductDraft,
} from '@/components/admin/suppliers/types'

type Tab = 'products' | 'changes' | 'suppliers'

interface RefreshSummary {
  checked: number
  changes: number
  failed: { id: string; title: string; error?: string }[]
}

async function loadAll() {
  const [sRes, cRes] = await Promise.all([
    fetch('/api/admin/suppliers', { cache: 'no-store' }),
    fetch('/api/admin/suppliers/changes', { cache: 'no-store' }),
  ])
  const sData = await readJson<{ suppliers?: Supplier[]; supplierProducts?: SupplierProduct[]; unreadCount?: number }>(sRes)
  const cData = await readJson<{ changes?: SupplierChange[] }>(cRes)
  if (!sRes.ok) throw new Error(sData.error || 'Toptancı verileri alınamadı.')
  return {
    suppliers: sData.suppliers || [],
    products: sData.supplierProducts || [],
    unread: sData.unreadCount || 0,
    changes: cRes.ok ? cData.changes || [] : [],
  }
}

export default function AdminSuppliersPage() {
  const [tab, setTab] = useState<Tab>('products')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [changes, setChanges] = useState<SupplierChange[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<SupplierProduct | null>(null)
  const [company, setCompany] = useState<{ supplier: Supplier | null } | null>(null)
  const [research, setResearch] = useState<SupplierProduct | null>(null)

  const [refreshingAll, setRefreshingAll] = useState(false)
  const [refreshSummary, setRefreshSummary] = useState<RefreshSummary | null>(null)
  const [rescanningId, setRescanningId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [confirm, confirmDialog] = useSiteConfirm()

  const reload = useCallback(async () => {
    try {
      const d = await loadAll()
      setSuppliers(d.suppliers)
      setProducts(d.products)
      setChanges(d.changes)
      setUnreadCount(d.unread)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Veriler alınamadı.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    loadAll()
      .then(d => {
        if (!active) return
        setSuppliers(d.suppliers)
        setProducts(d.products)
        setChanges(d.changes)
        setUnreadCount(d.unread)
      })
      .catch(err => active && setLoadError(err instanceof Error ? err.message : 'Veriler alınamadı.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  /* ---------------- İşlemler ---------------- */

  const refreshAll = async () => {
    if (products.length === 0) {
      notify.info('Güncellenecek ürün yok.')
      return
    }
    setRefreshingAll(true)
    setRefreshSummary(null)
    const toastId = notify.loading(`${products.length} ürün toptancı sitelerinden kontrol ediliyor…`)
    try {
      const res = await fetch('/api/admin/suppliers/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_all' }),
      })
      const data = await readJson<{
        updatedCount?: number
        changesCount?: number
        results?: { id: string; title: string; status: string; error?: string }[]
      }>(res)
      if (!res.ok) throw new Error(data.error || 'Güncelleme yapılamadı.')
      const failed = (data.results || []).filter(r => r.status !== 'success')
      const summary: RefreshSummary = {
        checked: (data.updatedCount || 0) - failed.length,
        changes: data.changesCount || 0,
        failed,
      }
      setRefreshSummary(summary)
      const msg =
        `${summary.checked} ürün güncellendi` +
        (summary.changes ? `, ${summary.changes} değişiklik bulundu` : ', değişiklik yok') +
        (failed.length ? `. ${failed.length} ürün okunamadı.` : '.')
      if (failed.length) notify.info(msg, toastId)
      else notify.success(msg, toastId)
      await reload()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Güncelleme yapılamadı.', toastId)
    } finally {
      setRefreshingAll(false)
    }
  }

  /** Tek ürünü sayfasından tekrar okuyup kaydeder (doğrulanmamış fiyatlar için) */
  const rescanOne = async (p: SupplierProduct) => {
    if (urlIssue(p.product_url)) {
      notify.error('Ürün linki hatalı. Önce "Düzenle" ile doğru linki girin.')
      return
    }
    setRescanningId(p.id)
    try {
      const res = await fetch('/api/admin/suppliers/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scrape_preview', product_url: p.product_url }),
      })
      const data = await readJson<{ data?: SupplierProductDraft }>(res)
      if (!res.ok || !data.data) throw new Error(data.error || 'Sayfa okunamadı.')
      const fresh = data.data
      const freshPrice = Number(fresh.price) || 0
      if (freshPrice <= 0) {
        notify.info('Sayfada fiyat bulunamadı. Fiyatı "Düzenle" ile elle girin.')
        return
      }
      const current = productToDraft(p)
      const draft: SupplierProductDraft = {
        ...current,
        title: fresh.title || current.title,
        price: freshPrice,
        stock_status: fresh.stock_status === 'stokta_yok' ? 'stokta_yok' : 'stokta_var',
        color: fresh.color || current.color,
        fabric: fresh.fabric || current.fabric,
        sizes: fresh.sizes || current.sizes,
        sku: fresh.sku || current.sku,
        image_url: fresh.image_url || current.image_url,
        description: fresh.description || current.description,
        raw_metadata: fresh.raw_metadata || {},
      }
      const saveRes = await fetch('/api/admin/suppliers/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSaveBody(draft, p.supplier_id || '', '', p.admin_product_id)),
      })
      const saved = await readJson<object>(saveRes)
      if (!saveRes.ok) throw new Error(saved.error || 'Kaydedilemedi.')
      notify.success(`Fiyat güncellendi: ${freshPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`)
      await reload()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Sayfa okunamadı.')
    } finally {
      setRescanningId(null)
    }
  }

  const deleteProduct = async (p: SupplierProduct) => {
    const ok = await confirm({
      title: 'Ürün listeden silinsin mi?',
      message: `"${p.title}" takip listesinden ve değişiklik geçmişinden kaldırılır. Mağazadaki ürün etkilenmez.`,
      confirmLabel: 'Sil',
      tone: 'danger',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/suppliers?product_id=${encodeURIComponent(p.id)}`, { method: 'DELETE' })
      const data = await readJson<object>(res)
      if (!res.ok) throw new Error(data.error || 'Silinemedi.')
      notify.success('Ürün silindi.')
      await reload()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Silinemedi.')
    }
  }

  const deleteSupplier = async (s: Supplier) => {
    const linked = products.filter(p => p.supplier_id === s.id).length
    const ok = await confirm({
      title: 'Firma silinsin mi?',
      message: linked
        ? `"${s.name}" silinir. Bu firmaya bağlı ${linked} ürün listede kalır, firması boş görünür.`
        : `"${s.name}" silinir.`,
      confirmLabel: 'Firmayı sil',
      tone: 'danger',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/suppliers?id=${encodeURIComponent(s.id)}`, { method: 'DELETE' })
      const data = await readJson<object>(res)
      if (!res.ok) throw new Error(data.error || 'Silinemedi.')
      notify.success('Firma silindi.')
      await reload()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Silinemedi.')
    }
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      const res = await fetch('/api/admin/suppliers/changes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all_read: true }),
      })
      const data = await readJson<object>(res)
      if (!res.ok) throw new Error(data.error || 'İşaretlenemedi.')
      setUnreadCount(0)
      setChanges(cs => cs.map(c => ({ ...c, is_read: true })))
      notify.success('Tüm değişiklikler okundu sayıldı.')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'İşaretlenemedi.')
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl pb-12">
      {confirmDialog}

      <PageHeader
        title="Toptancılar"
        description="Toptancı ürünlerinin fiyat ve stok bilgisini takip edin, beğendiklerinizi mağazaya ekleyin."
        actions={
          <>
            <Button variant="secondary" onClick={refreshAll} loading={refreshingAll} icon={<RefreshCw className="h-4 w-4" />}>
              {refreshingAll ? 'Güncelleniyor…' : 'Tümünü güncelle'}
            </Button>
            <Button onClick={() => setAddOpen(true)} icon={<Plus className="h-4 w-4" />}>
              Ürün ekle (link ile)
            </Button>
          </>
        }
      />

      {loadError && (
        <div className="mb-5">
          <Notice tone="danger" title="Veriler yüklenemedi">
            {loadError}{' '}
            <button type="button" className="font-semibold underline" onClick={() => reload()}>
              Tekrar dene
            </button>
          </Notice>
        </div>
      )}

      {refreshingAll && (
        <div className="mb-5">
          <Notice tone="info">
            Ürünler tek tek kontrol ediliyor. Ürün sayısına göre birkaç dakika sürebilir; bu sayfayı kapatmayın.
          </Notice>
        </div>
      )}

      {refreshSummary && refreshSummary.failed.length > 0 && (
        <div className="mb-5">
          <Notice tone="warning" title={`${refreshSummary.failed.length} ürün okunamadı`}>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {refreshSummary.failed.slice(0, 8).map(f => (
                <li key={f.id}>
                  {f.title}
                  {f.error ? ` — ${f.error}` : ''}
                </li>
              ))}
            </ul>
            {refreshSummary.failed.length > 8 && <p className="mt-1">ve {refreshSummary.failed.length - 8} ürün daha.</p>}
            <button type="button" className="mt-2 font-semibold underline" onClick={() => setRefreshSummary(null)}>
              Kapat
            </button>
          </Notice>
        </div>
      )}

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'products', label: 'Ürünler', count: products.length },
          { value: 'changes', label: 'Değişiklikler', count: unreadCount > 0 ? unreadCount : undefined },
          { value: 'suppliers', label: 'Firmalar', count: suppliers.length },
        ]}
      />

      {tab === 'products' && (
        <SupplierProductsTab
          products={products}
          suppliers={suppliers}
          loading={loading}
          rescanningId={rescanningId}
          onAdd={() => setAddOpen(true)}
          actions={{
            onEdit: setEditing,
            onDelete: deleteProduct,
            onResearch: setResearch,
            onRescan: rescanOne,
          }}
        />
      )}

      {tab === 'changes' && (
        <SupplierChangesTab
          changes={changes}
          unreadCount={unreadCount}
          loading={loading}
          markingAll={markingAll}
          onMarkAllRead={markAllRead}
          onRefresh={refreshAll}
        />
      )}

      {tab === 'suppliers' && (
        <div className="space-y-4">
          {suppliers.length > 0 && (
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setCompany({ supplier: null })} icon={<Plus className="h-4 w-4" />}>
                Firma ekle
              </Button>
            </div>
          )}
          <SuppliersTab
            suppliers={suppliers}
            products={products}
            onAdd={() => setCompany({ supplier: null })}
            onEdit={s => setCompany({ supplier: s })}
            onDelete={deleteSupplier}
          />
        </div>
      )}

      <AddByLinkDialog open={addOpen} onClose={() => setAddOpen(false)} suppliers={suppliers} existing={products} onSaved={reload} />

      {editing && (
        <SupplierProductDialog key={editing.id} product={editing} suppliers={suppliers} onClose={() => setEditing(null)} onSaved={reload} />
      )}

      {company && (
        <SupplierCompanyDialog
          key={company.supplier?.id || 'new'}
          supplier={company.supplier}
          onClose={() => setCompany(null)}
          onSaved={reload}
        />
      )}

      {research && <PriceResearchDrawer product={research} onClose={() => setResearch(null)} />}
    </div>
  )
}
