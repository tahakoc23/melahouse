'use client'

import { useState } from 'react'
import { Button, TextArea, TextInput } from '@/components/admin/ui'
import { SiteDialog } from '@/components/admin/ui/SiteDialog'
import { notify } from '@/components/admin/ui/siteToast'
import { isValidHttpUrl, readJson, type Supplier } from './types'

type CompanyForm = {
  name: string
  website_url: string
  contact_person: string
  phone: string
  email: string
  notes: string
}

/** Firma ekle/düzenle. supplier verilirse düzenleme modundadır. */
export function SupplierCompanyDialog({
  supplier,
  onClose,
  onSaved,
}: {
  supplier: Supplier | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<CompanyForm>({
    name: supplier?.name || '',
    website_url: supplier?.website_url || '',
    contact_person: supplier?.contact_person || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    notes: supplier?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyForm, string>>>({})

  const set = (key: keyof CompanyForm, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Firma adı gerekli.'
    if (form.website_url.trim() && !isValidHttpUrl(form.website_url)) next.website_url = 'https:// ile başlayan tam adres girin.'
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Geçerli bir e-posta girin.'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      const body = {
        ...(supplier ? { id: supplier.id } : {}),
        name: form.name.trim(),
        website_url: form.website_url.trim(),
        contact_person: form.contact_person.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        notes: form.notes.trim(),
      }
      const res = await fetch('/api/admin/suppliers', {
        method: supplier ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await readJson<object>(res)
      if (!res.ok) throw new Error(data.error || 'Firma kaydedilemedi.')
      notify.success(supplier ? 'Firma bilgileri güncellendi.' : 'Firma eklendi.')
      onSaved()
      onClose()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Firma kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SiteDialog
      open
      onClose={onClose}
      title={supplier ? 'Firmayı düzenle' : 'Firma ekle'}
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          <Button type="submit" form="supplier-company-form" loading={saving}>
            {supplier ? 'Kaydet' : 'Firmayı ekle'}
          </Button>
        </>
      }
    >
      <form id="supplier-company-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <TextInput className="sm:col-span-2" label="Firma adı" required value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} />
        <TextInput
          className="sm:col-span-2"
          label="Web sitesi"
          type="url"
          placeholder="https://"
          value={form.website_url}
          onChange={e => set('website_url', e.target.value)}
          error={errors.website_url}
        />
        <TextInput label="Yetkili kişi" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} />
        <TextInput label="Telefon" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
        <TextInput className="sm:col-span-2" label="E-posta" type="email" value={form.email} onChange={e => set('email', e.target.value)} error={errors.email} />
        <TextArea className="sm:col-span-2" label="Notlar" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="ör. En az 10 adet sipariş" />
      </form>
    </SiteDialog>
  )
}
