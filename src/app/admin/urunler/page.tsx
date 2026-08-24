// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { Plus, Search, Edit, Trash2, ExternalLink, Building2, ShieldCheck } from 'lucide-react'

export default function AdminProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch categories
      const { data: cats } = await supabase.from('categories' as any).select('id, name').order('name')
      setCategories(cats || [])

      // Fetch products with images, categories, and attached supplier_products
      const { data: prods } = await supabase
        .from('products' as any)
        .select('*, categories(name), product_images(image_url), supplier_products(id, product_url, supplier_id, suppliers(name, domain))')
        .order('created_at', { ascending: false })
      
      setProducts(prods || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      const { error } = await supabase.from('products' as any).delete().eq('id', id)
      if (error) {
        alert('Silinirken bir hata oluştu: ' + error.message)
      } else {
        setProducts(products.filter(p => p.id !== id))
      }
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.slug && p.slug.includes(searchTerm.toLowerCase())) ||
                          (p.supplier_products?.[0]?.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    const categoryName = p.categories?.name || (Array.isArray(p.tags) ? p.tags[0] : (typeof p.tags === 'string' ? p.tags : 'Elbise'));
    const matchesCategory = categoryFilter ? (p.category_id === categoryFilter || categoryName === categoryFilter) : true
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 font-inter">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">Ürünler Yönetimi</h1>
          <p className="text-gray-500 text-[11px] mt-0.5">Mağazanızdaki ürünleri, kategorileri ve gizli toptancı alış bilgilerini yönetin.</p>
        </div>

        <Link 
          href="/admin/urunler/yeni"
          className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-4 py-2.5 rounded-xs flex items-center space-x-2 transition-colors text-xs uppercase font-semibold tracking-wider shadow-md cursor-pointer"
        >
          <Plus size={18} />
          <span>Yeni Ürün Ekle</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Ürün adı veya toptancı firma adı ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xs text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A572]"
          />
        </div>
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xs text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A572] bg-white min-w-[200px]"
        >
          <option value="">Tüm Kategoriler</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Products Table with Gizli Toptancı Column */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200 font-semibold">
              <tr>
                <th className="px-4 py-3.5">Görsel</th>
                <th className="px-4 py-3.5">Ürün Adı</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5">Satış Fiyatı</th>
                <th className="px-4 py-3.5 text-amber-900 bg-amber-50/80 border-x border-amber-200/60">
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={14} className="text-amber-700" />
                    <span>Gizli Toptancı / Marka</span>
                  </div>
                </th>
                <th className="px-4 py-3.5">Durum</th>
                <th className="px-4 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Ürün bulunamadı.</td></tr>
              ) : (
                filteredProducts.map((product) => {
                  const primaryImage = product.product_images?.[0]?.image_url;
                  const categoryDisplay = product.categories?.name || (Array.isArray(product.tags) ? product.tags[0] : (typeof product.tags === 'string' ? product.tags : 'Elbise'));
                  const isOutOfStock = product.is_out_of_stock || (Array.isArray(product.tags) && product.tags.includes('Tükendi'));

                  const supProd = Array.isArray(product.supplier_products) && product.supplier_products.length > 0 
                    ? product.supplier_products[0] 
                    : null;
                  const supplierName = supProd?.suppliers?.name;
                  const supplierUrl = supProd?.product_url;

                  return (
                    <tr key={product.id} className="border-b hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-12 h-14 bg-[#FAFAF8] rounded-xs overflow-hidden flex items-center justify-center border border-gray-200">
                          {primaryImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-gray-400">Görsel Yok</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-[#1A1A1A]">
                        {product.name}
                        {product.is_featured && <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-xs font-semibold">Öne Çıkan</span>}
                        {product.is_new && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-xs font-semibold">Yeni</span>}
                      </td>

                      <td className="px-4 py-3 text-gray-700 font-medium">
                        <span className="bg-gray-100 px-2 py-1 rounded-xs border border-gray-200">
                          {categoryDisplay}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[#1A1A1A] font-bold">
                        {formatPrice(product.base_price)}
                      </td>

                      {/* GİZLİ TOPTANCI COLUMN */}
                      <td className="px-4 py-3 bg-amber-50/30 border-x border-amber-100">
                        {supplierName || supplierUrl ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#1A1A1A] flex items-center gap-1 text-xs">
                              <Building2 size={12} className="text-amber-700" />
                              {supplierName || 'Toptancı Bağlı'}
                            </span>
                            {supplierUrl && (
                              <a
                                href={supplierUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-[#C5A572] font-semibold hover:underline"
                              >
                                <ExternalLink size={10} /> Toptancı Linki
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">Belirtilmedi</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isOutOfStock ? (
                          <span className="px-2 py-1 rounded-xs text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Tükendi
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded-xs text-[10px] font-bold ${product.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                            {product.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right space-x-2">
                        <Link href={`/admin/urunler/${product.id}`} className="inline-flex p-1.5 text-blue-600 hover:bg-blue-50 rounded-xs transition-colors" title="Düzenle">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => handleDelete(product.id)} className="inline-flex p-1.5 text-rose-600 hover:bg-rose-50 rounded-xs transition-colors cursor-pointer" title="Sil">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
