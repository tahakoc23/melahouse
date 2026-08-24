// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { RefreshCw, Search, Eye, CheckCircle2, User, Phone, Mail, Package, AlertCircle, Sparkles } from 'lucide-react'
import { Toast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { LuxuryConfetti } from '@/components/ui/LuxuryConfetti'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function AdminReturnsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [showCelebration, setShowCelebration] = useState(false)

  // Confirm Modal State
  const [confirmData, setConfirmData] = useState<{ isOpen: boolean; orderId: string; orderNumber: string } | null>(null)
  const [approving, setApproving] = useState(false)

  // Toast Notification State
  const [toast, setToast] = useState<{ isOpen: boolean; type: 'success' | 'error'; title?: string; message: string }>({
    isOpen: false,
    type: 'success',
    message: ''
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success', title?: string) => {
    setToast({ isOpen: true, type, title, message })
  }

  const fetchReturnOrders = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch("/api/admin/returns", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İade talepleri alınamadı.");
      setOrders(data.orders || [])
    } catch (err: any) {
      console.error(err)
      if (!silent) showToast(err.message || 'İade talepleri yüklenirken bir hata oluştu.', 'error')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchReturnOrders()
  }, [])

  const handleOpenApproveModal = (orderId: string, orderNumber: string) => {
    setConfirmData({ isOpen: true, orderId, orderNumber })
  }

  const handleConfirmApprove = async () => {
    if (!confirmData) return;
    setApproving(true)

    const targetId = confirmData.orderId;
    const targetNumber = confirmData.orderNumber;

    try {
      const res = await fetch("/api/admin/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: targetId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İade onaylanamadı.");

      // Instantly update local React state to iade_edildi
      setOrders(prev => prev.map(o => o.id === targetId ? { ...o, status: 'iade_edildi' } : o));

      // Trigger Celebration Fireworks & Toast
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 5000)

      showToast(`#${targetNumber} siparişinin iadesi başarıyla onaylandı ve tamamlandı.`, 'success', '✨ İade Onaylandı')
      setConfirmData(null)
      fetchReturnOrders(true)
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'İade onaylanırken hata oluştu.', 'error')
    } finally {
      setApproving(false)
    }
  }

  const filteredOrders = orders.filter(o => {
    const customerName = o.profiles?.full_name || o.shipping_address?.full_name || ''
    const matchesSearch = (o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
                          (customerName.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    
    if (filter === 'pending') return matchesSearch && o.status === 'iade_talebi'
    if (filter === 'completed') return matchesSearch && o.status === 'iade_edildi'
    return matchesSearch
  })

  return (
    <div className="space-y-6 text-xs font-inter max-w-6xl mx-auto pb-12 relative">
      {/* Luxury Confetti Fireworks */}
      <LuxuryConfetti active={showCelebration} duration={5000} />

      {/* Toast Notification */}
      <Toast 
        isOpen={toast.isOpen}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Luxury Confirmation Modal */}
      {confirmData && (
        <ConfirmModal
          isOpen={confirmData.isOpen}
          title="İade Talebini Onayla"
          message={`#${confirmData.orderNumber} numaralı sipariş için ürün iadesini onaylamak ve durumu "İade Edildi" olarak güncellemek istediğinize emin misiniz?`}
          confirmText="Evet, İadeyi Onayla"
          cancelText="Vazgeç"
          type="warning"
          isLoading={approving}
          onConfirm={handleConfirmApprove}
          onClose={() => setConfirmData(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">İade Talepleri Yönetimi</h1>
          <p className="text-gray-500 text-[11px] mt-0.5">Müşterilerden gelen ürün iade taleplerini inceleyin ve onaylayın.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 text-amber-900 px-3.5 py-2 rounded-xs border border-amber-200 font-medium">
          <RefreshCw className="w-4 h-4 text-amber-700" />
          <span className="font-bold">Bekleyen Talepler: {orders.filter(o => o.status === 'iade_talebi').length}</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xs shadow-xs border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Sipariş No veya Müşteri Adı ile ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xs text-xs"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xs font-semibold uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-[#1A1A1A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tümü ({orders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xs font-semibold uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
              filter === 'pending' ? 'bg-[#C5A572] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            İncelemedekiler ({orders.filter(o => o.status === 'iade_talebi').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-xs font-semibold uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
              filter === 'completed' ? 'bg-emerald-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tamamlananlar ({orders.filter(o => o.status === 'iade_edildi').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-white p-12 text-center text-gray-400 rounded-xs border border-gray-200">
          <RefreshCw className="w-8 h-8 animate-spin text-[#C5A572] mx-auto mb-2" />
          <p>İade talepleri yükleniyor...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-xs border border-dashed border-gray-200 space-y-2">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-1" />
          <p className="font-semibold text-sm">İade talebi bulunmamaktadır.</p>
          <p className="text-gray-400 text-xs">Arama veya filtre kriterlerinizi değiştirmeyi deneyebilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const customerName = order.profiles?.full_name || order.shipping_address?.full_name || 'Müşteri';
            const customerEmail = order.profiles?.email || order.shipping_address?.email || '-';
            const customerPhone = order.profiles?.phone || order.shipping_address?.phone || '-';
            const isPending = order.status === 'iade_talebi';
            const isApproved = order.status === 'iade_edildi';
            const orderTotal = Number(order.total ?? order.total_amount ?? 0);

            return (
              <motion.div 
                layout
                key={order.id} 
                className="bg-white border border-gray-200 rounded-xs overflow-hidden shadow-xs space-y-0"
              >
                {/* Header */}
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Sipariş No</span>
                      <span className="font-mono font-bold text-[#1A1A1A] text-xs">{order.order_number || order.id.slice(0, 8)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Talep Tarihi</span>
                      <span className="font-semibold text-gray-800">{new Date(order.updated_at || order.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Toplam Tutar</span>
                      <span className="font-bold text-[#1A1A1A]">{formatPrice(orderTotal)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {isPending ? '🔄 İade Talebi Alındı' : '🟢 İade Onaylandı'}
                    </span>
                    <Link 
                      href={`/admin/siparisler/${order.id}`}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-[#1A1A1A] hover:text-white text-gray-700 font-semibold rounded-xs transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      <Eye size={14} /> Sipariş Detayı
                    </Link>
                  </div>
                </div>

                {/* Return Reason Box */}
                <div className="bg-amber-50/70 border-b border-amber-100 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-amber-950 text-xs">Müşteri İade Talebi Sebebi:</h4>
                    <p className="text-amber-900 font-mono text-xs whitespace-pre-line leading-relaxed bg-white p-3 rounded-xs border border-amber-200/80 shadow-2xs">
                      {order.notes || 'İade sebebi belirtilmemiş'}
                    </p>
                  </div>
                </div>

                {/* Main Details Grid: Customer & Items */}
                <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Customer Info */}
                  <div className="bg-gray-50/80 p-4 rounded-xs border border-gray-200 space-y-2">
                    <h4 className="font-bold text-[#1A1A1A] text-xs border-b pb-2 flex items-center gap-2">
                      <User size={14} className="text-[#C5A572]" /> Müşteri İletişim Bilgileri
                    </h4>
                    <div className="space-y-1.5 text-xs text-gray-700 pt-1">
                      <p><span className="font-semibold text-gray-900">Ad Soyad:</span> {customerName}</p>
                      <p className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400" /> <span className="font-medium">{customerEmail}</span></p>
                      <p className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400" /> <span className="font-medium">{customerPhone}</span></p>
                    </div>
                  </div>

                  {/* Products Being Returned */}
                  <div className="lg:col-span-2 space-y-3">
                    <h4 className="font-bold text-[#1A1A1A] text-xs border-b pb-2 flex items-center gap-2">
                      <Package size={14} className="text-[#C5A572]" /> İade Edilen Ürün(ler)
                    </h4>
                    <div className="space-y-2">
                      {order.order_items?.map((item: any) => {
                        const product = item.products
                        const mainImg = product?.product_images?.find((img: any) => img.is_primary)?.image_url || product?.product_images?.[0]?.image_url

                        return (
                          <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50/50 rounded-xs border border-gray-100">
                            <div className="relative w-12 h-16 bg-gray-200 rounded-xs overflow-hidden flex-shrink-0 border border-gray-200">
                              {mainImg && <Image unoptimized src={mainImg} alt={product?.name || item.product_name || "Ürün"} fill className="object-cover" />}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-[#1A1A1A] text-xs">{product?.name || item.product_name || "Ürün"}</h5>
                              <p className="text-gray-500 text-[10px] mt-0.5">Varyant: {item.variant_info || 'Standart'} | Adet: {item.quantity}</p>
                            </div>
                            <span className="font-bold text-[#1A1A1A] text-xs">{formatPrice((item.unit_price || 0) * (item.quantity || 1))}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Action / Status Bar */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center gap-3">
                  {isApproved ? (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 text-emerald-800 font-bold text-xs bg-emerald-100 px-4 py-2 rounded-xs border border-emerald-200 shadow-2xs"
                    >
                      <CheckCircle2 size={16} className="text-emerald-600 animate-bounce" />
                      <span>İADE ONAYLANDI & TAMAMLANDI</span>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => handleOpenApproveModal(order.id, order.order_number || order.id.slice(0, 8))}
                      className="bg-[#1A1A1A] hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xs font-semibold text-xs uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <Sparkles size={16} className="text-[#C5A572]" />
                      <span>İadeyi Onayla & Tamamla</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
