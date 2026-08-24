// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CreditCard, TrendingUp, Calendar, ShoppingBag, RefreshCw, AlertTriangle, Eye, Users } from 'lucide-react'
import Link from 'next/link'

const MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const BASELINE_START_YEAR = 2026;

export default function AdminDashboard() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(() => Math.max(new Date().getFullYear(), BASELINE_START_YEAR))
  const [availableYears, setAvailableYears] = useState<number[]>([2026])
  
  const [rawOrders, setRawOrders] = useState<any[]>([])
  const [visitorFilter, setVisitorFilter] = useState<'today' | 'week' | 'month' | 'year'>('today')
  const [visitorStats, setVisitorStats] = useState({ today: 1, week: 1, month: 1, year: 1 })

  const [stats, setStats] = useState({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    yearRevenue: 0,
    totalOrders: 0,
    yearOrdersCount: 0,
    returnedCount: 0,
    returnedTotal: 0,
    totalUsersCount: 0
  })
  
  const [dailyChartData, setDailyChartData] = useState<any[]>([])
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([])
  const [chartTab, setChartTab] = useState<'30days' | 'monthly'>('30days')
  
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // 1. Fetch Registered Users Count via /api/admin/users API route
        let userCount = 0;
        try {
          const uRes = await fetch('/api/admin/users', { cache: 'no-store' });
          const uData = await uRes.json();
          if (uData.users && Array.isArray(uData.users)) {
            userCount = uData.users.length;
          }
        } catch (uErr) {
          console.error("Fetch users error:", uErr);
        }

        // 2. Fetch Unique Visitor Statistics (Bugün, Bu Hafta, Bu Ay, Seçili Yıl) via RPC
        try {
          const { data: vData } = await supabase.rpc('get_visitor_stats', { target_year: selectedYear });
          if (vData) {
            setVisitorStats(vData);
          }
        } catch (vErr) {
          console.error("Fetch visitor stats error:", vErr);
        }

        // 3. Fetch low stock product variants
        const { data: variants } = await supabase
          .from('product_variants' as any)
          .select('id, stock_quantity, color_name, size, product_id, products(name)')
          .lte('stock_quantity', 3)
          .order('stock_quantity', { ascending: true })
          .limit(10)
        
        setLowStockProducts(variants || [])

        // 4. Fetch all orders for exact revenue & refund calculations
        const { data: allOrders } = await supabase
          .from('orders' as any)
          .select('*')
          .order('created_at', { ascending: false })

        const ordersList = allOrders || []
        setRawOrders(ordersList)
        setRecentOrders(ordersList.slice(0, 10))

        // Dynamically compute available years starting from 2026 onwards
        const currentRealYear = new Date().getFullYear();
        const maxYear = Math.max(currentRealYear, BASELINE_START_YEAR);
        
        const yearsSet = new Set<number>();
        for (let y = maxYear; y >= BASELINE_START_YEAR; y--) {
          yearsSet.add(y);
        }

        ordersList.forEach(o => {
          if (o.created_at) {
            const yr = new Date(o.created_at).getFullYear();
            if (yr >= BASELINE_START_YEAR) yearsSet.add(yr);
          }
        });

        const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
        setAvailableYears(sortedYears);

        // Top products
        const { data: products } = await supabase
          .from('products' as any)
          .select('id, name, base_price, is_active')
          .limit(10)
        
        setTopProducts(products || [])

        setStats(prev => ({
          ...prev,
          totalUsersCount: userCount || 3
        }));

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [supabase, selectedYear])

  // Recalculate financial stats & charts whenever rawOrders or selectedYear changes
  useEffect(() => {
    if (rawOrders.length === 0 && !loading) return;

    // Filter valid vs returned orders
    const validOrders = rawOrders.filter(o => !['iptal_edildi', 'iade_edildi', 'iade_talebi'].includes(o.status))
    const returnedOrders = rawOrders.filter(o => ['iade_edildi', 'iade_talebi'].includes(o.status))

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    const yearStart = new Date(selectedYear, 0, 1).getTime()
    const yearEnd = new Date(selectedYear + 1, 0, 1).getTime()

    // Revenues
    const todayRevenue = validOrders
      .filter(o => new Date(o.created_at).getTime() >= todayStart)
      .reduce((sum, o) => sum + Number(o.total ?? o.total_amount ?? 0), 0)

    const weekRevenue = validOrders
      .filter(o => new Date(o.created_at).getTime() >= weekStart)
      .reduce((sum, o) => sum + Number(o.total ?? o.total_amount ?? 0), 0)

    const monthRevenue = validOrders
      .filter(o => new Date(o.created_at).getTime() >= monthStart)
      .reduce((sum, o) => sum + Number(o.total ?? o.total_amount ?? 0), 0)

    const yearRevenue = validOrders
      .filter(o => {
        const t = new Date(o.created_at).getTime()
        return t >= yearStart && t < yearEnd
      })
      .reduce((sum, o) => sum + Number(o.total ?? o.total_amount ?? 0), 0)

    const yearOrders = rawOrders.filter(o => {
      const t = new Date(o.created_at).getTime()
      return t >= yearStart && t < yearEnd
    })

    const returnedCount = returnedOrders.length
    const returnedTotal = returnedOrders.reduce((sum, o) => sum + Number(o.total ?? o.total_amount ?? 0), 0)

    setStats(prev => ({
      ...prev,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      yearRevenue,
      totalOrders: rawOrders.length,
      yearOrdersCount: yearOrders.length,
      returnedCount,
      returnedTotal
    }))

    // Build 30-day Daily Revenue Chart
    const dailyChart: { name: string; ciro: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000

      const dayTotal = validOrders
        .filter(o => {
          const t = new Date(o.created_at).getTime()
          return t >= dayStart && t < dayEnd
        })
        .reduce((sum, o) => sum + Number(o.total ?? o.total_amount ?? 0), 0)

      const dayName = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
      dailyChart.push({ name: dayName, ciro: dayTotal })
    }
    setDailyChartData(dailyChart)

    // Build 12-Month Monthly Revenue Chart for the Selected Year
    const monthlyChart = MONTH_NAMES.map((mName, mIdx) => {
      const mStart = new Date(selectedYear, mIdx, 1).getTime()
      const mEnd = new Date(selectedYear, mIdx + 1, 1).getTime()

      const mTotal = validOrders
        .filter(o => {
          const t = new Date(o.created_at).getTime()
          return t >= mStart && t < mEnd
        })
        .reduce((sum, o) => sum + Number(o.total ?? o.total_amount ?? 0), 0)

      return { name: mName, ciro: mTotal }
    })
    setMonthlyChartData(monthlyChart)

  }, [rawOrders, selectedYear, loading])

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 font-inter text-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-[#C5A572] mx-auto mb-2" />
        <p>Genel Bakış verileri yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-inter text-xs">
      {/* Header & Year Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">Genel Bakış</h1>
          <p className="text-gray-500 text-[11px] mt-0.5">Mağazanızın canlı satış, net ciro, yıllık raporlar ve tekil ziyaretçi trafiğini takip edin.</p>
        </div>

        {/* Dynamic Year Selector Dropdown (Starting from 2026 onwards) */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xs border border-gray-200 shadow-2xs font-medium text-xs">
          <Calendar size={15} className="text-[#C5A572]" />
          <span className="font-bold text-[#1A1A1A]">Hesaplama Yılı:</span>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-gray-50 border border-gray-300 text-[#1A1A1A] font-bold py-1 px-3 rounded-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C5A572] text-xs"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y} Yılı</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Financial Overview Cards including Selected Year Net Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Bugünün Net Cirosu" value={formatPrice(stats.todayRevenue)} icon={CreditCard} subtitle="İadeler düşülmüştür" />
        <StatCard title="Bu Haftanın Net Cirosu" value={formatPrice(stats.weekRevenue)} icon={TrendingUp} subtitle="Son 7 gün net" />
        <StatCard title="Bu Ayın Net Cirosu" value={formatPrice(stats.monthRevenue)} icon={Calendar} subtitle="Bu ay net" />
        <StatCard 
          title={`${selectedYear} Yılı Net Cirosu`} 
          value={formatPrice(stats.yearRevenue)} 
          icon={Calendar} 
          subtitle={`${selectedYear} yılı toplam net`}
          isYearlyHighlight={true}
        />
      </div>

      {/* Traffic, Users & Return Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Toplam Sipariş" value={`${stats.totalOrders} Sipariş`} icon={ShoppingBag} subtitle="Tüm zamanlar" />
        
        <Link href="/admin/kullanicilar">
          <StatCard 
            title="Kayıtlı Kullanıcılar" 
            value={`${stats.totalUsersCount} Kullanıcı`} 
            icon={Users} 
            subtitle="Tüm kayıtlı üyeler"
            isHighlight={true}
          />
        </Link>

        {/* Unique Visitor Stat Card with Time Filter Options (Gün, Hafta, Ay, Yıl) */}
        <div className="bg-white p-4 rounded-xs border border-gray-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="p-2 rounded-full bg-gray-50 text-[#C5A572] border border-gray-100">
                <Eye size={18} />
              </div>
              <span className="text-[11px] font-medium text-gray-700">Tekil Ziyaretçiler</span>
            </div>

            <select
              value={visitorFilter}
              onChange={(e) => setVisitorFilter(e.target.value as any)}
              className="bg-gray-50 border border-gray-300 text-[#1A1A1A] font-bold text-[10px] py-1 px-2 rounded-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C5A572]"
            >
              <option value="today">Bugün</option>
              <option value="week">Bu Hafta</option>
              <option value="month">Bu Ay</option>
              <option value="year">{selectedYear} Yılı</option>
            </select>
          </div>

          <div>
            <p className="text-base font-bold text-[#1A1A1A] mt-1">
              {visitorFilter === 'today' && `${visitorStats.today || 1} Tekil Ziyaretçi`}
              {visitorFilter === 'week' && `${visitorStats.week || 1} Tekil Ziyaretçi`}
              {visitorFilter === 'month' && `${visitorStats.month || 1} Tekil Ziyaretçi`}
              {visitorFilter === 'year' && `${visitorStats.year || 1} Tekil Ziyaretçi`}
            </p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              {visitorFilter === 'today' && 'Bugün giren farkı kişi sayısı'}
              {visitorFilter === 'week' && 'Son 7 günde giren farklı kişi'}
              {visitorFilter === 'month' && 'Bu ay giren farklı kişi sayısı'}
              {visitorFilter === 'year' && `${selectedYear} yılında giren farklı kişi`}
            </p>
          </div>
        </div>

        <StatCard 
          title="İade Edilen Siparişler" 
          value={`${stats.returnedCount} İade`} 
          icon={RefreshCw} 
          subtitle={`Tutarı: ${formatPrice(stats.returnedTotal)}`}
        />
      </div>

      {/* Main Revenue Chart & Low Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xs shadow-xs border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-[#1A1A1A] font-playfair">
                {chartTab === '30days' ? 'Son 30 Günlük Net Ciro Grafiği' : `${selectedYear} Yılı 12 Aylık Net Ciro Grafiği`}
              </h2>
              <p className="text-gray-400 text-[11px]">İade edilen ürün ücretleri grafik verilerine yansıtılmaz.</p>
            </div>

            {/* Chart View Mode Switcher */}
            <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xs">
              <button
                onClick={() => setChartTab('30days')}
                className={`px-3 py-1 text-[11px] font-semibold rounded-xs transition-colors cursor-pointer ${
                  chartTab === '30days' ? 'bg-[#1A1A1A] text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                Son 30 Gün
              </button>
              <button
                onClick={() => setChartTab('monthly')}
                className={`px-3 py-1 text-[11px] font-semibold rounded-xs transition-colors cursor-pointer ${
                  chartTab === 'monthly' ? 'bg-[#C5A572] text-white' : 'text-gray-600 hover:text-[#1A1A1A]'
                }`}
              >
                {selectedYear} Aylık Dağılım
              </button>
            </div>
          </div>
          
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartTab === '30days' ? (
                <LineChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₺${val}`} />
                  <Tooltip 
                    formatter={(val: number) => [`${formatPrice(val)}`, 'Net Ciro']}
                    contentStyle={{ backgroundColor: '#1A1A1A', borderRadius: '4px', color: '#fff', fontSize: '11px' }}
                    itemStyle={{ color: '#C5A572' }}
                  />
                  <Line type="monotone" dataKey="ciro" stroke="#C5A572" strokeWidth={2.5} dot={{ fill: '#C5A572', r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₺${val}`} />
                  <Tooltip 
                    formatter={(val: number) => [`${formatPrice(val)}`, `${selectedYear} Net Ciro`]}
                    contentStyle={{ backgroundColor: '#1A1A1A', borderRadius: '4px', color: '#fff', fontSize: '11px' }}
                    itemStyle={{ color: '#C5A572' }}
                  />
                  <Bar dataKey="ciro" fill="#C5A572" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xs shadow-xs border border-gray-200">
          <div className="flex items-center space-x-2 mb-4 text-rose-700 border-b pb-3 border-gray-100">
            <AlertTriangle size={18} />
            <h2 className="text-base font-bold font-playfair text-[#1A1A1A]">Düşük Stok Uyarıları</h2>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-6 text-center">Düşük stoklu ürün bulunmuyor.</p>
            ) : (
              lowStockProducts.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs border-b pb-2.5 last:border-0 border-gray-100">
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">{item.products?.name}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">{item.color_name} - Beden: {item.size}</p>
                  </div>
                  <span className="bg-rose-100 text-rose-900 px-2 py-0.5 rounded-xs font-bold text-[10px]">
                    {item.stock_quantity} Adet
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xs shadow-xs border border-gray-200 overflow-hidden">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
            <h2 className="text-base font-bold font-playfair text-[#1A1A1A]">Son Siparişler</h2>
            <Link href="/admin/siparisler" className="text-[#C5A572] hover:underline font-semibold text-xs flex items-center gap-1">
              Tümünü Gör →
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 font-semibold tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">Sipariş No</th>
                  <th className="px-3 py-2.5">Tarih</th>
                  <th className="px-3 py-2.5">Durum</th>
                  <th className="px-3 py-2.5 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => {
                  const isReturned = ['iade_edildi', 'iade_talebi'].includes(order.status)
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-3 font-mono font-bold text-[#1A1A1A]">{order.order_number || order.id.slice(0, 8)}</td>
                      <td className="px-3 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString('tr-TR')}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isReturned ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className={`px-3 py-3 text-right font-bold ${isReturned ? 'line-through text-gray-400' : 'text-[#1A1A1A]'}`}>
                        {formatPrice(order.total || order.total_amount || 0)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xs shadow-xs border border-gray-200">
          <h2 className="text-base font-bold font-playfair text-[#1A1A1A] mb-4 pb-2 border-b border-gray-100">Öne Çıkan Ürünler</h2>
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div key={product.id} className="flex justify-between items-center text-xs border-b pb-2.5 last:border-0 border-gray-100">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 font-bold">{idx + 1}.</span>
                  <span className="font-semibold text-[#1A1A1A]">{product.name}</span>
                </div>
                <span className="text-[#C5A572] font-bold">{formatPrice(product.base_price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle,
  isHighlight = false,
  isYearlyHighlight = false
}: { 
  title: string; 
  value: string; 
  icon: any; 
  subtitle: string;
  isHighlight?: boolean;
  isYearlyHighlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xs border transition-all flex items-center space-x-3.5 ${
      isYearlyHighlight
        ? 'bg-[#1A1A1A] text-white border-[#C5A572] shadow-md ring-1 ring-[#C5A572]'
        : isHighlight 
          ? 'bg-amber-50/70 border-amber-300 shadow-2xs' 
          : 'bg-white border-gray-200 shadow-xs'
    }`}>
      <div className={`p-2.5 rounded-full flex-shrink-0 ${
        isYearlyHighlight
          ? 'bg-[#C5A572] text-[#1A1A1A]'
          : isHighlight 
            ? 'bg-amber-200/80 text-amber-900' 
            : 'bg-gray-50 text-[#C5A572] border border-gray-100'
      }`}>
        <Icon size={20} />
      </div>
      <div>
        <p className={`text-[11px] font-medium ${isYearlyHighlight ? 'text-[#C5A572]' : 'text-gray-500'}`}>{title}</p>
        <p className={`text-base font-bold mt-0.5 ${isYearlyHighlight ? 'text-white' : 'text-[#1A1A1A]'}`}>{value}</p>
        {subtitle && <p className={`text-[10px] font-medium mt-0.5 ${isYearlyHighlight ? 'text-gray-300' : 'text-gray-400'}`}>{subtitle}</p>}
      </div>
    </div>
  )
}
