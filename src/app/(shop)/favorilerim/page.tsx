// @ts-nocheck
"use client";

import { useWishlist } from "@/hooks/useWishlist";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WishlistPage() {
  const { items, isLoading } = useWishlist();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/giris?redirect=/favorilerim");
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return <div className="min-h-[60vh] flex justify-center items-center font-inter text-gray-500 pt-20">Yükleniyor...</div>;
  }

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-28 md:pt-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {items.length === 0 ? (
          <div className="min-h-[35vh] flex flex-col items-center justify-center px-4 bg-white rounded-xs border border-gray-200 py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-xs border border-gray-100">
              <Heart className="w-8 h-8 text-[#C5A572]" />
            </div>
            <h2 className="text-xl font-playfair text-[#1A1A1A] mb-2">Favori Listeniz Boş</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md font-inter text-sm">
              Beğendiğiniz ürünleri kalbe tıklayarak favorilerinize ekleyebilirsiniz.
            </p>
            <Link href="/urunler">
              <Button size="lg" className="bg-[#C5A572] hover:bg-[#1A1A1A]">Alışverişe Başla</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
