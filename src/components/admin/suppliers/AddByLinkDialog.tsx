'use client'

import { useState } from 'react'
import { ImageOff, Search } from 'lucide-react'
import { Button, Notice, TextInput } from '@/components/admin/ui'
import { SiteDialog } from '@/components/admin/ui/SiteDialog'
import { notify } from '@/components/admin/ui/siteToast'
import { NEW_SUPPLIER, SupplierPicker, SupplierProductFields, buildSaveBody } from './SupplierProductFields'
import { isValidHttpUrl, readJson, urlIssue, type Supplier, type SupplierProduct, type SupplierProductDraft } from './types'

interface ScrapeResult extends SupplierProductDraft {
  brand_name?: string
}

/** "Ürün ekle (link ile)": link yapıştır → bilgileri getir → kontrol et → kaydet */
export function AddByLinkDialog({
  open,
  onClose,
  suppliers,
  existing,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  suppliers: Supplier[]
  existing: SupplierProduct[]
  onSaved: () => void
}) {
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [draft, setDraft] = useState<SupplierProductDraft | null>(null)
  const [supplierValue, setSupplierValue] = useState('')
  const [newSupplierName, setNewSupplierName] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setUrl('')
    setUrlError(null)
    setFetchError(null)
    setDraft(null)
    setSupplierValue('')
    setNewSupplierName('')
  }

  const close = () => {
    if (saving || fetching) return
    reset()
    onClose()
  }

  const duplicate = draft ? existing.find(p => p.product_url === draft.product_url) : undefined

  const fetchPreview = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = url.trim()
    if (!isValidHttpUrl(trimmed)) {
      setUrlError('Linki https:// ile başlayacak şekilde tam yapıştırın.')
      return
    }
    const issue = urlIssue(trimmed)
    if (issue) {
      setUrlError(`${issue}: toptancının ürün sayfasının linkini yapıştırın.`)
      return
    }
    setUrlError(null)
    setFetchError(null)
    setFetching(true)
    setDraft(null)
    try {
      const res = await fetch('/api/admin/suppliers/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scrape_preview', product_url: trimmed }),
      })
      const data = await readJson<{ data?: ScrapeResult }>(res)
      if (!res.ok || !data.data) throw new Error(data.error || 'Sayfadan bilgi alınamadı.')
      const d = data.data
      setDraft({
        title: d.title || '',
        product_url: d.product_url || trimmed,
        sku: d.sku || '',
        price: Number(d.price) || 0,
        stock_status: d.stock_status === 'stokta_yok' ? 'stokta_yok' : 'stokta_var',
        color: d.color || '',
        fabric: d.fabric || '',
        sizes: d.sizes || '',
        description: d.description || '',
        image_url: d.image_url || '',
        raw_metadata: d.raw_metadata || {},
      })
      // Marka adı kayıtlı bir firmaya uyuyorsa onu seç, yoksa yeni firma öner
      const brand = (d.brand_name || '').trim()
      const match = brand ? suppliers.find(s => s.name.toLocaleLowerCase('tr') === brand.toLocaleLowerCase('tr')) : undefined
      const byDomain = suppliers.find(s => s.domain && trimmed.includes(s.domain))
      if (match || byDomain) {
        setSupplierValue((match || byDomain)!.id)
        setNewSupplierName('')
      } else if (brand) {
        setSupplierValue(NEW_SUPPLIER)
        setNewSupplierName(brand)
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Sayfadan bilgi alınamadı.')
    } finally {
      setFetching(false)
    }
  }

  const save = async () => {
    if (!draft) return
    if (!draft.title.trim()) {
      notify.error('Ürün adı boş olamaz.')
      return
    }
    if (supplierValue === NEW_SUPPLIER && !newSupplierName.trim()) {
      notify.error('Yeni firma adını yazın ya da listeden firma seçin.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/suppliers/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSaveBody(draft, supplierValue, newSupplierName, duplicate?.admin_product_id)),
      })
      const data = await readJson<object>(res)
      if (!res.ok) throw new Error(data.error || 'Ürün kaydedilemedi.')
      notify.success(duplicate ? 'Ürün bilgileri güncellendi.' : 'Ürün listeye eklendi.')
      reset()
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
      open={open}
      onClose={close}
      title="Ürün ekle (link ile)"
      description="Toptancının ürün sayfası linkini yapıştırın; bilgiler otomatik doldurulur."
      size="lg"
      busy={saving || fetching}
      footer={
        draft ? (
          <>
            <Button variant="secondary" onClick={close} disabled={saving}>
              Vazgeç
            </Button>
            <Button onClick={save} loading={saving}>
              {duplicate ? 'Bilgileri güncelle' : 'Listeye kaydet'}
            </Button>
          </>
        ) : undefined
      }
    >
      <form onSubmit={fetchPreview} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <TextInput
          className="flex-1"
          label="Ürün linki"
          type="url"
          inputMode="url"
          placeholder="https://toptanci.com/urun/..."
          value={url}
          onChange={e => {
            setUrl(e.target.value)
            setUrlError(null)
          }}
          error={urlError}
          data-autofocus
        />
        <Button type="submit" variant={draft ? 'secondary' : 'primary'} loading={fetching} icon={<Search className="h-4 w-4" />} className="sm:mt-[26px]">
          {draft ? 'Tekrar getir' : 'Bilgileri getir'}
        </Button>
      </form>

      {fetching && <p className="mt-4 text-[13px] text-kul">Sayfa okunuyor, bu birkaç saniye sürebilir…</p>}

      {fetchError && (
        <div className="mt-4">
          <Notice tone="danger" title="Bilgiler alınamadı">
            {fetchError} Linki kontrol edip tekrar deneyin.
          </Notice>
        </div>
      )}

      {draft && (
        <div className="mt-6 space-y-5">
          {duplicate && (
            <Notice tone="warning">Bu link zaten listede. Kaydederseniz mevcut kaydın bilgileri güncellenir.</Notice>
          )}
          <div className="flex gap-4">
            <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#E7E3DE] bg-[#F7F6F4]">
              {draft.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="h-5 w-5 text-kul" aria-label="Görsel yok" />
              )}
            </div>
            <div className="min-w-0 text-[13px] text-kul">
              <p className="font-medium text-ink">Bulunan bilgiler aşağıda.</p>
              <p className="mt-1">Eksik ya da yanlış olanları düzeltip kaydedin. Fiyat bulunamadıysa elle yazın.</p>
            </div>
          </div>
          <SupplierPicker
            suppliers={suppliers}
            value={supplierValue}
            newName={newSupplierName}
            onChange={(v, n) => {
              setSupplierValue(v)
              setNewSupplierName(n)
            }}
          />
          <SupplierProductFields draft={draft} onChange={setDraft} />
        </div>
      )}
    </SiteDialog>
  )
}
