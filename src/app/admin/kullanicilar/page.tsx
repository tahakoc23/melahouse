// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/utils'
import { Users, Search, Mail, Phone, MapPin, ShoppingBag, ShieldCheck, RefreshCw, X, Eye, Trash2, Edit3, Lock, Check } from 'lucide-react'
import { Toast } from '@/components/ui/Toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all')
  const [selectedUser, setSelectedUser] = useState<any | null>(null)

  // Edit User State
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user')
  const [isSaving, setIsSaving] = useState(false)

  const [toast, setToast] = useState<{ isOpen: boolean; type: 'success' | 'error'; title?: string; message: string }>({
    isOpen: false,
    type: 'success',
    message: ''
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success', title?: string) => {
    setToast({ isOpen: true, type, title, message })
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kullanıcılar alınamadı.')
      setUsers(data.users || [])
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Kullanıcılar yüklenirken bir hata oluştu.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Open Edit Modal
  const handleOpenEdit = (user: any) => {
    setEditingUser(user)
    setEditFullName(user.full_name || '')
    setEditEmail(user.email || '')
    setEditPassword('')
    setEditRole(user.role === 'admin' ? 'admin' : 'user')
  }

  // Submit Edit User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          full_name: editFullName,
          email: editEmail,
          password: editPassword || undefined,
          role: editRole
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Güncelleme başarısız oldu.')

      showToast('Kullanıcı bilgileri başarıyla güncellendi.', 'success')
      setEditingUser(null)
      fetchUsers()
    } catch (err: any) {
      showToast(err.message || 'Güncelleme sırasında hata oluştu.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete User
  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`${user.full_name || user.email} isimli kullanıcıyı sistemden kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/users?userId=${user.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Silme işlemi başarısız.')

      showToast('Kullanıcı sistemden başarıyla silindi.', 'success')
      setUsers(prev => prev.filter(u => u.id !== user.id))
      if (selectedUser?.id === user.id) setSelectedUser(null)
    } catch (err: any) {
      showToast(err.message || 'Silme hatası.', 'error')
    }
  }

  const filteredUsers = users.filter(u => {
    const fullName = u.full_name || ''
    const email = u.email || ''
    const phone = u.phone || ''
    const city = u.addresses?.[0]?.city || ''
    
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          phone.includes(searchTerm) ||
                          city.toLowerCase().includes(searchTerm.toLowerCase())

    if (roleFilter === 'admin') return matchesSearch && u.role === 'admin'
    if (roleFilter === 'user') return matchesSearch && u.role !== 'admin'
    return matchesSearch
  })

  const totalUsersCount = users.length
  const adminCount = users.filter(u => u.role === 'admin').length
  const customerCount = users.filter(u => u.role !== 'admin').length

  return (
    <div className="space-y-6 text-xs font-inter max-w-7xl mx-auto pb-12">
      <Toast 
        isOpen={toast.isOpen}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">Kullanıcılar &amp; Müşteri Yönetimi</h1>
          <p className="text-gray-500 text-[11px] mt-0.5">Sisteme kayıtlı kullanıcıları inceleyin, bilgilerini düzenleyin veya kullanıcı silin.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-3.5 py-2 rounded-xs border border-gray-200 shadow-2xs font-medium text-gray-700">
            Toplam Kullanıcı: <span className="font-bold text-[#1A1A1A]">{totalUsersCount}</span>
          </div>
          <div className="bg-[#1A1A1A] text-[#C5A572] px-3.5 py-2 rounded-xs font-bold shadow-2xs flex items-center gap-1.5">
            <ShieldCheck size={16} />
            <span>Yöneticiler: {adminCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xs shadow-xs border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Ad Soyad, E-posta, Telefon veya Şehir ile ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xs text-xs"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-4 py-2 rounded-xs font-semibold uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
              roleFilter === 'all' ? 'bg-[#1A1A1A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tümü ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('user')}
            className={`px-4 py-2 rounded-xs font-semibold uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
              roleFilter === 'user' ? 'bg-[#C5A572] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Müşteriler ({customerCount})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-4 py-2 rounded-xs font-semibold uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
              roleFilter === 'admin' ? 'bg-indigo-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Yöneticiler ({adminCount})
          </button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-white p-12 text-center text-gray-400 rounded-xs border border-gray-200">
          <RefreshCw className="w-8 h-8 animate-spin text-[#C5A572] mx-auto mb-2" />
          <p>Kullanıcı listesi yükleniyor...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-xs border border-dashed border-gray-200 space-y-2">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-1" />
          <p className="font-semibold text-sm">Arama kriterlerinize uygun kullanıcı bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xs overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 border-b border-gray-200 font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Kullanıcı Bilgileri</th>
                  <th className="px-4 py-3.5">İletişim</th>
                  <th className="px-4 py-3.5">Rol</th>
                  <th className="px-4 py-3.5">Kayıt Tarihi</th>
                  <th className="px-4 py-3.5">Sipariş</th>
                  <th className="px-4 py-3.5">Harcama</th>
                  <th className="px-4 py-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const isAdmin = user.role === 'admin'
                  const defaultAddr = user.addresses?.find((a: any) => a.is_default) || user.addresses?.[0]

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* User Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isAdmin ? 'bg-[#1A1A1A] text-[#C5A572]' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {(user.full_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[#1A1A1A] block">{user.full_name || 'İsimsiz Kullanıcı'}</span>
                            {defaultAddr && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin size={10} className="text-[#C5A572]" /> {defaultAddr.district} / {defaultAddr.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 space-y-0.5">
                        <p className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <Mail size={12} className="text-gray-400" />
                          <span>{user.email || '-'}</span>
                        </p>
                        {user.phone && (
                          <p className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                            <Phone size={12} className="text-gray-400" />
                            <span>{user.phone}</span>
                          </p>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isAdmin ? 'bg-black text-[#C5A572] border border-[#C5A572]/40' : 'bg-sky-50 text-sky-800 border border-sky-200'
                        }`}>
                          {isAdmin ? '👑 Admin' : '👤 Müşteri'}
                        </span>
                      </td>

                      {/* Registered Date */}
                      <td className="px-4 py-3.5 text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </td>

                      {/* Total Orders */}
                      <td className="px-4 py-3.5 font-semibold text-[#1A1A1A]">
                        {user.totalOrdersCount} Sipariş
                      </td>

                      {/* Total Spent */}
                      <td className="px-4 py-3.5 font-bold text-[#1A1A1A]">
                        {formatPrice(user.totalSpentAmount)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xs transition-colors cursor-pointer"
                          title="Detaylar"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xs transition-colors cursor-pointer"
                          title="Düzenle (E-posta, Şifre, Rol)"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xs transition-colors cursor-pointer"
                          title="Kullanıcıyı Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-inter text-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-xs border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-playfair font-semibold text-lg text-[#1A1A1A] flex items-center gap-2">
                  <Edit3 size={18} className="text-[#C5A572]" /> Kullanıcı Düzenle
                </h3>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-black p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs text-xs focus:ring-2 focus:ring-[#C5A572] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">E-Posta Adresi</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs text-xs focus:ring-2 focus:ring-[#C5A572] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                    <span>Yeni Şifre</span>
                    <span className="text-[10px] text-gray-400 font-normal">(Boş bırakırsanız değişmez)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Yeni şifre belirle..."
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs text-xs focus:ring-2 focus:ring-[#C5A572] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kullanıcı Rolü</label>
                  <select
                    value={editRole}
                    onChange={(e: any) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xs text-xs focus:ring-2 focus:ring-[#C5A572] outline-none bg-white font-semibold"
                  >
                    <option value="user">👤 Müşteri (Standart Kullanıcı)</option>
                    <option value="admin">👑 Yönetici (Admin)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xs text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs text-xs font-semibold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Kaydet</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-inter text-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-xs border border-gray-200 max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-[#C5A572] flex items-center justify-center font-bold text-sm">
                    {(selectedUser.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-playfair font-semibold text-lg text-[#1A1A1A] flex items-center gap-2">
                      {selectedUser.full_name || 'Kullanıcı Detayları'}
                      <span className="text-xs font-inter px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-normal">
                        {selectedUser.role === 'admin' ? 'Yönetici' : 'Müşteri'}
                      </span>
                    </h3>
                    <p className="text-gray-400 text-[11px]">Kayıt Tarihi: {new Date(selectedUser.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-black p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* Contact Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xs border border-gray-200">
                  <span className="text-gray-400 text-[10px] uppercase font-bold block">E-posta</span>
                  <span className="font-semibold text-gray-900 break-all">{selectedUser.email || '-'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xs border border-gray-200">
                  <span className="text-gray-400 text-[10px] uppercase font-bold block">Telefon</span>
                  <span className="font-semibold text-gray-900">{selectedUser.phone || '-'}</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-xs border border-amber-200">
                  <span className="text-amber-800 text-[10px] uppercase font-bold block">Toplam Harcama</span>
                  <span className="font-bold text-[#1A1A1A] text-sm">{formatPrice(selectedUser.totalSpentAmount)}</span>
                </div>
              </div>

              {/* Saved Addresses Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-[#1A1A1A] text-xs border-b pb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#C5A572]" /> Kayıtlı Adresleri ({selectedUser.addresses?.length || 0})
                </h4>

                {selectedUser.addresses?.length === 0 ? (
                  <p className="text-gray-400 text-xs italic">Kullanıcının henüz kayıtlı adresi bulunmuyor.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedUser.addresses?.map((addr: any) => (
                      <div key={addr.id} className="p-3 bg-gray-50 rounded-xs border border-gray-200 space-y-1">
                        <div className="flex justify-between items-center border-b pb-1">
                          <span className="font-bold text-gray-900 text-xs">{addr.title || 'Adres'}</span>
                          {addr.is_default && <span className="bg-[#C5A572] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs">Varsayılan</span>}
                        </div>
                        <p className="text-gray-800 font-semibold">{addr.full_name}</p>
                        <p className="text-gray-500 text-[11px]">{addr.phone}</p>
                        <p className="text-gray-700 text-xs mt-1">{addr.address_line}</p>
                        <p className="text-gray-500 text-[10px] font-medium">{addr.district} / {addr.city}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Order History */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-[#1A1A1A] text-xs border-b pb-1.5 flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-[#C5A572]" /> Sipariş Geçmişi ({selectedUser.orders?.length || 0})
                </h4>

                {selectedUser.orders?.length === 0 ? (
                  <p className="text-gray-400 text-xs italic">Kullanıcının henüz verilmiş bir siparişi yok.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedUser.orders?.map((ord: any) => (
                      <div key={ord.id} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xs border border-gray-200">
                        <div>
                          <span className="font-mono font-bold text-[#1A1A1A]">{ord.order_number || ord.id.slice(0, 8)}</span>
                          <span className="text-gray-400 text-[10px] block">{new Date(ord.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-800">
                          {ord.status}
                        </span>
                        <span className="font-bold text-[#1A1A1A]">{formatPrice(ord.total || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedUser)}
                  className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xs text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Edit3 size={14} /> Bilgileri Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-6 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
