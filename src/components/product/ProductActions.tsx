'use client';

import { useState } from 'react';
import VariantSelector from './VariantSelector';
import SizeGuide from './SizeGuide';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useWishlist } from '@/hooks/useWishlist';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    sale_price?: number | null;
    product_images?: any[];
    product_variants?: any[];
    is_out_of_stock?: boolean;
    tags?: any;
  };
}

export default function ProductActions({ product }: ProductActionsProps) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const toggleCart = useUIStore((state) => state.toggleCart);

  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFav = isInWishlist(product.id);

  const primaryImage = product.product_images?.find((img) => img.is_primary)?.image_url || product.product_images?.[0]?.image_url || '';
  const priceToUse = product.sale_price || product.base_price;

  const isOutOfStock = product.is_out_of_stock || (Array.isArray(product.tags) && product.tags.includes('Tükendi')) || product.tags === 'Tükendi';

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    const variantInfo = selectedVariant 
      ? `${selectedVariant.color_name || ''} / ${selectedVariant.size || ''}`
      : undefined;

    addItem({
      id: `${product.id}-${selectedVariant?.id || 'default'}`,
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantInfo,
      price: priceToUse,
      quantity,
      image: primaryImage,
      slug: product.slug,
      maxStock: selectedVariant?.stock_quantity ?? 10
    });

    toggleCart(true);
  };

  const handleToggleFav = () => {
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 600);
    toggleWishlist(product.id);
  };

  return (
    <div className="space-y-6 font-inter">
      {/* Out of Stock Notice Badge */}
      {isOutOfStock && (
        <div className="bg-[#1A1A1A] border-l-4 border-[#C5A572] p-4 rounded-xs text-[#C5A572] flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-xs uppercase tracking-widest block text-[#C5A572]">STOKTA YOK (TÜKENDİ)</span>
            <p className="text-[11px] text-gray-300">Bu ürün geçici olarak tükenmiştir. Yeni stoklar için takipte kalın.</p>
          </div>
          <span className="text-[10px] uppercase font-bold bg-[#C5A572] text-black px-2 py-1 rounded-xs">TÜKENDİ</span>
        </div>
      )}

      <div className="flex justify-between items-center text-sm">
        <button 
          type="button"
          onClick={() => setIsSizeGuideOpen(true)}
          className="text-[#C5A572] underline font-medium hover:text-[#1A1A1A] transition-colors cursor-pointer"
        >
          Beden Tablosu
        </button>
      </div>

      {product.product_variants && product.product_variants.length > 0 && (
        <VariantSelector 
          variants={product.product_variants} 
          onVariantChange={(v) => setSelectedVariant(v)} 
        />
      )}

      {/* Quantity, Add to Cart & Wishlist Heart Button */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        {/* Quantity selector */}
        <div className={`flex items-center border border-gray-300 w-32 justify-between px-3 py-3 ${isOutOfStock ? 'opacity-40 pointer-events-none' : ''}`}>
          <button 
            type="button"
            disabled={isOutOfStock}
            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
            className="text-lg font-medium text-gray-500 hover:text-black px-2 cursor-pointer"
          >
            -
          </button>
          <span className="text-sm font-medium text-[#1A1A1A]">{quantity}</span>
          <button 
            type="button"
            disabled={isOutOfStock}
            onClick={() => setQuantity(prev => prev + 1)}
            className="text-lg font-medium text-gray-500 hover:text-black px-2 cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Add to Cart button */}
        {isOutOfStock ? (
          <button 
            type="button"
            disabled
            className="flex-1 bg-gray-300 text-gray-600 py-4 uppercase tracking-widest text-xs font-bold font-inter cursor-not-allowed text-center rounded-xs shadow-xs"
          >
            Ü R Ü N  T Ü K E N D İ (STOKTA YOK)
          </button>
        ) : (
          <button 
            type="button"
            onClick={handleAddToCart}
            className="flex-1 bg-[#C5A572] hover:bg-[#1A1A1A] text-white py-4 uppercase tracking-widest text-xs font-medium font-inter transition-all duration-300 shadow-md cursor-pointer text-center rounded-xs"
          >
            Sepete Ekle — {(priceToUse * quantity).toLocaleString('tr-TR')} ₺
          </button>
        )}

        {/* Prominent Heart Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleFav}
          title={isFav ? "Favorilerimden Çıkar" : "Favorilerime Ekle"}
          className={`px-5 py-4 border rounded-xs transition-all flex items-center justify-center gap-2 font-semibold text-xs uppercase tracking-wider cursor-pointer shadow-xs ${
            isFav 
              ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100' 
              : 'border-gray-300 bg-white text-gray-800 hover:border-[#1A1A1A] hover:bg-gray-50'
          }`}
        >
          <motion.div animate={heartAnim ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] } : {}}>
            <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-gray-700'}`} />
          </motion.div>
          <span className="hidden md:inline">{isFav ? 'Favorilerimde' : 'Favorilere Ekle'}</span>
        </button>
      </div>

      <SizeGuide isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </div>
  );
}
