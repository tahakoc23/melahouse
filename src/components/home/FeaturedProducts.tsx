'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import ProductCard from '../product/ProductCard'

interface ProductImage {
  id: string
  image_url: string
  is_primary: boolean
  sort_order: number
}

interface Product {
  id: string
  name: string
  slug: string
  base_price: number
  sale_price?: number | null
  is_new: boolean
  product_images: ProductImage[]
}

interface FeaturedProductsProps {
  products?: Product[]
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'def-1',
    name: 'Saten Kruvaze Abiye Elbise',
    slug: 'saten-kruvaze-abiye-elbise',
    base_price: 8500,
    sale_price: 6990,
    is_new: true,
    product_images: [
      { id: 'img-1', image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop', is_primary: true, sort_order: 1 },
      { id: 'img-1b', image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop', is_primary: false, sort_order: 2 }
    ]
  },
  {
    id: 'def-2',
    name: 'İpek Dantel Detaylı Büstiyer',
    slug: 'ipek-dantel-detayli-bustiyer',
    base_price: 3450,
    sale_price: null,
    is_new: true,
    product_images: [
      { id: 'img-2', image_url: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?q=80&w=800&auto=format&fit=crop', is_primary: true, sort_order: 1 }
    ]
  },
  {
    id: 'def-3',
    name: 'Velvet Noir Gece Elbisesi',
    slug: 'velvet-noir-gece-elbisesi',
    base_price: 12500,
    sale_price: 9800,
    is_new: false,
    product_images: [
      { id: 'img-3', image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop', is_primary: true, sort_order: 1 }
    ]
  },
  {
    id: 'def-4',
    name: 'İpek Saten Sabahlık & Kimono',
    slug: 'ipek-saten-sabahlik-kimono',
    base_price: 4900,
    sale_price: null,
    is_new: true,
    product_images: [
      { id: 'img-4', image_url: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=800&auto=format&fit=crop', is_primary: true, sort_order: 1 }
    ]
  }
]

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const displayProducts = products && products.length > 0 ? products : DEFAULT_PRODUCTS

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0, 0, 0.2, 1] as [number, number, number, number] } }
  }

  return (
    <section className="px-4 md:px-8 max-w-[1600px] mx-auto overflow-hidden py-12">
      <div className="flex flex-col items-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="font-playfair text-4xl md:text-5xl text-[#1A1A1A] mb-4 text-center"
        >
          Öne Çıkan Ürünler
        </motion.h2>
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-[1px] w-24 bg-[#C5A572]"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="flex overflow-x-auto pb-8 -mx-4 px-4 gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-x-6 md:gap-y-12 md:overflow-visible md:pb-0 md:mx-0 md:px-0 snap-x snap-mandatory hide-scrollbar"
      >
        {displayProducts.map((product) => (
          <motion.div 
            key={product.id} 
            variants={itemVariants}
            className="w-[85vw] sm:w-[300px] md:w-auto flex-shrink-0 snap-start"
          >
            <ProductCard product={product as any} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex justify-center mt-16"
      >
        <Link 
          href="/urunler" 
          className="inline-block border-b border-[#1A1A1A] pb-1 font-inter text-sm uppercase tracking-widest text-[#1A1A1A] hover:text-[#C5A572] hover:border-[#C5A572] transition-colors font-medium"
        >
          Tüm Ürünleri Gör
        </Link>
      </motion.div>
    </section>
  )
}
