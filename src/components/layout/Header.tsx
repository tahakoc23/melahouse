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
  const [isHomeLoading, setIsHomeLoading] = useState(false);

  const pathname = usePathname();
  const isHome = pathname === '/';
  const router = useRouter();

  const { toggleCart, toggleSearch } = useUIStore();
  const openCart = () => toggleCart(true);
  const openSearch = () => toggleSearch(true);
  const { items } = useCartStore();
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const { user, profile, isAdmin, signOut } = useAuth();
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

  // Home Loader lifecycle
  const handleNavigateHome = (e: React.MouseEvent) => {
    if (pathname !== '/') {
      e.preventDefault();
      setIsHomeLoading(true);
      router.push('/');
    }
  };

  useEffect(() => {
    if (pathname === '/' && isHomeLoading) {
      const timer = setTimeout(() => {
        setIsHomeLoading(false);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [pathname, isHomeLoading]);

  const headerClass = scrolled
    ? 'bg-[#FAFAF8]/95 backdrop-blur-md text-[#1A1A1A] shadow-sm'
    : (isHome 
        ? 'bg-gradient-to-b from-black/80 via-black/45 to-transparent text-white'
        : 'bg-[#1A1A1A] text-white shadow-sm');

  const useDarkTheme = !scrolled;
  const textColorClass = useDarkTheme ? 'text-[#FAFAF8]' : 'text-[#1A1A1A]';
  const iconColorClass = useDarkTheme ? 'text-[#FAFAF8]' : 'text-[#1A1A1A]';
  const hoverColorClass = 'hover:text-[#C5A572]';

  return (
    <>
      {/* Home Loader Overlay */}
      <AnimatePresence>
        {isHomeLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAFAF8] select-none"
          >
            <div className="flex flex-col items-center gap-6">
              <h1 className="font-playfair text-4xl md:text-5xl tracking-[0.2em] text-[#1A1A1A] font-semibold">
                MELA HOUSE
              </h1>
              <div className="w-10 h-10 relative">
                <div className="absolute inset-0 border-2 border-transparent border-t-[#C5A572] rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-2 border-transparent border-b-[#A68B5B] rounded-full animate-spin-slow"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                className={`hidden lg:flex items-center gap-2 p-2 transition-colors group cursor-pointer ${hoverColorClass}`}
                aria-label="Ara"
              >
                <Search className={`w-5 h-5 ${iconColorClass} group-hover:text-[#C5A572] transition-colors`} />
                <span className={`text-xs font-inter uppercase tracking-widest hidden xl:inline-block font-medium ${textColorClass}`}>Ara</span>
              </button>
            </div>

            {/* Logo Centered */}
            <div className="flex-shrink-0 text-center flex items-center justify-center">
              <Link href="/" onClick={handleNavigateHome} className="inline-flex items-center justify-center">
                <h1 className={`font-playfair text-2xl md:text-4xl lg:text-5xl tracking-tight font-semibold transition-colors duration-300 ${textColorClass}`}>
                  MELA HOUSE
                </h1>
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
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A572] text-white hover:bg-black transition-all text-xs font-inter uppercase tracking-wider rounded-xs font-medium shadow-md"
                  title="Yönetim Paneli"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Paneli</span>
                </Link>
              )}

              {user ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link 
                    href="/hesabim" 
                    className={`flex items-center gap-1.5 text-xs font-inter uppercase tracking-wider font-medium transition-colors ${textColorClass} ${hoverColorClass}`}
                  >
                    <User className="w-4 h-4 text-[#C5A572]" />
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
                    className="text-[#C5A572] hover:text-white font-semibold transition-colors drop-shadow-xs"
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}

              <Link 
                href="/favorilerim" 
                className={`p-2 transition-colors hidden md:block ${hoverColorClass}`}
                title="Favorilerim"
              >
                <Heart className={`w-5 h-5 ${iconColorClass} hover:text-[#C5A572] transition-colors`} />
              </Link>

              <button 
                onClick={openCart}
                className={`p-2 transition-colors relative flex items-center group cursor-pointer ${hoverColorClass}`}
                aria-label="Sepet"
              >
                <ShoppingBag className={`w-5 h-5 ${iconColorClass} group-hover:text-[#C5A572] transition-colors`} />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-[#C5A572] text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-xs">
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
          <nav className={`hidden lg:flex items-center justify-center space-x-10 h-12 font-inter text-xs uppercase tracking-widest font-medium border-t transition-colors duration-300 ${
            useDarkTheme ? 'border-white/15' : 'border-gray-200/80'
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
                  {cat.subcategories && <ChevronDown className="w-3 h-3 text-[#C5A572]" />}
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
                        className="absolute top-full left-1/2 -translate-x-1/2 w-56 bg-white shadow-xl border border-gray-200 py-4 px-6 z-50 rounded-b-md text-[#1A1A1A]"
                      >
                        <ul className="space-y-3">
                          {cat.subcategories.map((sub: any) => (
                            <li key={sub.id || sub.title}>
                              <Link 
                                href={sub.path} 
                                className="text-gray-600 hover:text-[#C5A572] transition-colors block text-xs font-medium uppercase tracking-wider"
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
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[#FAFAF8] z-[70] shadow-2xl flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <Link href="/" onClick={(e) => { handleNavigateHome(e); setMobileMenuOpen(false); }}>
                  <h2 className="font-playfair text-2xl font-semibold text-[#1A1A1A]">MELA HOUSE</h2>
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
                      className="flex-1 py-2.5 text-center bg-[#C5A572] text-white font-medium uppercase tracking-wider rounded-xs"
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
                              className="block py-1.5 text-gray-600 hover:text-[#C5A572] text-[11px] uppercase tracking-wider font-medium"
                            >
                              • {sub.title}
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
                  <Link href="/admin" className="flex items-center justify-center gap-2 text-white font-semibold bg-[#C5A572] px-4 py-3 rounded-xs text-xs uppercase tracking-wider" onClick={() => setMobileMenuOpen(false)}>
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Yönetim Paneli</span>
                  </Link>
                )}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link href={user ? '/hesabim' : '/giris'} className="flex items-center justify-center gap-2 text-[#1A1A1A] font-medium text-xs bg-white border border-gray-200 py-2.5 rounded-xs" onClick={() => setMobileMenuOpen(false)}>
                    <User className="w-4 h-4 text-[#C5A572]" />
                    <span>{user ? 'Hesabım' : 'Giriş Yap'}</span>
                  </Link>
                  <Link href="/favorilerim" className="flex items-center justify-center gap-2 text-[#1A1A1A] font-medium text-xs bg-[#1A1A1A] text-white py-2.5 rounded-xs" onClick={() => setMobileMenuOpen(false)}>
                    <Heart className="w-4 h-4 text-[#C5A572]" />
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
