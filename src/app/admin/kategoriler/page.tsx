'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CornerDownRight, Eye, EyeOff, FolderTree, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_TREE } from '@/components/product/catalog'
import { Badge, Button, Card, EmptyState, Notice, PageHeader } from '@/components/admin/ui'
import { useSiteConfirm } from '@/components/admin/ui/SiteConfirmDialog'
import { SiteRowMenu } from '@/components/admin/ui/SiteRowMenu'
import { notify } from '@/components/admin/ui/siteToast'
import { CategoryDialog, type CategoryFormValues, type CategoryRow } from '@/components/admin/categories/CategoryDialog'

/** Mağaza taksonomisindeki sıra (Üst Giyim, Alt Giyim, İç Giyim, Dış Giyim, Takımlar) */
const STATIC_ORDER = new Map<string, number>()
CATEGORY_TREE.forEach((c, i) => {
  STATIC_ORDER.set(c.slug, i * 100)
  c.subcategories?.forEach((s, j) => STATIC_ORDER.set(s.slug, i * 100 + j + 1))
})

const byOrder = (a: CategoryRow, b: CategoryRow) =>
  (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
  (STATIC_ORDER.get(a.slug) ?? 9999) - (STATIC_ORDER.get(b.slug) ?? 9999) ||
  a.name.localeCompare(b.name, 'tr')

type DialogState = { category: CategoryRow | null; parentId?: string } | null

export default function AdminCategoriesPage() {
  const supabase = useMemo(() => createClient(), [])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [saving, setSaving] = useState(false)
  const [grouping, setGrouping] = useState(false)
  const [confirm, confirmDialog] = useSiteConfirm()

  const fetchAll = useCallback(async () => {
    const [{ data: cats, error: cErr }, { data: prods, error: pErr }] = await Promise.all([
      supabase.from('categories').select('id, name, slug, description, image_url, parent_id, sort_order, is_active'),
      supabase.from('products').select('category_id'),
    ])
    if (cErr) throw cErr
    const c: Record<string, number> = {}
    if (!pErr) {
      for (const p of (prods || []) as { category_id: string | null }[]) {
        if (p.category_id) c[p.category_id] = (c[p.category_id] || 0) + 1
      }
    }
    return { cats: (cats || []) as CategoryRow[], counts: c }
  }, [supabase])

  const reload = useCallback(async () => {
    try {
      const d = await fetchAll()
      setCategories(d.cats)
      setCounts(d.counts)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Kategoriler alınamadı.')
    }
  }, [fetchAll])

  useEffect(() => {
    let active = true
    fetchAll()
      .then(d => {
        if (!active) return
        setCategories(d.cats)
        setCounts(d.counts)
      })
      .catch(err => active && setLoadError(err instanceof Error ? err.message : 'Kategoriler alınamadı.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [fetchAll])

  /* ---------------- Ağaç ---------------- */

  const ids = useMemo(() => new Set(categories.map(c => c.id)), [categories])
  const roots = useMemo(
    () => categories.filter(c => !c.parent_id || !ids.has(c.parent_id)).sort(byOrder),
    [categories, ids],
  )
  const childrenOf = useCallback((id: string) => categories.filter(c => c.parent_id === id).sort(byOrder), [categories])

  /** Taksonomiye göre bağlanabilecek alt kategoriler (henüz üst grubu olmayanlar) */
  const groupingPlan = useMemo(() => {
    const bySlug = new Map(categories.map(c => [c.slug, c]))
    const plan: { child: CategoryRow; parent: CategoryRow }[] = []
    for (const node of CATEGORY_TREE) {
      const parent = bySlug.get(node.slug)
      if (!parent) continue
      for (const sub of node.subcategories || []) {
        const child = bySlug.get(sub.slug)
        if (child && !child.parent_id && child.id !== parent.id) plan.push({ child, parent })
      }
    }
    return plan
  }, [categories])

  const q = query.trim().toLocaleLowerCase('tr')
  const matches = (c: CategoryRow) => !q || c.name.toLocaleLowerCase('tr').includes(q) || c.slug.includes(q)

  /* ---------------- İşlemler ---------------- */

  const save = async (values: CategoryFormValues) => {
    const editing = dialog?.category
    setSaving(true)
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        image_url: values.image_url || null,
        parent_id: values.parent_id || null,
        is_active: values.is_active,
      }
      if (editing) {
        const { error } = await supabase
          .from('categories')
          .update({ ...payload, updated_at: new Date().toISOString() } as never)
          .eq('id', editing.id)
        if (error) throw error
        notify.success('Kategori kaydedildi.')
      } else {
        const siblings = categories.filter(c => (c.parent_id || '') === (values.parent_id || ''))
        const sort_order = siblings.reduce((m, c) => Math.max(m, c.sort_order ?? 0), 0) + 1
        const { error } = await supabase.from('categories').insert({ ...payload, sort_order } as never)
        if (error) throw error
        notify.success('Kategori eklendi.')
      }
      setDialog(null)
      await reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || ''
      notify.error(/duplicate|unique/i.test(msg) ? 'Bu adres başka bir kategoride kullanılıyor.' : `Kaydedilemedi: ${msg || 'bilinmeyen hata'}`)
    } finally {
      setSaving(false)
    }
  }

  const setActive = async (c: CategoryRow, active: boolean) => {
    const { error } = await supabase.from('categories').update({ is_active: active } as never).eq('id', c.id)
    if (error) {
      notify.error(`Güncellenemedi: ${error.message}`)
      return
    }
    setCategories(prev => prev.map(x => (x.id === c.id ? { ...x, is_active: active } : x)))
    notify.success(active ? `"${c.name}" sitede görünüyor.` : `"${c.name}" gizlendi.`)
  }

  const remove = async (c: CategoryRow) => {
    const productCount = counts[c.id] || 0
    if (productCount > 0) {
      const hide = await confirm({
        title: 'Bu kategori silinemez',
        message: `"${c.name}" kategorisinde ${productCount} ürün var. Ürünleri başka kategoriye taşıyın ya da kategoriyi gizleyin.`,
        confirmLabel: c.is_active === false ? 'Tamam' : 'Kategoriyi gizle',
        cancelLabel: 'Vazgeç',
      })
      if (hide && c.is_active !== false) await setActive(c, false)
      return
    }
    const kids = childrenOf(c.id)
    const ok = await confirm({
      title: 'Kategori silinsin mi?',
      message: kids.length
        ? `"${c.name}" silinir. ${kids.length} alt kategorisi silinmez, ana kategori olarak kalır.`
        : `"${c.name}" kalıcı olarak silinir.`,
      confirmLabel: 'Sil',
      tone: 'danger',
    })
    if (!ok) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) {
      notify.error(`Silinemedi: ${error.message}`)
      return
    }
    notify.success('Kategori silindi.')
    await reload()
  }

  const applyGrouping = async () => {
    const ok = await confirm({
      title: 'Alt kategoriler gruplara bağlansın mı?',
      message: `${groupingPlan.length} kategori mağaza menüsündeki gruplarına bağlanır (ör. Elbise → Üst Giyim). Daha sonra tek tek değiştirebilirsiniz.`,
      confirmLabel: 'Grupları düzenle',
    })
    if (!ok) return
    setGrouping(true)
    try {
      const byParent = new Map<string, string[]>()
      groupingPlan.forEach(({ child, parent }) => byParent.set(parent.id, [...(byParent.get(parent.id) || []), child.id]))
      for (const [parentId, childIds] of byParent) {
        const { error } = await supabase.from('categories').update({ parent_id: parentId } as never).in('id', childIds)
        if (error) throw error
      }
      notify.success('Alt kategoriler gruplarına bağlandı.')
      await reload()
    } catch (err) {
      notify.error(`Düzenlenemedi: ${err instanceof Error ? err.message : (err as { message?: string })?.message || ''}`)
      await reload()
    } finally {
      setGrouping(false)
    }
  }

  /* ---------------- Görünüm ---------------- */

  const renderRow = (c: CategoryRow, depth: 0 | 1) => {
    const own = counts[c.id] || 0
    const kids = depth === 0 ? childrenOf(c.id) : []
    const total = own + kids.reduce((s, k) => s + (counts[k.id] || 0), 0)
    const hidden = c.is_active === false
    return (
      <li key={c.id} className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${depth ? 'bg-[#FCFBFA]' : ''}`}>
        {depth === 1 && <CornerDownRight className="ml-2 h-4 w-4 shrink-0 text-[#C9C2BA]" aria-hidden />}
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-[#E7E3DE] bg-[#F7F6F4]">
          {c.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
          )}
        </div>
        <button type="button" onClick={() => setDialog({ category: c })} className="min-w-0 flex-1 text-left">
          <span className={`flex flex-wrap items-center gap-2 text-sm ${depth === 0 ? 'font-semibold' : 'font-medium'} ${hidden ? 'text-kul' : 'text-ink'}`}>
            {c.name}
            {hidden && <Badge>Gizli</Badge>}
          </span>
          <span className="block truncate text-xs text-kul">/kategori/{c.slug}</span>
        </button>
        <span className="hidden w-28 shrink-0 text-right text-[13px] text-kul sm:block">
          {own} ürün
          {kids.length > 0 && total !== own && <span className="block text-xs">toplam {total}</span>}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setDialog({ category: c })} aria-label={`${c.name} düzenle`}>
            <Pencil className="h-4 w-4" />
            <span className="hidden md:inline">Düzenle</span>
          </Button>
          <SiteRowMenu
            label={`${c.name} için işlemler`}
            items={[
              ...(depth === 0
                ? [{ label: 'Alt kategori ekle', icon: <Plus className="h-4 w-4" />, onSelect: () => setDialog({ category: null, parentId: c.id }) }]
                : []),
              hidden
                ? { label: 'Sitede göster', icon: <Eye className="h-4 w-4" />, onSelect: () => setActive(c, true) }
                : { label: 'Gizle', icon: <EyeOff className="h-4 w-4" />, onSelect: () => setActive(c, false) },
              { label: 'Sil', icon: <Trash2 className="h-4 w-4" />, tone: 'danger' as const, onSelect: () => remove(c) },
            ]}
          />
        </div>
      </li>
    )
  }

  const visibleRoots = roots.filter(r => matches(r) || childrenOf(r.id).some(matches))

  return (
    <div className="mx-auto max-w-5xl pb-12">
      {confirmDialog}

      <PageHeader
        title="Kategoriler"
        description="Ürünlerin bağlandığı kategoriler ve alt kategoriler. Gizli kategoriler sitede görünmez."
        actions={
          <Button onClick={() => setDialog({ category: null })} icon={<Plus className="h-4 w-4" />}>
            Kategori ekle
          </Button>
        }
      />

      {loadError && (
        <div className="mb-5">
          <Notice tone="danger" title="Kategoriler yüklenemedi">
            {loadError}
          </Notice>
        </div>
      )}

      {!loading && groupingPlan.length > 0 && (
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-amber-900">
            {groupingPlan.length} alt kategori (Elbise, Pantolon, Ceket…) henüz bir üst gruba bağlı değil.
          </p>
          <Button size="sm" variant="secondary" onClick={applyGrouping} loading={grouping} icon={<FolderTree className="h-4 w-4" />}>
            Gruplara bağla
          </Button>
        </div>
      )}

      <Card padded={false}>
        <div className="border-b border-[#EFEBE6] p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kul" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Kategori ara"
              aria-label="Kategori ara"
              className="h-10 w-full rounded-md border border-[#DCD6CF] bg-white pl-9 pr-3 text-sm text-ink placeholder:text-[#A8A19A] focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-kul">
            <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            icon={<FolderTree className="h-5 w-5" />}
            title="Henüz kategori yok"
            action={
              <Button onClick={() => setDialog({ category: null })} icon={<Plus className="h-4 w-4" />}>
                Kategori ekle
              </Button>
            }
          />
        ) : visibleRoots.length === 0 ? (
          <EmptyState title="Eşleşen kategori yok" />
        ) : (
          <ul className="divide-y divide-[#F3F0EC]">
            {visibleRoots.map(r => {
              const kids = childrenOf(r.id).filter(k => matches(k) || matches(r))
              return (
                <li key={r.id}>
                  <ul className="divide-y divide-[#F3F0EC]">
                    {renderRow(r, 0)}
                    {kids.map(k => renderRow(k, 1))}
                  </ul>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {dialog && (
        <CategoryDialog
          key={dialog.category?.id || `new-${dialog.parentId || ''}`}
          category={dialog.category}
          defaultParentId={dialog.parentId}
          categories={categories}
          saving={saving}
          onClose={() => !saving && setDialog(null)}
          onSave={save}
        />
      )}
    </div>
  )
}
