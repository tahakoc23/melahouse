// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, Save, Palette, Layers, ArrowUpDown, Check } from 'lucide-react';

export default function FilterManagementPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'categories' | 'colors' | 'sorting'>('categories');

  // Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', is_active: true });

  // Colors State (stored in site_content or local settings)
  const [colors, setColors] = useState<any[]>([
    { id: 'c-1', name: 'Siyah', hex: '#1A1A1A', is_active: true },
    { id: 'c-2', name: 'Şampanya', hex: '#E6D5C3', is_active: true },
    { id: 'c-3', name: 'Kırmızı', hex: '#D62828', is_active: true },
    { id: 'c-4', name: 'Altın', hex: '#C5A572', is_active: true },
    { id: 'c-5', name: 'Beyaz', hex: '#FFFFFF', is_active: true },
    { id: 'c-6', name: 'Lacivert', hex: '#1B263B', is_active: true },
    { id: 'c-7', name: 'Pudra', hex: '#F4C2C2', is_active: true },
  ]);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [colorForm, setColorForm] = useState({ name: '', hex: '#000000', is_active: true });

  // Products Sorting / Flags State
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Categories
    const { data: catData } = await supabase.from('categories').select('*').order('sort_order');
    if (catData && catData.length > 0) {
      setCategories(catData);
    } else {
      setCategories([
        { id: 'cat-1', name: 'Elbise & Abiye', slug: 'elbise-abiye', is_active: true },
        { id: 'cat-2', name: 'İç Giyim', slug: 'luks-ic-giyim', is_active: true },
        { id: 'cat-3', name: 'İpek & Saten', slug: 'ipek-saten', is_active: true },
      ]);
    }

    // Fetch Products for flags
    const { data: prodData } = await supabase.from('products').select('id, name, slug, base_price, is_new, is_featured, is_active');
    setProducts(prodData || []);
    setLoading(false);
  };

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) {
      const { error } = await supabase.from('categories').update(catForm).eq('id', editingCat.id);
      if (error) alert('Hata: ' + error.message);
    } else {
      const { error } = await supabase.from('categories').insert([catForm]);
      if (error) alert('Hata: ' + error.message);
    }
    setCatModalOpen(false);
    fetchData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) alert('Hata: ' + error.message);
      else setCategories(categories.filter(c => c.id !== id));
    }
  };

  // Color Actions
  const handleAddColor = (e: React.FormEvent) => {
    e.preventDefault();
    const newColor = { id: 'c-' + Date.now(), ...colorForm };
    setColors([...colors, newColor]);
    setColorModalOpen(false);
    setColorForm({ name: '', hex: '#000000', is_active: true });
    alert('Yeni renk başarıyla eklendi!');
  };

  const handleDeleteColor = (id: string) => {
    if (window.confirm('Bu rengi kaldırmak istediğinize emin misiniz?')) {
      setColors(colors.filter(c => c.id !== id));
    }
  };

  // Product Flag Toggle
  const toggleProductFlag = async (productId: string, field: 'is_new' | 'is_featured', currentValue: boolean) => {
    const { error } = await supabase.from('products').update({ [field]: !currentValue }).eq('id', productId);
    if (!error) {
      setProducts(products.map(p => p.id === productId ? { ...p, [field]: !currentValue } : p));
    } else {
      alert('Güncelleme hatası: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 font-inter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">Filtreler & Renk Yönetimi</h1>
          <p className="text-xs text-gray-500 mt-1">
            Katalog filtrelerinde gözükecek kategori isimlerini, renk seçeneklerini ve öne çıkan ürün tercihlerinizi buradan yönetin.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-md text-xs font-medium">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm transition-all ${
              activeTab === 'categories' ? 'bg-white text-[#1A1A1A] shadow-xs font-semibold' : 'text-gray-600 hover:text-black'
            }`}
          >
            <Layers className="w-4 h-4 text-[#C5A572]" />
            <span>Kategoriler</span>
          </button>

          <button
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm transition-all ${
              activeTab === 'colors' ? 'bg-white text-[#1A1A1A] shadow-xs font-semibold' : 'text-gray-600 hover:text-black'
            }`}
          >
            <Palette className="w-4 h-4 text-[#C5A572]" />
            <span>Renk Paleti</span>
          </button>

          <button
            onClick={() => setActiveTab('sorting')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm transition-all ${
              activeTab === 'sorting' ? 'bg-white text-[#1A1A1A] shadow-xs font-semibold' : 'text-gray-600 hover:text-black'
            }`}
          >
            <ArrowUpDown className="w-4 h-4 text-[#C5A572]" />
            <span>Sıralama & Öne Çıkanlar</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KATEGORİLER */}
      {activeTab === 'categories' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Kategori Listesi</h2>
            <button
              onClick={() => {
                setEditingCat(null);
                setCatForm({ name: '', slug: '', description: '', is_active: true });
                setCatModalOpen(true);
              }}
              className="bg-[#1A1A1A] text-white px-4 py-2 rounded-xs text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#C5A572] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Kategori Ekle</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Kategori Adı</th>
                  <th className="px-4 py-3">URL Slug</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <tr key={cat.id || cat.slug} className="hover:bg-gray-50">
                    <td className="px-4 py-3.5 font-semibold text-[#1A1A1A]">{cat.name}</td>
                    <td className="px-4 py-3.5 text-gray-500 font-mono">/kategori/{cat.slug}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {cat.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingCat(cat);
                          setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '', is_active: cat.is_active });
                          setCatModalOpen(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RENKLER */}
      {activeTab === 'colors' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Filtre Renk Paleti</h2>
            <button
              onClick={() => setColorModalOpen(true)}
              className="bg-[#1A1A1A] text-white px-4 py-2 rounded-xs text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#C5A572] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Renk Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {colors.map((color) => (
              <div key={color.id} className="border border-gray-200 p-4 rounded-xs flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <span 
                    className="w-7 h-7 rounded-full border border-gray-300 shadow-xs flex-shrink-0" 
                    style={{ backgroundColor: color.hex }} 
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1A1A]">{color.name}</h4>
                    <span className="text-[10px] font-mono text-gray-500 uppercase">{color.hex}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteColor(color.id)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  title="Kaldır"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SIRALAMA VE ÖNE ÇIKANLAR */}
      {activeTab === 'sorting' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Sıralama ve Tercih Etiketleri</h2>
            <p className="text-xs text-gray-500 mt-1">
              "En Yeni Gelenler" ve "En Çok Satanlar" filtrelerinde üst sırada yer alacak ürünlerin rozetlerini buradan anında açıp kapatabilirsiniz.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Ürün Adı</th>
                  <th className="px-4 py-3">Fiyat</th>
                  <th className="px-4 py-3 text-center">En Yeni Gelenler</th>
                  <th className="px-4 py-3 text-center">En Çok Satanlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Ürünler yükleniyor veya henüz eklenmedi.</td></tr>
                ) : (
                  products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3.5 font-semibold text-[#1A1A1A]">{prod.name}</td>
                      <td className="px-4 py-3.5 font-mono text-gray-700">{prod.base_price} ₺</td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => toggleProductFlag(prod.id, 'is_new', prod.is_new)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            prod.is_new ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {prod.is_new ? '✓ Yeni Gelen' : '+ Yeni Yap'}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => toggleProductFlag(prod.id, 'is_featured', prod.is_featured)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            prod.is_featured ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {prod.is_featured ? '★ Çok Satan' : '+ Çok Satan Yap'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">
              {editingCat ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Kategori Adı *</label>
                <input
                  required
                  type="text"
                  value={catForm.name}
                  onChange={(e) => setCatForm({
                    ...catForm,
                    name: e.target.value,
                    slug: editingCat ? catForm.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  })}
                  className="w-full p-2.5 border border-gray-300 rounded-xs focus:ring-1 focus:ring-[#C5A572]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">URL Slug *</label>
                <input
                  required
                  type="text"
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xs font-mono"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={catForm.is_active}
                  onChange={(e) => setCatForm({ ...catForm, is_active: e.target.checked })}
                  className="accent-[#C5A572]"
                />
                <span className="font-semibold text-gray-700">Kategori Mağazada Aktif</span>
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xs hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A1A1A] text-white rounded-xs hover:bg-[#C5A572] transition-colors font-medium"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLOR MODAL */}
      {colorModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Yeni Renk Ekle</h3>
            <form onSubmit={handleAddColor} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Renk Adı * (ör. Zümrüt Yeşili)</label>
                <input
                  required
                  type="text"
                  value={colorForm.name}
                  onChange={(e) => setColorForm({ ...colorForm, name: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xs focus:ring-1 focus:ring-[#C5A572]"
                  placeholder="Renk adı girin"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Renk Kodu (HEX) *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorForm.hex}
                    onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })}
                    className="w-10 h-10 border border-gray-300 rounded-xs cursor-pointer"
                  />
                  <input
                    required
                    type="text"
                    value={colorForm.hex}
                    onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })}
                    className="flex-1 p-2.5 border border-gray-300 rounded-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setColorModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xs hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A1A1A] text-white rounded-xs hover:bg-[#C5A572] transition-colors font-medium"
                >
                  Rengi Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
