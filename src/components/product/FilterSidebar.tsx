'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Check, RotateCcw, SlidersHorizontal } from 'lucide-react';

const CATEGORY_TREE = [
  { 
    name: 'Üst Giyim', 
    slug: 'ust-giyim',
    subcategories: [
      { name: 'Elbise', slug: 'elbise' },
      { name: 'Gömlek', slug: 'gomlek' },
      { name: 'T-Shirt', slug: 't-shirt' },
      { name: 'Crop', slug: 'crop' },
      { name: 'Kimono', slug: 'kimono' },
      { name: 'Sweatshirt', slug: 'sweatshirt' },
    ]
  },
  { 
    name: 'Alt Giyim', 
    slug: 'alt-giyim',
    subcategories: [
      { name: 'Pantolon', slug: 'pantolon' },
      { name: 'Etek', slug: 'etek' },
      { name: 'Şort', slug: 'sort' },
      { name: 'Tayt', slug: 'tayt' },
      { name: 'Eşofman', slug: 'esofman' },
      { name: 'Tulum', slug: 'tulum' },
    ]
  },
  { name: 'İç Giyim', slug: 'ic-giyim' },
  { 
    name: 'Dış Giyim', 
    slug: 'dis-giyim',
    subcategories: [
      { name: 'Trençkot', slug: 'trenckot' },
      { name: 'Ceket', slug: 'ceket' },
      { name: 'Kaban', slug: 'kaban' },
      { name: 'Yelek', slug: 'yelek' },
      { name: 'Mont', slug: 'mont' },
    ]
  },
  { name: 'Takımlar', slug: 'takimlar' }
];

const ALL_LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'STD'];
const ALL_NUMBER_SIZES = ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50'];

const SORT_OPTIONS = [
  { value: 'en-yeni', label: 'En Yeni Gelenler' },
  { value: 'fiyat-artan', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'fiyat-azalan', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'en-cok-satan', label: 'En Çok Satanlar' },
];

export interface ColorOption {
  name: string;
  hex: string;
}

interface FilterSidebarProps {
  categories?: any[];
  availableColors?: ColorOption[];
  availableSizes?: string[];
}

export default function FilterSidebar({ 
  availableColors = [], 
  availableSizes = [] 
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [sizeTab, setSizeTab] = useState<'letter' | 'number'>('letter');

  const currentCategory = searchParams.get('category') || (pathname.startsWith('/kategori/') ? pathname.replace('/kategori/', '') : '');
  const currentSort = searchParams.get('sort') || 'en-yeni';
  const currentColors = searchParams.getAll('color');
  const currentSizes = searchParams.getAll('size');

  // STRICTLY filter letter & number sizes: ONLY render sizes that exist in active products!
  const displayLetterSizes = availableSizes.length > 0
    ? ALL_LETTER_SIZES.filter(s => availableSizes.includes(s))
    : [];

  const displayNumberSizes = availableSizes.length > 0
    ? ALL_NUMBER_SIZES.filter(s => availableSizes.includes(s))
    : [];

  const updateParam = (key: string, value: string, isMultiple = false) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    if (isMultiple) {
      const existing = params.getAll(key);
      if (existing.includes(value)) {
        params.delete(key);
        existing.filter(v => v !== value).forEach(v => params.append(key, v));
      } else {
        params.append(key, value);
      }
    } else {
      if (params.get(key) === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const newQuery = params.toString();
    router.push(newQuery ? `${pathname}?${newQuery}` : pathname);
  };

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    const newQuery = params.toString();

    if (!slug) {
      router.push('/urunler');
    } else {
      router.push(`/kategori/${slug}${newQuery ? `?${newQuery}` : ''}`);
    }
  };

  const clearFilters = () => {
    router.push('/urunler');
  };

  const hasActiveFilters = currentCategory || currentColors.length > 0 || currentSizes.length > 0 || currentSort !== 'en-yeni';

  return (
    <>
      <button 
        type="button"
        className="md:hidden w-full mb-6 py-3.5 px-4 border border-gray-300 bg-white text-[#1A1A1A] flex items-center justify-between text-xs font-semibold uppercase tracking-widest rounded-xs shadow-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#C5A572]" />
          Filtrele & Sırala
        </span>
        <span className="text-[#C5A572] font-bold">{isOpen ? 'Kapat ▲' : 'Aç ▼'}</span>
      </button>

      <div className={`md:block w-full md:w-64 flex-shrink-0 font-inter ${isOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-7 sticky top-36">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-playfair font-semibold text-lg text-[#1A1A1A]">Filtreler</h3>
            {hasActiveFilters && (
              <button 
                type="button"
                onClick={clearFilters}
                className="text-[11px] text-[#C5A572] hover:text-black uppercase tracking-wider flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Temizle
              </button>
            )}
          </div>

          {/* 1. Sıralama (Sort) */}
          <div>
            <h4 className="font-playfair font-semibold text-sm mb-3 text-[#1A1A1A]">Sıralama</h4>
            <div className="space-y-1.5">
              {SORT_OPTIONS.map(opt => {
                const isSelected = currentSort === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateParam('sort', opt.value)}
                    className={`w-full flex items-center justify-between text-left text-xs tracking-wider transition-colors cursor-pointer py-1.5 px-2 rounded-xs ${
                      isSelected ? 'bg-gray-100 font-semibold text-[#1A1A1A]' : 'text-gray-600 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#C5A572]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Kategoriler (Hierarchy Tree) */}
          <div>
            <h4 className="font-playfair font-semibold text-sm mb-3 text-[#1A1A1A]">Kategoriler</h4>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => handleCategoryClick('')}
                className={`w-full flex items-center justify-between text-left uppercase tracking-wider py-1 px-2 rounded-xs cursor-pointer ${
                  !currentCategory ? 'bg-gray-100 font-semibold text-[#C5A572]' : 'text-gray-600 hover:text-black'
                }`}
              >
                <span>Tüm Ürünler</span>
                {!currentCategory && <span className="w-2 h-2 rounded-full bg-[#C5A572]"></span>}
              </button>

              {CATEGORY_TREE.map(cat => {
                const isCatSelected = currentCategory === cat.slug;
                return (
                  <div key={cat.slug} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat.slug)}
                      className={`w-full flex items-center justify-between text-left uppercase tracking-wider py-1 px-2 rounded-xs font-semibold cursor-pointer ${
                        isCatSelected ? 'bg-gray-100 text-[#C5A572]' : 'text-[#1A1A1A] hover:text-[#C5A572]'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isCatSelected && <span className="w-2 h-2 rounded-full bg-[#C5A572]"></span>}
                    </button>

                    {cat.subcategories && (
                      <div className="pl-4 space-y-1 border-l-2 border-gray-100 ml-2">
                        {cat.subcategories.map(sub => {
                          const isSubSelected = currentCategory === sub.slug;
                          return (
                            <button
                              key={sub.slug}
                              type="button"
                              onClick={() => handleCategoryClick(sub.slug)}
                              className={`w-full text-left py-1 px-2 rounded-xs text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                                isSubSelected ? 'font-semibold text-[#C5A572] bg-gray-50' : 'text-gray-500 hover:text-black'
                              }`}
                            >
                              • {sub.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Dinamik Renk Seçimi (Tam Seçilen HEX Renk Kodu İle) */}
          {availableColors.length > 0 && (
            <div>
              <h4 className="font-playfair font-semibold text-sm mb-3 text-[#1A1A1A]">Renk Seçimi</h4>
              <div className="grid grid-cols-2 gap-2">
                {availableColors.map(color => {
                  const isSelected = currentColors.includes(color.name);
                  const isWhite = color.hex?.toUpperCase() === '#FFFFFF';
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => updateParam('color', color.name, true)}
                      className={`flex items-center gap-2 p-1.5 text-xs rounded-xs border transition-all cursor-pointer ${
                        isSelected ? 'border-[#C5A572] bg-[#FAFAF8] font-semibold text-[#1A1A1A]' : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <span 
                        className={`w-4 h-4 rounded-full flex-shrink-0 shadow-xs ${isWhite ? 'border border-gray-300' : ''}`}
                        style={{ backgroundColor: color.hex || '#1A1A1A' }}
                      />
                      <span className="truncate">{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Dinamik Beden Seçimi (SADECE Mağazada Var Olan Bedenler) */}
          {(displayLetterSizes.length > 0 || displayNumberSizes.length > 0) && (
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <h4 className="font-playfair font-semibold text-sm text-[#1A1A1A]">Beden Seçimi</h4>
                <div className="flex gap-1 bg-gray-100 p-0.5 rounded-xs text-[10px] font-semibold">
                  {displayLetterSizes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSizeTab('letter')}
                      className={`px-2 py-0.5 rounded-xs transition-all cursor-pointer ${sizeTab === 'letter' ? 'bg-white text-black shadow-xs' : 'text-gray-500'}`}
                    >
                      Harf
                    </button>
                  )}
                  {displayNumberSizes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSizeTab('number')}
                      className={`px-2 py-0.5 rounded-xs transition-all cursor-pointer ${sizeTab === 'number' ? 'bg-white text-black shadow-xs' : 'text-gray-500'}`}
                    >
                      Numara
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(sizeTab === 'letter' ? displayLetterSizes : displayNumberSizes).map(size => {
                  const isSelected = currentSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => updateParam('size', size, true)}
                      className={`px-2.5 py-1.5 text-xs font-medium border rounded-xs flex items-center justify-center transition-all cursor-pointer ${
                        isSelected ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs' : 'border-gray-200 text-[#1A1A1A] hover:border-[#C5A572] hover:bg-gray-50'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
