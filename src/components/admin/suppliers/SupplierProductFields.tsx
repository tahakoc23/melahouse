'use client'

import { Select, TextInput } from '@/components/admin/ui'
import type { Supplier, SupplierProductDraft } from './types'

export const NEW_SUPPLIER = '__new__'

/** Ürün bilgisi alanları: bağlantı ekleme ve düzenleme pencerelerinde ortak */
export function SupplierProductFields({
  draft,
  onChange,
  showUrl = false,
}: {
  draft: SupplierProductDraft
  onChange: (next: SupplierProductDraft) => void
  showUrl?: boolean
}) {
  const set = <K extends keyof SupplierProductDraft>(key: K, value: SupplierProductDraft[K]) =>
    onChange({ ...draft, [key]: value })

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TextInput
        className="sm:col-span-2"
        label="Ürün adı"
        required
        value={draft.title}
        onChange={e => set('title', e.target.value)}
      />
      {showUrl && (
        <TextInput
          className="sm:col-span-2"
          label="Ürün linki"
          type="url"
          required
          value={draft.product_url}
          onChange={e => set('product_url', e.target.value)}
          hint="Link değişirse ürün yeni linkle kaydedilir."
        />
      )}
      <TextInput
        label="Alış fiyatı"
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        suffix="₺"
        value={Number.isFinite(draft.price) ? String(draft.price) : ''}
        onChange={e => set('price', e.target.value === '' ? 0 : Number(e.target.value))}
        hint={draft.price <= 0 ? 'Fiyat bulunamadı, elle girin.' : 'KDV dahil'}
      />
      <Select
        label="Stok"
        value={draft.stock_status}
        onChange={e => set('stock_status', e.target.value === 'stokta_yok' ? 'stokta_yok' : 'stokta_var')}
      >
        <option value="stokta_var">Stokta var</option>
        <option value="stokta_yok">Tükendi</option>
      </Select>
      <TextInput label="Kumaş" value={draft.fabric} onChange={e => set('fabric', e.target.value)} placeholder="ör. %100 viskon" />
      <TextInput label="Renk" value={draft.color} onChange={e => set('color', e.target.value)} placeholder="ör. Siyah, Bej" />
      <TextInput label="Bedenler" value={draft.sizes} onChange={e => set('sizes', e.target.value)} placeholder="ör. S, M, L" />
      <TextInput label="Ürün kodu" value={draft.sku} onChange={e => set('sku', e.target.value)} />
    </div>
  )
}

/** Firma seçimi: mevcut firma ya da yeni firma adı */
export function SupplierPicker({
  suppliers,
  value,
  newName,
  onChange,
}: {
  suppliers: Supplier[]
  value: string
  newName: string
  onChange: (value: string, newName: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Select label="Firma" value={value} onChange={e => onChange(e.target.value, newName)}>
        <option value="">Firma yok</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
        <option value={NEW_SUPPLIER}>Yeni firma ekle…</option>
      </Select>
      {value === NEW_SUPPLIER && (
        <TextInput
          label="Yeni firma adı"
          required
          value={newName}
          onChange={e => onChange(NEW_SUPPLIER, e.target.value)}
          placeholder="ör. Fame Tekstil"
        />
      )}
    </div>
  )
}

/** Kayıt API'sine gönderilecek gövde */
export function buildSaveBody(
  draft: SupplierProductDraft,
  supplierValue: string,
  newSupplierName: string,
  adminProductId?: string | null,
) {
  const rawMeta = { ...(draft.raw_metadata || {}) }
  delete (rawMeta as Record<string, unknown>).sizes
  return {
    action: 'save_product',
    supplier_id: supplierValue && supplierValue !== NEW_SUPPLIER ? supplierValue : null,
    supplier_name: supplierValue === NEW_SUPPLIER ? newSupplierName.trim() : '',
    admin_product_id: adminProductId || null,
    title: draft.title.trim(),
    product_url: draft.product_url.trim(),
    sku: draft.sku.trim(),
    price: Number(draft.price) || 0,
    stock_status: draft.stock_status,
    color: draft.color.trim(),
    fabric: draft.fabric.trim(),
    sizes: draft.sizes.trim(),
    description: draft.description,
    image_url: draft.image_url,
    // Eski kayıtta tarama verisi yoksa null gider; API yine de bedenleri ekler
    raw_metadata: draft.raw_metadata == null ? null : rawMeta,
  }
}
