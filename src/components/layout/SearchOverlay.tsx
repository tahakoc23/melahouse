'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ShoppingBag } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

// Simple debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchOverlay() {
  const { isSearchOpen, toggleSearch } = useUIStore();
  const closeSearch = () => toggleSearch(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const supabase = createClient();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    if (isSearchOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isSearchOpen, closeSearch]);

  useEffect(() => {
    const searchProducts = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, images')
        .ilike('name', `%${debouncedQuery}%`)
        .limit(6);

      if (!error && data) {
        setResults(data);
      }
      setIsSearching(false);
    };

    searchProducts();
  }, [debouncedQuery, supabase]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col font-inter overflow-y-auto"
        >
          <div className="container mx-auto px-6 pt-12 pb-6 max-w-5xl">
            <div className="flex justify-end mb-8">
              <button
                onClick={closeSearch}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                aria-label="Kapat"
              >
                <X className="w-8 h-8 text-gray-500 group-hover:text-[#1A1A1A] transition-colors" />
              </button>
            </div>
            
            <div className="relative mb-16">
              <div className="flex items-center border-b-2 border-gray-200 focus-within:border-[#C5A572] transition-colors pb-4">
                <Search className="w-8 h-8 text-gray-400 mr-4" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ürün ara..."
                  className="w-full text-3xl md:text-5xl font-playfair bg-transparent border-none focus:outline-none focus:ring-0 text-[#1A1A1A] placeholder-gray-300"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="ml-4 text-gray-400 hover:text-[#1A1A1A]"
                  >
                    Temizle
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-[300px]">
              {isSearching ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-8 h-8 border-2 border-[#C5A572] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : results.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8">
                    Sonuçlar ({results.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {results.map((product) => (
                      <Link 
                        key={product.id} 
                        href={`/urun/${product.slug}`}
                        onClick={closeSearch}
                        className="group"
                      >
                        <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden">
                          {product.images && product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ShoppingBag className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-[#1A1A1A] text-sm mb-1 line-clamp-2 group-hover:text-[#C5A572] transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-[#1A1A1A] font-semibold text-sm">
                          {product.price.toLocaleString('tr-TR')} ₺
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : query.length >= 2 ? (
                <div className="text-center text-gray-500 py-12">
                  <p className="text-xl font-playfair mb-2">"{query}" için sonuç bulunamadı.</p>
                  <p>Lütfen farklı bir anahtar kelime ile tekrar deneyin.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Popüler Aramalar</h3>
                    <ul className="space-y-4">
                      {['İpek Elbise', 'Kaşmir Kazak', 'Deri Ceket', 'Abiye', 'Trençkot'].map((term) => (
                        <li key={term}>
                          <button 
                            onClick={() => setQuery(term)}
                            className="text-lg text-[#1A1A1A] hover:text-[#C5A572] transition-colors font-playfair"
                          >
                            {term}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
