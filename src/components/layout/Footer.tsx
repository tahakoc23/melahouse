'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const InstagramIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-[#FAFAF8] pt-16 pb-8 border-t-4 border-[#C5A572]">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Column 1: Brand */}
          <div className="space-y-6">
            <h2 className="font-playfair text-3xl font-bold tracking-wider">VELORIA</h2>
            <p className="font-inter text-gray-400 text-sm leading-relaxed max-w-xs">
              Zarif çizgiler, premium kumaşlar ve zamansız tasarımlarla modern kadının gardırobunu yeniden tanımlıyoruz. Lüksü her anınızda hissedin.
            </p>
            <a 
              href="https://instagram.com/veloria.official" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#C5A572] hover:text-[#FAFAF8] transition-colors"
            >
              <InstagramIcon />
              <span className="font-inter text-sm">@veloria.official</span>
            </a>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-playfair text-lg font-semibold mb-6 uppercase tracking-widest text-[#C5A572]">
              Hızlı Menü
            </h3>
            <ul className="space-y-4 font-inter text-sm text-gray-400">
              <li>
                <Link href="/urunler" className="hover:text-[#C5A572] transition-colors inline-block">
                  Tüm Ürünler
                </Link>
              </li>
              <li>
                <Link href="/kategoriler" className="hover:text-[#C5A572] transition-colors inline-block">
                  Kategoriler
                </Link>
              </li>
              <li>
                <Link href="/hakkimizda" className="hover:text-[#C5A572] transition-colors inline-block">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/magazalarimiz" className="hover:text-[#C5A572] transition-colors inline-block">
                  Mağazalarımız
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div>
            <h3 className="font-playfair text-lg font-semibold mb-6 uppercase tracking-widest text-[#C5A572]">
              Müşteri Hizmetleri
            </h3>
            <ul className="space-y-4 font-inter text-sm text-gray-400">
              <li>
                <Link href="/siparis-takibi" className="hover:text-[#C5A572] transition-colors inline-block">
                  Sipariş Takibi
                </Link>
              </li>
              <li>
                <Link href="/iade-politikasi" className="hover:text-[#C5A572] transition-colors inline-block">
                  İade ve Değişim
                </Link>
              </li>
              <li>
                <Link href="/sss" className="hover:text-[#C5A572] transition-colors inline-block">
                  Sıkça Sorulan Sorular
                </Link>
              </li>
              <li>
                <Link href="/gizlilik-politikasi" className="hover:text-[#C5A572] transition-colors inline-block">
                  Gizlilik Politikası
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Contact */}
          <div>
            <h3 className="font-playfair text-lg font-semibold mb-6 uppercase tracking-widest text-[#C5A572]">
              Bülten Aboneliği
            </h3>
            <p className="font-inter text-gray-400 text-sm mb-4">
              Yeni koleksiyonlar, özel indirimler ve stil önerilerinden ilk siz haberdar olun.
            </p>
            <form className="mb-8 relative" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="E-posta adresiniz" 
                className="w-full bg-transparent border-b border-gray-600 focus:border-[#C5A572] text-[#FAFAF8] px-0 py-3 outline-none font-inter text-sm transition-colors placeholder-gray-500"
                required
              />
              <button 
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#C5A572] hover:text-[#FAFAF8] transition-colors p-2"
                aria-label="Abone ol"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
            <div className="font-inter text-sm text-gray-400 space-y-2">
              <p>Destek: <a href="mailto:destek@veloria.com" className="hover:text-[#C5A572] transition-colors">destek@veloria.com</a></p>
              <p>Tel: <a href="tel:+908501234567" className="hover:text-[#C5A572] transition-colors">+90 850 123 45 67</a></p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-inter text-gray-500 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Veloria. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-4 items-center">
            {/* Payment methods placeholders - simple text or could be icons */}
            <span className="text-gray-600 text-xs font-semibold tracking-wider">VISA</span>
            <span className="text-gray-600 text-xs font-semibold tracking-wider">MASTERCARD</span>
            <span className="text-gray-600 text-xs font-semibold tracking-wider">IYZICO</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
