'use client';

import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: any[];
  totalCount: number;
  currentPage: number;
}

export default function ProductGrid({ products, totalCount, currentPage }: ProductGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalCount / 12);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-gray-500">{totalCount} ürün listeleniyor</span>
        <select 
          onChange={handleSortChange} 
          defaultValue={searchParams.get('sort') || 'en-yeni'}
          className="border-gray-200 border text-sm py-2 px-3 focus:ring-[#C5A572] focus:border-[#C5A572] outline-none"
        >
          <option value="en-yeni">En Yeni</option>
          <option value="fiyat-artan">Fiyat: Düşükten Yükseğe</option>
          <option value="fiyat-azalan">Fiyat: Yüksekten Düşüğe</option>
        </select>
      </div>

      {products.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          Henüz ürün bulunmamaktadır.
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8"
        >
          {products.map(product => (
            <motion.div key={product.id} variants={item}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="mt-12 flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-10 h-10 flex items-center justify-center border text-sm transition-colors ${
                page === currentPage 
                  ? 'bg-black text-white border-black' 
                  : 'bg-transparent text-black border-gray-200 hover:border-black'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
