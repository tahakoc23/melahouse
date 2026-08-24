'use client';

import Link from 'next/link';
import Image from 'next/image';
import { isVideoUrl, getMediaType } from '@/components/admin/ImageUploader';
import { Film, Video, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWishlist } from '@/hooks/useWishlist';
import { useState } from 'react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    sale_price?: number | null;
    primary_image?: string;
    product_images?: any[];
    is_new?: boolean;
    is_out_of_stock?: boolean;
    tags?: any;
  };
}

function InstagramIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [heartAnim, setHeartAnim] = useState(false);
  const isFav = isInWishlist(product.id);

  const price = product.sale_price ?? product.base_price;
  const hasDiscount = product.sale_price && product.sale_price < product.base_price;
  
  const rawImageUrl = product.primary_image || product.product_images?.[0]?.image_url || (product as any).image_url || '';
  const imageUrl = rawImageUrl.startsWith('blob:') 
    ? (product.product_images?.find(i => !i.image_url.startsWith('blob:'))?.image_url || '') 
    : rawImageUrl;

  const mediaType = getMediaType(imageUrl);
  const isVid = isVideoUrl(imageUrl);
  
  const isOutOfStock = product.is_out_of_stock || (Array.isArray(product.tags) && product.tags.includes('Tükendi')) || product.tags === 'Tükendi';

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 600);
    toggleWishlist(product.id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col space-y-3 font-inter"
    >
      <Link href={`/urunler/${product.slug}`} className="relative aspect-[3/4] w-full overflow-hidden bg-[#FAFAF8] rounded-xs border border-gray-200/60 flex items-center justify-center">
        {imageUrl ? (
          isVid ? (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              {mediaType === 'video' ? (
                <video 
                  src={`${imageUrl}#t=0.1`} 
                  className="w-full h-full object-cover" 
                  muted 
                  autoPlay
                  loop 
                  playsInline 
                  preload="metadata" 
                />
              ) : null}
              
              <span className="absolute top-2 left-2 bg-[#C5A572] text-white text-[9px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider shadow-sm flex items-center gap-1 z-10">
                {mediaType === 'instagram' ? (
                  <><InstagramIcon className="w-3 h-3 text-pink-300" /> Reel</>
                ) : mediaType === 'youtube' ? (
                  <><Video className="w-3 h-3 text-red-300" /> YouTube</>
                ) : (
                  <><Film className="w-3 h-3" /> Video</>
                )}
              </span>
            </div>
          ) : (
            <Image
              unoptimized
              src={imageUrl}
              alt={product.name}
              fill
              className={`object-cover p-0 transition-transform duration-700 ease-out group-hover:scale-105 ${isOutOfStock ? 'opacity-70 grayscale-[20%]' : ''}`}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
            Görsel Yok
          </div>
        )}

        {/* Wishlist Floating Heart */}
        <button
          onClick={handleHeartClick}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-gray-600 hover:text-rose-500 transition-all shadow-md cursor-pointer hover:scale-110 active:scale-90"
        >
          <motion.div animate={heartAnim ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] } : {}}>
            <Heart className={`w-4 h-4 transition-colors ${isFav ? 'fill-rose-500 text-rose-500' : 'text-gray-700'}`} />
          </motion.div>
        </button>

        {isOutOfStock ? (
          <span className="absolute top-2 left-2 bg-[#1A1A1A] text-[#C5A572] border border-[#C5A572] text-[9px] font-bold px-2.5 py-1 uppercase tracking-widest font-inter shadow-md z-20">
            STOKTA YOK (TÜKENDİ)
          </span>
        ) : (
          <>
            {product.is_new && !isVid && (
              <span className="absolute top-2 left-2 bg-[#1A1A1A] text-white text-[10px] font-semibold px-2 py-1 uppercase tracking-wider font-inter shadow-sm">
                YENİ
              </span>
            )}
            {hasDiscount && (
              <span className="absolute top-2 left-2 bg-[#C5A572] text-white text-[10px] font-semibold px-2 py-1 uppercase tracking-wider font-inter shadow-sm">
                İNDİRİM
              </span>
            )}
          </>
        )}
      </Link>

      <div className="flex flex-col space-y-1">
        <Link href={`/urunler/${product.slug}`} className="font-semibold text-xs sm:text-sm text-[#1A1A1A] hover:text-[#C5A572] transition-colors line-clamp-1">
          {product.name}
        </Link>

        <div className="flex items-center space-x-2">
          {hasDiscount ? (
            <>
              <span className="text-xs sm:text-sm font-bold text-[#1A1A1A]">
                {product.sale_price?.toLocaleString('tr-TR')} ₺
              </span>
              <span className="text-[11px] text-gray-400 line-through">
                {product.base_price?.toLocaleString('tr-TR')} ₺
              </span>
            </>
          ) : (
            <span className="text-xs sm:text-sm font-bold text-[#1A1A1A]">
              {product.base_price?.toLocaleString('tr-TR')} ₺
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
