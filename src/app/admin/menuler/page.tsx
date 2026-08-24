// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Menu as MenuIcon, MoveUp, MoveDown, Check, X } from 'lucide-react'

const INITIAL_DEMO_MENUS = [
  { id: 'menu-1', title: 'Tüm Ürünler', url: '/urunler', location: 'header', sort_order: 1, is_active: true },
  { id: 'menu-2', title: 'Üst Giyim', url: '/kategori/ust-giyim', location: 'header', sort_order: 2, is_active: true },
  { id: 'menu-3', title: 'Alt Giyim', url: '/kategori/alt-giyim', location: 'header', sort_order: 3, is_active: true },
  { id: 'menu-4', title: 'İç Giyim', url: '/kategori/ic-giyim', location: 'header', sort_order: 4, is_active: true },
  { id: 'menu-5', title: 'Dış Giyim', url: '/kategori/dis-giyim', location: 'header', sort_order: 5, is_active: true },
  { id: 'menu-6', title: 'Takımlar', url: '/kategori/takimlar', location: 'header', sort_order: 6, is_active: true },
  { id: 'menu-7', title: 'Hakkımızda', url: '/hakkimizda', location: 'header', sort_order: 7, is_active: true },
  { id: 'menu-8', title: 'Sipariş Takibi', url: '/hesabim', location: 'footer', sort_order: 1, is_active: true },
  { id: 'menu-9', title: 'İade & Değişim', url: '/hakkimizda', location: 'footer', sort_order: 2, is_active: true },
  { id: 'menu-10', title: 'Gizlilik Politikası', url: '/hakkimizda', location: 'footer', sort_order: 3, is_active: true }
];

export default function AdminMenuPage() {
  const supabase = createClient()
  const [menus, setMenus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'header' | 'footer'>('header')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    location: 'header',
    sort_order: 1,
    is_active: true
  })

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('navigation_menus' as any)
        .select('*')
        .order('sort_order', { ascending: true })

      if (!error && data && data.length > 0) {
        setMenus(data)
      } else {
        setMenus(INITIAL_DEMO_MENUS)
      }
    } catch (err) {
      console.error('Error fetching menus:', err)
      setMenus(INITIAL_DEMO_MENUS)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingMenu(null)
    setFormData({
      title: '',
      url: '/kategori/',
      location: activeTab,
      sort_order: menus.filter(m => m.location === activeTab).length + 1,
      is_active: true
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (menu: any) => {
    setEditingMenu(menu)
    setFormData({
      title: menu.title || '',
      url: menu.url || '',
      location: menu.location || 'header',
      sort_order: menu.sort_order || 1,
      is_active: menu.is_active ?? true
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingMenu) {
        // Update existing menu
        const { error } = await supabase
          .from('navigation_menus' as any)
          .update({
            title: formData.title,
            url: formData.url,
            location: formData.location,
            sort_order: Number(formData.sort_order),
            is_active: formData.is_active
          })
          .eq('id', editingMenu.id)

        if (error) {
          setMenus(menus.map(m => m.id === editingMenu.id ? { ...m, ...formData } : m))
        } else {
          fetchMenus()
        }
      } else {
        // Create new menu item
        const newMenu = {
          id: `menu-${Date.now()}`,
          title: formData.title,
          url: formData.url,
          location: formData.location,
          sort_order: Number(formData.sort_order),
          is_active: formData.is_active
        }

        const { error } = await supabase
          .from('navigation_menus' as any)
          .insert([newMenu])

        if (error) {
          setMenus([...menus, newMenu])
        } else {
          fetchMenus()
        }
      }

      setIsModalOpen(false)
    } catch (err) {
      console.error('Error saving menu:', err)
      setIsModalOpen(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu menü bağlantısını silmek istediğinize emin misiniz?')) {
      try {
        await supabase.from('navigation_menus' as any).delete().eq('id', id)
        setMenus(menus.filter(m => m.id !== id))
      } catch (err) {
        setMenus(menus.filter(m => m.id !== id))
      }
    }
  }

  const filteredMenus = menus
    .filter(m => (m.location || 'header') === activeTab)
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6 font-inter max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">Menü Yönetimi</h1>
          <p className="text-xs text-gray-500 mt-1">Sitenizin üst gezinme menüsünü (Header Navigation) ve alt bilgi linklerini (Footer) düzenleyin.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-4 py-2 rounded-xs flex items-center space-x-2 transition-colors text-xs uppercase font-semibold tracking-wider shadow-md cursor-pointer"
        >
          <Plus size={18} />
          <span>Yeni Menü Elemanı Ekle</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white p-2 rounded-lg shadow-xs gap-2">
        <button
          onClick={() => setActiveTab('header')}
          className={`flex-1 py-2.5 rounded-xs text-xs font-semibold transition-all cursor-pointer text-center ${
            activeTab === 'header' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Üst Menü (Header Navigation Bar)
        </button>
        <button
          onClick={() => setActiveTab('footer')}
          className={`flex-1 py-2.5 rounded-xs text-xs font-semibold transition-all cursor-pointer text-center ${
            activeTab === 'footer' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Alt Bilgi Linkleri (Footer Links)
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Sıra</th>
                <th className="px-4 py-3">Menü Başlığı</th>
                <th className="px-4 py-3">Yönlendirme Bağlantısı (URL)</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td></tr>
              ) : filteredMenus.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Bu bölümde henüz menü elemanı yok.</td></tr>
              ) : (
                filteredMenus.map((menu, idx) => (
                  <tr key={menu.id} className="border-b hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-bold text-[#C5A572]">
                      #{menu.sort_order || idx + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1A1A1A]">
                      <div className="flex items-center gap-2">
                        <MenuIcon className="w-4 h-4 text-gray-400" />
                        <span>{menu.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">
                      {menu.url}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-xs text-[10px] font-bold ${menu.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                        {menu.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEditModal(menu)}
                        className="inline-flex p-1.5 text-blue-600 hover:bg-blue-50 rounded-xs transition-colors cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(menu.id)}
                        className="inline-flex p-1.5 text-rose-600 hover:bg-rose-50 rounded-xs transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-playfair text-lg font-bold text-[#1A1A1A]">
                {editingMenu ? 'Menü Elemanını Düzenle' : 'Yeni Menü Elemanı Ekle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Menü Başlığı *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="ör. Abiye & Elbise"
                  className="w-full p-2.5 border rounded-xs text-xs font-medium" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Yönlendirme Linki (URL) *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.url} 
                  onChange={(e) => setFormData({...formData, url: e.target.value})} 
                  placeholder="ör. /kategori/elbise veya /urunler"
                  className="w-full p-2.5 border rounded-xs text-xs font-mono" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Menü Konumu</label>
                  <select 
                    value={formData.location} 
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full p-2.5 border rounded-xs text-xs font-medium bg-white"
                  >
                    <option value="header">Üst Menü (Header)</option>
                    <option value="footer">Alt Menü (Footer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sıralama Numarası</label>
                  <input 
                    type="number" 
                    value={formData.sort_order} 
                    onChange={(e) => setFormData({...formData, sort_order: Number(e.target.value)})} 
                    className="w-full p-2.5 border rounded-xs text-xs font-bold" 
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium pt-2">
                <input 
                  type="checkbox" 
                  checked={formData.is_active} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                  className="accent-[#C5A572] w-4 h-4 cursor-pointer" 
                />
                <span>Menü Elemanı Mağazada Aktif ve Görünür</span>
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 border text-xs font-semibold rounded-xs hover:bg-gray-100 cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white text-xs font-semibold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-md"
                >
                  {editingMenu ? 'Kaydet' : 'Menü Elemanı Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
