'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { Search, Eye, Package, Truck, CheckCircle2, Clock, RefreshCw } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  odeme_bekliyor: { label: 'Ödeme Bekliyor', color: 'bg-amber-100 text-amber-800' },
  siparis_alindi: { label: 'Sipariş Alındı', color: 'bg-sky-100 text-sky-800' },
  odeme_alindi: { label: 'Sipariş Alındı', color: 'bg-sky-100 text-sky-800' },
  hazirlaniyor: { label: 'Hazırlanıyor', color: 'bg-indigo-100 text-indigo-800' },
  kargoya_verildi: { label: 'Kargoya Verildi', color: 'bg-purple-100 text-purple-800' },
  teslim_edildi: { label: 'Teslim Edildi', color: 'bg-emerald-100 text-emerald-800' },
  iade_talebi: { label: 'İade Talebi Alındı', color: 'bg-amber-100 text-amber-900 border border-amber-300' },
  iade_edildi: { label: 'İade Edildi', color: 'bg-rose-100 text-rose-800' },
  iptal_edildi: { label: 'İptal Edildi', color: 'bg-rose-100 text-rose-800' },
};

export default function AdminOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function fetchOrders() {
      const { data } = await supabase
        .from('orders' as any)
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    fetchOrders()
  }, [supabase])

  const filteredOrders = orders.filter(o => {
    const customerName = o.profiles?.full_name || o.shipping_address?.full_name || '';
    const searchMatch = (o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
                        (customerName.toLowerCase().includes(searchTerm.toLowerCase()) || '');
    const statusMatch = statusFilter ? o.status === statusFilter : true;
    return searchMatch && statusMatch;
  })

  return (
    <div className="space-y-6 text-xs font-inter">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">Sipariş Yönetimi</h1>
        <span className="text-gray-500 font-medium">Toplam {orders.length} Sipariş</span>
      </div>

      <div className="bg-white p-4 rounded-xs shadow-xs border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Sipariş No veya Müşteri Adı ile ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xs text-xs"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xs min-w-[200px] text-xs font-semibold bg-white"
        >
          <option value="">Tüm Sipariş Durumları</option>
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

      <div className="bg-white rounded-xs shadow-xs border border-gray-200 overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Sipariş No</th>
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Toplam Tutar</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Siparişler yükleniyor...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aradığınız kriterlere uygun sipariş bulunamadı.</td></tr>
            ) : (
              filteredOrders.map((order) => {
                const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
                const orderTotal = Number(order.total ?? order.total_amount ?? 0);
                const customerName = order.profiles?.full_name || order.shipping_address?.full_name || 'Müşteri';

                return (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-[#1A1A1A]">{order.order_number || `VEL-ORD-${order.id.slice(0, 6).toUpperCase()}`}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{customerName}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1A1A1A]">{formatPrice(orderTotal)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link 
                        href={`/admin/siparisler/${order.id}`} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-[#1A1A1A] hover:text-white text-gray-700 font-semibold rounded-xs transition-colors cursor-pointer text-[11px]"
                      >
                        <Eye size={14} /> Detay & Yönet
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
