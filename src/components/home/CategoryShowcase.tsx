'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Category {
  id: string
  name: string
  slug: string
  image_url: string
}

interface CategoryShowcaseProps {
  categories?: Category[]
}

const FIVE_MAIN_COLLECTIONS = [
  {
    id: 'c-1',
    name: 'Üst Giyim',
    slug: 'ust-giyim',
    subtitle: 'Elbise, Gömlek, Crop, Kimono & Dahası',
    image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'c-2',
    name: 'Alt Giyim',
    slug: 'alt-giyim',
    subtitle: 'Pantolon, Etek, Şort & Tayt',
    image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'c-3',
    name: 'İç Giyim',
    slug: 'ic-giyim',
    subtitle: 'Zarif İpek Dantel & Kombinezon',
    image_url: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'c-4',
    name: 'Dış Giyim',
    slug: 'dis-giyim',
    subtitle: 'Trençkot, Kaban, Ceket & Mont',
    image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'c-5',
    name: 'Takımlar',
    slug: 'takimlar',
    subtitle: 'Lüks İkili Kombin & Takımlar',
    image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop'
  }
]

export default function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const displayCats = FIVE_MAIN_COLLECTIONS;

  return (
    <section className="px-4 md:px-8 max-w-[1600px] mx-auto py-12 font-inter">
      <div className="flex flex-col items-center mb-14">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-playfair text-4xl md:text-5xl text-[#1A1A1A] mb-4 text-center font-semibold tracking-tight"
        >
          Koleksiyonlar
        </motion.h2>
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-[1px] w-24 bg-[#C5A572]"
        />
      </div>

      {/* 5 Main Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6 min-h-[600px]">
        {/* Card 1: Üst Giyim (Col 1-3) */}
        <Link href={`/kategori/${displayCats[0].slug}`} className="md:col-span-3 group relative block overflow-hidden min-h-[340px] md:min-h-[420px] rounded-xs shadow-sm">
          <div className="absolute inset-0 z-0">
            <Image
              src={displayCats[0].image_url}
              alt={displayCats[0].name}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-500 z-10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center px-6">
            <span className="text-[#C5A572] font-inter text-xs tracking-widest uppercase mb-2">Koleksiyon</span>
            <h3 className="font-playfair text-3xl md:text-5xl text-white tracking-wide mb-2 font-medium">{displayCats[0].name}</h3>
            <p className="text-gray-200 text-xs font-light tracking-wider mb-4 hidden md:block">{displayCats[0].subtitle}</p>
            <span className="text-white border-b border-[#C5A572] font-inter text-xs tracking-widest uppercase pb-1 group-hover:text-[#C5A572] transition-colors">Keşfet &rarr;</span>
          </div>
        </Link>

        {/* Card 2: Alt Giyim (Col 4-6) */}
        <Link href={`/kategori/${displayCats[1].slug}`} className="md:col-span-3 group relative block overflow-hidden min-h-[340px] md:min-h-[420px] rounded-xs shadow-sm">
          <div className="absolute inset-0 z-0">
            <Image
              src={displayCats[1].image_url}
              alt={displayCats[1].name}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-500 z-10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center px-6">
            <span className="text-[#C5A572] font-inter text-xs tracking-widest uppercase mb-2">Koleksiyon</span>
            <h3 className="font-playfair text-3xl md:text-5xl text-white tracking-wide mb-2 font-medium">{displayCats[1].name}</h3>
            <p className="text-gray-200 text-xs font-light tracking-wider mb-4 hidden md:block">{displayCats[1].subtitle}</p>
            <span className="text-white border-b border-[#C5A572] font-inter text-xs tracking-widest uppercase pb-1 group-hover:text-[#C5A572] transition-colors">Keşfet &rarr;</span>
          </div>
        </Link>

        {/* Card 3: İç Giyim (Col 1-2) */}
        <Link href={`/kategori/${displayCats[2].slug}`} className="md:col-span-2 group relative block overflow-hidden min-h-[280px] rounded-xs shadow-sm">
          <div className="absolute inset-0 z-0">
            <Image
              src={displayCats[2].image_url}
              alt={displayCats[2].name}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-500 z-10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center px-4">
            <h3 className="font-playfair text-2xl md:text-3xl text-white tracking-wide mb-2 font-medium">{displayCats[2].name}</h3>
            <span className="text-[#C5A572] font-inter text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">Keşfet &rarr;</span>
          </div>
        </Link>

        {/* Card 4: Dış Giyim (Col 3-4) */}
        <Link href={`/kategori/${displayCats[3].slug}`} className="md:col-span-2 group relative block overflow-hidden min-h-[280px] rounded-xs shadow-sm">
          <div className="absolute inset-0 z-0">
            <Image
              src={displayCats[3].image_url}
              alt={displayCats[3].name}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-500 z-10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center px-4">
            <h3 className="font-playfair text-2xl md:text-3xl text-white tracking-wide mb-2 font-medium">{displayCats[3].name}</h3>
            <span className="text-[#C5A572] font-inter text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">Keşfet &rarr;</span>
          </div>
        </Link>

        {/* Card 5: Takımlar (Col 5-6) */}
        <Link href={`/kategori/${displayCats[4].slug}`} className="md:col-span-2 group relative block overflow-hidden min-h-[280px] rounded-xs shadow-sm">
          <div className="absolute inset-0 z-0">
            <Image
              src={displayCats[4].image_url}
              alt={displayCats[4].name}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-500 z-10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center px-4">
            <h3 className="font-playfair text-2xl md:text-3xl text-white tracking-wide mb-2 font-medium">{displayCats[4].name}</h3>
            <span className="text-[#C5A572] font-inter text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">Keşfet &rarr;</span>
          </div>
        </Link>
      </div>
    </section>
  )
}
