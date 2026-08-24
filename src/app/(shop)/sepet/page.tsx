// @ts-nocheck
"use client";

import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();

  const total = getTotal();
  const kargo = total > 500 ? 0 : 50;

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-28 md:pt-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {items.length === 0 ? (
          <div className="min-h-[35vh] flex flex-col items-center justify-center px-4 bg-white rounded-xs border border-gray-200 py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
              <ShoppingBag className="w-8 h-8 text-[#C5A572]" />
            </div>
            <h2 className="text-xl font-playfair text-[#1A1A1A] mb-2">Sepetiniz Boş</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md font-inter text-sm">
              Sepetinizde henüz ürün bulunmuyor. Yeni koleksiyonumuzu keşfedin.
            </p>
            <Link href="/urunler">
              <Button size="lg" className="bg-[#C5A572] hover:bg-[#1A1A1A]">Alışverişe Başla</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 font-inter">
            <div className="lg:col-span-8">
              <div className="bg-white p-6 rounded-xs border border-gray-200 divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 md:gap-6 py-6 first:pt-0 last:pb-0">
                    <div className="w-24 h-32 md:w-28 md:h-36 relative bg-gray-50 rounded-xs overflow-hidden flex-shrink-0 border border-gray-100">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <Link href={`/urunler/${item.slug || item.id}`} className="font-medium text-[#1A1A1A] hover:text-[#C5A572] transition-colors">
                            {item.name}
                          </Link>
                          {item.variantInfo && <p className="text-xs text-gray-500 mt-1">Beden/Renk: {item.variantInfo}</p>}
                        </div>
                        <p className="font-semibold text-[#1A1A1A]">{formatPrice(item.price)}</p>
                      </div>
                      
                      <div className="flex justify-between items-end mt-4">
                        <div className="flex items-center border border-gray-300 rounded-xs">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="p-2 hover:bg-gray-100 transition-colors text-gray-600"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 transition-colors text-gray-600"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <button 
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-rose-600 transition-colors flex items-center gap-1 text-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Kaldır</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-4">
              <div className="bg-white p-6 rounded-xs border border-gray-200 sticky top-28 shadow-xs">
                <h2 className="text-lg font-playfair font-semibold mb-6 border-b border-gray-100 pb-4 text-[#1A1A1A]">Sipariş Özeti</h2>
                
                <div className="space-y-4 mb-6 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam</span>
                    <span className="font-medium text-[#1A1A1A]">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Kargo</span>
                    {kargo === 0 ? (
                      <span className="text-emerald-600 font-medium">Ücretsiz Kargo</span>
                    ) : (
                      <span className="font-medium text-[#1A1A1A]">{formatPrice(kargo)}</span>
                    )}
                  </div>
                  <div className="border-t border-gray-100 pt-4 flex justify-between font-semibold text-lg text-[#1A1A1A]">
                    <span>Toplam</span>
                    <span>{formatPrice(total + kargo)}</span>
                  </div>
                </div>
                
                <Link href="/odeme" className="block w-full">
                  <Button size="lg" className="w-full bg-[#C5A572] hover:bg-[#1A1A1A]">Ödemeye Geç</Button>
                </Link>
                
                <Link href="/urunler" className="block text-center mt-4 text-xs font-medium text-[#C5A572] hover:underline uppercase tracking-wider">
                  Alışverişe Devam Et &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
