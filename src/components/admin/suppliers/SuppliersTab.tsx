'use client'

import { Building2, ExternalLink, Mail, Pencil, Phone, Plus, Trash2, User } from 'lucide-react'
import { Button, Card, EmptyState } from '@/components/admin/ui'
import type { Supplier, SupplierProduct } from './types'

export function SuppliersTab({
  suppliers,
  products,
  onAdd,
  onEdit,
  onDelete,
}: {
  suppliers: Supplier[]
  products: SupplierProduct[]
  onAdd: () => void
  onEdit: (s: Supplier) => void
  onDelete: (s: Supplier) => void
}) {
  if (suppliers.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="Kayıtlı firma yok"
          description="Link ile ürün eklediğinizde firma otomatik oluşur. Elle de ekleyebilirsiniz."
          action={
            <Button onClick={onAdd} icon={<Plus className="h-4 w-4" />}>
              Firma ekle
            </Button>
          }
        />
      </Card>
    )
  }

  const countOf = (id: string) => products.filter(p => p.supplier_id === id).length

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {suppliers.map(s => (
        <section key={s.id} className="flex flex-col rounded-lg border border-[#E7E3DE] bg-white">
          <div className="flex items-start justify-between gap-3 border-b border-[#EFEBE6] px-5 py-4">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-ink">{s.name}</h3>
              <p className="truncate text-xs text-kul">
                {s.domain || 'Web sitesi yok'} · {countOf(s.id)} ürün
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(s)}
                aria-label={`${s.name} firmasını düzenle`}
                className="rounded-md p-2 text-kul hover:bg-[#F1EEEA] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(s)}
                aria-label={`${s.name} firmasını sil`}
                className="rounded-md p-2 text-kul hover:bg-rose-50 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <dl className="flex-1 space-y-2 px-5 py-4 text-[13px]">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-kul" aria-hidden />
              <dt className="sr-only">Yetkili</dt>
              <dd className={s.contact_person ? 'text-ink' : 'text-kul'}>{s.contact_person || 'Yetkili yok'}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-kul" aria-hidden />
              <dt className="sr-only">Telefon</dt>
              <dd>
                {s.phone ? (
                  <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="text-ink hover:underline">
                    {s.phone}
                  </a>
                ) : (
                  <span className="text-kul">Telefon yok</span>
                )}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-kul" aria-hidden />
              <dt className="sr-only">E-posta</dt>
              <dd className="min-w-0 truncate">
                {s.email ? (
                  <a href={`mailto:${s.email}`} className="text-ink hover:underline">
                    {s.email}
                  </a>
                ) : (
                  <span className="text-kul">E-posta yok</span>
                )}
              </dd>
            </div>
            {s.notes && <p className="border-t border-[#F3F0EC] pt-2 text-xs text-kul">{s.notes}</p>}
          </dl>
          {s.website_url && (
            <div className="border-t border-[#EFEBE6] px-5 py-3">
              <a
                href={s.website_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Siteyi aç
              </a>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
