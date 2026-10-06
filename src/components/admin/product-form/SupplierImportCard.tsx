'use client'

import { useState } from 'react'
import { ChevronDown, Download, ExternalLink, Plus } from 'lucide-react'
import { Button, Notice, Select, TextInput } from '@/components/admin/ui'
import { createSupplier, scrapeSupplierUrl } from './data'
import { productToast } from './toast'
import type { ScrapedInfo, SupplierLinkState, SupplierRow } from './types'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export interface ImportReport {
  filled: string[]
  kept: string[]
}

/** Alan adından toptancıyı bulur (www. ve alt alan adları yok sayılır) */
export function matchSupplierByUrl(url: string, suppliers: SupplierRow[]): SupplierRow | null {
  let host = ''
  try {
    host = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
  if (!host) return null
  return (
    suppliers.find(s => {
      const cands = [s.domain, s.website_url]
        .filter(Boolean)
        .map(v => String(v).replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase())
      return cands.some(c => c && (host === c || host.endsWith(`.${c}`)))
    }) || null
  )
}

export default function SupplierImportCard({
  supplier,
  suppliers,
  onChange,
  onSupplierCreated,
  onImported,
  report,
  defaultOpen,
  sourceLabel,
}: {
  supplier: SupplierLinkState
  suppliers: SupplierRow[]
  onChange: (patch: Partial<SupplierLinkState>) => void
  onSupplierCreated: (s: SupplierRow) => void
  onImported: (data: ScrapedInfo, url: string) => void
  report: ImportReport | null
  defaultOpen: boolean
  /** Toptancılar sayfasından gelindiyse kısa bilgi */
  sourceLabel?: string | null
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [savingSupplier, setSavingSupplier] = useState(false)

  const linkedName = suppliers.find(s => s.id === supplier.supplierId)?.name
  const summary = linkedName || supplier.url ? `Bağlı: ${linkedName || 'toptancı'}` : 'İsteğe bağlı'

  const fetchInfo = async () => {
    const url = supplier.url.trim()
    if (!/^https?:\/\/\S+\.\S+/i.test(url)) {
      setFetchError('Toptancıdaki ürün sayfasının tam linkini yapıştırın (https:// ile başlar).')
      return
    }
    setFetching(true)
    setFetchError(null)
    try {
      const data = await scrapeSupplierUrl(url)
      onImported(data, url)
      if (!supplier.supplierId) {
        const match = matchSupplierByUrl(url, suppliers)
        if (match) onChange({ supplierId: match.id })
        else if (data.brand_name) {
          setNewName(data.brand_name)
          setAdding(true)
        }
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Ürün bilgileri alınamadı.')
    } finally {
      setFetching(false)
    }
  }

  const addSupplier = async () => {
    if (!newName.trim()) return
    setSavingSupplier(true)
    try {
      const created = await createSupplier(newName, supplier.url.trim() || undefined)
      onSupplierCreated(created)
      onChange({ supplierId: created.id })
      setNewName('')
      setAdding(false)
      productToast.success(`“${created.name}” toptancı olarak eklendi.`)
    } catch (err) {
      productToast.error(err instanceof Error ? err.message : 'Toptancı eklenemedi.')
    } finally {
      setSavingSupplier(false)
    }
  }

  return (
    <section className="rounded-lg border border-[#E7E3DE] bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="pf-import-body"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-4 rounded-lg px-5 py-4 text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-murdum/10 text-murdum">
            <Download className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold text-ink">Toptancıdan içe aktar</span>
            <span className="block truncate text-[13px] text-kul">
              {open ? 'Ürün linkini yapıştırın; ad, kumaş, renk, beden, alış fiyatı ve görsel otomatik dolsun.' : summary}
            </span>
          </span>
        </span>
        <ChevronDown aria-hidden className={cx('h-5 w-5 shrink-0 text-kul transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div id="pf-import-body" className="space-y-4 border-t border-[#EFEBE6] px-5 py-5">
          {sourceLabel && <Notice tone="accent">{sourceLabel}</Notice>}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <TextInput
              id="pf-supplier-url"
              className="flex-1"
              label="Toptancıdaki ürün linki"
              type="url"
              inputMode="url"
              placeholder="https://toptanci.com/urun/…"
              value={supplier.url}
              onChange={e => {
                onChange({ url: e.target.value })
                setFetchError(null)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  fetchInfo()
                }
              }}
              error={fetchError}
            />
            <Button type="button" variant="accent" onClick={fetchInfo} loading={fetching} disabled={!supplier.url.trim()} className={fetchError ? 'sm:mb-[22px]' : undefined}>
              {fetching ? 'Bilgiler getiriliyor…' : 'Bilgileri getir'}
            </Button>
          </div>

          {report && (
            <Notice tone="success" title="Bilgiler forma aktarıldı. Kaydetmeden önce kontrol edin.">
              {report.filled.length > 0 && <p>Doldurulan: {report.filled.join(', ')}.</p>}
              {report.kept.length > 0 && <p>Dokunulmayan (formda zaten dolu): {report.kept.join(', ')}.</p>}
              {report.filled.length === 0 && report.kept.length === 0 && <p>Sayfada kullanılabilir bilgi bulunamadı.</p>}
            </Notice>
          )}

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Select
              id="pf-supplier"
              label="Toptancı"
              value={supplier.supplierId}
              onChange={e => onChange({ supplierId: e.target.value })}
              hint="Sadece admin panelinde görünür; müşteriler görmez."
            >
              <option value="">Seçilmedi</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.domain ? ` · ${s.domain}` : ''}
                </option>
              ))}
            </Select>
            {!adding && (
              <Button type="button" variant="secondary" onClick={() => setAdding(true)} icon={<Plus className="h-4 w-4" />} className="sm:mb-[22px]">
                Yeni toptancı ekle
              </Button>
            )}
          </div>

          {adding && (
            <div className="flex flex-col gap-2 rounded-md bg-[#FAF9F7] p-3 sm:flex-row sm:items-end">
              <TextInput
                className="flex-1"
                label="Yeni toptancının adı"
                value={newName}
                autoFocus
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSupplier()
                  }
                  if (e.key === 'Escape') setAdding(false)
                }}
                placeholder="ör. İstanbul Tekstil Toptan"
              />
              <div className="flex gap-2">
                <Button type="button" onClick={addSupplier} loading={savingSupplier} disabled={!newName.trim()}>
                  Toptancıyı ekle
                </Button>
                <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                  Vazgeç
                </Button>
              </div>
            </div>
          )}

          {(supplier.url || supplier.supplierId) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
              {supplier.url && /^https?:\/\//i.test(supplier.url) && (
                <a href={supplier.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ink underline-offset-2 hover:underline">
                  Toptancı sayfasını aç <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              )}
              {supplier.linkId && (
                <button
                  type="button"
                  className="text-kul underline-offset-2 hover:text-rose-700 hover:underline cursor-pointer"
                  onClick={() => onChange({ url: '', supplierId: '' })}
                >
                  Toptancı bağlantısını kaldır
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
