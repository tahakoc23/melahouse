// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ImageUploader from '@/components/admin/ImageUploader'
import PriceResearchButton from '@/components/admin/PriceResearchButton'
import AdminNotificationModal from '@/components/ui/AdminNotificationModal'
import { Save, ArrowLeft, Plus, Trash2, RefreshCw, Building2, ShieldCheck, Check } from 'lucide-react'
import React from 'react'
import { parseTurkishPrice, formatTurkishPrice, sanitizePriceInput, validatePrices } from '../_lib/price'
import { slugifyTr, generateMainSku, nextVariantSku } from '../_lib/slug'

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

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const { id } = React.use(params)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dbCategories, setDbCategories] = useState<any[]>([])
  const [dbSuppliers, setDbSuppliers] = useState<any[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [supplierProductUrl, setSupplierProductUrl] = useState<string>('')
  const [supplierCost, setSupplierCost] = useState<number | undefined>(undefined)

  // Quick New Supplier / Brand Creation Inline State
  const [showQuickAddSupplier, setShowQuickAddSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [addingSupplier, setAddingSupplier] = useState(false)

  const [isSizeEnabled, setIsSizeEnabled] = useState(true)
  
  const [displayBasePrice, setDisplayBasePrice] = useState('2.000')
  const [displaySalePrice, setDisplaySalePrice] = useState('')
  const [priceError, setPriceError] = useState<string | null>(null)

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

  const [productData, setProductData] = useState<any>(null)
  const [images, setImages] = useState<string[]>([])
  const [mainSku, setMainSku] = useState('')
  const [variants, setVariants] = useState<any[]>([])
  // IDs of variants as stored in the DB, used to diff on save (keeps IDs stable for carts/orders)
  const [originalVariantIds, setOriginalVariantIds] = useState<string[]>([])
  const [originalSlug, setOriginalSlug] = useState('')

  useEffect(() => {
    async function fetchCategoriesAndSuppliers() {
      const { data: cats } = await supabase.from('categories').select('id, name, slug').order('name')
      setDbCategories(cats || [])

      const { data: sups } = await supabase.from('suppliers').select('id, name, domain').order('name')
      setDbSuppliers(sups || [])
    }
    fetchCategoriesAndSuppliers()
  }, [supabase])

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

  useEffect(() => {
    async function fetchProductDetails() {
      try {
        setLoading(true);

        // 1. Fetch Product
        const { data: prod, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (prodErr) throw prodErr;

        // 2. Fetch Attached Secret Supplier Details
        const { data: supProd } = await supabase
          .from('supplier_products')
          .select('*, suppliers(id, name)')
          .eq('admin_product_id', id)
          .maybeSingle();

        if (supProd) {
          setSelectedSupplierId(supProd.supplier_id || supProd.suppliers?.id || '');
          setSupplierProductUrl(supProd.product_url || '');
          setSupplierCost(Number(supProd.price) || undefined);
        }

        // 3. Fetch Product Images/Videos
        const { data: imgData } = await supabase
          .from('product_images')
          .select('image_url, sort_order')
          .eq('product_id', id)
          .order('sort_order', { ascending: true });

        const loadedImages = imgData?.map((img: any) => img.image_url) || [];

        // 4. Fetch Product Variants
        const { data: varData } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', id)
          .order('created_at', { ascending: true });

        // Variants deactivated because they are referenced by past orders are hidden here
        const activeVarData = (varData || []).filter((v) => v.is_active !== false);
        const fallbackSku = generateMainSku();
        const loadedVariants = activeVarData.map((v, idx: number) => ({
          id: v.id,
          color_name: v.color_name || 'Siyah',
          color_hex: v.color_hex || '#1A1A1A',
          size: v.size || 'S',
          sku: v.sku || `${fallbackSku}-${idx + 1}`,
          stock_quantity: v.stock_quantity ?? 0,
          price_override: v.price_override || null
        }));
        setOriginalVariantIds(loadedVariants.map((v) => v.id));

        const initialSku = loadedVariants[0]?.sku ? loadedVariants[0].sku.split('-').slice(0, 3).join('-') : fallbackSku;
        setMainSku(initialSku);

        const hasSpecificSizes = loadedVariants.some((v: any) => v.size && v.size !== 'STD');
        setIsSizeEnabled(hasSpecificSizes);

        if (loadedVariants.length === 0) {
          loadedVariants.push({
            color_name: 'Siyah',
            color_hex: '#1A1A1A',
            size: 'S',
            sku: `${initialSku}-1`,
            stock_quantity: 10,
            price_override: null
          });
        }

        const baseP = prod.base_price ? Number(prod.base_price) : 0;
        const saleP = prod.sale_price ? Number(prod.sale_price) : 0;

        setDisplayBasePrice(baseP ? formatTurkishPrice(baseP) : '');
        setDisplaySalePrice(saleP ? formatTurkishPrice(saleP) : '');
        setOriginalSlug(prod.slug || '');

        const isOut = (Array.isArray(prod.tags) && prod.tags.includes('Tükendi')) || prod.is_out_of_stock === true;

        setProductData({
          name: prod.name || '',
          slug: prod.slug || '',
          short_description: prod.short_description || '',
          description: prod.description || prod.short_description || '',
          base_price: baseP,
          sale_price: saleP,
          fabric_info: prod.fabric_info || '',
          care_instructions: prod.care_instructions || '',
          tags: Array.isArray(prod.tags) ? prod.tags : (prod.tags ? [prod.tags] : ['Elbise']),
          category_id: prod.category_id || '',
          selected_category: Array.isArray(prod.tags) && prod.tags.length > 0 ? prod.tags[0] : (typeof prod.tags === 'string' ? prod.tags : 'Elbise'),
          is_featured: prod.is_featured ?? false,
          is_new: prod.is_new ?? true,
          is_active: prod.is_active ?? true,
          is_out_of_stock: isOut,
          seo_title: prod.seo_title || '',
          seo_description: prod.seo_description || ''
        });

        setImages(loadedImages);
        setVariants(loadedVariants);

      } catch (err: any) {
        console.error('Error fetching product:', err);
        setModalConfig({
          isOpen: true,
          type: 'error',
          title: 'Ürün Bulunamadı',
          message: 'Aradığınız ürün bulunamadı veya silinmiş olabilir.'
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProductDetails();
  }, [id, supabase]);

  const regenerateSKU = () => {
    const newSku = generateMainSku();
    setMainSku(newSku);
    setVariants(prev => prev.map((v, idx) => ({ ...v, sku: `${newSku}-${idx + 1}` })));
  };

  // On the edit page the slug is NOT derived from the name automatically:
  // changing a live product's URL breaks links/SEO. The admin can edit the
  // slug field or press "Addan oluştur" explicitly.
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setProductData(prev => ({ ...prev, name }));
  };

  const handleBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const display = sanitizePriceInput(e.target.value);
    const base = parseTurkishPrice(display) ?? 0;
    setDisplayBasePrice(display);
    setProductData(prev => ({ ...prev, base_price: base }));
    setPriceError(null);
  };

  const handleSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const display = sanitizePriceInput(e.target.value);
    const sale = parseTurkishPrice(display) ?? 0;
    setDisplaySalePrice(display);
    setProductData(prev => ({ ...prev, sale_price: sale }));
    setPriceError(null);
  };

  // Normalise the typed value to "1.299,90" when the field loses focus
  const handlePriceBlur = () => {
    setDisplayBasePrice(productData?.base_price ? formatTurkishPrice(productData.base_price) : '');
    setDisplaySalePrice(productData?.sale_price ? formatTurkishPrice(productData.sale_price) : '');
    setPriceError(validatePrices(productData?.base_price || null, productData?.sale_price || null));
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    setVariants(prev => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addVariant = () => {
    setVariants(prev => [...prev, {
      color_name: 'Siyah',
      color_hex: '#1A1A1A',
      size: isSizeEnabled ? 'M' : 'STD',
      sku: nextVariantSku(mainSku, prev),
      stock_quantity: 10,
      price_override: null
    }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const basePrice = Number(productData.base_price) || 0;
    const salePrice = Number(productData.sale_price) || 0;
    const priceValidation = validatePrices(basePrice, salePrice || null);
    if (priceValidation) {
      setPriceError(priceValidation);
      setModalConfig({ isOpen: true, type: 'error', title: 'Fiyat Hatası', message: priceValidation });
      return;
    }

    const skus = variants.map(v => (v.sku || '').trim()).filter(Boolean);
    if (new Set(skus).size !== skus.length) {
      setModalConfig({ isOpen: true, type: 'error', title: 'SKU Hatası', message: 'Aynı SKU koduna sahip birden fazla varyant var. Lütfen "Yeni SKU Üret" butonunu kullanın.' });
      return;
    }

    const finalSlug = slugifyTr(productData.slug) || originalSlug;
    if (!finalSlug) {
      setModalConfig({ isOpen: true, type: 'error', title: 'Slug Hatası', message: 'Geçerli bir URL adresi (slug) girin.' });
      return;
    }

    setSaving(true);
    try {
      // Explicit slug change: make sure another product doesn't already use it
      if (finalSlug !== originalSlug) {
        const { data: clash, error: clashErr } = await supabase
          .from('products')
          .select('id')
          .eq('slug', finalSlug)
          .neq('id', id)
          .limit(1);
        if (clashErr) throw clashErr;
        if (clash && clash.length > 0) {
          throw new Error(`"${finalSlug}" adresi başka bir ürün tarafından kullanılıyor. Lütfen farklı bir slug girin.`);
        }
      }

      const cat = productData.selected_category || 'Elbise';
      const parentCat = PARENT_CATEGORY_MAP[cat];

      const tagsArray = [cat];
      if (parentCat && parentCat !== cat) {
        tagsArray.push(parentCat);
      }
      // "Tükendi" is a storefront flag only: per-variant stock values are saved
      // exactly as entered, so unticking it later restores the real stock.
      if (productData.is_out_of_stock) {
        tagsArray.push('Tükendi');
      }

      // Match category_id from DB categories
      const matchedCat = dbCategories.find(c => c.name === cat || c.slug === slugifyTr(cat));
      const categoryId = matchedCat ? matchedCat.id : null;

      // 1. Update Product Details
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: productData.name,
          slug: finalSlug,
          short_description: productData.description || '',
          description: productData.description || '',
          base_price: basePrice,
          sale_price: salePrice > 0 ? salePrice : null,
          fabric_info: productData.fabric_info || '',
          tags: tagsArray,
          category_id: categoryId,
          is_featured: productData.is_featured,
          is_new: productData.is_new,
          is_active: productData.is_active,
          // SEO title always follows the current product name
          seo_title: productData.name,
          seo_description: (productData.description || '').slice(0, 160)
        })
        .eq('id', id);

      if (productError) throw productError;
      setOriginalSlug(finalSlug);
      setProductData(prev => ({ ...prev, slug: finalSlug, seo_title: prev.name }));

      const problems: string[] = [];

      // 2. Images & videos: insert the new set first, then remove the old rows,
      //    so a failed insert never leaves the product without media.
      const { data: oldImgRows, error: oldImgErr } = await supabase
        .from('product_images')
        .select('id')
        .eq('product_id', id);
      if (oldImgErr) {
        problems.push(`Görseller okunamadı: ${oldImgErr.message}`);
      } else {
        let insertOk = true;
        if (images.length > 0) {
          const imageRecords = images.map((url, idx) => ({
            product_id: id,
            image_url: url,
            sort_order: idx,
            is_primary: idx === 0
          }));
          const { error: imgInsErr } = await supabase.from('product_images').insert(imageRecords);
          if (imgInsErr) {
            insertOk = false;
            problems.push(`Görseller kaydedilemedi: ${imgInsErr.message}`);
          }
        }
        const oldIds = (oldImgRows || []).map((r) => r.id);
        if (insertOk && oldIds.length > 0) {
          const { error: imgDelErr } = await supabase.from('product_images').delete().in('id', oldIds);
          if (imgDelErr) problems.push(`Eski görseller silinemedi: ${imgDelErr.message}`);
        }
      }

      // 3. Variants: update existing rows by id, insert new ones, delete removed ones.
      const toVariantRecord = (v) => ({
        color_name: v.color_name,
        color_hex: v.color_hex,
        size: isSizeEnabled ? v.size : 'STD',
        sku: v.sku,
        stock_quantity: Math.max(0, Number(v.stock_quantity) || 0),
        price_override: v.price_override ? Number(v.price_override) : null
      });

      const keptIds = new Set(variants.filter(v => v.id).map(v => v.id));
      const removedIds = originalVariantIds.filter(vid => !keptIds.has(vid));
      const stillOriginal = new Set(originalVariantIds);

      // 3a. Removed variants (first, so their SKUs are free for reuse)
      for (const vid of removedIds) {
        const { error: delErr } = await supabase.from('product_variants').delete().eq('id', vid);
        if (delErr) {
          // Referenced by an order/cart (FK) -> keep the row but hide it
          const { error: deactErr } = await supabase
            .from('product_variants')
            .update({ is_active: false, stock_quantity: 0 })
            .eq('id', vid);
          if (deactErr) {
            problems.push(`Varyant silinemedi: ${delErr.message}`);
            continue;
          }
        }
        stillOriginal.delete(vid);
      }

      // 3b. Existing variants
      for (const v of variants.filter(v => v.id)) {
        const { error: updErr } = await supabase
          .from('product_variants')
          .update(toVariantRecord(v))
          .eq('id', v.id);
        if (updErr) problems.push(`Varyant güncellenemedi (${v.sku}): ${updErr.message}`);
      }

      // 3c. New variants (get their ids back so a second save doesn't duplicate them)
      const newVariants = variants.filter(v => !v.id);
      if (newVariants.length > 0) {
        const { data: inserted, error: insErr } = await supabase
          .from('product_variants')
          .insert(newVariants.map(v => ({ product_id: id, ...toVariantRecord(v) })))
          .select('id, sku');
        if (insErr) {
          problems.push(`Yeni varyantlar eklenemedi: ${insErr.message}`);
        } else {
          const idBySku = new Map((inserted || []).map((r) => [r.sku, r.id]));
          setVariants(prev => prev.map(v => (!v.id && idBySku.has(v.sku) ? { ...v, id: idBySku.get(v.sku) } : v)));
          (inserted || []).forEach((r) => stillOriginal.add(r.id));
        }
      }
      setOriginalVariantIds(Array.from(stillOriginal));

      // 4. Update / Save Secret Supplier Product Details (Admin Only)
      if (supplierProductUrl.trim() || selectedSupplierId) {
        const { data: existingSupProd, error: supReadErr } = await supabase
          .from('supplier_products')
          .select('id')
          .eq('admin_product_id', id)
          .maybeSingle();

        let supErr = supReadErr;
        if (!supReadErr) {
          if (existingSupProd) {
            ({ error: supErr } = await supabase
              .from('supplier_products')
              .update({
                supplier_id: selectedSupplierId || null,
                product_url: supplierProductUrl.trim() || 'https://toptanci.com',
                title: productData.name,
                price: basePrice
              })
              .eq('id', existingSupProd.id));
          } else {
            ({ error: supErr } = await supabase
              .from('supplier_products')
              .insert({
                admin_product_id: id,
                supplier_id: selectedSupplierId || null,
                title: productData.name,
                product_url: supplierProductUrl.trim() || 'https://toptanci.com',
                price: basePrice
              }));
          }
        }
        if (supErr) problems.push(`Toptancı bağlantısı kaydedilemedi: ${supErr.message}`);
      }

      if (problems.length > 0) {
        setModalConfig({
          isOpen: true,
          type: 'error',
          title: 'Kısmen Kaydedildi',
          message: `Ürün bilgileri kaydedildi ancak bazı adımlar başarısız oldu:\n• ${problems.join('\n• ')}`
        });
        return;
      }

      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Ürün Bilgileri Güncellendi',
        message: 'Ürün bilgileri, stok durumu, varyantlar ve gizli toptancı bağlantısı başarıyla kaydedildi.'
      });

    } catch (error: any) {
      console.error('Error updating product:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Güncelleme Hatası',
        message: error.message || 'Ürün bilgileri güncellenirken bir hata meydana geldi.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-inter text-[#1A1A1A]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#C5A572] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium">Ürün ve toptancı detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12 font-inter">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button type="button" onClick={() => router.back()} className="text-gray-500 hover:text-black cursor-pointer">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">Ürün Düzenle</h1>
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-6 py-2.5 rounded-xs flex items-center space-x-2 disabled:opacity-50 transition-colors font-medium text-xs uppercase tracking-wider cursor-pointer shadow-md"
          >
            <Save size={18} />
            <span>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
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
                  <input required type="text" value={productData?.name} onChange={handleNameChange} className="w-full p-2.5 border rounded-xs text-sm" placeholder="ör. Saten Kruvaze Abiye Elbise" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-700">Slug (URL Adresi) *</label>
                    <button
                      type="button"
                      onClick={() => setProductData(prev => ({ ...prev, slug: slugifyTr(prev.name) }))}
                      className="text-[11px] text-[#C5A572] font-bold hover:underline cursor-pointer"
                      title="Slug'ı mevcut ürün adından yeniden oluştur (ürün URL'si değişir)"
                    >
                      Addan oluştur
                    </button>
                  </div>
                  <input required type="text" value={productData?.slug} onChange={(e) => setProductData({...productData, slug: e.target.value})} onBlur={() => setProductData(prev => ({ ...prev, slug: slugifyTr(prev.slug) }))} className="w-full p-2.5 border rounded-xs text-sm bg-gray-50 font-mono" />
                  {productData?.slug && slugifyTr(productData.slug) !== originalSlug && (
                    <p className="text-[10px] text-amber-700 mt-1">Dikkat: URL değişecek. Eski bağlantılar (/urunler/{originalSlug}) çalışmayacak.</p>
                  )}
                </div>
              </div>
              
              {/* Kategori & SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Seçimi *</label>
                  <select 
                    required 
                    value={productData?.selected_category} 
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
                  value={productData?.description} 
                  onChange={(e) => setProductData({...productData, description: e.target.value, short_description: e.target.value})} 
                  rows={4} 
                  className="w-full p-2.5 border rounded-xs text-sm" 
                  placeholder="Müşteriye ürün sayfasında 'Ürün Detayı' sekmesinde gösterilecek açıklama..." 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kumaş Bilgisi</label>
                <textarea 
                  value={productData?.fabric_info} 
                  onChange={(e) => setProductData({...productData, fabric_info: e.target.value})} 
                  rows={3} 
                  className="w-full p-2.5 border rounded-xs text-sm" 
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
                onUploadSuccess={(urls) => setImages(prev => [...prev, ...urls.filter(u => !prev.includes(u))])}
                onReorder={(newImages) => setImages(newImages)}
                onRemoveImage={(url) => setImages(prev => prev.filter(img => img !== url))}
              />
            </div>

            {/* Varyantlar & Beden Ayarları */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-3 gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1A1A]">Varyantlar & Stok (Renk & Beden)</h2>
                  <p className="text-xs text-gray-500">Ürüne özel renk, beden ve stok miktarlarını düzenleyin.</p>
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
                        <input placeholder="ör. Siyah" value={v.color_name} onChange={(e) => handleVariantChange(idx, 'color_name', e.target.value)} className="w-full p-2 border rounded-xs text-xs bg-white" />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Renk Paleti</label>
                        <input type="color" value={v.color_hex} onChange={(e) => handleVariantChange(idx, 'color_hex', e.target.value)} className="w-full h-8 cursor-pointer rounded-xs" />
                      </div>

                      {isSizeEnabled ? (
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Beden (Harf & Numara)</label>
                          <select 
                            value={v.size} 
                            onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                            className="w-full p-2 border rounded-xs text-xs bg-white font-medium"
                          >
                            {v.size && !LETTER_SIZES.includes(v.size) && !NUMBER_SIZES.includes(v.size) && (
                              <option value={v.size}>{v.size} (mevcut)</option>
                            )}
                            <optgroup label="── Harf Bedenler ──">
                              {LETTER_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </optgroup>
                            <optgroup label="── Numara Bedenler (Ulusal) ──">
                              {NUMBER_SIZES.map(s => <option key={s} value={s}>{s} Beden</option>)}
                            </optgroup>
                          </select>
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
                  className="w-full p-2.5 border border-gray-300 rounded-xs text-xs font-semibold bg-white"
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
                  className="w-full p-2.5 border border-gray-300 rounded-xs text-xs bg-white font-mono"
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
                    onBlur={handlePriceBlur}
                    inputMode="decimal"
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
                    onBlur={handlePriceBlur}
                    inputMode="decimal"
                    className="w-full p-2.5 pr-8 border border-gray-300 rounded-xs text-sm font-bold text-emerald-700" 
                    placeholder="Opsiyonel (Örn: 1.750)" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs">₺</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Kuruş için virgül kullanın (ör. 1.299,90)</p>
              </div>

              {priceError && (
                <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xs p-2">{priceError}</p>
              )}

              <PriceResearchButton
                productName={productData?.name || ''}
                fabric={productData?.fabric_info || ''}
                costPrice={supplierCost}
                onApplyPrice={(price) => {
                  setProductData(prev => ({ ...prev, base_price: price }))
                  setDisplayBasePrice(formatTurkishPrice(price))
                  setPriceError(validatePrices(price, productData?.sale_price || null))
                }}
              />
            </div>

            {/* Durum & Etiketler */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3">
              <h2 className="text-lg font-semibold text-[#1A1A1A] border-b pb-2">Mağaza Etiketleri</h2>
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium">
                <input type="checkbox" checked={productData?.is_active} onChange={(e) => setProductData({...productData, is_active: e.target.checked})} className="accent-[#C5A572] w-4 h-4 cursor-pointer" />
                <span>Ürün Mağazada Aktif ve Yayında</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium">
                <input type="checkbox" checked={productData?.is_featured} onChange={(e) => setProductData({...productData, is_featured: e.target.checked})} className="accent-[#C5A572] w-4 h-4 cursor-pointer" />
                <span>En Çok Satanlar (Öne Çıkan)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium">
                <input type="checkbox" checked={productData?.is_new} onChange={(e) => setProductData({...productData, is_new: e.target.checked})} className="accent-[#C5A572] w-4 h-4 cursor-pointer" />
                <span>En Yeni Gelenler Rozeti</span>
              </label>

              {/* OUT OF STOCK / TÜKENDİ TOGGLE CHECKBOX */}
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-rose-700 bg-rose-50 p-2.5 rounded-xs border border-rose-200 mt-2">
                <input 
                  type="checkbox" 
                  checked={productData?.is_out_of_stock} 
                  onChange={(e) => setProductData({...productData, is_out_of_stock: e.target.checked})} 
                  className="accent-rose-600 w-4 h-4 cursor-pointer" 
                />
                <span className="font-bold">Ürün Tükendi (Stokta Yok Rozeti)</span>
              </label>
              {productData?.is_out_of_stock && (
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Ürün mağazada &quot;Tükendi&quot; olarak gösterilir ve sepete eklenemez. Varyant stok miktarları olduğu gibi saklanır; işareti kaldırdığınızda bu stoklar tekrar geçerli olur.
                </p>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Custom Notification Modal */}
      <AdminNotificationModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        primaryButtonText="Ürünler Listesine Git"
        onPrimaryClick={() => router.push('/admin/urunler')}
      />
    </>
  )
}
