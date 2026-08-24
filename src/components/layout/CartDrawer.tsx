'use client';

import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CartDrawer() {
  const { isCartOpen, toggleCart } = useUIStore();
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();

  const total = getTotal();

  const closeCart = () => toggleCart(false);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#FAFAF8] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center font-inter">
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-5 h-5 text-[#C5A572]" />
                <h2 className="font-playfair text-xl font-semibold text-[#1A1A1A]">Alışveriş Sepeti</h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                  {items.reduce((acc, item) => acc + item.quantity, 0)} Ürün
                </span>
              </div>
              <button
                onClick={closeCart}
                className="text-gray-400 hover:text-[#1A1A1A] transition-colors p-1"
                aria-label="Sepeti kapat"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 font-inter space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-lg font-medium text-[#1A1A1A]">Sepetiniz Henüz Boş</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                      MELA HOUSE özel koleksiyonlarını keşfetmek için alışverişe hemen başlayın.
                    </p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="mt-4 px-6 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#C5A572] transition-colors text-xs uppercase tracking-wider font-semibold cursor-pointer"
                  >
                    Alışverişe Başla
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex space-x-4 border-b border-gray-100 pb-6">
                      <div className="relative aspect-[3/4] w-20 bg-gray-100 rounded-xs overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <Image
                            unoptimized
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Görsel Yok</div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-[#1A1A1A] text-sm line-clamp-1">{item.name}</h4>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                              aria-label="Ürünü sil"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {item.variantInfo && (
                            <p className="text-xs text-gray-500 mt-1">{item.variantInfo}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border border-gray-200">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-3 py-1 hover:bg-gray-100 transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3 text-[#1A1A1A]" />
                            </button>
                            <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1 hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="w-3 h-3 text-[#1A1A1A]" />
                            </button>
                          </div>
                          <span className="font-semibold text-[#1A1A1A] text-sm">
                            {(item.price * item.quantity).toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 bg-white border-t border-gray-200 font-inter space-y-4">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Ara Toplam</span>
                  <span>{total.toLocaleString('tr-TR')} ₺</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Kargo</span>
                  <span>{total > 1000 ? 'Ücretsiz' : 'Standart Kargo (50 ₺)'}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="font-playfair text-xl font-semibold text-[#1A1A1A]">Toplam</span>
                  <span className="font-playfair text-xl font-semibold text-[#1A1A1A]">
                    {(total > 1000 ? total : total + 50).toLocaleString('tr-TR')} ₺
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Link
                    href="/sepet"
                    onClick={closeCart}
                    className="flex justify-center items-center px-4 py-3 border border-[#1A1A1A] text-[#1A1A1A] hover:bg-gray-50 transition-colors text-xs uppercase tracking-wider font-semibold text-center"
                  >
                    Sepeti Gör
                  </Link>
                  <Link
                    href="/odeme"
                    onClick={closeCart}
                    className="flex justify-center items-center px-4 py-3 bg-[#C5A572] text-white hover:bg-[#1A1A1A] transition-colors text-xs uppercase tracking-wider font-semibold text-center shadow-md"
                  >
                    Ödemeye Geç
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
