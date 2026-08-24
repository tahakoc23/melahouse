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

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!products || products.length === 0) {
    return null
  }

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
        {products.map((product) => (
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
