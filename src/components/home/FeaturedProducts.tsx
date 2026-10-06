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
    <section className="px-5 md:px-10 max-w-[1600px] mx-auto overflow-hidden">
      <div className="flex items-end justify-between gap-6 border-b border-ink/15 pb-5 mb-8 md:mb-10">
        <div>
          <p className="eyebrow text-kul mb-3">Seçki</p>
          <h2 className="font-display text-4xl md:text-6xl leading-none">
            Öne <em className="text-murdum">çıkanlar</em>
          </h2>
        </div>
        <Link href="/urunler" className="eyebrow link-couture hidden sm:inline-block whitespace-nowrap">
          Tüm ürünler
        </Link>
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

    </section>
  )
}
