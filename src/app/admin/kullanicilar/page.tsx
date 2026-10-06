'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ChevronRight, Mail, MapPin, Phone, Search, Trash2, Users } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Select, Table, Tabs, Td, TextInput, Th } from '@/components/admin/ui'
import { ConfirmDialog, SidePanel } from '@/components/admin/ui/AdminDialog'
import {
  countsAsRevenue,
  createAdminBrowserClient,
  errorMessage,
  formatDate,
  orderNo,
  statusMeta,
} from '@/components/admin/ui/orderHelpers'
import { formatTL } from '@/lib/utils'

type Address = {
  id: string
  title: string | null
  full_name: string | null
  phone: string | null
  city: string | null
  district: string | null
  neighborhood: string | null
  address_line: string | null
  postal_code: string | null
  is_default: boolean | null
}

type UserOrder = { id: string; order_number: string | null; status: string | null; total: number | null; created_at: string | null }

type AdminUser = {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  role: string | null
  created_at: string | null
  addresses: Address[] | null
  orders: UserOrder[] | null
}

type RoleTab = 'tumu' | 'musteri' | 'yonetici'

const MIN_PASSWORD = 6

function spentOf(u: AdminUser) {
  return (u.orders || []).filter(o => countsAsRevenue(o.status)).reduce((s, o) => s + Number(o.total || 0), 0)
}

function phoneOf(u: AdminUser) {
  if (u.phone && u.phone !== '-') return u.phone
  return (u.addresses || []).find(a => a.phone)?.phone || ''
}

export default function AdminUsersPage() {
  const supabase = useMemo(() => createAdminBrowserClient(), [])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [roleTab, setRoleTab] = useState<RoleTab>('tumu')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', role: 'user', password: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      const data = (await res.json().catch(() => ({}))) as { users?: AdminUser[]; error?: string }
      if (!res.ok) throw new Error(data.error || 'Kullanıcılar alınamadı.')
      setUsers(data.users || [])
      setError(null)
    } catch (err) {
      setError(errorMessage(err, 'Kullanıcılar alınamadı.'))
    } finally {
      setLoading(false)
    }
  }, [])

  // İlk yükleme: load() içindeki setState çağrıları istek tamamlandıktan sonra çalışır
  useEffect(() => {
    const run = () => {
      load().catch(() => {})
    }
    run()
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null))
  }, [load, supabase])

  const selected = users.find(u => u.id === selectedId) || null
  const isSelf = !!selected && selected.id === myId

  const openUser = (u: AdminUser) => {
    setSelectedId(u.id)
    setForm({ full_name: u.full_name || '', email: u.email || '', role: u.role === 'admin' ? 'admin' : 'user', password: '' })
    setFormError(null)
  }

  const dirty =
    !!selected &&
    (form.full_name.trim() !== (selected.full_name || '') ||
      form.email.trim() !== (selected.email || '') ||
      form.role !== (selected.role === 'admin' ? 'admin' : 'user') ||
      form.password.length > 0)

  const save = async () => {
    if (!selected) return
    const email = form.email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setFormError('Geçerli bir e-posta adresi girin.')
    if (form.password && form.password.length < MIN_PASSWORD)
      return setFormError(`Yeni şifre en az ${MIN_PASSWORD} karakter olmalı.`)
    if (isSelf && form.role !== 'admin') return setFormError('Kendi yönetici yetkinizi kaldıramazsınız.')
    setFormError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selected.id,
          full_name: form.full_name.trim(),
          email,
          role: form.role,
          password: form.password || undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Kullanıcı güncellenemedi.')
      toast.success(form.password ? 'Bilgiler ve şifre güncellendi.' : 'Kullanıcı bilgileri güncellendi.')
      setForm(f => ({ ...f, password: '' }))
      await load()
    } catch (err) {
      const msg = errorMessage(err, 'Kullanıcı güncellenemedi.')
      setFormError(/duplicate|already|unique/i.test(msg) ? 'Bu e-posta başka bir hesapta kullanılıyor.' : msg)
    } finally {
      setSaving(false)
    }
  }

  const deleteKeyword = selected?.email || 'SİL'
  const confirmMatches = deleteConfirmText.trim().toLocaleLowerCase('tr') === deleteKeyword.toLocaleLowerCase('tr')

  const remove = async () => {
    if (!selected || isSelf || !confirmMatches) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(selected.id)}`, { method: 'DELETE' })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Kullanıcı silinemedi.')
      toast.success('Kullanıcı silindi.')
      setUsers(prev => prev.filter(u => u.id !== selected.id))
      setDeleteOpen(false)
      setSelectedId(null)
    } catch (err) {
      toast.error(errorMessage(err, 'Kullanıcı silinemedi.'))
    } finally {
      setDeleting(false)
    }
  }

  const searched = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr')
    if (!q) return users
    return users.filter(u =>
      [u.full_name || '', u.email || '', phoneOf(u)].some(v => v.toLocaleLowerCase('tr').includes(q)),
    )
  }, [users, query])

  const admins = searched.filter(u => u.role === 'admin')
  const customers = searched.filter(u => u.role !== 'admin')
  const list = roleTab === 'yonetici' ? admins : roleTab === 'musteri' ? customers : searched

  return (
    <div>
      <PageHeader title="Kullanıcılar" description={loading ? undefined : `${users.length} kayıtlı hesap`} />

      <div className="mb-4 max-w-md">
        <TextInput
          type="search"
          aria-label="Kullanıcılarda ara"
          placeholder="Ad, e-posta veya telefon"
          prefix={<Search className="h-4 w-4" />}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <Tabs
        tabs={[
          { value: 'tumu' as RoleTab, label: 'Tümü', count: searched.length },
          { value: 'musteri' as RoleTab, label: 'Müşteriler', count: customers.length },
          { value: 'yonetici' as RoleTab, label: 'Yöneticiler', count: admins.length },
        ]}
        value={roleTab}
        onChange={setRoleTab}
      />

      {error && (
        <div className="mb-4">
          <Notice tone="danger" title="Kullanıcılar yüklenemedi">
            <p>{error}</p>
            <button
              type="button"
              className="mt-1 font-medium underline"
              onClick={() => {
                setLoading(true)
                load()
              }}
            >
              Tekrar dene
            </button>
          </Notice>
        </div>
      )}

      {loading ? (
        <div className="h-80 animate-pulse rounded-lg border border-[#E7E3DE] bg-white" aria-busy="true" aria-label="Kullanıcılar yükleniyor" />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title={query ? 'Aramanızla eşleşen kullanıcı yok' : 'Bu listede kullanıcı yok'}
            description={query ? 'Adı, e-postayı veya telefonu kontrol edin ya da aramayı temizleyin.' : 'Müşteriler siteye üye olduğunda burada görünür.'}
            action={
              query ? (
                <Button variant="secondary" onClick={() => setQuery('')}>
                  Aramayı temizle
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card padded={false}>
          <Table>
            <thead>
              <tr>
                <Th>Ad soyad</Th>
                <Th className="hidden md:table-cell">E-posta</Th>
                <Th className="hidden lg:table-cell">Telefon</Th>
                <Th>Rol</Th>
                <Th className="hidden md:table-cell">Kayıt</Th>
                <Th className="text-right">Sipariş</Th>
                <Th className="text-right">Harcama</Th>
                <Th className="w-10">
                  <span className="sr-only">Ayrıntı</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {list.map(u => (
                <tr key={u.id} className="cursor-pointer transition-colors hover:bg-[#FAF9F7]" onClick={() => openUser(u)}>
                  <Td>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        openUser(u)
                      }}
                      className="text-left font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
                    >
                      {u.full_name || 'İsimsiz kullanıcı'}
                      {u.id === myId && <span className="ml-1.5 text-xs font-normal text-kul">(siz)</span>}
                    </button>
                    <p className="max-w-[12rem] truncate text-xs text-kul md:hidden">{u.email}</p>
                  </Td>
                  <Td className="hidden max-w-[16rem] truncate md:table-cell">{u.email || '-'}</Td>
                  <Td className="hidden whitespace-nowrap text-kul lg:table-cell">{phoneOf(u) || '-'}</Td>
                  <Td>{u.role === 'admin' ? <Badge tone="accent">Yönetici</Badge> : <Badge>Müşteri</Badge>}</Td>
                  <Td className="hidden whitespace-nowrap text-kul md:table-cell">{formatDate(u.created_at)}</Td>
                  <Td className="text-right tabular-nums">{(u.orders || []).length}</Td>
                  <Td className="whitespace-nowrap text-right tabular-nums">{formatTL(spentOf(u))}</Td>
                  <Td className="text-kul">
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Ayrıntı paneli */}
      <SidePanel
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.full_name || 'İsimsiz kullanıcı'}
        subtitle={selected ? `${selected.role === 'admin' ? 'Yönetici' : 'Müşteri'} · ${formatDate(selected.created_at)} tarihinde üye oldu` : undefined}
        footer={
          selected ? (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedId(null)}>
                Kapat
              </Button>
              <Button onClick={save} loading={saving} disabled={!dirty}>
                Değişiklikleri kaydet
              </Button>
            </div>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-7">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-[#EFEBE6] p-3">
                <p className="text-xs text-kul">Sipariş</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{(selected.orders || []).length}</p>
              </div>
              <div className="rounded-md border border-[#EFEBE6] p-3">
                <p className="text-xs text-kul">Harcama</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{formatTL(spentOf(selected))}</p>
              </div>
            </div>

            <section className="space-y-1.5 text-[13px]">
              <h3 className="mb-2 text-sm font-semibold">İletişim</h3>
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="flex items-center gap-2 break-all hover:underline">
                  <Mail className="h-4 w-4 shrink-0 text-kul" /> {selected.email}
                </a>
              )}
              {phoneOf(selected) ? (
                <a href={`tel:${phoneOf(selected).replace(/\s/g, '')}`} className="flex items-center gap-2 hover:underline">
                  <Phone className="h-4 w-4 shrink-0 text-kul" /> {phoneOf(selected)}
                </a>
              ) : (
                <p className="text-kul">Telefon kayıtlı değil.</p>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Adresler</h3>
              {(selected.addresses || []).length === 0 ? (
                <p className="text-[13px] text-kul">Kayıtlı adres yok.</p>
              ) : (
                <ul className="space-y-2">
                  {(selected.addresses || []).map(a => (
                    <li key={a.id} className="flex gap-2 rounded-md border border-[#EFEBE6] p-3 text-[13px]">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-kul" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          {a.title || 'Adres'}
                          {a.is_default && <Badge className="ml-2">Varsayılan</Badge>}
                        </p>
                        <p>{a.full_name}{a.phone ? ` · ${a.phone}` : ''}</p>
                        <p className="text-kul">
                          {[a.neighborhood, a.address_line].filter(Boolean).join(', ')} {[a.district, a.city].filter(Boolean).join(' / ')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Siparişler</h3>
              {(selected.orders || []).length === 0 ? (
                <p className="text-[13px] text-kul">Henüz sipariş vermemiş.</p>
              ) : (
                <ul className="divide-y divide-[#F3F0EC] rounded-md border border-[#EFEBE6]">
                  {[...(selected.orders || [])]
                    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
                    .map(o => {
                      const m = statusMeta(o.status)
                      return (
                        <li key={o.id}>
                          <Link
                            href={`/admin/siparisler/${o.id}`}
                            className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-[#FAF9F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
                          >
                            <div className="min-w-0">
                              <p className="font-medium tabular-nums">{orderNo(o)}</p>
                              <p className="text-xs text-kul">{formatDate(o.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge tone={m.tone}>{m.label}</Badge>
                              <span className="whitespace-nowrap tabular-nums">{formatTL(o.total)}</span>
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold">Bilgileri düzenle</h3>
              <form
                className="space-y-4"
                onSubmit={e => {
                  e.preventDefault()
                  save()
                }}
              >
                <TextInput label="Ad soyad" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                <TextInput
                  label="E-posta"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  hint="Kullanıcı bu adresle giriş yapar."
                  required
                />
                <Select
                  label="Rol"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  disabled={isSelf}
                  hint={isSelf ? 'Kendi yönetici yetkinizi kaldıramazsınız.' : undefined}
                >
                  <option value="user">Müşteri</option>
                  <option value="admin">Yönetici</option>
                </Select>
                {!isSelf && form.role === 'admin' && selected.role !== 'admin' && (
                  <Notice tone="warning">Bu kişi yönetim paneline tam erişim kazanır.</Notice>
                )}
                <TextInput
                  label="Yeni şifre"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  hint={`Değiştirmeyecekseniz boş bırakın. En az ${MIN_PASSWORD} karakter.`}
                />
                {formError && <Notice tone="danger">{formError}</Notice>}
                <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
              </form>
            </section>

            <section className="rounded-md border border-rose-200 p-4">
              <h3 className="text-sm font-semibold text-rose-700">Kullanıcıyı sil</h3>
              {isSelf ? (
                <p className="mt-1 text-[13px] text-kul">Kendi hesabınızı buradan silemezsiniz.</p>
              ) : (
                <>
                  <p className="mt-1 text-[13px] text-kul">
                    Hesap, adresleri ve yorumları kalıcı olarak silinir.
                    {(selected.orders || []).length > 0 && ` ${(selected.orders || []).length} siparişi de silinir ve ciro raporlarından düşer.`}
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    className="mt-3"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => {
                      setDeleteConfirmText('')
                      setDeleteOpen(true)
                    }}
                  >
                    Kullanıcıyı sil
                  </Button>
                </>
              )}
            </section>
          </div>
        )}
      </SidePanel>

      <ConfirmDialog
        open={deleteOpen && !!selected && !isSelf}
        onClose={() => setDeleteOpen(false)}
        onConfirm={remove}
        loading={deleting}
        tone="danger"
        confirmDisabled={!confirmMatches}
        title="Kullanıcıyı kalıcı olarak sil"
        message={
          selected && (selected.orders || []).length > 0
            ? `Bu işlem geri alınamaz. ${(selected.orders || []).length} sipariş kaydı da silinecek.`
            : 'Bu işlem geri alınamaz.'
        }
        confirmLabel="Kullanıcıyı sil"
      >
        <div className="pb-2">
          <TextInput
            label={
              <>
                Onaylamak için <span className="font-semibold">{deleteKeyword}</span> yazın
              </>
            }
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            autoComplete="off"
            data-autofocus
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
