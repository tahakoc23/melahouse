'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, User, Heart, ShoppingBag, X, ChevronDown, ShieldCheck, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import AnnouncementBar from './AnnouncementBar';
import CartDrawer from './CartDrawer';
import SearchOverlay from './SearchOverlay';

const DEFAULT_NAVIGATION_MENUS = [
  { id: 'all', title: 'TÜM ÜRÜNLER', path: '/urunler' },
  { 
    id: 'ust-giyim', 
    title: 'ÜST GİYİM', 
    path: '/kategori/ust-giyim',
    subcategories: [
      { id: 'u1', title: 'Elbise', path: '/kategori/elbise' },
      { id: 'u7', title: 'Triko & Kazak', path: '/kategori/triko-kazak' },
      { id: 'u8', title: 'Hırka', path: '/kategori/hirka' },
      { id: 'u2', title: 'Gömlek', path: '/kategori/gomlek' },
      { id: 'u3', title: 'T-Shirt', path: '/kategori/t-shirt' },
      { id: 'u4', title: 'Crop', path: '/kategori/crop' },
      { id: 'u5', title: 'Kimono', path: '/kategori/kimono' },
      { id: 'u6', title: 'Sweatshirt', path: '/kategori/sweatshirt' },
    ]
  },
  { 
    id: 'alt-giyim', 
    title: 'ALT GİYİM', 
    path: '/kategori/alt-giyim',
    subcategories: [
      { id: 'a1', title: 'Pantolon', path: '/kategori/pantolon' },
      { id: 'a2', title: 'Etek', path: '/kategori/etek' },
      { id: 'a3', title: 'Şort', path: '/kategori/sort' },
      { id: 'a4', title: 'Tayt', path: '/kategori/tayt' },
      { id: 'a5', title: 'Eşofman', path: '/kategori/esofman' },
      { id: 'a6', title: 'Tulum', path: '/kategori/tulum' },
    ]
  },
  { id: 'ic-giyim', title: 'İÇ GİYİM', path: '/kategori/ic-giyim' },
  { 
    id: 'dis-giyim', 
    title: 'DIŞ GİYİM', 
    path: '/kategori/dis-giyim',
    subcategories: [
      { id: 'd1', title: 'Trençkot', path: '/kategori/trenckot' },
      { id: 'd2', title: 'Ceket', path: '/kategori/ceket' },
      { id: 'd3', title: 'Kaban', path: '/kategori/kaban' },
      { id: 'd4', title: 'Yelek', path: '/kategori/yelek' },
      { id: 'd5', title: 'Mont', path: '/kategori/mont' },
    ]
  },
  { id: 'takimlar', title: 'TAKIMLAR', path: '/kategori/takimlar' },
  { id: 'hakkimizda', title: 'HAKKIMIZDA', path: '/hakkimizda' }
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>(DEFAULT_NAVIGATION_MENUS);
  const [activeHover, setActiveHover] = useState<string | null>(null);

  const pathname = usePathname();
  const isHome = pathname === '/';
  const router = useRouter();

  const { toggleCart, toggleSearch } = useUIStore();
  const openCart = () => toggleCart(true);
  const openSearch = () => toggleSearch(true);
  const { items } = useCartStore();
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const { user, profile, isAdmin, signOut, loading: authLoading } = useAuth();
  const supabase = createClient();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('navigation_menus' as any)
        .select('*')
        .order('created_at', { ascending: true });
      
      if (!error && data && data.length > 0) {
        const enhancedData = (data as any[]).map(item => {
          const itemsData: any = item.items || {};
          const hasChildren = Array.isArray(itemsData) && itemsData.length > 0;
          return {
            ...item,
            title: item.name,
            path: `/${item.slug}`,
            subcategories: hasChildren ? itemsData : null
          };
        });
        setCategories(enhancedData);
      }
    };
    fetchCategories();
  }, [supabase]);

  const useDarkTheme = isHome && !scrolled;
  const headerClass = useDarkTheme
    ? 'bg-gradient-to-b from-ink/60 via-ink/25 to-transparent text-white'
    : 'bg-white/95 backdrop-blur-md text-ink border-b border-ink/10';
  const textColorClass = useDarkTheme ? 'text-white' : 'text-ink';
  const iconColorClass = useDarkTheme ? 'text-white' : 'text-ink';
  const hoverColorClass = useDarkTheme ? 'hover:text-gold-light' : 'hover:text-murdum';

  return (
    <>
      <header className={`fixed w-full top-0 z-50 transition-colors duration-300 ${headerClass}`}>
        <AnnouncementBar />
        
        <div className="container mx-auto px-4 lg:px-8">
          {/* Main Top Header */}
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left side (Mobile Menu & Search) */}
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden p-2 rounded-full transition-colors cursor-pointer ${useDarkTheme ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                aria-label="Menü"
              >
                <Menu className={`w-5 h-5 ${iconColorClass}`} />
              </button>
              <button 
                onClick={openSearch}
                className={`hidden lg:flex items-center gap-2 p-2 transition-colors group cursor-pointer ${textColorClass} ${hoverColorClass}`}
                aria-label="Ara"
              >
                <Search className="w-5 h-5" />
                <span className={`text-xs font-inter uppercase tracking-widest hidden xl:inline-block font-medium ${textColorClass}`}>Ara</span>
              </button>
            </div>

            {/* Logo Centered */}
            <div className="flex-shrink-0 text-center flex items-center justify-center">
              <Link href="/" className="inline-flex items-center justify-center">
                <span className={`font-display text-xl sm:text-2xl md:text-[2.1rem] tracking-[0.08em] sm:tracking-[0.16em] transition-colors duration-300 ${textColorClass}`}>
                  MELA HOUSE
                </span>
              </Link>
            </div>

            {/* Right side actions */}
            <div className="flex items-center justify-end gap-3 md:gap-5 flex-1">
              <button 
                onClick={openSearch}
                className={`lg:hidden p-2 rounded-full transition-colors cursor-pointer ${useDarkTheme ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                aria-label="Ara"
              >
                <Search className={`w-5 h-5 ${iconColorClass}`} />
              </button>

              {isAdmin && (
                <Link 
                  href="/admin" 
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 border text-[10px] uppercase tracking-[0.2em] font-medium transition-colors ${useDarkTheme ? 'border-white/40 text-white hover:bg-white hover:text-ink' : 'border-ink/20 text-ink hover:bg-ink hover:text-white'}`}
                  title="Yönetim Paneli"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Paneli</span>
                </Link>
              )}

              {authLoading ? (
                // Oturum bilgisi gelene kadar yer tut: 'Giriş Yap' bir an görünüp kaybolmasın
                <span className="hidden md:block w-28" aria-hidden />
              ) : user ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link 
                    href="/hesabim" 
                    className={`flex items-center gap-1.5 text-xs font-inter uppercase tracking-wider font-medium transition-colors ${textColorClass} ${hoverColorClass}`}
                  >
                    <User className="w-4 h-4" />
                    <span>{profile?.full_name?.split(' ')[0] || 'Hesabım'}</span>
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className={`transition-colors p-1 cursor-pointer ${useDarkTheme ? 'text-white/70 hover:text-rose-400' : 'text-gray-400 hover:text-rose-600'}`}
                    title="Çıkış Yap"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2.5 font-inter text-xs uppercase tracking-wider">
                  <Link 
                    href="/giris" 
                    className={`font-medium transition-colors ${textColorClass} ${hoverColorClass}`}
                  >
                    Giriş Yap
                  </Link>
                  <span className={useDarkTheme ? 'text-white/40' : 'text-gray-300'}>|</span>
                  <Link 
                    href="/kayit" 
                    className={`font-semibold transition-colors ${textColorClass} ${hoverColorClass}`}
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}

              <Link 
                href="/favorilerim" 
                className={`p-2 transition-colors hidden md:block ${textColorClass} ${hoverColorClass}`}
                title="Favorilerim"
              >
                <Heart className="w-5 h-5" />
              </Link>

              <button 
                onClick={openCart}
                className={`p-2 transition-colors relative flex items-center group cursor-pointer ${textColorClass} ${hoverColorClass}`}
                aria-label="Sepet"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-murdum text-white text-[10px] font-semibold flex items-center justify-center rounded-full">
                    {cartItemCount}
                  </span>
                )}
                <span className={`ml-2 text-xs font-inter font-medium uppercase tracking-widest hidden lg:inline-block ${textColorClass}`}>
                  Sepet
                </span>
              </button>
            </div>
          </div>

          {/* Desktop Navigation Menu */}
          <nav className={`hidden lg:flex items-center justify-center space-x-10 h-12 text-[11px] uppercase tracking-[0.22em] font-medium border-t transition-colors duration-300 ${
            useDarkTheme ? 'border-white/15' : 'border-ink/10'
          }`}>
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                className="h-full flex items-center group relative"
                onMouseEnter={() => setActiveHover(cat.id)}
                onMouseLeave={() => setActiveHover(null)}
              >
                <Link 
                  href={cat.path || '#'}
                  className={`flex items-center gap-1 transition-colors py-3 ${textColorClass} ${hoverColorClass}`}
                >
                  {cat.title}
                  {cat.subcategories && <ChevronDown className="w-3 h-3 opacity-60" />}
                </Link>
                
                {/* Mega Menu Dropdown */}
                {cat.subcategories && (
                  <AnimatePresence>
                    {activeHover === cat.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.18 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 w-60 bg-white shadow-[0_20px_40px_-20px_rgba(23,18,20,0.25)] border border-ink/10 py-5 px-7 z-50 text-ink"
                      >
                        <ul className="space-y-3">
                          {cat.subcategories.map((sub: any) => (
                            <li key={sub.id || sub.title}>
                              <Link 
                                href={sub.path} 
                                className="text-kul hover:text-ink transition-colors block text-sm normal-case tracking-normal font-normal"
                              >
                                {sub.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Menu Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-[70] shadow-2xl flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  <span className="font-display text-2xl tracking-[0.14em] text-ink">MELA HOUSE</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#1A1A1A]" />
                </button>
              </div>

              {/* Mobile Auth Quick Buttons */}
              <div className="px-6 py-4 bg-gray-100/60 border-b border-gray-200 flex gap-3 font-inter text-xs">
                {user ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-[#1A1A1A]">Merhaba, {profile?.full_name || 'Kullanıcı'}</span>
                    <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="text-rose-600 font-medium cursor-pointer">Çıkış</button>
                  </div>
                ) : (
                  <>
                    <Link 
                      href="/giris" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 py-2.5 text-center bg-[#1A1A1A] text-white font-medium uppercase tracking-wider rounded-xs"
                    >
                      Giriş Yap
                    </Link>
                    <Link 
                      href="/kayit" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 py-2.5 text-center border border-ink text-ink font-medium uppercase tracking-wider"
                    >
                      Kayıt Ol
                    </Link>
                  </>
                )}
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                <nav className="flex flex-col font-inter text-xs">
                  {categories.map((cat) => (
                    <div key={cat.id} className="border-b border-gray-100 last:border-0">
                      <Link 
                        href={cat.path || '#'}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-6 py-3.5 text-[#1A1A1A] font-semibold hover:bg-gray-50 transition-colors uppercase tracking-wider"
                      >
                        {cat.title}
                      </Link>

                      {cat.subcategories && (
                        <div className="bg-gray-50/80 px-8 py-2 space-y-2 border-t border-gray-100">
                          {cat.subcategories.map((sub: any) => (
                            <Link
                              key={sub.id || sub.title}
                              href={sub.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block py-1.5 text-kul hover:text-ink text-sm"
                            >
                              {sub.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col gap-3 font-inter">
                {isAdmin && (
                  <Link href="/admin" className="flex items-center justify-center gap-2 text-white font-semibold bg-ink px-4 py-3 text-xs uppercase tracking-wider" onClick={() => setMobileMenuOpen(false)}>
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Yönetim Paneli</span>
                  </Link>
                )}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link href={user ? '/hesabim' : '/giris'} className="flex items-center justify-center gap-2 text-[#1A1A1A] font-medium text-xs bg-white border border-gray-200 py-2.5 rounded-xs" onClick={() => setMobileMenuOpen(false)}>
                    <User className="w-4 h-4" />
                    <span>{user ? 'Hesabım' : 'Giriş Yap'}</span>
                  </Link>
                  <Link href="/favorilerim" className="flex items-center justify-center gap-2 text-[#1A1A1A] font-medium text-xs bg-[#1A1A1A] text-white py-2.5 rounded-xs" onClick={() => setMobileMenuOpen(false)}>
                    <Heart className="w-4 h-4" />
                    <span>Favorilerim</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CartDrawer />
      <SearchOverlay />
    </>
  );
}
