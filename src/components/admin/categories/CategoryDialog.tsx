'use client'

import { useMemo, useState } from 'react'
import ImageUploader from '@/components/admin/ImageUploader'
import { Button, Field, Notice, Select, TextArea, TextInput, Toggle } from '@/components/admin/ui'
import { SiteDialog } from '@/components/admin/ui/SiteDialog'
import { slugifyTr } from '@/app/admin/urunler/_lib/slug'

export interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  sort_order: number | null
  is_active: boolean | null
}

export interface CategoryFormValues {
  name: string
  slug: string
  description: string
  image_url: string
  parent_id: string
  is_active: boolean
}

/** Kategori ekle/düzenle. category null ise yeni kayıt; defaultParentId alt kategori eklerken kullanılır. */
export function CategoryDialog({
  category,
  defaultParentId,
  categories,
  saving,
  onClose,
  onSave,
}: {
  category: CategoryRow | null
  defaultParentId?: string
  categories: CategoryRow[]
  saving: boolean
  onClose: () => void
  onSave: (values: CategoryFormValues) => void
}) {
  const [form, setForm] = useState<CategoryFormValues>({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    image_url: category?.image_url || '',
    parent_id: category?.parent_id || defaultParentId || '',
    is_active: category?.is_active ?? true,
  })
  // Yeni kategoride adres, ad yazıldıkça otomatik dolar (elle değiştirilene kadar)
  const [slugTouched, setSlugTouched] = useState(!!category)
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({})

  /** Kendisi ve alt kategorileri üst kategori olamaz */
  const parentOptions = useMemo(() => {
    if (!category) return categories.filter(c => !c.parent_id)
    const blocked = new Set<string>([category.id])
    let grew = true
    while (grew) {
      grew = false
      for (const c of categories) {
        if (c.parent_id && blocked.has(c.parent_id) && !blocked.has(c.id)) {
          blocked.add(c.id)
          grew = true
        }
      }
    }
    // Yalnızca üst seviye kategoriler grup olabilir (iki seviyeli yapı)
    return categories.filter(c => !blocked.has(c.id) && !c.parent_id)
  }, [categories, category])

  const hasChildren = !!category && categories.some(c => c.parent_id === category.id)
  const slugChanged = !!category && form.slug !== category.slug

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    const slug = slugifyTr(form.slug || form.name)
    if (!form.name.trim()) next.name = 'Kategori adı gerekli.'
    if (!slug) next.slug = 'Adres boş olamaz.'
    else if (categories.some(c => c.slug === slug && c.id !== category?.id)) next.slug = 'Bu adres başka bir kategoride kullanılıyor.'
    setErrors(next)
    if (Object.keys(next).length) return
    onSave({ ...form, name: form.name.trim(), slug, description: form.description.trim() })
  }

  return (
    <SiteDialog
      open
      onClose={onClose}
      title={category ? 'Kategoriyi düzenle' : 'Kategori ekle'}
      size="lg"
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          <Button type="submit" form="category-form" loading={saving}>
            {category ? 'Kaydet' : 'Kategoriyi ekle'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput
          label="Ad"
          required
          value={form.name}
          error={errors.name}
          placeholder="ör. Elbise"
          onChange={e => {
            const name = e.target.value
            setForm(f => ({ ...f, name, slug: slugTouched ? f.slug : slugifyTr(name) }))
            setErrors(er => ({ ...er, name: undefined }))
          }}
        />
        <TextInput
          label="Adres"
          prefix="/"
          value={form.slug}
          error={errors.slug}
          hint={slugChanged ? 'Adres değişirse eski kategori linki çalışmaz.' : `Sitede: /kategori/${form.slug || '…'}`}
          onChange={e => {
            setSlugTouched(true)
            setForm(f => ({ ...f, slug: e.target.value }))
            setErrors(er => ({ ...er, slug: undefined }))
          }}
          onBlur={() => setForm(f => ({ ...f, slug: slugifyTr(f.slug) }))}
        />
        <Select
          className="sm:col-span-2"
          label="Üst kategori"
          value={form.parent_id}
          disabled={hasChildren}
          hint={
            hasChildren
              ? 'Bu kategorinin alt kategorileri var; kendisi bir gruba bağlanamaz.'
              : 'Alt kategori ürünleri, üst kategorinin sayfasında da listelenir.'
          }
          onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
        >
          <option value="">Yok (ana kategori)</option>
          {parentOptions.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <TextArea
          className="sm:col-span-2"
          label="Açıklama"
          rows={3}
          value={form.description}
          hint="Kategori sayfasında ve arama sonuçlarında görünür."
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
        <Field className="sm:col-span-2" label="Görsel" hint="Ana sayfadaki kategori alanında kullanılır. Dikey fotoğraf önerilir.">
          <ImageUploader
            bucket="content"
            folder="kategoriler"
            maxFiles={1}
            existingImages={form.image_url ? [form.image_url] : []}
            onUploadSuccess={(urls: string[]) => setForm(f => ({ ...f, image_url: urls[0] || '' }))}
            onRemoveImage={() => setForm(f => ({ ...f, image_url: '' }))}
          />
        </Field>
        <div className="sm:col-span-2">
          <Toggle
            checked={form.is_active}
            onChange={v => setForm(f => ({ ...f, is_active: v }))}
            label="Sitede görünsün"
            description="Kapalıysa kategori sayfası açılmaz."
          />
        </div>
        {!form.is_active && hasChildren && (
          <div className="sm:col-span-2">
            <Notice tone="warning">Alt kategoriler ayrı ayrı açık kalır; onları da kapatmak isterseniz tek tek düzenleyin.</Notice>
          </div>
        )}
      </form>
    </SiteDialog>
  )
}
