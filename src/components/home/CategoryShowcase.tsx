'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Category {
  id: string
  name: string
  slug: string
  image_url?: string | null
}

interface CategoryShowcaseProps {
  categories?: Category[]
}

// Ana koleksiyonlar. Admin'de kategoriye görsel eklenirse o görsel kullanılır.
const COLLECTIONS = [
  {
    slug: 'ust-giyim',
    name: 'Üst Giyim',
    detail: 'Elbise · Gömlek · Bluz · Kimono',
    image: 'https://images.unsplash.com/photo-1704775990248-4c1c1a276b4f?q=80&w=1400&auto=format&fit=crop',
    span: 'md:col-span-7 md:row-span-2',
  },
  {
    slug: 'alt-giyim',
    name: 'Alt Giyim',
    detail: 'Pantolon · Etek · Şort',
    image: 'https://images.unsplash.com/photo-1741605037162-b1f475a4a4d3?q=80&w=1200&auto=format&fit=crop',
    span: 'md:col-span-5',
  },
  {
    slug: 'dis-giyim',
    name: 'Dış Giyim',
    detail: 'Trençkot · Kaban · Ceket',
    image: 'https://images.unsplash.com/photo-1723390926441-5840f12432fc?q=80&w=1200&auto=format&fit=crop',
    span: 'md:col-span-5',
  },
  {
    slug: 'takimlar',
    name: 'Takımlar',
    detail: 'İkili ve üçlü kombinler',
    image: 'https://images.unsplash.com/photo-1619914777583-ce0b7830d2a6?q=80&w=1200&auto=format&fit=crop',
    span: 'md:col-span-6',
  },
  {
    slug: 'ic-giyim',
    name: 'İç Giyim',
    detail: 'Saten · Dantel · Gecelik',
    image: 'https://images.unsplash.com/photo-1624819153654-5cfb66a0fc68?q=80&w=1200&auto=format&fit=crop',
    span: 'md:col-span-6',
  },
]

export default function CategoryShowcase({ categories = [] }: CategoryShowcaseProps) {
  const bySlug = new Map(categories.map(c => [c.slug, c]))

  return (
    <section className="max-w-[1600px] mx-auto px-5 md:px-10" aria-labelledby="koleksiyonlar-baslik">
      <div className="flex items-end justify-between gap-6 border-b border-ink/15 pb-5 mb-8 md:mb-10">
        <div>
          <p className="eyebrow text-kul mb-3">Koleksiyonlar</p>
          <h2 id="koleksiyonlar-baslik" className="font-display text-4xl md:text-6xl leading-none">
            Gardırobun <em className="text-murdum">temeli</em>
          </h2>
        </div>
        <Link href="/urunler" className="eyebrow link-couture hidden sm:inline-block whitespace-nowrap">
          Tüm ürünler
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-12 md:auto-rows-[300px] gap-3 md:gap-4">
        {COLLECTIONS.map((col, i) => {
          const dbCat = bySlug.get(col.slug)
          const image = dbCat?.image_url || col.image
          const name = dbCat?.name || col.name
          return (
            <motion.div
              key={col.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: (i % 3) * 0.08 }}
              className={`${i === 0 ? 'col-span-2 aspect-[4/5]' : 'col-span-1 aspect-[3/4]'} md:aspect-auto ${col.span}`}
            >
              <Link href={`/kategori/${col.slug}`} className="group relative block h-full w-full overflow-hidden bg-tas">
                <Image
                  src={image}
                  alt={name}
                  fill
                  sizes={i === 0 ? '(min-width: 768px) 58vw, 100vw' : '(min-width: 768px) 42vw, 50vw'}
                  className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-ink/0" />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-7 text-white flex items-end justify-between gap-4">
                  <div>
                    <h3 className={`font-display italic leading-none ${i === 0 ? 'text-4xl md:text-7xl' : 'text-2xl md:text-4xl'}`}>
                      {name}
                    </h3>
                    <p className="hidden md:block eyebrow text-white/75 mt-3">{col.detail}</p>
                  </div>
                  <span
                    aria-hidden
                    className="hidden md:flex shrink-0 items-center justify-center w-11 h-11 rounded-full border border-white/60 transition-all duration-500 group-hover:bg-white group-hover:text-ink"
                  >
                    →
                  </span>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
