'use client';

import { useState, useEffect } from 'react';

interface Variant {
  id: string;
  color_name: string;
  color_hex: string;
  size: string;
  stock_quantity: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  onVariantChange?: (variant: Variant | null) => void;
}

export default function VariantSelector({ variants, onVariantChange }: VariantSelectorProps) {
  const colors = Array.from(new Set(variants.map(v => v.color_hex))).map(hex => {
    return variants.find(v => v.color_hex === hex);
  });

  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0]?.color_hex || null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const availableSizes = variants.filter(v => v.color_hex === selectedColor);
  const allSizes = ['XS', 'S', 'M', 'L', 'XL'];

  useEffect(() => {
    if (selectedColor && selectedSize) {
      const variant = variants.find(v => v.color_hex === selectedColor && v.size === selectedSize);
      onVariantChange?.(variant || null);
    } else {
      onVariantChange?.(null);
    }
  }, [selectedColor, selectedSize, variants, onVariantChange]);

  const selectedVariant = variants.find(v => v.color_hex === selectedColor && v.size === selectedSize);

  return (
    <div className="space-y-6">
      {/* Colors */}
      <div>
        <h4 className="text-sm font-medium mb-3 font-inter text-[#1A1A1A]">
          Renk: <span className="text-gray-500 font-normal">{colors.find(c => c?.color_hex === selectedColor)?.color_name || 'Seçiniz'}</span>
        </h4>
        <div className="flex space-x-3">
          {colors.map((color) => {
            if (!color) return null;
            return (
              <button
                type="button"
                key={color.color_hex}
                onClick={() => {
                  setSelectedColor(color.color_hex);
                  setSelectedSize(null);
                }}
                className={`w-8 h-8 rounded-full border-2 focus:outline-none transition-all cursor-pointer ${
                  selectedColor === color.color_hex ? 'border-[#C5A572] ring-2 ring-offset-2 ring-[#C5A572]' : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.color_hex }}
                title={color.color_name}
              />
            );
          })}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium font-inter text-[#1A1A1A]">Beden</h4>
        </div>
        <div className="flex flex-wrap gap-3">
          {allSizes.map(size => {
            const variant = availableSizes.find(v => v.size === size);
            const isOutOfStock = !variant || variant.stock_quantity <= 0;

            return (
              <button
                type="button"
                key={size}
                disabled={isOutOfStock}
                onClick={() => setSelectedSize(size)}
                className={`w-12 h-12 flex items-center justify-center border text-sm font-inter transition-all cursor-pointer ${
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

      {/* Stock Status */}
      {selectedVariant && (
        <div className="text-sm font-inter">
          {selectedVariant.stock_quantity > 3 ? (
            <span className="text-emerald-600 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Stokta Mevcut
            </span>
          ) : selectedVariant.stock_quantity > 0 ? (
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
