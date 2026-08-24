// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit, Trash2, FolderPlus, Check, X, Layers } from 'lucide-react'

const INITIAL_DEMO_CATEGORIES = [
  { id: 'cat-1', name: 'Üst Giyim', slug: 'ust-giyim', description: 'Bluz, gömlek, t-shirt ve crop modelleri', parent_id: null, is_active: true },
  { id: 'cat-2', name: 'Elbise', slug: 'elbise', description: 'Abiye, gece elbiseleri ve günlük şık elbiseler', parent_id: null, is_active: true },
  { id: 'cat-3', name: 'Alt Giyim', slug: 'alt-giyim', description: 'Pantolon, etek ve şort tasarımları', parent_id: null, is_active: true },
  { id: 'cat-4', name: 'İç Giyim', slug: 'ic-giyim', description: 'İpek ve dantel detaylı lüks iç giyim parçaları', parent_id: null, is_active: true },
  { id: 'cat-5', name: 'Dış Giyim', slug: 'dis-giyim', description: 'Kaban, ceket ve trençkot koleksiyonu', parent_id: null, is_active: true },
  { id: 'cat-6', name: 'Takımlar', slug: 'takimlar', description: 'İki parçalı şık kadın ceket ve etek takımları', parent_id: null, is_active: true },
];

export default function AdminCategoriesPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    is_active: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('categories' as any)
        .select('*')
        .order('name', { ascending: true })

      if (!error && data && data.length > 0) {
        setCategories(data)
      } else {
        setCategories(INITIAL_DEMO_CATEGORIES)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      setCategories(INITIAL_DEMO_CATEGORIES)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      parent_id: '',
      is_active: true
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (cat: any) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      parent_id: cat.parent_id || '',
      is_active: cat.is_active ?? true
    })
    setIsModalOpen(true)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories' as any)
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            parent_id: formData.parent_id || null,
            is_active: formData.is_active
          })
          .eq('id', editingCategory.id)

        if (error) {
          // Fallback local state update if DB schema constraint
          setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } : c))
        } else {
          fetchCategories()
        }
      } else {
        // Add new category
        const newCat = {
          id: `cat-${Date.now()}`,
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          parent_id: formData.parent_id || null,
          is_active: formData.is_active
        }

        const { error } = await supabase
          .from('categories' as any)
          .insert([newCat])

        if (error) {
          setCategories([...categories, newCat])
        } else {
          fetchCategories()
        }
      }

      setIsModalOpen(false)
    } catch (err) {
      console.error('Error saving category:', err)
      setIsModalOpen(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
      try {
        await supabase.from('categories' as any).delete().eq('id', id)
        setCategories(categories.filter(c => c.id !== id))
      } catch (err) {
        setCategories(categories.filter(c => c.id !== id))
      }
    }
  }

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">Kategoriler Yönetimi</h1>
          <p className="text-xs text-gray-500 mt-1">Mağazanızdaki ürün kategorilerini ekleyin, düzenleyin veya pasifleştirin.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-4 py-2 rounded-xs flex items-center space-x-2 transition-colors text-xs uppercase font-semibold tracking-wider shadow-md cursor-pointer"
        >
          <Plus size={18} />
          <span>Yeni Kategori Ekle</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Kategori adı veya açıklama ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xs text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A572]"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Kategori Adı</th>
                <th className="px-4 py-3">Slug (URL)</th>
                <th className="px-4 py-3">Açıklama</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Kategori bulunamadı.</td></tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="border-b hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-semibold text-[#1A1A1A]">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#C5A572]" />
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500">
                      /kategori/{cat.slug}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {cat.description || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-xs text-[10px] font-bold ${cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                        {cat.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEditModal(cat)}
                        className="inline-flex p-1.5 text-blue-600 hover:bg-blue-50 rounded-xs transition-colors cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
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

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-playfair text-lg font-bold text-[#1A1A1A]">
                {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Adı *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={handleNameChange} 
                  placeholder="ör. Gece Elbiseleri"
                  className="w-full p-2.5 border rounded-xs text-xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Slug (Otomatik URL)</label>
                <input 
                  required 
                  type="text" 
                  value={formData.slug} 
                  onChange={(e) => setFormData({...formData, slug: e.target.value})} 
                  className="w-full p-2.5 border rounded-xs text-xs bg-gray-50 font-mono" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Açıklaması</label>
                <textarea 
                  rows={3} 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Kategori hakkında kısa açıklama..."
                  className="w-full p-2.5 border rounded-xs text-xs" 
                />
              </div>

              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium pt-2">
                <input 
                  type="checkbox" 
                  checked={formData.is_active} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                  className="accent-[#C5A572] w-4 h-4 cursor-pointer" 
                />
                <span>Kategori Mağazada Aktif ve Yayında</span>
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
                  {editingCategory ? 'Kaydet' : 'Kategori Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
