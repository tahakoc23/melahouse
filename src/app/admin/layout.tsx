// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  RefreshCw,
  Users,
  Building2,
  FileText, 
  Mail, 
  MessageSquare,
  LogOut,
  X,
  Menu as HamburgerIcon
} from 'lucide-react'

const NAVIGATION = [
  { name: 'Genel Bakış', href: '/admin', icon: LayoutDashboard },
  { name: 'Ürünler', href: '/admin/urunler', icon: Package },
  { name: 'Siparişler', href: '/admin/siparisler', icon: ShoppingCart },
  { name: 'İade Talepleri', href: '/admin/iadeler', icon: RefreshCw },
  { name: 'Toptancılar', href: '/admin/toptancilar', icon: Building2, hasBadge: true },
  { name: 'Kullanıcılar', href: '/admin/kullanicilar', icon: Users },
  { name: 'İçerik Yönetimi', href: '/admin/icerik', icon: FileText },
  { name: 'E-posta Pazarlama', href: '/admin/email', icon: Mail },
  { name: 'Yorumlar', href: '/admin/yorumlar', icon: MessageSquare },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadSupplierChangesCount, setUnreadSupplierChangesCount] = useState<number>(0)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/')
        return
      }

      setUserName(profile.full_name || session.user.email || 'Admin')
      setIsLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  // Fetch unread supplier changes count for RED BADGE
  useEffect(() => {
    async function fetchUnreadChanges() {
      try {
        const res = await fetch('/api/admin/suppliers', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setUnreadSupplierChangesCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Fetch unread supplier changes error:", err);
      }
    }

    fetchUnreadChanges();
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] font-inter text-xs text-gray-500">Yükleniyor...</div>
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col md:flex-row font-inter text-xs">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#1A1A1A] text-white p-4 flex justify-between items-center">
        <span className="font-playfair text-xl tracking-wider text-[#C5A572]">MELA HOUSE Admin</span>
        <button onClick={() => setIsMobileMenuOpen(true)}>
          <HamburgerIcon size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#1A1A1A] text-white transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 flex justify-between items-center border-b border-gray-800">
          <span className="font-playfair text-2xl tracking-wider text-[#C5A572]">MELA HOUSE Admin</span>
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {NAVIGATION.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
            const isSuppliers = item.name === 'Toptancılar'

            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-md transition-colors text-xs font-semibold
                  ${isActive ? 'bg-[#C5A572] text-[#1A1A1A]' : 'hover:bg-gray-800 text-gray-300'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} />
                  <span>{item.name}</span>
                </div>

                {/* RED BADGE NOTIFICATION FOR TOPTANCILAR */}
                {isSuppliers && unreadSupplierChangesCount > 0 && (
                  <span className="bg-rose-600 text-white rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm animate-pulse">
                    {unreadSupplierChangesCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="mb-4 px-2 text-xs text-gray-400">
            Kullanıcı: <span className="text-white font-semibold">{userName}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-400 hover:bg-gray-800 rounded-md transition-colors text-xs font-semibold cursor-pointer"
          >
            <LogOut size={18} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
