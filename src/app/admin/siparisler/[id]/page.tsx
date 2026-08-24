// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, Save, Truck, User, CreditCard, Package, RefreshCw } from 'lucide-react'
import { Toast } from '@/components/ui/Toast'

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const { id } = React.use(params)
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [cargoCompany, setCargoCompany] = useState('')
  const [cargoTracking, setCargoTracking] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Toast Notification State
  const [toast, setToast] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'info'; title?: string; message: string }>({
    isOpen: false,
    type: 'success',
    message: ''
  })

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', title?: string) => {
    setToast({
      isOpen: true,
      type,
      title,
      message
    })
  }

  useEffect(() => {
    async function fetchOrder() {
      try {
        const { data, error } = await supabase
          .from('orders' as any)
          .select('*, order_items(*), profiles(full_name, email, phone)')
          .eq('id', id)
          .single()
        
        if (error) throw error
        
        setOrder(data)
        setStatus(data.status || 'siparis_alindi')
        setCargoCompany(data.cargo_company || '')
        setCargoTracking(data.cargo_tracking_number || '')
        setNotes(data.notes || '')
      } catch (err) {
        console.error(err)
        showToast('Sipariş verileri yüklenemedi.', 'error', 'Sipariş Bulunamadı')
        setTimeout(() => router.push('/admin/siparisler'), 1500)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id, supabase, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('orders' as any)
        .update({
          status,
          cargo_company: cargoCompany,
          cargo_tracking_number: cargoTracking,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (error) throw error

      setOrder({ ...order, status, cargo_company: cargoCompany, cargo_tracking_number: cargoTracking, notes })
      showToast('Sipariş durumu ve kargo bilgileri başarıyla güncellendi.', 'success', 'Sipariş Güncellendi')
    } catch (error: any) {
      showToast(error.message || 'Görünüşe göre güncelleme sırasında bir hata oluştu.', 'error', 'Güncelleme Başarısız')
    } finally {
      setSaving(false)
    }
  }

  const renderAddressText = (addr: any) => {
    if (!addr) return 'Adres bilgisi girilmemiş'
    if (typeof addr === 'string') return addr
    if (typeof addr === 'object') {
      const lines = []
      if (addr.full_name || addr.fullName) lines.push(`Alıcı: ${addr.full_name || addr.fullName}`)
      if (addr.phone) lines.push(`Telefon: ${addr.phone}`)
      if (addr.address_line || addr.line) lines.push(`Adres: ${addr.address_line || addr.line}`)
      if (addr.district || addr.city) lines.push(`Bölge: ${[addr.district, addr.city].filter(Boolean).join(' / ')}`)
      if (addr.postal_code || addr.zip) lines.push(`Posta Kodu: ${addr.postal_code || addr.zip}`)
      return lines.join('\n')
    }
    return String(addr)
  }

  if (loading) return <div className="p-8 text-gray-500 font-inter text-xs">Sipariş detayları yükleniyor...</div>
  if (!order) return null

  const orderTotal = Number(order.total ?? order.total_amount ?? 0)
  const orderSubtotal = Number(order.subtotal ?? orderTotal)
  const orderCargo = Number(order.shipping_cost ?? 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-inter text-xs relative">
      {/* Toast Notification */}
      <Toast 
        isOpen={toast.isOpen}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-black p-1 rounded-md hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold font-playfair text-[#1A1A1A]">
              Sipariş Detayı #{order.order_number || order.id.slice(0, 8)}
            </h1>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Sipariş Tarihi: {new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-6 py-2.5 rounded-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
        >
          <Save size={16} />
          <span>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items List */}
          <div className="bg-white p-6 rounded-xs shadow-xs border border-gray-200">
            <h2 className="text-sm font-bold text-[#1A1A1A] border-b pb-3 mb-4 flex items-center gap-2">
              <Package size={16} className="text-[#C5A572]" />
              <span>Sipariş İçeriği ({order.order_items?.length || 0} Kalem)</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2.5">Ürün Adı</th>
                    <th className="px-4 py-2.5">Varyant</th>
                    <th className="px-4 py-2.5">Birim Fiyat</th>
                    <th className="px-4 py-2.5">Adet</th>
                    <th className="px-4 py-2.5 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.order_items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-semibold text-[#1A1A1A]">{item.product_name || item.products?.name || "Ürün"}</td>
                      <td className="px-4 py-3 text-gray-500">{item.variant_info || 'Standart'}</td>
                      <td className="px-4 py-3">{formatPrice(item.unit_price || 0)}</td>
                      <td className="px-4 py-3 font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#1A1A1A]">
                        {formatPrice((item.unit_price || 0) * (item.quantity || 1))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 border-t pt-4 flex justify-end">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Ara Toplam:</span>
                  <span>{formatPrice(orderSubtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 border-b pb-2">
                  <span>Kargo Ücreti:</span>
                  <span>{orderCargo === 0 ? 'Ücretsiz Kargo' : formatPrice(orderCargo)}</span>
                </div>
                <div className="flex justify-between text-[#1A1A1A] font-bold text-base pt-1">
                  <span>Genel Toplam:</span>
                  <span>{formatPrice(orderTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery & Billing Address Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xs shadow-xs border border-gray-200 space-y-3">
              <h2 className="text-sm font-bold text-[#1A1A1A] border-b pb-2.5 flex items-center space-x-2">
                <Truck size={16} className="text-[#C5A572]" />
                <span>Teslimat Adresi</span>
              </h2>
              <p className="text-xs whitespace-pre-line text-gray-700 leading-relaxed font-mono bg-gray-50 p-3 rounded-xs border border-gray-100">
                {renderAddressText(order.shipping_address)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xs shadow-xs border border-gray-200 space-y-3">
              <h2 className="text-sm font-bold text-[#1A1A1A] border-b pb-2.5 flex items-center space-x-2">
                <CreditCard size={16} className="text-[#C5A572]" />
                <span>Fatura Adresi</span>
              </h2>
              <p className="text-xs whitespace-pre-line text-gray-700 leading-relaxed font-mono bg-gray-50 p-3 rounded-xs border border-gray-100">
                {renderAddressText(order.billing_address || order.shipping_address)}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Controls: Status, Cargo, Customer */}
        <div className="space-y-6">
          {/* Status Updates */}
          <div className="bg-white p-6 rounded-xs shadow-xs border border-gray-200 space-y-4">
            <h2 className="text-sm font-bold text-[#1A1A1A] border-b pb-2.5">Sipariş Durumu Güncelle</h2>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sipariş Durumu *</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="w-full p-2.5 border rounded-xs text-xs font-semibold bg-white text-[#1A1A1A] border-gray-300 focus:ring-1 focus:ring-[#C5A572]"
              >
                <option value="siparis_alindi">🔵 Sipariş Alındı</option>
                <option value="odeme_bekliyor">🟡 Ödeme Bekliyor</option>
                <option value="hazirlaniyor">🟣 Hazırlanıyor</option>
                <option value="kargoya_verildi">🚚 Kargoya Verildi</option>
                <option value="teslim_edildi">🟢 Teslim Edildi</option>
                <option value="iade_talebi">🔄 İade Talebi Alındı</option>
                <option value="iade_edildi">🔴 İade Edildi</option>
                <option value="iptal_edildi">❌ İptal Edildi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Kargo Firması</label>
              <input 
                type="text" 
                value={cargoCompany} 
                onChange={(e) => setCargoCompany(e.target.value)} 
                placeholder="ör. Yurtiçi Kargo, Trendyol Express" 
                className="w-full p-2.5 border rounded-xs text-xs border-gray-300" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Kargo Takip Numarası</label>
              <input 
                type="text" 
                value={cargoTracking} 
                onChange={(e) => setCargoTracking(e.target.value)} 
                placeholder="ör. 123456789012" 
                className="w-full p-2.5 border rounded-xs text-xs font-mono border-gray-300" 
              />
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white p-6 rounded-xs shadow-xs border border-gray-200 space-y-3">
            <h2 className="text-sm font-bold text-[#1A1A1A] border-b pb-2 flex items-center space-x-2">
              <User size={16} className="text-[#C5A572]" />
              <span>Müşteri Bilgileri</span>
            </h2>
            <div className="text-xs text-gray-600 space-y-1.5">
              <p><span className="font-semibold text-gray-900">Ad Soyad:</span> {order.profiles?.full_name || order.shipping_address?.full_name || 'Müşteri'}</p>
              <p><span className="font-semibold text-gray-900">E-posta:</span> {order.profiles?.email || order.shipping_address?.email || '-'}</p>
              <p><span className="font-semibold text-gray-900">Telefon:</span> {order.profiles?.phone || order.shipping_address?.phone || '-'}</p>
            </div>
          </div>

          {/* Admin Notes / Return Reason */}
          <div className="bg-white p-6 rounded-xs shadow-xs border border-gray-200 space-y-3">
            <h2 className="text-sm font-bold text-[#1A1A1A] border-b pb-2">Admin / İade Notu</h2>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              rows={4} 
              placeholder="İade gerekçesi veya yönetici notları..."
              className="w-full p-2.5 border rounded-xs text-xs border-gray-300 leading-relaxed font-mono" 
            />
          </div>
        </div>
      </div>
    </div>
  )
}
