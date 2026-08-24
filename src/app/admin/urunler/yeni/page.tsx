// @ts-nocheck
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ImageUploader from '@/components/admin/ImageUploader'
import AdminNotificationModal from '@/components/ui/AdminNotificationModal'
import { Save, ArrowLeft, Plus, Trash2, RefreshCw, Building2, ShieldCheck, Check, Sparkles, CheckCircle2 } from 'lucide-react'

const CATEGORY_OPTIONS = [
  { group: 'Üst Giyim', options: ['Üst Giyim', 'Elbise', 'Gömlek', 'T-Shirt', 'Crop', 'Kimono', 'Sweatshirt'] },
  { group: 'Alt Giyim', options: ['Alt Giyim', 'Pantolon', 'Etek', 'Şort', 'Tayt', 'Eşofman', 'Tulum'] },
  { group: 'İç Giyim', options: ['İç Giyim'] },
  { group: 'Dış Giyim', options: ['Dış Giyim', 'Trençkot', 'Ceket', 'Kaban', 'Yelek', 'Mont'] },
  { group: 'Takımlar', options: ['Takımlar'] },
];

const PARENT_CATEGORY_MAP: Record<string, string> = {
  'Elbise': 'Üst Giyim',
  'Gömlek': 'Üst Giyim',
  'T-Shirt': 'Üst Giyim',
  'Crop': 'Üst Giyim',
  'Kimono': 'Üst Giyim',
  'Sweatshirt': 'Üst Giyim',
  'Pantolon': 'Alt Giyim',
  'Etek': 'Alt Giyim',
  'Şort': 'Alt Giyim',
  'Tayt': 'Alt Giyim',
  'Eşofman': 'Alt Giyim',
  'Tulum': 'Alt Giyim',
  'Trençkot': 'Dış Giyim',
  'Ceket': 'Dış Giyim',
  'Kaban': 'Dış Giyim',
  'Yelek': 'Dış Giyim',
  'Mont': 'Dış Giyim',
};

const LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'STD'];
const NUMBER_SIZES = ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50'];

function generateUniqueSKU() {
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `VEL-${new Date().getFullYear()}-${randomStr}`;
}

function NewProductForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const fromSupplierId = searchParams.get('from_supplier')
  
  const [loading, setLoading] = useState(false)
  const [dbCategories, setDbCategories] = useState<any[]>([])
  const [dbSuppliers, setDbSuppliers] = useState<any[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [supplierProductUrl, setSupplierProductUrl] = useState<string>('')
  const [importedSupplierInfo, setImportedSupplierInfo] = useState<any>(null)
  
  // Quick New Supplier / Brand Creation Inline State
  const [showQuickAddSupplier, setShowQuickAddSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [addingSupplier, setAddingSupplier] = useState(false)

  const [isSizeEnabled, setIsSizeEnabled] = useState(true)
  
  // Price Display States
  const [displayBasePrice, setDisplayBasePrice] = useState('2.000')
  const [displaySalePrice, setDisplaySalePrice] = useState('')

  // Custom Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  })

  const [productData, setProductData] = useState({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    base_price: 2000,
    sale_price: 0,
    fabric_info: '',
    care_instructions: '',
    tags: '',
    category_id: '',
    selected_category: 'Elbise',
    is_featured: false,
    is_new: true,
    is_active: true,
    is_out_of_stock: false,
    seo_title: '',
    seo_description: ''
  })
  
  const [images, setImages] = useState<string[]>([])
  const [mainSku, setMainSku] = useState(generateUniqueSKU())

  const [variants, setVariants] = useState<any[]>([
    { color_name: 'Siyah', color_hex: '#1A1A1A', size: 'S', sku: `${mainSku}-1`, stock_quantity: 10, price_override: null }
  ])

  useEffect(() => {
    async function fetchData() {
      const { data: cats } = await supabase.from('categories' as any).select('id, name, slug').order('name')
      setDbCategories(cats || [])

      const { data: sups } = await supabase.from('suppliers' as any).select('id, name, domain').order('name')
      setDbSuppliers(sups || [])
    }
    fetchData()
  }, [supabase])

  // Handle Transferring Wholesaler Product Details into the Store Product Form
  useEffect(() => {
    async function loadSupplierProduct() {
      if (!fromSupplierId) return;

      try {
        const { data: supProd, error } = await supabase
          .from('supplier_products' as any)
          .select('*, suppliers(id, name, domain)')
          .eq('id', fromSupplierId)
          .maybeSingle()

        if (error) {
          console.error("Supplier product load error:", error)
          return
        }

        if (supProd) {
          setImportedSupplierInfo(supProd)

          // 1. Name & Slug
          const prodName = supProd.title || ''
          const prodSlug = prodName.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

          // 2. Base Price
          const pVal = Number(supProd.price || 0)
          const formattedPrice = pVal > 0 ? pVal.toLocaleString('tr-TR') : ''

          // 3. Stock Status
          const isOut = supProd.stock_status === 'stokta_yok'

          setProductData(prev => ({
            ...prev,
            name: prodName,
            slug: prodSlug,
            description: supProd.description || '',
            short_description: supProd.description || '',
            base_price: pVal,
            fabric_info: supProd.fabric && supProd.fabric !== 'Belirtilmemiş' ? supProd.fabric : prev.fabric_info,
            is_out_of_stock: isOut
          }))

          if (formattedPrice) {
            setDisplayBasePrice(formattedPrice)
          }

          // 4. SKU
          const sSku = supProd.sku || ''
          if (sSku && !sSku.startsWith('SKU-')) {
            setMainSku(sSku)
          }

          // 5. Secret Wholesaler Link & Brand Assignment
          if (supProd.product_url) {
            setSupplierProductUrl(supProd.product_url)
          }
          if (supProd.supplier_id) {
            setSelectedSupplierId(supProd.supplier_id)
          }

          // 6. Product Image
          if (supProd.image_url) {
            setImages([supProd.image_url])
          }

          // 7. Extract Sizes & Create Variant Rows
          const sizesRaw = supProd.raw_metadata?.sizes || supProd.sizes || ''
          const sizeList = sizesRaw
            .split(',')
            .map((s: string) => s.trim().toUpperCase())
            .filter((s: string) => s && s !== 'STANDART' && s !== 'TEK BEDEN')

          const colorName = supProd.color && supProd.color !== 'Standart' ? supProd.color : 'Siyah'

          if (sizeList.length > 0) {
            setIsSizeEnabled(true)
            const generatedVariants = sizeList.map((sizeToken: string, idx: number) => ({
              color_name: colorName,
              color_hex: '#1A1A1A',
              size: sizeToken,
              sku: `${sSku || mainSku}-${idx + 1}`,
              stock_quantity: isOut ? 0 : 10,
              price_override: null
            }))
            setVariants(generatedVariants)
          } else {
            setVariants([{
              color_name: colorName,
              color_hex: '#1A1A1A',
              size: 'STD',
              sku: `${sSku || mainSku}-1`,
              stock_quantity: isOut ? 0 : 10,
              price_override: null
            }])
          }
        }
      } catch (err) {
        console.error("Failed to load supplier product for import:", err)
      }
    }

    loadSupplierProduct()
  }, [fromSupplierId, supabase])

  // Quick Inline Add Supplier / Brand
  const handleQuickAddSupplier = async () => {
    if (!newSupplierName.trim()) return
    setAddingSupplier(true)
    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSupplierName.trim() })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Toptancı eklenemedi.')

      const createdSup = data.supplier
      setDbSuppliers(prev => [createdSup, ...prev])
      setSelectedSupplierId(createdSup.id)
      setNewSupplierName('')
      setShowQuickAddSupplier(false)
    } catch (err: any) {
      alert(err.message || 'Toptancı marka eklenemedi.')
    } finally {
      setAddingSupplier(false)
    }
  }

  const regenerateSKU = () => {
    const newSku = generateUniqueSKU();
    setMainSku(newSku);
    setVariants(variants.map((v, idx) => ({ ...v, sku: `${newSku}-${idx + 1}` })));
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setProductData({
      ...productData,
      name,
      slug: name.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    })
  }

  const formatTurkishPrice = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('tr-TR');
  };

  const parsePriceNumber = (formattedStr: string): number => {
    const digits = formattedStr.replace(/\D/g, '');
    return digits ? Number(digits) : 0;
  };

  const handleBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatTurkishPrice(val);
    setDisplayBasePrice(formatted);
    setProductData(prev => ({ ...prev, base_price: parsePriceNumber(formatted) }));
  };

  const handleSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatTurkishPrice(val);
    setDisplaySalePrice(formatted);
    setProductData(prev => ({ ...prev, sale_price: parsePriceNumber(formatted) }));
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const newVariants = [...variants]
    newVariants[index][field] = value
    setVariants(newVariants)
  }

  const addVariant = () => {
    const nextIdx = variants.length + 1;
    setVariants([...variants, { 
      color_name: 'Siyah', 
      color_hex: '#1A1A1A', 
      size: isSizeEnabled ? 'M' : 'STD', 
      sku: `${mainSku}-${nextIdx}`, 
      stock_quantity: 10, 
      price_override: null 
    }])
  }

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const cat = productData.selected_category || 'Elbise';
      const parentCat = PARENT_CATEGORY_MAP[cat];

      const tagsArray = [cat];
      if (parentCat && parentCat !== cat) {
        tagsArray.push(parentCat);
      }
      if (productData.is_out_of_stock) {
        tagsArray.push('Tükendi');
      }

      // Match category_id from DB categories
      const matchedCat = dbCategories.find(c => c.name === cat || c.slug === cat.toLowerCase());
      const categoryId = matchedCat ? matchedCat.id : null;

      // 1. Create product
      const { data: product, error: productError } = await supabase
        .from('products' as any)
        .insert([{
          name: productData.name,
          slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          short_description: productData.description || '',
          description: productData.description || '',
          base_price: Number(productData.base_price) || 0,
          sale_price: productData.sale_price ? Number(productData.sale_price) : null,
          fabric_info: productData.fabric_info || '',
          care_instructions: '',
          tags: tagsArray,
          category_id: categoryId,
          is_featured: productData.is_featured,
          is_new: productData.is_new,
          is_active: productData.is_active,
          seo_title: productData.seo_title || productData.name,
          seo_description: productData.seo_description || productData.description
        }])
        .select()
        .single()

      if (productError) throw productError

      // 2. Create images / videos
      if (images.length > 0) {
        const imageRecords = images.map((url, idx) => ({
          product_id: product.id,
          image_url: url,
          sort_order: idx,
          is_primary: idx === 0
        }))
        await supabase.from('product_images' as any).insert(imageRecords)
      }

      // 3. Create variants
      if (variants.length > 0) {
        const variantRecords = variants.map((v, idx) => ({
          product_id: product.id,
          color_name: v.color_name,
          color_hex: v.color_hex,
          size: isSizeEnabled ? v.size : 'STD',
          sku: v.sku || `${mainSku}-${idx + 1}`,
          stock_quantity: productData.is_out_of_stock ? 0 : Number(v.stock_quantity),
          price_override: v.price_override ? Number(v.price_override) : null
        }))
        await supabase.from('product_variants' as any).insert(variantRecords)
      }

      // 4. Save Secret Supplier Link & Supplier Info (Admin Only)
      if (supplierProductUrl.trim() || selectedSupplierId) {
        try {
          await supabase.from('supplier_products' as any).insert({
            admin_product_id: product.id,
            supplier_id: selectedSupplierId || null,
            title: productData.name,
            product_url: supplierProductUrl.trim() || 'https://toptanci.com',
            sku: mainSku,
            price: Number(productData.base_price) || 0,
            stock_status: productData.is_out_of_stock ? 'stokta_yok' : 'stokta_var',
            fabric: productData.fabric_info || 'Belirtilmemiş'
          })
        } catch (supErr) {
          console.error("Supplier product link save error:", supErr)
        }
      }

      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Ürün Başarıyla Yayınlandı',
        message: 'Ürün, benzersiz SKU kodları ve gizli toptancı bağlantısı başarıyla oluşturuldu.'
      })

    } catch (error: any) {
      console.error('Error saving product:', error)
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Kaydedilirken Hata Oluştu',
        message: error.message || 'Ürün kaydedilirken beklenmeyen bir hata meydana geldi.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12 font-inter">
        {/* Imported Wholesaler Product Golden Banner */}
        {importedSupplierInfo && (
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border border-amber-400 p-4 rounded-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-700 flex-shrink-0 animate-pulse" />
              <div>
                <h3 className="font-bold text-amber-950 text-xs flex items-center gap-2">
                  <span>✨ Toptancı Ürünü Başarıyla Form Formuna Taşıdı!</span>
                  <span className="bg-amber-900 text-white font-mono text-[10px] px-2 py-0.5 rounded-full">
                    {importedSupplierInfo.suppliers?.name || 'Toptancı'}
                  </span>
                </h3>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  Toptancıdan çekilen ürün adı, alış fiyatı, kumaş, bedenler, görsel ve gizli toptancı linki form alanlarına dolduruldu. Dilediğiniz gibi düzenleyip <strong>"Kaydet & Yayınla"</strong> butonuna basabilirsiniz.
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs font-bold text-amber-900 block">Alış Fiyatı: {importedSupplierInfo.price} ₺</span>
              <span className="text-[10px] text-emerald-800 font-bold block">✓ Bedenler & Görsel Yüklendi</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button type="button" onClick={() => router.back()} className="text-gray-500 hover:text-black cursor-pointer">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">
              {importedSupplierInfo ? 'Toptancı Ürününü Düzenle & Mağazaya Ekle' : 'Yeni Ürün Ekle'}
            </h1>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-6 py-2.5 rounded-xs flex items-center space-x-2 disabled:opacity-50 transition-colors font-medium text-xs uppercase tracking-wider shadow-md cursor-pointer"
          >
            <Save size={18} />
            <span>{loading ? 'Kaydediliyor...' : 'Kaydet & Yayınla'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Temel Bilgiler */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-lg font-semibold text-[#1A1A1A] border-b pb-2">Temel Bilgiler</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ürün Adı *</label>
                  <input required type="text" value={productData.name} onChange={handleNameChange} className="w-full p-2.5 border rounded-xs text-sm font-semibold" placeholder="ör. Saten Kruvaze Abiye Elbise" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Slug (URL Adresi) *</label>
                  <input required type="text" value={productData.slug} onChange={(e) => setProductData({...productData, slug: e.target.value})} className="w-full p-2.5 border rounded-xs text-sm bg-gray-50 font-mono" />
                </div>
              </div>
              
              {/* Kategori Seçimi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Seçimi *</label>
                  <select 
                    required 
                    value={productData.selected_category} 
                    onChange={(e) => setProductData({...productData, selected_category: e.target.value})} 
                    className="w-full p-2.5 border border-gray-300 rounded-xs text-sm font-medium"
                  >
                    {CATEGORY_OPTIONS.map(group => (
                      <optgroup key={group.group} label={`── ${group.group} ──`}>
                        {group.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Otomatik Benzersiz SKU Kodu</label>
                  <div className="flex items-center gap-2">
                    <input readOnly type="text" value={mainSku} className="w-full p-2.5 border border-gray-200 rounded-xs text-sm font-mono bg-gray-100 font-bold text-[#1A1A1A]" />
                    <button type="button" onClick={regenerateSKU} className="p-2.5 border border-gray-300 rounded-xs hover:bg-gray-100 text-gray-600 cursor-pointer" title="Yeni SKU Üret">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ürün Detayı *</label>
                <textarea 
                  required
                  value={productData.description} 
                  onChange={(e) => setProductData({...productData, description: e.target.value, short_description: e.target.value})} 
                  rows={4} 
                  className="w-full p-2.5 border rounded-xs text-sm" 
                  placeholder="Müşteriye ürün sayfasında 'Ürün Detayı' sekmesinde gösterilecek açıklama..." 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kumaş Bilgisi</label>
                <textarea 
                  value={productData.fabric_info} 
                  onChange={(e) => setProductData({...productData, fabric_info: e.target.value})} 
                  rows={3} 
                  className="w-full p-2.5 border border-emerald-300 rounded-xs text-sm font-medium bg-emerald-50/30" 
                  placeholder="Müşteriye ürün sayfasında 'Kumaş Bilgisi' sekmesinde gösterilecek ipek, saten, kaşmir vb. bilgiler..." 
                />
              </div>
            </div>

            {/* Görseller ve Videolar */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-lg font-semibold text-[#1A1A1A] border-b pb-2">Fotoğraf & Video Galeri</h2>
              <ImageUploader 
                bucket="products" 
                folder="urunler"
                existingImages={images}
                onUploadSuccess={(urls) => setImages([...images, ...urls])}
                onReorder={(newImages) => setImages(newImages)}
                onRemoveImage={(url) => setImages(images.filter(img => img !== url))}
              />
            </div>

            {/* Varyantlar & Beden Ayarları */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-3 gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1A1A]">Varyantlar & Stok (Renk & Beden)</h2>
                  <p className="text-xs text-gray-500">Toptancıdan çekilen bedenler aşağıda otomatik listelenmiştir.</p>
                </div>

                {/* Size Toggle Switch */}
                <label className="flex items-center gap-2 cursor-pointer bg-gray-100 px-3 py-1.5 rounded-xs text-xs font-semibold text-[#1A1A1A]">
                  <input 
                    type="checkbox" 
                    checked={isSizeEnabled} 
                    onChange={(e) => setIsSizeEnabled(e.target.checked)} 
                    className="accent-[#C5A572] w-4 h-4 cursor-pointer"
                  />
                  <span>Beden Seçimi Aktif</span>
                </label>
              </div>
              
              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <div key={idx} className="p-3 border border-gray-200 rounded-xs bg-gray-50/70 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Renk Adı</label>
                        <input placeholder="ör. Siyah" value={v.color_name} onChange={(e) => handleVariantChange(idx, 'color_name', e.target.value)} className="w-full p-2 border rounded-xs text-xs bg-white font-semibold" />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Renk Paleti</label>
                        <input type="color" value={v.color_hex} onChange={(e) => handleVariantChange(idx, 'color_hex', e.target.value)} className="w-full h-8 cursor-pointer rounded-xs" />
                      </div>

                      {isSizeEnabled ? (
                        <div>
                          <label className="block text-[10px] font-semibold text-indigo-700 mb-1">Beden (Aktarıldı)</label>
                          <input 
                            type="text"
                            value={v.size} 
                            onChange={(e) => handleVariantChange(idx, 'size', e.target.value.toUpperCase())}
                            className="w-full p-2 border border-indigo-400 rounded-xs text-xs bg-white font-bold text-indigo-900"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Beden Durumu</label>
                          <input readOnly value="Standart (Tek Beden)" className="w-full p-2 border rounded-xs text-xs bg-gray-200 text-gray-600 font-medium" />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Stok Miktarı</label>
                        <input type="number" min="0" placeholder="Stok" value={v.stock_quantity} onChange={(e) => handleVariantChange(idx, 'stock_quantity', e.target.value)} className="w-full p-2 border rounded-xs text-xs bg-white font-semibold" />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Benzersiz SKU Kodu</label>
                        <input readOnly value={v.sku} className="w-full p-2 border rounded-xs text-xs font-mono bg-gray-100 font-semibold text-gray-700" />
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-gray-200 pt-2">
                      <button type="button" onClick={() => removeVariant(idx)} className="text-rose-600 hover:bg-rose-50 text-xs font-medium px-2 py-1 rounded flex items-center gap-1 cursor-pointer">
                        <Trash2 size={14} />
                        <span>Varyantı Sil</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addVariant} className="w-full py-2.5 border border-dashed border-gray-300 hover:border-[#C5A572] hover:bg-gray-50 rounded-xs text-xs font-semibold text-[#1A1A1A] flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <Plus size={16} className="text-[#C5A572]" />
                <span>Yeni Renk / Beden Varyantı Ekle</span>
              </button>
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="space-y-6">
            {/* GİZLİ TOPTANCI BİLGİLERİ (SADECE ADMİN GÖREBİLİR) */}
            <div className="bg-amber-50/90 p-5 rounded-lg border border-amber-300 space-y-3 shadow-2xs">
              <div className="flex items-center space-x-2 text-amber-950 border-b border-amber-200 pb-2">
                <Building2 size={18} className="text-amber-800" />
                <h2 className="text-base font-bold font-playfair">Gizli Toptancı Bilgileri</h2>
                <ShieldCheck size={16} className="text-emerald-700 ml-auto" title="Sadece Admin Yetkilisi Görür" />
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Bu alandaki toptancı bağlantısı <strong>sadece Admin Panelinde</strong> saklanır. Müşterileriniz bu tedarikçi linkini asla göremez.
              </p>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-800">Toptancı / Marka Seçin</label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddSupplier(!showQuickAddSupplier)}
                    className="text-[11px] text-[#C5A572] font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={12} /> {showQuickAddSupplier ? 'Kapat' : 'Yeni Marka / Toptancı Ekle'}
                  </button>
                </div>

                {/* Quick Add Supplier Input Field */}
                {showQuickAddSupplier && (
                  <div className="p-2.5 bg-white border border-amber-300 rounded-xs space-y-2 mb-2">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">Toptancı Firma / Marka Adı</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ör. İstanbul Tekstil Toptan"
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                        className="flex-1 p-2 border rounded-xs text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddSupplier}
                        disabled={addingSupplier}
                        className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-3 py-2 rounded-xs font-semibold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={14} />
                        <span>{addingSupplier ? '...' : 'Ekle'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full p-2.5 border border-amber-400 rounded-xs text-xs font-bold bg-white"
                >
                  <option value="">-- Toptancı Firma / Marka Seçiniz (Opsiyonel) --</option>
                  {dbSuppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.domain || 'Toptancı'})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Toptancı Ürün Linki (URL)</label>
                <input
                  type="url"
                  value={supplierProductUrl}
                  onChange={(e) => setSupplierProductUrl(e.target.value)}
                  placeholder="https://toptanci.com/urun-123"
                  className="w-full p-2.5 border border-amber-400 rounded-xs text-xs bg-white font-mono"
                />
              </div>
            </div>

            {/* Fiyatlandırma */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-lg font-semibold text-[#1A1A1A] border-b pb-2">Fiyatlandırma</h2>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Normal Satış Fiyatı (₺) *</label>
                <div className="relative">
                  <input 
                    required 
                    type="text" 
                    value={displayBasePrice} 
                    onChange={handleBasePriceChange} 
                    className="w-full p-2.5 pr-8 border border-gray-300 rounded-xs text-sm font-bold text-[#1A1A1A]" 
                    placeholder="2.000" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₺</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">İndirimli Satış Fiyatı (₺)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={displaySalePrice} 
                    onChange={handleSalePriceChange} 
                    className="w-full p-2.5 pr-8 border border-gray-300 rounded-xs text-sm font-bold text-emerald-700" 
                    placeholder="Opsiyonel (Örn: 1.750)" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs">₺</span>
                </div>
              </div>
            </div>

            {/* Durum & Etiketler */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3">
              <h2 className="text-lg font-semibold text-[#1A1A1A] border-b pb-2">Mağaza Etiketleri</h2>
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium">
                <input type="checkbox" checked={productData.is_active} onChange={(e) => setProductData({...productData, is_active: e.target.checked})} className="accent-[#C5A572] w-4 h-4 cursor-pointer" />
                <span>Ürün Mağazada Aktif ve Yayında</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium">
                <input type="checkbox" checked={productData.is_featured} onChange={(e) => setProductData({...productData, is_featured: e.target.checked})} className="accent-[#C5A572] w-4 h-4 cursor-pointer" />
                <span>En Çok Satanlar (Öne Çıkan)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium">
                <input type="checkbox" checked={productData.is_new} onChange={(e) => setProductData({...productData, is_new: e.target.checked})} className="accent-[#C5A572] w-4 h-4 cursor-pointer" />
                <span>En Yeni Gelenler Rozeti</span>
              </label>

              {/* OUT OF STOCK / TÜKENDİ TOGGLE CHECKBOX */}
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-rose-700 bg-rose-50 p-2.5 rounded-xs border border-rose-200 mt-2">
                <input 
                  type="checkbox" 
                  checked={productData.is_out_of_stock} 
                  onChange={(e) => setProductData({...productData, is_out_of_stock: e.target.checked})} 
                  className="accent-rose-600 w-4 h-4 cursor-pointer" 
                />
                <span className="font-bold">Ürün Tükendi (Stokta Yok Rozeti)</span>
              </label>
            </div>
          </div>
        </div>
      </form>

      {/* Luxury Custom Notification Modal */}
      <AdminNotificationModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        primaryButtonText="Ürünler Listesine Git"
        onPrimaryClick={() => router.push('/admin/urunler')}
        secondaryButtonText="Yeni Ürün Ekle"
        onSecondaryClick={() => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          window.location.reload();
        }}
      />
    </>
  )
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500 font-inter text-xs">Toptancı ürün verileri yükleniyor...</div>}>
      <NewProductForm />
    </Suspense>
  )
}
