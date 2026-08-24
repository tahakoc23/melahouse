// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { 
  Building2, 
  Link as LinkIcon, 
  RefreshCw, 
  Search, 
  Plus, 
  ExternalLink, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  ShoppingBag, 
  Sparkles, 
  X, 
  Loader2, 
  Package, 
  Tag, 
  Layers, 
  Check, 
  DollarSign,
  Edit,
  Trash2
} from 'lucide-react'
import { Toast } from '@/components/ui/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function AdminSuppliersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'products' | 'changes' | 'competitors' | 'suppliers'>('products')
  const [loading, setLoading] = useState(true)
  const [refreshingAll, setRefreshingAll] = useState(false)

  // Data states
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierProducts, setSupplierProducts] = useState<any[]>([])
  const [changes, setChanges] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState('')

  // Scrape & Save Product Modal State
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false)
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [isScraping, setIsScraping] = useState(false)
  const [scrapedPreview, setScrapedPreview] = useState<any | null>(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [customSupplierName, setCustomSupplierName] = useState<string>('')
  const [savingProduct, setSavingProduct] = useState(false)

  // Add Supplier Company Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [newSupplier, setNewSupplier] = useState({ name: '', website_url: '', contact_person: '', phone: '', email: '', notes: '' })
  const [savingSupplier, setSavingSupplier] = useState(false)

  // Edit Supplier Company Modal State
  const [isEditSupplierModalOpen, setIsEditSupplierModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null)
  const [updatingSupplier, setUpdatingSupplier] = useState(false)

  // Edit Supplier Product Modal State
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [updatingProduct, setUpdatingProduct] = useState(false)

  // Competitor Research State (Trendyol / Hepsiburada)
  const [competitorQuery, setCompetitorQuery] = useState('')
  const [isSearchingCompetitors, setIsSearchingCompetitors] = useState(false)
  const [competitorAnalysis, setCompetitorAnalysis] = useState<any | null>(null)

  // Toast State
  const [toast, setToast] = useState<{ isOpen: boolean; type: 'success' | 'error'; title?: string; message: string }>({
    isOpen: false,
    type: 'success',
    message: ''
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success', title?: string) => {
    setToast({ isOpen: true, type, title, message })
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch suppliers & products
      const sRes = await fetch('/api/admin/suppliers', { cache: 'no-store' })
      const sData = await sRes.json()
      if (sRes.ok) {
        setSuppliers(sData.suppliers || [])
        setSupplierProducts(sData.supplierProducts || [])
        setUnreadCount(sData.unreadCount || 0)
      }

      // 2. Fetch changes log
      const cRes = await fetch('/api/admin/suppliers/changes', { cache: 'no-store' })
      const cData = await cRes.json()
      if (cRes.ok) {
        setChanges(cData.changes || [])
      }
    } catch (err: any) {
      console.error(err)
      showToast('Veriler yüklenirken hata oluştu.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Action: Live Scrape URL Preview
  const handleScrapePreview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scrapeUrl.trim()) {
      showToast('Lütfen geçerli bir ürün linki giriniz.', 'error')
      return
    }

    setIsScraping(true)
    setScrapedPreview(null)

    try {
      const res = await fetch('/api/admin/suppliers/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scrape_preview', product_url: scrapeUrl })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Veri çekilemedi.')

      setScrapedPreview(data.data)
      if (data.data?.brand_name) {
        setCustomSupplierName(data.data.brand_name)
      }
      showToast('Toptancı sitesinden ürün verileri, kumaş ve beden bilgileri çekildi!', 'success', '✨ Açık Kaynak Kazıma Tamam')
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Ürün verileri çekilemedi.', 'error')
    } finally {
      setIsScraping(false)
    }
  }

  // Action: Save Scraped Product
  const handleSaveScrapedProduct = async () => {
    if (!scrapedPreview) return
    setSavingProduct(true)

    try {
      const res = await fetch('/api/admin/suppliers/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_product',
          supplier_id: selectedSupplierId || null,
          supplier_name: customSupplierName || '',
          title: scrapedPreview.title,
          product_url: scrapedPreview.product_url,
          sku: scrapedPreview.sku,
          price: scrapedPreview.price,
          stock_status: scrapedPreview.stock_status,
          color: scrapedPreview.color,
          fabric: scrapedPreview.fabric,
          sizes: scrapedPreview.sizes,
          description: scrapedPreview.description,
          image_url: scrapedPreview.image_url,
          raw_metadata: scrapedPreview.raw_metadata
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ürün kaydedilemedi.')

      showToast('Toptancı ürünü ve marka kaydı başarıyla oluşturuldu!', 'success')
      setIsScrapeModalOpen(false)
      setScrapeUrl('')
      setScrapedPreview(null)
      setCustomSupplierName('')
      setSelectedSupplierId('')
      fetchData()
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Kaydedilirken hata oluştu.', 'error')
    } finally {
      setSavingProduct(false)
    }
  }

  // Action: Save New Supplier Company
  const handleSaveSupplierCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSupplier.name.trim()) return

    setSavingSupplier(true)
    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Toptancı eklenemedi.')

      showToast('Toptancı firma rehbere başarıyla eklendi.', 'success')
      setIsSupplierModalOpen(false)
      setNewSupplier({ name: '', website_url: '', contact_person: '', phone: '', email: '', notes: '' })
      fetchData()
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Toptancı eklenemedi.', 'error')
    } finally {
      setSavingSupplier(false)
    }
  }

  // Action: Update Supplier Company
  const handleUpdateSupplierCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSupplier || !editingSupplier.name.trim()) return

    setUpdatingSupplier(true)
    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSupplier)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Toptancı güncellenemedi.')

      showToast('Toptancı firma bilgileri başarıyla güncellendi.', 'success')
      setIsEditSupplierModalOpen(false)
      setEditingSupplier(null)
      fetchData()
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Toptancı güncellenemedi.', 'error')
    } finally {
      setUpdatingSupplier(false)
    }
  }

  // Action: Delete Supplier Company
  const handleDeleteSupplierCompany = async (supplierId: string, name: string) => {
    if (!window.confirm(`"${name}" adlı toptancı firmayı silmek istediğinize emin misiniz?`)) return

    try {
      const res = await fetch(`/api/admin/suppliers?id=${supplierId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Toptancı silinemedi.')

      showToast('Toptancı firma başarıyla silindi.', 'success')
      fetchData()
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Silme hatası oluştu.', 'error')
    }
  }

  // Action: Update Supplier Product Details
  const handleUpdateSupplierProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    setUpdatingProduct(true)
    try {
      const res = await fetch('/api/admin/suppliers/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_product',
          supplier_id: editingProduct.supplier_id || null,
          title: editingProduct.title,
          product_url: editingProduct.product_url,
          sku: editingProduct.sku,
          price: editingProduct.price,
          stock_status: editingProduct.stock_status,
          color: editingProduct.color,
          fabric: editingProduct.fabric,
          sizes: editingProduct.sizes || 'S, M, L, XL',
          description: editingProduct.description,
          image_url: editingProduct.image_url
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Toptancı ürünü güncellenemedi.')

      showToast('Toptancı ürün detayları başarıyla güncellendi.', 'success')
      setIsEditProductModalOpen(false)
      setEditingProduct(null)
      fetchData()
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Ürün güncellenemedi.', 'error')
    } finally {
      setUpdatingProduct(false)
    }
  }

  // Action: Delete Supplier Product
  const handleDeleteSupplierProduct = async (productId: string, title: string) => {
    if (!window.confirm(`"${title}" adlı toptancı ürününü silmek istediğinize emin misiniz?`)) return

    try {
      const res = await fetch(`/api/admin/suppliers?product_id=${productId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ürün silinemedi.')

      showToast('Toptancı ürünü takip listesinden silindi.', 'success')
      fetchData()
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Silme hatası oluştu.', 'error')
    }
  }

  // Action: Batch Refresh & Change Detection
  const handleRefreshAllSuppliers = async () => {
    setRefreshingAll(true)
    try {
      const res = await fetch('/api/admin/suppliers/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_all' })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Taramada hata oluştu.')

      showToast(
        `Tüm toptancı ürünleri tarandı. ${data.changesCount || 0} yeni değişiklik tespit edildi!`,
        'success',
        '🔄 Canlı Takip Taraması Tamamlandı'
      )
      fetchData()
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Toptancı siteleri taranırken hata oluştu.', 'error')
    } finally {
      setRefreshingAll(false)
    }
  }

  // Action: Mark All Change Notifications as Read
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/admin/suppliers/changes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all_read: true })
      })

      if (!res.ok) throw new Error('Bildirimler güncellenemedi.')

      showToast('Tüm değişiklik bildirimleri okundu olarak işaretlendi.', 'success')
      setUnreadCount(0)
      fetchData()
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'İşlem başarısız.', 'error')
    }
  }

  // Action: Scrape Trendyol & Hepsiburada Competitor Prices (5 Trendyol + 5 Hepsiburada)
  const handleSearchCompetitors = async (queryTitle?: string, fabricInfo?: string) => {
    const q = (queryTitle || competitorQuery).trim()
    if (!q) {
      showToast('Lütfen aramak istediğiniz kıyafet adını giriniz.', 'error')
      return
    }

    setIsSearchingCompetitors(true)
    setCompetitorAnalysis(null)
    setActiveTab('competitors')

    try {
      const res = await fetch('/api/admin/suppliers/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, fabric: fabricInfo || 'Saten / Dokuma Kumaş' })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Pazar yerleri aranamadı.')

      setCompetitorAnalysis(data.analysis)
      showToast('Trendyol ve Hepsiburada pazar yerlerinden 5+5 ürün başarıyla karşılaştırıldı!', 'success', '🏷️ 10 Adet Doğrudan Ürün Linki')
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Rakip araştırması başarısız.', 'error')
    } finally {
      setIsSearchingCompetitors(false)
    }
  }

  const filteredProducts = supplierProducts.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 text-xs font-inter max-w-7xl mx-auto pb-12">
      <Toast 
        isOpen={toast.isOpen}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A] flex items-center gap-2">
            Toptancılar & Toptancı Ürün Takip Yönetimi
            {unreadCount > 0 && (
              <span className="bg-rose-600 text-white rounded-full px-2.5 py-0.5 text-xs font-bold animate-pulse shadow-sm">
                {unreadCount} Yeni Değişiklik
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-[11px] mt-0.5">
            Açık kaynaklı Cheerio motoru ile toptancı ürünlerini canlı takip edin; fiyat, kumaş, beden ve stok değişikliklerini anlık tespit edin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefreshAllSuppliers}
            disabled={refreshingAll}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xs font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${refreshingAll ? 'animate-spin' : ''}`} />
            <span>{refreshingAll ? 'Tüm Toptancılar Taranıyor...' : 'Tüm Toptancıları Şimdi Tara'}</span>
          </button>

          <button
            onClick={() => setIsScrapeModalOpen(true)}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            <span>Toptancı Ürünü Ekle (URL İle)</span>
          </button>

          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xs font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Building2 size={15} />
            <span>Firma Ekle</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-xs p-1 shadow-2xs">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2.5 px-4 rounded-xs font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'products' ? 'bg-[#1A1A1A] text-white' : 'text-gray-600 hover:text-black'
          }`}
        >
          <Package size={16} />
          <span>Toptancı Ürünleri ({supplierProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('changes')}
          className={`flex-1 py-2.5 px-4 rounded-xs font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer relative ${
            activeTab === 'changes' ? 'bg-rose-900 text-white' : 'text-gray-600 hover:text-black'
          }`}
        >
          <AlertCircle size={16} />
          <span>Fiyat & Stok Değişiklik Günlüğü ({changes.length})</span>
          {unreadCount > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute top-2 right-4" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('competitors')}
          className={`flex-1 py-2.5 px-4 rounded-xs font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'competitors' ? 'bg-[#C5A572] text-white' : 'text-gray-600 hover:text-black'
          }`}
        >
          <TrendingUp size={16} />
          <span>Trendyol & Hepsiburada Rakip Analizi</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex-1 py-2.5 px-4 rounded-xs font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'suppliers' ? 'bg-indigo-950 text-white' : 'text-gray-600 hover:text-black'
          }`}
        >
          <Building2 size={16} />
          <span>Toptancı Firmalar ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: TOPTANCI ÜRÜNLERİ & CANLI LINK SCRAPER */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xs border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Ürün adı, SKU kodu veya toptancı adı ile ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xs text-xs"
              />
            </div>
            <span className="text-gray-500 text-xs font-semibold">
              Listelenen: {filteredProducts.length} Ürün
            </span>
          </div>

          {loading ? (
            <div className="bg-white p-12 text-center text-gray-400 rounded-xs border border-gray-200">
              <RefreshCw className="w-8 h-8 animate-spin text-[#C5A572] mx-auto mb-2" />
              <p>Toptancı ürünleri yükleniyor...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-500 rounded-xs border border-dashed border-gray-200 space-y-3">
              <Package className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="font-semibold text-sm">Henüz kayıtlı toptancı ürünü bulunmuyor.</p>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Yukarıdaki <strong>"Toptancı Ürünü Ekle (URL İle)"</strong> butonuna tıklayarak ürün linkini yapıştırabilir ve verileri otomatik çekebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xs overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 border-b border-gray-200 font-semibold tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Toptancı & Görsel</th>
                      <th className="px-4 py-3.5">Ürün Adı & Kodu</th>
                      <th className="px-4 py-3.5">Kumaş, Renk & Bedenler</th>
                      <th className="px-4 py-3.5">Alış Fiyatı</th>
                      <th className="px-4 py-3.5">Stok Durumu</th>
                      <th className="px-4 py-3.5">Son Kontrol</th>
                      <th className="px-4 py-3.5 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((prod) => {
                      const isOutOfStock = prod.stock_status === 'stokta_yok'
                      const sizesStr = prod.raw_metadata?.sizes || 'S, M, L, XL'

                      return (
                        <tr key={prod.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-14 bg-gray-100 rounded-xs overflow-hidden border border-gray-200 flex-shrink-0">
                                {prod.image_url ? (
                                  <Image unoptimized src={prod.image_url} alt={prod.title} fill className="object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">Görsel Yok</div>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-[#1A1A1A] block">{prod.suppliers?.name || 'Genel Toptancı'}</span>
                                <span className="text-[10px] text-[#C5A572] font-mono block">{prod.suppliers?.domain || 'web'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <h4 className="font-semibold text-[#1A1A1A] max-w-xs line-clamp-2">{prod.title}</h4>
                            <span className="text-[10px] font-mono text-gray-400">SKU: {prod.sku || '-'}</span>
                          </td>

                          <td className="px-4 py-3 text-gray-600 space-y-0.5">
                            <p><span className="font-medium text-gray-900">Kumaş:</span> {prod.fabric || 'Belirtilmemiş'}</p>
                            <p><span className="font-medium text-gray-900">Renk:</span> {prod.color || 'Standart'}</p>
                            <p className="flex items-center gap-1 mt-0.5">
                              <span className="font-medium text-gray-900">Bedenler:</span> 
                              <span className="font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded-xs border border-indigo-200 text-[10px]">
                                {sizesStr}
                              </span>
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-sm text-[#1A1A1A]">{formatPrice(prod.price)}</span>
                          </td>

                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isOutOfStock ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {isOutOfStock ? '🔴 Stokta Yok (Tükendi)' : '🟢 Stokta Var (Satışta)'}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-gray-500 text-[11px]">
                            {prod.last_scraped_at ? new Date(prod.last_scraped_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Bugün'}
                          </td>

                          <td className="px-4 py-3 text-right space-x-1.5">
                            <a
                              href={prod.product_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-gray-100 hover:bg-[#1A1A1A] hover:text-white text-gray-800 font-semibold rounded-xs transition-colors inline-flex items-center gap-1 text-[10px]"
                              title="Toptancı Sitesini Aç"
                            >
                              <ExternalLink size={12} /> Link
                            </a>

                            <button
                              onClick={() => {
                                setEditingProduct({ ...prod, sizes: sizesStr })
                                setIsEditProductModalOpen(true)
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xs transition-colors inline-flex items-center cursor-pointer"
                              title="Ürün Detaylarını Düzenle"
                            >
                              <Edit size={14} />
                            </button>

                            <button
                              onClick={() => handleDeleteSupplierProduct(prod.id, prod.title)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xs transition-colors inline-flex items-center cursor-pointer"
                              title="Ürünü Sil"
                            >
                              <Trash2 size={14} />
                            </button>

                            <button
                              onClick={() => {
                                setCompetitorQuery(prod.title)
                                handleSearchCompetitors(prod.title, prod.fabric)
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-200 text-amber-900 font-semibold rounded-xs transition-colors inline-flex items-center gap-1 text-[10px] cursor-pointer"
                            >
                              <TrendingUp size={11} /> Pazarda Ara
                            </button>

                            <button
                              onClick={() => router.push(`/admin/urunler/yeni?from_supplier=${prod.id}`)}
                              className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#C5A572] text-white font-semibold rounded-xs transition-colors inline-flex items-center gap-1 text-[10px] cursor-pointer shadow-2xs"
                              title="Bu toptancı ürününün tüm verilerini otomatik taşıyarak MELA HOUSE Mağazasına Ekle"
                            >
                              <Plus size={12} className="text-[#C5A572]" /> Ürünü Mağazaya Ekle
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
        </div>
      )}

      {/* TAB 2: CANLI FİYAT & STOK DEĞİŞİKLİK GÜNLÜĞÜ */}
      {activeTab === 'changes' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xs flex items-center justify-between">
            <div className="flex items-center gap-3 text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-xs">Canlı Toptancı Değişiklik Bildirimleri</h4>
                <p className="text-[11px] text-amber-800">
                  Toptancıların web sitelerinde fiyat veya stok durumu değiştiğinde anında burada listelenir.
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-xs"
              >
                Tüm Bildirimleri Okundu İşaretle
              </button>
            )}
          </div>

          {changes.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-500 rounded-xs border border-dashed border-gray-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-1" />
              <p className="font-semibold text-sm">Henüz tespit edilen yeni bir toptancı değişikliği yok.</p>
              <p className="text-gray-400 text-xs">Toptancı sitelerini canlı taramak için yukarıdaki "Tüm Toptancıları Şimdi Tara" butonunu kullanabilirsiniz.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {changes.map((change) => {
                const prod = change.supplier_products
                const isPriceChange = change.field_changed === 'price'
                const isUnread = !change.is_read

                return (
                  <div 
                    key={change.id}
                    className={`p-4 rounded-xs border transition-all flex items-start justify-between gap-4 ${
                      isUnread ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-300' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full flex-shrink-0 mt-0.5 ${
                        isPriceChange ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-900'
                      }`}>
                        {isPriceChange ? <DollarSign size={18} /> : <AlertCircle size={18} />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-[#1A1A1A]">{prod?.title || 'Toptancı Ürünü'}</h4>
                          {isUnread && (
                            <span className="bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                              Yeni Uyarı
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 text-xs">
                          Toptancı: <span className="font-semibold text-gray-900">{prod?.suppliers?.name || 'Genel Toptancı'}</span>
                        </p>

                        <div className="p-2.5 bg-white border border-gray-200 rounded-xs font-mono text-xs text-gray-800 mt-2 inline-block">
                          <span className="text-gray-500 font-semibold">{isPriceChange ? 'Alış Fiyatı Değişti:' : 'Stok Durumu Değişti:'}</span>{' '}
                          <span className="line-through text-gray-400 mr-2">{change.old_value}</span>
                          <span className="font-bold text-emerald-700">➔ {change.new_value}</span>
                        </div>

                        <p className="text-[10px] text-gray-400 mt-1">
                          Tespit Tarihi: {new Date(change.created_at).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>

                    {prod?.product_url && (
                      <a
                        href={prod.product_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#1A1A1A] text-white hover:bg-[#C5A572] rounded-xs font-semibold text-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                      >
                        <ExternalLink size={12} /> Ürünü Toptancıda Gör
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRENDYOL & HEPSİBURADA RAKİP FİYAT ANALİZİ */}
      {activeTab === 'competitors' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-playfair font-semibold text-lg text-[#1A1A1A]">Trendyol & Hepsiburada Rakip Satıcı Araştırması</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                Ücretli hiçbir API kullanmadan açık kaynaklı kodlarla Trendyol ve Hepsiburada üzerindeki benzer kıyafet satıcılarını ve ortalama pazar satış fiyatlarını bulun.
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleSearchCompetitors()
              }} 
              className="flex gap-2"
            >
              <input
                type="text"
                value={competitorQuery}
                onChange={(e) => setCompetitorQuery(e.target.value)}
                placeholder="ör. Saten Kruvaze Abiye Elbise..."
                className="flex-1 p-3 border border-gray-300 rounded-xs text-xs"
              />
              <button
                type="submit"
                disabled={isSearchingCompetitors}
                className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-6 py-3 rounded-xs font-semibold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-md disabled:opacity-50"
              >
                {isSearchingCompetitors ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Pazaryerleri Taranıyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C5A572]" />
                    <span>Pazarda Araştır</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Analysis Results Display */}
          {competitorAnalysis && (
            <div className="space-y-6">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-amber-50 border border-amber-300 p-4 rounded-xs shadow-2xs">
                  <span className="text-amber-900 text-[10px] font-bold uppercase tracking-wider block">Ortalama Pazar Satış Fiyatı</span>
                  <span className="text-2xl font-bold text-[#1A1A1A] font-playfair">{formatPrice(competitorAnalysis.average_price)}</span>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">En Düşük Pazar Fiyatı</span>
                  <span className="text-xl font-bold text-emerald-700">{formatPrice(competitorAnalysis.min_price)}</span>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">En Yüksek Pazar Fiyatı</span>
                  <span className="text-xl font-bold text-rose-700">{formatPrice(competitorAnalysis.max_price)}</span>
                </div>
              </div>

              {/* Verified Marketplace Listings Table */}
              <div className="bg-white border border-gray-200 rounded-xs overflow-hidden shadow-xs">
                <div className="p-4 border-b border-gray-200 font-bold text-xs text-[#1A1A1A] flex items-center justify-between">
                  <span>Tespit Edilen Benzer Satıcı Ürünleri ({competitorAnalysis.items?.length || 0})</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">✓ 5 Trendyol + 5 Hepsiburada Doğrudan Ürün Linkleri</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {competitorAnalysis.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.marketplace_name === 'Trendyol' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-amber-600 text-white font-bold'
                        }`}>
                          {item.marketplace_name}
                        </span>
                        <div>
                          <h4 className="font-semibold text-xs text-[#1A1A1A]">{item.product_title}</h4>
                          {item.fabric_match && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-xs border border-emerald-200 inline-block mt-0.5">
                              ✓ {item.fabric_match}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm text-[#1A1A1A]">{formatPrice(item.price)}</span>
                        <a
                          href={item.product_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                        >
                          <ExternalLink size={12} /> Ürünü Gör ➔
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TOPTANCI FİRMALAR REHBERİ */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xs border border-gray-200 shadow-xs">
            <h3 className="font-bold text-xs text-[#1A1A1A]">Kayıtlı Toptancı Firmalar Rehberi ({suppliers.length})</h3>
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Yeni Firma Ekle</span>
            </button>
          </div>

          {suppliers.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-500 rounded-xs border border-dashed border-gray-200">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-1" />
              <p className="font-semibold text-sm">Henüz kayıtlı toptancı firma yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((sup) => (
                <div key={sup.id} className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs space-y-3 relative group">
                  <div className="flex justify-between items-start border-b pb-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#1A1A1A] font-playfair">{sup.name}</h4>
                      <span className="font-mono text-[10px] text-[#C5A572] bg-amber-50 px-2 py-0.5 rounded-xs border border-amber-200 inline-block mt-0.5">
                        {sup.domain || 'Domain'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingSupplier(sup)
                          setIsEditSupplierModalOpen(true)
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-xs transition-colors cursor-pointer"
                        title="Toptancı Firmayı Düzenle"
                      >
                        <Edit size={15} />
                      </button>

                      <button
                        onClick={() => handleDeleteSupplierCompany(sup.id, sup.name)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-xs transition-colors cursor-pointer"
                        title="Toptancı Firmayı Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    <p><span className="font-semibold text-gray-900">Yetkili:</span> {sup.contact_person || '-'}</p>
                    <p><span className="font-semibold text-gray-900">Telefon:</span> {sup.phone || '-'}</p>
                    <p><span className="font-semibold text-gray-900">E-posta:</span> {sup.email || '-'}</p>
                    {sup.notes && <p className="text-[11px] text-gray-500 italic mt-2 border-t pt-2">{sup.notes}</p>}
                  </div>

                  {sup.website_url && (
                    <a
                      href={sup.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center py-2 bg-gray-100 hover:bg-[#1A1A1A] hover:text-white text-gray-800 font-semibold rounded-xs text-xs transition-colors"
                    >
                      Web Sitesini Aç ➔
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: TOPTANCI ÜRÜNÜ EKLE (URL İLE CANLI KAZIMA & MARKA İSMİ ATAMA) */}
      <AnimatePresence>
        {isScrapeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-inter text-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-xs border border-gray-200 max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-playfair font-semibold text-lg text-[#1A1A1A] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C5A572]" />
                  Toptancı Ürünü Ekle (URL & Marka İsmi Tanımla)
                </h3>
                <button onClick={() => setIsScrapeModalOpen(false)} className="text-gray-400 hover:text-black p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* URL Input Form */}
              <form onSubmit={handleScrapePreview} className="space-y-3">
                <label className="block font-semibold text-gray-800">Toptancı Ürün Linkini (URL) Yapıştırın *</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://toptanci-firmasi.com/urun-detay-123"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-xs text-xs"
                  />
                  <button
                    type="submit"
                    disabled={isScraping}
                    className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-6 py-3 rounded-xs font-semibold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-md disabled:opacity-50"
                  >
                    {isScraping ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Çekiliyor...</span>
                      </>
                    ) : (
                      <span>Verileri Çek</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Scraped Live Metadata Preview & Wholesaler Name Section */}
              {scrapedPreview && (
                <div className="bg-gray-50 border border-gray-200 p-5 rounded-xs space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 size={16} />
                    <span>Otomatik Veriler, Kumaş & Beden Bilgileri Çekildi:</span>
                  </div>

                  {/* Wholesaler Brand Name Input & Dropdown Selection */}
                  <div className="bg-amber-50/80 p-3.5 rounded-xs border border-amber-300 space-y-2">
                    <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                      1. Toptancı Firma / Marka Adı (Otomatik Rehbere Eklenir) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-gray-500 font-semibold block mb-0.5">Mevcut Toptancılardan Seç:</span>
                        <select
                          value={selectedSupplierId}
                          onChange={(e) => {
                            setSelectedSupplierId(e.target.value)
                            const matched = suppliers.find(s => s.id === e.target.value)
                            if (matched) setCustomSupplierName(matched.name)
                          }}
                          className="w-full p-2 border rounded-xs bg-white text-xs font-semibold"
                        >
                          <option value="">-- Listeden Seçiniz --</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.domain})</option>)}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 font-semibold block mb-0.5">veya Yeni Toptancı/Marka Adı Yaz:</span>
                        <input
                          type="text"
                          placeholder="ör. Fame Tekstil, ZARA Toptan"
                          value={customSupplierName}
                          onChange={(e) => {
                            setCustomSupplierName(e.target.value)
                            setSelectedSupplierId('')
                          }}
                          className="w-full p-2 border border-amber-400 rounded-xs font-bold bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400">Ürün Adı</label>
                      <input
                        type="text"
                        value={scrapedPreview.title}
                        onChange={(e) => setScrapedPreview({ ...scrapedPreview, title: e.target.value })}
                        className="w-full p-2 border rounded-xs font-semibold bg-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400">Toptancı Alış Fiyatı (₺)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={scrapedPreview.price}
                        onChange={(e) => setScrapedPreview({ ...scrapedPreview, price: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 border rounded-xs font-bold text-emerald-800 bg-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400">Stok Durumu</label>
                      <select
                        value={scrapedPreview.stock_status}
                        onChange={(e) => setScrapedPreview({ ...scrapedPreview, stock_status: e.target.value })}
                        className="w-full p-2 border rounded-xs font-semibold bg-white mt-1"
                      >
                        <option value="stokta_var">Stokta Var (Satışta)</option>
                        <option value="stokta_yok">Stokta Yok (Tükendi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400">Ürün Kodu (SKU)</label>
                      <input
                        type="text"
                        value={scrapedPreview.sku}
                        onChange={(e) => setScrapedPreview({ ...scrapedPreview, sku: e.target.value })}
                        className="w-full p-2 border rounded-xs font-mono bg-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-emerald-700">Kumaş Bilgisi (Otomatik Çekildi)</label>
                      <input
                        type="text"
                        value={scrapedPreview.fabric}
                        onChange={(e) => setScrapedPreview({ ...scrapedPreview, fabric: e.target.value })}
                        className="w-full p-2 border border-emerald-400 rounded-xs font-semibold bg-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-700">Mevcut Bedenler (Otomatik Çekildi)</label>
                      <input
                        type="text"
                        value={scrapedPreview.sizes}
                        onChange={(e) => setScrapedPreview({ ...scrapedPreview, sizes: e.target.value })}
                        className="w-full p-2 border border-indigo-400 rounded-xs font-semibold bg-white mt-1"
                        placeholder="ör. S, M, L, XL veya 36, 38, 40"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400">Renkler</label>
                      <input
                        type="text"
                        value={scrapedPreview.color}
                        onChange={(e) => setScrapedPreview({ ...scrapedPreview, color: e.target.value })}
                        className="w-full p-2 border rounded-xs bg-white mt-1"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setScrapedPreview(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xs text-xs font-semibold"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      disabled={savingProduct}
                      onClick={handleSaveScrapedProduct}
                      className="px-6 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs text-xs font-semibold uppercase tracking-wider shadow-md cursor-pointer"
                    >
                      {savingProduct ? 'Kaydediliyor...' : 'Toptancı & Ürünü Kaydet'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: YENİ TOPTANCI FİRMA EKLE */}
      <AnimatePresence>
        {isSupplierModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-inter text-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-xs border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-playfair font-semibold text-lg text-[#1A1A1A]">Yeni Toptancı Firma Ekle</h3>
                <button onClick={() => setIsSupplierModalOpen(false)} className="text-gray-400 hover:text-black p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSupplierCompany} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Firma Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="ör. İstanbul Tekstil Toptan"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    className="w-full p-2.5 border rounded-xs text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Web Sitesi URL</label>
                  <input
                    type="url"
                    placeholder="https://www.toptanci.com"
                    value={newSupplier.website_url}
                    onChange={(e) => setNewSupplier({ ...newSupplier, website_url: e.target.value })}
                    className="w-full p-2.5 border rounded-xs text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Yetkili Kişi</label>
                    <input
                      type="text"
                      placeholder="Ahmet Bey"
                      value={newSupplier.contact_person}
                      onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                      className="w-full p-2.5 border rounded-xs text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      placeholder="0532 000 0000"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      className="w-full p-2.5 border rounded-xs text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    placeholder="info@toptanci.com"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="w-full p-2.5 border rounded-xs text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notlar / Özel Alış Şartları</label>
                  <textarea
                    rows={3}
                    placeholder="Minimum 10 adet sipariş şartı var..."
                    value={newSupplier.notes}
                    onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                    className="w-full p-2.5 border rounded-xs text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSupplierModalOpen(false)}
                    className="px-4 py-2 border text-gray-700 rounded-xs font-semibold"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={savingSupplier}
                    className="px-6 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs font-semibold uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    {savingSupplier ? 'Ekleniyor...' : 'Firmayı Kaydet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: TOPTANCI FİRMA DÜZENLE */}
      <AnimatePresence>
        {isEditSupplierModalOpen && editingSupplier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-inter text-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-xs border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-playfair font-semibold text-lg text-[#1A1A1A]">Toptancı Firma Düzenle</h3>
                <button onClick={() => setIsEditSupplierModalOpen(false)} className="text-gray-400 hover:text-black p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateSupplierCompany} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Firma Adı *</label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.name}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                    className="w-full p-2.5 border rounded-xs text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Web Sitesi URL</label>
                  <input
                    type="url"
                    value={editingSupplier.website_url || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, website_url: e.target.value })}
                    className="w-full p-2.5 border rounded-xs text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Yetkili Kişi</label>
                    <input
                      type="text"
                      value={editingSupplier.contact_person || ''}
                      onChange={(e) => setEditingSupplier({ ...editingSupplier, contact_person: e.target.value })}
                      className="w-full p-2.5 border rounded-xs text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={editingSupplier.phone || ''}
                      onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                      className="w-full p-2.5 border rounded-xs text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={editingSupplier.email || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                    className="w-full p-2.5 border rounded-xs text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notlar / Şartlar</label>
                  <textarea
                    rows={3}
                    value={editingSupplier.notes || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, notes: e.target.value })}
                    className="w-full p-2.5 border rounded-xs text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditSupplierModalOpen(false)}
                    className="px-4 py-2 border text-gray-700 rounded-xs font-semibold"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={updatingSupplier}
                    className="px-6 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs font-semibold uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    {updatingSupplier ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: TOPTANCI ÜRÜNÜ DÜZENLE */}
      <AnimatePresence>
        {isEditProductModalOpen && editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-inter text-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-xs border border-gray-200 max-w-lg w-full p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-playfair font-semibold text-lg text-[#1A1A1A]">Toptancı Ürün Detayını Düzenle</h3>
                <button onClick={() => setIsEditProductModalOpen(false)} className="text-gray-400 hover:text-black p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateSupplierProduct} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ürün Adı *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.title}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="w-full p-2.5 border rounded-xs text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Toptancı Alış Linki (URL)</label>
                  <input
                    type="url"
                    required
                    value={editingProduct.product_url}
                    onChange={(e) => setEditingProduct({ ...editingProduct, product_url: e.target.value })}
                    className="w-full p-2.5 border rounded-xs text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Toptancı Alış Fiyatı (₺)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 border rounded-xs font-bold text-emerald-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Stok Durumu</label>
                    <select
                      value={editingProduct.stock_status}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock_status: e.target.value })}
                      className="w-full p-2.5 border rounded-xs font-semibold text-xs"
                    >
                      <option value="stokta_var">Stokta Var (Satışta)</option>
                      <option value="stokta_yok">Stokta Yok (Tükendi)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">SKU Kodu</label>
                    <input
                      type="text"
                      value={editingProduct.sku || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      className="w-full p-2.5 border rounded-xs font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Kumaş Bilgisi</label>
                    <input
                      type="text"
                      value={editingProduct.fabric || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fabric: e.target.value })}
                      className="w-full p-2.5 border rounded-xs text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mevcut Bedenler</label>
                  <input
                    type="text"
                    value={editingProduct.sizes || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sizes: e.target.value })}
                    className="w-full p-2.5 border rounded-xs text-xs font-semibold"
                    placeholder="ör. S, M, L, XL veya 36, 38, 40"
                  />
                </div>

                {suppliers.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Bağlı Toptancı Firma</label>
                    <select
                      value={editingProduct.supplier_id || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, supplier_id: e.target.value })}
                      className="w-full p-2.5 border rounded-xs text-xs font-semibold"
                    >
                      <option value="">-- Toptancı Seçiniz (Opsiyonel) --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.domain})</option>)}
                    </select>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditProductModalOpen(false)}
                    className="px-4 py-2 border text-gray-700 rounded-xs font-semibold"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProduct}
                    className="px-6 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs font-semibold uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    {updatingProduct ? 'Güncelleniyor...' : 'Ürünü Güncelle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
