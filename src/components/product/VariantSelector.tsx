'use client';

import { useState, useEffect, useMemo } from 'react';
import { compareSizes } from './catalog';

export interface Variant {
  id: string;
  color_name: string | null;
  color_hex: string | null;
  size: string | null;
  stock_quantity: number | null;
  sku?: string | null;
}

interface VariantSelectorProps {
  variants: Variant[];
  onVariantChange?: (variant: Variant | null) => void;
  /** Highlights the pickers when the shopper tried to add to cart without choosing. */
  showValidation?: boolean;
}

const colorKey = (v: Variant) => `${v.color_name || ''}|${v.color_hex || ''}`;
const inStock = (v?: Variant) => !!v && Number(v.stock_quantity) > 0;

export default function VariantSelector({ variants, onVariantChange, showValidation = false }: VariantSelectorProps) {
  // Unique colours, in first-seen order
  const colors = useMemo(() => {
    const map = new Map<string, Variant>();
    variants.forEach((v) => {
      if (!map.has(colorKey(v))) map.set(colorKey(v), v);
    });
    return Array.from(map.entries()).map(([key, v]) => ({ key, name: v.color_name, hex: v.color_hex }));
  }, [variants]);

  // Sizes that really exist for this product (not a hard-coded list)
  const allSizes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.size).filter(Boolean) as string[])).sort(compareSizes),
    [variants]
  );

  // Pre-select only when there is no real choice to make
  const [selectedColor, setSelectedColor] = useState<string | null>(colors.length === 1 ? colors[0].key : null);
  const [selectedSize, setSelectedSize] = useState<string | null>(() => {
    if (allSizes.length !== 1) return null;
    const only = variants.find((v) => v.size === allSizes[0] && (colors.length !== 1 || colorKey(v) === colors[0].key));
    return inStock(only) ? allSizes[0] : null;
  });

  const showColorPicker = colors.length > 1 || !!colors[0]?.name;
  const showSizePicker = allSizes.length > 1 || (allSizes.length === 1 && allSizes[0] !== 'STD');

  const selectedVariant = useMemo(() => {
    if (!selectedColor) return null;
    // Products whose variants carry no size at all only need a colour
    if (allSizes.length === 0) return variants.find((v) => colorKey(v) === selectedColor) || null;
    if (!selectedSize) return null;
    return variants.find((v) => colorKey(v) === selectedColor && v.size === selectedSize) || null;
  }, [variants, allSizes.length, selectedColor, selectedSize]);

  useEffect(() => {
    onVariantChange?.(selectedVariant);
  }, [selectedVariant, onVariantChange]);

  const sizesForColor = selectedColor ? variants.filter((v) => colorKey(v) === selectedColor) : variants;
  const selectedColorName = colors.find((c) => c.key === selectedColor)?.name;

  return (
    <div className="space-y-6">
      {/* Colors */}
      {showColorPicker && (
        <div>
          <h4 className="text-sm font-medium mb-3 font-inter text-[#1A1A1A]">
            Renk:{' '}
            <span className={showValidation && !selectedColor ? 'text-rose-600 font-medium' : 'text-gray-500 font-normal'}>
              {selectedColorName || 'Seçiniz'}
            </span>
          </h4>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const hasStock = variants.some((v) => colorKey(v) === color.key && inStock(v));
              return (
                <button
                  type="button"
                  key={color.key}
                  onClick={() => {
                    setSelectedColor(color.key);
                    // keep the size if it exists (and is in stock) for the new colour
                    const keep = variants.find((v) => colorKey(v) === color.key && v.size === selectedSize);
                    if (!inStock(keep)) setSelectedSize(null);
                  }}
                  aria-label={color.name || 'Renk'}
                  aria-pressed={selectedColor === color.key}
                  className={`w-8 h-8 rounded-full border-2 focus:outline-none transition-all cursor-pointer ${
                    selectedColor === color.key ? 'border-[#C5A572] ring-2 ring-offset-2 ring-[#C5A572]' : 'border-gray-200 hover:border-gray-400'
                  } ${hasStock ? '' : 'opacity-40'}`}
                  style={{ backgroundColor: color.hex || '#E5E5E5' }}
                  title={hasStock ? color.name || '' : `${color.name || ''} (tükendi)`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Sizes */}
      {showSizePicker && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium font-inter text-[#1A1A1A]">
              Beden{' '}
              {showValidation && !selectedSize && <span className="text-rose-600 font-medium">— Lütfen seçiniz</span>}
            </h4>
          </div>
          <div className="flex flex-wrap gap-3">
            {allSizes.map((size) => {
              const variant = sizesForColor.find((v) => v.size === size);
              const isOutOfStock = !inStock(variant);

              return (
                <button
                  type="button"
                  key={size}
                  disabled={isOutOfStock}
                  aria-pressed={selectedSize === size}
                  onClick={() => {
                    setSelectedSize(size);
                    if (!selectedColor && variant) setSelectedColor(colorKey(variant));
                  }}
                  className={`min-w-12 h-12 px-2 flex items-center justify-center border text-sm font-inter transition-all cursor-pointer ${
                    selectedSize === size
                      ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white font-medium shadow-sm'
                      : isOutOfStock
                      ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                      : 'border-gray-300 bg-white text-[#1A1A1A] hover:border-[#C5A572]'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Status */}
      {selectedVariant && (
        <div className="text-sm font-inter">
          {Number(selectedVariant.stock_quantity) > 3 ? (
            <span className="text-emerald-600 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Stokta Mevcut
            </span>
          ) : Number(selectedVariant.stock_quantity) > 0 ? (
            <span className="text-amber-600 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span> Son {selectedVariant.stock_quantity} Ürün
            </span>
          ) : (
            <span className="text-rose-600 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span> Stok Tükendi
            </span>
          )}
        </div>
      )}
    </div>
  );
}
