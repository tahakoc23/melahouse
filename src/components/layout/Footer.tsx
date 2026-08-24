'use client';

import React from 'react';
import Link from 'next/link';

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-12 mb-16">
          
          {/* Column 1: Brand & Contact */}
          <div className="space-y-6">
            <h2 className="font-playfair text-3xl font-bold tracking-wider">MELA HOUSE</h2>
            <p className="font-inter text-gray-400 text-sm leading-relaxed max-w-sm">
              Zarif çizgiler, premium ipek &amp; saten kumaşlar ve zamansız tasarımlarla modern kadının gardırobunu yeniden tanımlıyoruz. Lüksü her anınızda hissedin.
            </p>
            <div className="space-y-3 pt-2 font-inter text-sm text-gray-400">
              <p>E-Posta: <a href="mailto:info@melahouse.net" className="hover:text-[#C5A572] transition-colors font-medium">info@melahouse.net</a></p>
              <a 
                href="https://instagram.com/melahouse.official" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#C5A572] hover:text-[#FAFAF8] transition-colors pt-1"
              >
                <InstagramIcon />
                <span className="font-inter text-sm">@melahouse.official</span>
              </a>
            </div>
          </div>

          {/* Column 2: Kurumsal & Keşfet */}
          <div>
            <h3 className="font-playfair text-lg font-semibold mb-6 uppercase tracking-widest text-[#C5A572]">
              Kurumsal &amp; Keşfet
            </h3>
            <ul className="space-y-4 font-inter text-sm text-gray-400">
              <li>
                <Link href="/urunler" className="hover:text-[#C5A572] transition-colors inline-block">
                  Tüm Ürünler
                </Link>
              </li>
              <li>
                <Link href="/hakkimizda" className="hover:text-[#C5A572] transition-colors inline-block">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#C5A572] transition-colors inline-block font-medium text-[#C5A572]/90">
                  Stil Rehberi
                </Link>
              </li>

            </ul>
          </div>

          {/* Column 3: Yasal Sözleşmeler & Politikalar */}
          <div>
            <h3 className="font-playfair text-lg font-semibold mb-6 uppercase tracking-widest text-[#C5A572]">
              Yasal &amp; Politikalar
            </h3>
            <ul className="space-y-4 font-inter text-sm text-gray-400">
              <li>
                <Link href="/gizlilik-politikasi" className="hover:text-[#C5A572] transition-colors inline-block">
                  Gizlilik Politikası (KVKK)
                </Link>
              </li>
              <li>
                <Link href="/kullanim-kosullari" className="hover:text-[#C5A572] transition-colors inline-block">
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <Link href="/mesafeli-satis-sozlesmesi" className="hover:text-[#C5A572] transition-colors inline-block">
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-inter text-gray-500 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} MELA HOUSE. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-4 items-center">
            <span className="text-gray-500 text-xs font-semibold tracking-wider">VISA</span>
            <span className="text-gray-500 text-xs font-semibold tracking-wider">MASTERCARD</span>
            <span className="text-gray-500 text-xs font-semibold tracking-wider">SHOPIER / IYZICO</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
