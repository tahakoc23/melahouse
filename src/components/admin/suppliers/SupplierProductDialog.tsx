'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button, Notice } from '@/components/admin/ui'
import { SiteDialog } from '@/components/admin/ui/SiteDialog'
import { notify } from '@/components/admin/ui/siteToast'
import { SupplierPicker, SupplierProductFields, buildSaveBody } from './SupplierProductFields'
import {
  isUnverifiedPrice,
  isValidHttpUrl,
  productToDraft,
  readJson,
  type Supplier,
  type SupplierProduct,
  type SupplierProductDraft,
} from './types'

/** Toptancı ürününü düzenleme penceresi. product değişince key ile yeniden kurulur. */
export function SupplierProductDialog({
  product,
  suppliers,
  onClose,
  onSaved,
}: {
  product: SupplierProduct
  suppliers: Supplier[]
  onClose: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<SupplierProductDraft>(() => productToDraft(product))
  const [supplierValue, setSupplierValue] = useState(product.supplier_id || '')
  const [newSupplierName, setNewSupplierName] = useState('')
  const [saving, setSaving] = useState(false)
  const [rescanning, setRescanning] = useState(false)
  const busy = saving || rescanning
  const unverified = isUnverifiedPrice(product) && draft.price === 2000

  const rescan = async () => {
    if (!isValidHttpUrl(draft.product_url)) {
      notify.error('Önce geçerli bir ürün linki girin.')
      return
    }
    setRescanning(true)
    try {
      const res = await fetch('/api/admin/suppliers/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scrape_preview', product_url: draft.product_url.trim() }),
      })
      const data = await readJson<{ data?: SupplierProductDraft }>(res)
      if (!res.ok || !data.data) throw new Error(data.error || 'Sayfadan bilgi alınamadı.')
      const d = data.data
      setDraft(prev => ({
        ...prev,
        title: d.title || prev.title,
        price: Number(d.price) > 0 ? Number(d.price) : prev.price,
        stock_status: d.stock_status === 'stokta_yok' ? 'stokta_yok' : 'stokta_var',
        color: d.color || prev.color,
        fabric: d.fabric || prev.fabric,
        sizes: d.sizes || prev.sizes,
        sku: d.sku || prev.sku,
        description: d.description || prev.description,
        image_url: d.image_url || prev.image_url,
        raw_metadata: d.raw_metadata || {},
      }))
      if (Number(d.price) > 0) notify.success('Güncel bilgiler getirildi. Kontrol edip kaydedin.')
      else notify.info('Sayfada fiyat bulunamadı. Fiyatı elle girin.')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Sayfadan bilgi alınamadı.')
    } finally {
      setRescanning(false)
    }
  }

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!draft.title.trim()) return notify.error('Ürün adı boş olamaz.')
    if (!isValidHttpUrl(draft.product_url)) return notify.error('Geçerli bir ürün linki girin.')
    setSaving(true)
    try {
      const urlChanged = draft.product_url.trim() !== product.product_url
      const res = await fetch('/api/admin/suppliers/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSaveBody(draft, supplierValue, newSupplierName, product.admin_product_id)),
      })
      const data = await readJson<object>(res)
      if (!res.ok) throw new Error(data.error || 'Ürün kaydedilemedi.')
      // Kayıt linke göre eşleştiği için link değiştiyse yeni kayıt oluşur; eskisini kaldır
      if (urlChanged) {
        const del = await fetch(`/api/admin/suppliers?product_id=${encodeURIComponent(product.id)}`, { method: 'DELETE' })
        if (!del.ok) notify.info('Yeni linkle kaydedildi; eski kayıt silinemedi, listeden silebilirsiniz.')
      }
      notify.success('Ürün kaydedildi.')
      onSaved()
      onClose()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Ürün kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SiteDialog
      open
      onClose={onClose}
      title="Ürünü düzenle"
      size="lg"
      busy={busy}
      footer={
        <>
          <Button variant="ghost" onClick={rescan} loading={rescanning} disabled={saving} icon={<RefreshCw className="h-4 w-4" />} className="mr-auto">
            Siteden tekrar çek
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Vazgeç
          </Button>
          <Button onClick={() => save()} loading={saving} disabled={rescanning}>
            Kaydet
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-5">
        {unverified && (
          <Notice tone="warning" title="Fiyat doğrulanmadı">
            2.000 ₺ eski aktarımdan kalan varsayılan değer olabilir. &quot;Siteden tekrar çek&quot; ile güncel fiyatı alın ya da elle düzeltin.
          </Notice>
        )}
        <SupplierPicker
          suppliers={suppliers}
          value={supplierValue}
          newName={newSupplierName}
          onChange={(v, n) => {
            setSupplierValue(v)
            setNewSupplierName(n)
          }}
        />
        <SupplierProductFields draft={draft} onChange={setDraft} showUrl />
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </SiteDialog>
  )
}
