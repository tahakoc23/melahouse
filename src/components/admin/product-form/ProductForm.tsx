'use client'

/**
 * Ürün ekleme ve düzenleme formu (tek bileşen).
 * /admin/urunler/yeni ve /admin/urunler/[id] bu bileşeni ince sarmalayıcılarla kullanır.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Loader2, PackageX } from 'lucide-react'
import {
  Button,
  Card,
  ChipGroup,
  EmptyState,
  Notice,
  PageHeader,
  Select,
  StickyActions,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/admin/ui'
import { ProductConfirmDialog } from '@/components/admin/ui/ProductConfirmDialog'
import ImageUploader from '@/components/admin/ImageUploader'
import { formatTurkishPrice, parseTurkishPrice } from '@/app/admin/urunler/_lib/price'
import { nextVariantSku, slugifyTr } from '@/app/admin/urunler/_lib/slug'
import { COLOR_PRESETS, DETAIL_OPTIONS, FABRIC_PRESETS, groupCategories, presetHex, trLower, type CategoryRow } from './constants'
import {
  emptyForm,
  loadCategories,
  loadProduct,
  loadSupplierProduct,
  loadSuppliers,
  saveProduct,
} from './data'
import { QuickChips, StepTitle } from './fields'
import { applyImport, type ImportedCostInfo, type ImportSource } from './importer'
import { activeVariants, validate, warnings, type SaveIntent } from './logic'
import PriceCard from './PriceCard'
import SummaryAside from './SummaryAside'
import SupplierImportCard, { type ImportReport } from './SupplierImportCard'
import { ProductToaster, productToast } from './toast'
import { FIELD_ANCHORS, type FieldKey, type ProductFormState, type SupplierRow } from './types'
import VariantStockCard from './VariantStockCard'

const COLOR_SWATCHES = Object.fromEntries(COLOR_PRESETS.map(c => [c.name, c.hex]))

interface Meta {
  originalSlug: string
  originalVariantIds: string[]
  extraTags: string[]
  isActiveSaved: boolean
}

export interface ProductFormProps {
  mode: 'create' | 'edit'
  productId?: string
  /** /admin/urunler/yeni?from_supplier=<supplier_products.id> */
  fromSupplierId?: string | null
}

export default function ProductForm({ mode, productId, fromSupplierId }: ProductFormProps) {
  const router = useRouter()
  const [initial] = useState(() => emptyForm())
  const [form, setForm] = useState<ProductFormState>(initial)
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial))
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>(
    mode === 'edit' || fromSupplierId ? 'loading' : 'ready',
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [meta, setMeta] = useState<Meta>({ originalSlug: '', originalVariantIds: [], extraTags: [], isActiveSaved: false })
  const [slugTouched, setSlugTouched] = useState(false)
  const [slugOpen, setSlugOpen] = useState(false)
  const [attempt, setAttempt] = useState<SaveIntent | null>(null)
  const [saving, setSaving] = useState<SaveIntent | null>(null)
  const [importReport, setImportReport] = useState<ImportReport | null>(null)
  const [importedCost, setImportedCost] = useState<ImportedCostInfo | null>(null)
  const [sourceLabel, setSourceLabel] = useState<string | null>(null)
  const [leaveHref, setLeaveHref] = useState<string | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  /* ---------------- Yükleme ---------------- */
  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const [cats, sups] = await Promise.all([loadCategories(), loadSuppliers().catch(() => [] as SupplierRow[])])
        if (cancelled) return
        setCategories(cats)
        setSuppliers(sups)
        setCategoriesLoading(false)

        if (mode === 'edit' && productId) {
          const loaded = await loadProduct(productId, cats)
          if (cancelled) return
          if (!loaded) {
            setStatus('notfound')
            return
          }
          setForm(loaded.state)
          setBaseline(JSON.stringify(loaded.state))
          setMeta({
            originalSlug: loaded.originalSlug,
            originalVariantIds: loaded.originalVariantIds,
            extraTags: loaded.extraTags,
            isActiveSaved: loaded.isActiveSaved,
          })
          setStatus('ready')
          return
        }

        if (fromSupplierId) {
          const row = await loadSupplierProduct(fromSupplierId).catch(() => null)
          if (cancelled) return
          if (row) {
            const start: ProductFormState = {
              ...initial,
              supplier: { ...initial.supplier, sourceId: row.id, supplierId: row.supplier_id || '', url: row.product_url || '' },
            }
            const r = applyImport(start, row as ImportSource, cats, { slugTouched: false, mode: 'create' })
            setForm(r.form)
            setImportReport({ filled: r.filled, kept: r.kept, missing: r.missing })
            setImportedCost(r.cost)
            const supName = sups.find(s => s.id === row.supplier_id)?.name
            setSourceLabel(
              row.admin_product_id
                ? `Bu toptancı ürünü zaten bir mağaza ürününe bağlı. Kaydederseniz bağlantı bu yeni ürüne taşınır.`
                : `${supName ? `${supName} toptancısındaki` : 'Toptancıdaki'} “${r.originalTitle || row.title || 'ürün'}” bilgileri aktarıldı.`,
            )
          } else {
            productToast.error('Toptancı ürünü bulunamadı. Formu boş başlatıyoruz.')
          }
          setStatus('ready')
        }
      } catch (err) {
        if (cancelled) return
        setCategoriesLoading(false)
        setLoadError(err instanceof Error ? err.message : 'Sayfa yüklenemedi.')
        setStatus('error')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [mode, productId, fromSupplierId, initial])

  /* ---------------- Türetilmiş değerler ---------------- */
  const snapshot = useMemo(() => JSON.stringify(form), [form])
  const dirty = status === 'ready' && snapshot !== baseline
  const errors = useMemo(() => (attempt ? validate(form, attempt, mode) : {}), [attempt, form, mode])
  const errorKeys = Object.keys(errors) as FieldKey[]
  const warns = useMemo(() => warnings(form), [form])
  const categoryGroups = useMemo(() => groupCategories(categories), [categories])
  const selectedCategory = categories.find(c => c.id === form.categoryId)
  const primaryColor = form.colors[0]
  const storeUrl = mode === 'edit' && meta.isActiveSaved && meta.originalSlug ? `/urunler/${meta.originalSlug}` : null

  const research = useMemo(
    () => ({
      name: form.name.trim(),
      category: selectedCategory?.name,
      color: primaryColor?.name.trim() || undefined,
      fabric: form.fabric.trim() || undefined,
      details: form.details,
    }),
    [form.name, form.fabric, form.details, selectedCategory?.name, primaryColor?.name],
  )

  const costHint = useMemo(() => {
    if (!importedCost || parseTurkishPrice(form.cost) !== importedCost.value) return null
    if (importedCost.net && importedCost.vatRate) {
      return `KDV dahil (KDV hariç ${formatTurkishPrice(importedCost.net)} ₺, %${importedCost.vatRate})`
    }
    return 'Toptancıdan alındı. KDV durumunu kontrol edin.'
  }, [importedCost, form.cost])

  /* ---------------- Ayrılırken uyarı ---------------- */
  useEffect(() => {
    if (!dirty || saving) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty, saving])

  // Uygulama içi linkler (menü, geri linki): kaydedilmemiş değişiklik varsa önce sor
  useEffect(() => {
    if (!dirty || saving) return
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const raw = a.getAttribute('href') || ''
      if (raw.startsWith('#')) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      e.preventDefault()
      e.stopPropagation()
      setLeaveHref(url.pathname + url.search + url.hash)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [dirty, saving])

  /* ---------------- Güncelleyiciler ---------------- */
  const patch = useCallback((p: Partial<ProductFormState>) => setForm(s => ({ ...s, ...p })), [])

  const setName = (name: string) =>
    setForm(s => ({ ...s, name, slug: mode === 'create' && !slugTouched ? slugifyTr(name) : s.slug }))

  const setPrimaryColor = (name: string) =>
    setForm(s => {
      const [first, ...rest] = s.colors
      const hex = presetHex(name) || (presetHex(first.name) ? '' : first.hex)
      return { ...s, colors: [{ ...first, name, hex }, ...rest] }
    })

  const toggleFabric = (chip: string) =>
    setForm(s => {
      const cur = s.fabric.trim()
      const has = trLower(cur).includes(trLower(chip))
      if (has) {
        const re = new RegExp(`\\s*,?\\s*${chip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'iu')
        return { ...s, fabric: cur.replace(re, '').replace(/^,\s*/, '').trim() }
      }
      return { ...s, fabric: cur ? `${cur}, ${chip}` : chip }
    })

  const onImported = (data: Parameters<typeof applyImport>[1], url: string) => {
    const r = applyImport(form, data, categories, { slugTouched, mode })
    setForm({
      ...r.form,
      supplier: { ...r.form.supplier, url, scraped: data as ProductFormState['supplier']['scraped'] },
    })
    setImportReport({ filled: r.filled, kept: r.kept, missing: r.missing })
    if (r.cost) setImportedCost(r.cost)
    productToast.success(r.filled.length ? 'Toptancı bilgileri forma aktarıldı.' : 'Sayfada yeni bilgi bulunamadı.')
  }

  /* ---------------- Kaydetme ---------------- */
  const save = async (intent: SaveIntent) => {
    if (saving) return
    const next: ProductFormState = { ...form, isActive: intent === 'publish' }
    const errs = validate(next, intent, mode)
    setAttempt(intent)
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        summaryRef.current?.focus({ preventScroll: true })
      })
      return
    }

    setSaving(intent)
    try {
      const res = await saveProduct(next, {
        mode,
        productId,
        originalSlug: meta.originalSlug,
        originalVariantIds: meta.originalVariantIds,
        extraTags: meta.extraTags,
        categories,
      })

      const viewLink = intent === 'publish' && (
        <a href={`/urunler/${res.slug}`} target="_blank" rel="noopener noreferrer" className="ml-1 font-medium underline">
          Mağazada görüntüle
        </a>
      )
      const doneMsg =
        mode === 'create'
          ? intent === 'publish'
            ? 'Ürün kaydedildi ve yayında.'
            : 'Ürün taslak olarak kaydedildi.'
          : intent === 'publish'
            ? 'Değişiklikler kaydedildi.'
            : 'Taslak olarak kaydedildi.'
      productToast.success(
        <span>
          {doneMsg}
          {viewLink}
        </span>,
        6000,
      )
      if (res.problems.length) {
        productToast.error(
          <span>
            Bazı adımlar tamamlanamadı:
            <br />
            {res.problems.map(p => (
              <span key={p} className="block">
                • {p}
              </span>
            ))}
          </span>,
          10000,
        )
      }

      if (mode === 'create') {
        setBaseline(JSON.stringify(next)) // yönlendirmede "kaydedilmedi" uyarısı çıkmasın
        setForm(next)
        router.replace(`/admin/urunler/${res.id}`)
        return
      }

      // Düzenleme: yeni varyant id'lerini işle; silinen/gizlenen varyantların hücreleri yeni SKU alır
      const removed = new Set(res.removedIds)
      const cells = { ...next.cells }
      for (const [k, c] of Object.entries(cells)) {
        if (res.insertedIds[k]) cells[k] = { ...c, id: res.insertedIds[k] }
        else if (c.id && removed.has(c.id)) cells[k] = { sku: '', stock: c.stock }
      }
      for (const [k, c] of Object.entries(cells)) {
        if (!c.id && !c.sku) cells[k] = { ...c, sku: nextVariantSku(next.mainSku, Object.values(cells)) }
      }
      const saved: ProductFormState = {
        ...next,
        slug: res.slug,
        cells,
        supplier: { ...next.supplier, linkId: res.linkId, sourceId: null, scraped: null },
      }
      const ids = new Set(meta.originalVariantIds.filter(id => !removed.has(id)))
      Object.values(res.insertedIds).forEach(id => ids.add(id))
      activeVariants(saved).forEach(v => v.cell.id && ids.add(v.cell.id))
      setForm(saved)
      setBaseline(JSON.stringify(saved))
      setMeta(m => ({ ...m, originalSlug: res.slug, originalVariantIds: Array.from(ids), isActiveSaved: saved.isActive }))
      setAttempt(null)
    } catch (err) {
      productToast.error(err instanceof Error ? err.message : 'Kaydedilemedi. Tekrar deneyin.')
    } finally {
      setSaving(null)
    }
  }

  // Ctrl/Cmd + S: düzenlemede mevcut duruma göre kaydeder
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  })
  useEffect(() => {
    if (mode !== 'edit') return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveRef.current(form.isActive ? 'publish' : 'draft')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, form.isActive])

  /* ---------------- Durum ekranları ---------------- */
  if (status === 'loading') {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2 text-sm text-kul" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        {mode === 'edit' ? 'Ürün yükleniyor…' : 'Toptancı ürünü yükleniyor…'}
      </div>
    )
  }
  if (status === 'notfound' || status === 'error') {
    return (
      <Card>
        <EmptyState
          icon={<PackageX className="h-5 w-5" />}
          title={status === 'notfound' ? 'Ürün bulunamadı' : 'Sayfa yüklenemedi'}
          description={status === 'notfound' ? 'Ürün silinmiş ya da bağlantı hatalı olabilir.' : loadError || undefined}
          action={
            <div className="flex gap-2">
              {status === 'error' && (
                <Button variant="secondary" onClick={() => window.location.reload()}>
                  Yeniden dene
                </Button>
              )}
              <Button href="/admin/urunler">Ürünlere dön</Button>
            </div>
          }
        />
      </Card>
    )
  }

  /* ---------------- Butonlar ---------------- */
  const showDraftButton = mode === 'create' || !form.isActive
  const primaryLabel = mode === 'edit' && form.isActive ? 'Değişiklikleri kaydet' : 'Kaydet ve yayınla'
  const buttons = (full: boolean) => (
    <>
      {showDraftButton && (
        <Button
          type="button"
          variant="secondary"
          className={full ? 'w-full' : undefined}
          loading={saving === 'draft'}
          disabled={!!saving}
          onClick={() => save('draft')}
        >
          Taslak olarak kaydet
        </Button>
      )}
      <Button
        type="button"
        className={full ? 'w-full' : undefined}
        loading={saving === 'publish'}
        disabled={!!saving}
        onClick={() => save('publish')}
      >
        {primaryLabel}
      </Button>
    </>
  )

  const statusLabel =
    mode === 'create'
      ? { text: 'Yeni ürün', tone: 'neutral' as const }
      : meta.isActiveSaved
        ? { text: 'Yayında', tone: 'success' as const }
        : { text: 'Taslak', tone: 'neutral' as const }

  const anchorOf = (k: FieldKey) => (k === 'colors' && form.colors.length === 1 ? { id: 'pf-color', label: 'Renk' } : FIELD_ANCHORS[k])
  const uniqueErrorAnchors = errorKeys.filter((k, i) => errorKeys.findIndex(x => anchorOf(x).id === anchorOf(k).id && errors[x] === errors[k]) === i)

  let step = 0
  return (
    <>
      <ProductToaster />
      <PageHeader
        title={mode === 'create' ? 'Yeni ürün' : 'Ürünü düzenle'}
        description={mode === 'create' ? 'Bilgileri doldurun, fiyatı piyasaya göre belirleyin, kaydedin.' : form.name || undefined}
        back={{ href: '/admin/urunler', label: 'Ürünler' }}
        actions={
          storeUrl ? (
            <Button variant="secondary" size="sm" href={storeUrl} icon={<ExternalLink className="h-4 w-4" />}>
              Mağazada görüntüle
            </Button>
          ) : undefined
        }
      />

      <form noValidate onSubmit={e => e.preventDefault()} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {attempt && errorKeys.length > 0 && (
            <div ref={summaryRef} tabIndex={-1} className="scroll-mt-24 outline-none">
              <Notice tone="danger" title={`Kaydetmeden önce ${uniqueErrorAnchors.length} alanı düzeltin`}>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {uniqueErrorAnchors.map(k => (
                    <li key={k}>
                      <a
                        href={`#${anchorOf(k).id}`}
                        className="underline underline-offset-2"
                        onClick={e => {
                          e.preventDefault()
                          const el = document.getElementById(anchorOf(k).id)
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          const focusable = el?.matches('input,select,textarea') ? el : el?.querySelector<HTMLElement>('input,select,textarea,button')
                          focusable?.focus({ preventScroll: true })
                        }}
                      >
                        {anchorOf(k).label}
                      </a>
                      : {errors[k]}
                    </li>
                  ))}
                </ul>
              </Notice>
            </div>
          )}

          {/* 1. Toptancıdan içe aktar */}
          <SupplierImportCard
            supplier={form.supplier}
            suppliers={suppliers}
            onChange={p => setForm(s => ({ ...s, supplier: { ...s.supplier, ...p } }))}
            onSupplierCreated={sup => setSuppliers(list => [sup, ...list.filter(x => x.id !== sup.id)])}
            onImported={onImported}
            report={importReport}
            defaultOpen={mode === 'create'}
            sourceLabel={sourceLabel}
          />

          {/* 2. Temel bilgiler */}
          <Card title={<StepTitle n={++step}>Temel bilgiler</StepTitle>}>
            <div className="space-y-5">
              <TextInput
                id="pf-name"
                label="Ürün adı"
                required
                value={form.name}
                onChange={e => setName(e.target.value)}
                error={errors.name}
                placeholder="ör. Saten Kruvaze Midi Elbise"
                hint="Müşterinin göreceği ad. Model ve kumaşı içeren kısa bir ad iyi çalışır."
                maxLength={120}
              />

              <Select
                id="pf-category"
                label="Kategori"
                required
                value={form.categoryId}
                onChange={e => patch({ categoryId: e.target.value })}
                error={errors.category}
                disabled={categoriesLoading}
              >
                <option value="">{categoriesLoading ? 'Kategoriler yükleniyor…' : 'Kategori seçin'}</option>
                {categoryGroups.map(g => (
                  <optgroup key={g.label} label={g.label}>
                    {g.options.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.is_active === false ? ' (pasif)' : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>

              <div>
                <TextInput
                  id="pf-color"
                  label={form.colors.length > 1 ? 'Ana renk' : 'Renk'}
                  required
                  value={primaryColor?.name || ''}
                  onChange={e => setPrimaryColor(e.target.value)}
                  placeholder="ör. Siyah"
                  error={errors.colors && !primaryColor?.name.trim() ? errors.colors : undefined}
                  hint={form.colors.length > 1 ? 'Diğer renkleri “Beden ve stok” bölümünde düzenleyin.' : undefined}
                />
                <QuickChips
                  label="Hazır renkler"
                  options={COLOR_PRESETS.map(c => c.name)}
                  swatches={COLOR_SWATCHES}
                  isActive={o => trLower(primaryColor?.name.trim() || '') === trLower(o)}
                  onPick={o => setPrimaryColor(trLower(primaryColor?.name.trim() || '') === trLower(o) ? '' : o)}
                />
              </div>

              <div>
                <TextInput
                  id="pf-fabric"
                  label="Kumaş"
                  value={form.fabric}
                  onChange={e => patch({ fabric: e.target.value })}
                  placeholder="ör. %100 Viskon"
                  hint="Biliyorsanız oranı da yazın; müşteriler ve fiyat araştırması için önemli."
                />
                <QuickChips
                  label="Hazır kumaşlar"
                  options={FABRIC_PRESETS}
                  isActive={o => trLower(form.fabric).includes(trLower(o))}
                  onPick={toggleFabric}
                />
              </div>

              <div>
                <p className="mb-1.5 text-[13px] font-medium text-ink">Model detayları</p>
                <ChipGroup options={DETAIL_OPTIONS.map(d => ({ value: d }))} value={form.details} onChange={v => patch({ details: DETAIL_OPTIONS.filter(d => v.includes(d)) })} />
                <p className="mt-1.5 text-xs text-kul">Uyanları seçin. Mağaza filtrelerinde ve fiyat araştırmasında kullanılır.</p>
              </div>

              <TextArea
                id="pf-description"
                label="Açıklama"
                rows={5}
                value={form.description}
                onChange={e => patch({ description: e.target.value })}
                placeholder="Kesim, boy, astar, kullanım önerisi…"
                hint={`Ürün sayfasında görünür. İlk 155 karakter Google açıklaması olur. (${form.description.trim().length} karakter)`}
              />

              <TextArea
                id="pf-care"
                label="Bakım talimatı"
                rows={2}
                value={form.care}
                onChange={e => patch({ care: e.target.value })}
                placeholder="ör. 30 °C’de tersten yıkayın, düşük ısıda ütüleyin."
              />

              {/* URL (gelişmiş) */}
              <div className="rounded-md bg-[#FAF9F7] px-3 py-2.5">
                {slugOpen || errors.slug ? (
                  <div className="space-y-2">
                    <TextInput
                      id="pf-slug"
                      label="Ürün adresi (URL)"
                      prefix="/"
                      value={form.slug}
                      onChange={e => {
                        setSlugTouched(true)
                        patch({ slug: e.target.value })
                      }}
                      onBlur={() => setForm(s => ({ ...s, slug: slugifyTr(s.slug) }))}
                      error={errors.slug}
                      hint={
                        mode === 'create'
                          ? 'Addan otomatik oluşur. Aynı adres varsa sonuna -2 eklenir.'
                          : 'Yayındaki ürünün adresini değiştirirseniz eski linkler çalışmaz.'
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSlugTouched(mode === 'edit')
                          patch({ slug: slugifyTr(form.name) })
                        }}
                        disabled={!form.name.trim()}
                      >
                        Addan oluştur
                      </Button>
                      {mode === 'edit' && form.slug !== meta.originalSlug && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => patch({ slug: meta.originalSlug })}>
                          Eski adrese dön
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="min-w-0 truncate text-kul">
                      Adres: <span className="font-mono text-ink">/urunler/{form.slug || slugifyTr(form.name) || '…'}</span>
                    </span>
                    <button type="button" onClick={() => setSlugOpen(true)} className="shrink-0 font-medium text-ink underline-offset-2 hover:underline cursor-pointer">
                      Değiştir
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 3. Görseller */}
          <div id="pf-images" className="scroll-mt-24">
            <Card
              title={<StepTitle n={++step}>Görseller</StepTitle>}
              description="İlk görsel kapak olur. Ön, arka ve detay olmak üzere 3–5 görsel idealdir."
            >
              <ImageUploader
                bucket="products"
                folder="urunler"
                existingImages={form.images}
                maxFiles={10}
                onUploadSuccess={urls => setForm(s => ({ ...s, images: [...s.images, ...urls.filter(u => !s.images.includes(u))] }))}
                onReorder={images => patch({ images })}
                onRemoveImage={url => setForm(s => ({ ...s, images: s.images.filter(i => i !== url) }))}
                altTexts={form.imageAlts}
                onAltTextChange={(url, alt) => setForm(s => ({ ...s, imageAlts: { ...s.imageAlts, [url]: alt } }))}
              />
              {form.images.length === 0 && attempt && <p className="mt-2 text-xs text-amber-800">Görsel eklemeden de kaydedebilirsiniz ama önerilmez.</p>}
            </Card>
          </div>

          {/* 4. Beden ve stok */}
          <VariantStockCard form={form} setForm={setForm} errors={errors} step={++step} />

          {/* 5. Fiyat */}
          <PriceCard
            form={form}
            onChange={p => patch(p)}
            errors={errors}
            step={++step}
            research={research}
            supplierProductId={form.supplier.sourceId || form.supplier.linkId || undefined}
            costHint={costHint}
          />

          {/* 6. Yayın */}
          <Card title={<StepTitle n={++step}>Yayın</StepTitle>}>
            <div className="divide-y divide-[#EFEBE6]">
              {mode === 'edit' && (
                <div className="pb-4">
                  <Toggle
                    checked={form.isActive}
                    onChange={v => patch({ isActive: v })}
                    label="Yayında"
                    description="Kapalıyken ürün mağazada görünmez (taslak). Değişiklik kaydedince uygulanır."
                  />
                </div>
              )}
              <div className={mode === 'edit' ? 'py-4' : 'pb-4'}>
                <Toggle checked={form.isFeatured} onChange={v => patch({ isFeatured: v })} label="Öne çıkan" description="Ana sayfadaki öne çıkanlar bölümünde gösterilir." />
              </div>
              <div className="py-4">
                <Toggle checked={form.isNew} onChange={v => patch({ isNew: v })} label="Yeni" description="Ürüne “Yeni” etiketi eklenir." />
              </div>
              <div className="pt-4">
                <Toggle
                  checked={form.outOfStock}
                  onChange={v => patch({ outOfStock: v })}
                  label="Tükendi olarak göster"
                  description="Stoklar silinmez; ürün sepete eklenemez. Kapatınca girilen stoklar yeniden geçerli olur."
                />
              </div>
            </div>
            {mode === 'create' && <p className="mt-4 text-xs text-kul">Yayın durumunu kaydederken seçersiniz: taslak ya da yayında.</p>}
          </Card>

          {/* Mobil kaydet çubuğu */}
          <div className="lg:hidden">
            <StickyActions note={dirty ? 'Kaydedilmemiş değişiklik var' : undefined}>{buttons(false)}</StickyActions>
          </div>
        </div>

        {/* Masaüstü özet */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <SummaryAside form={form} categoryName={selectedCategory?.name || ''} statusLabel={statusLabel} dirty={dirty} storeUrl={null}>
              {buttons(true)}
              {warns.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {warns.map(w => (
                    <li key={w.id} className="text-xs text-amber-800">
                      {w.text}
                    </li>
                  ))}
                </ul>
              )}
              {mode === 'edit' && <p className="pt-1 text-center text-xs text-kul">Kısayol: Ctrl + S</p>}
            </SummaryAside>
          </div>
        </aside>
      </form>

      <ProductConfirmDialog
        open={!!leaveHref}
        title="Değişiklikler kaydedilmedi"
        description="Sayfadan çıkarsanız yaptığınız değişiklikler kaybolur."
        confirmLabel="Kaydetmeden çık"
        cancelLabel="Sayfada kal"
        onCancel={() => setLeaveHref(null)}
        onConfirm={() => {
          const href = leaveHref
          setLeaveHref(null)
          setBaseline(snapshot)
          if (href) router.push(href)
        }}
      />
    </>
  )
}
