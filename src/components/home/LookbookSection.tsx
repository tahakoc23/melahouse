'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface LookbookContent {
  id?: string
  title: string
  image_url: string
  description: string
  link_url?: string
}

interface LookbookSectionProps {
  content?: LookbookContent | null
}

const DEFAULT_LOOKBOOK: LookbookContent = {
  title: 'Zamansız Zarafet',
  image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
  description: 'MELA HOUSE, saf ipek dokunuşları, kusursuz işçilik ve modern siluetlerle kadının gücünü ve zarafetini ortaya çıkarıyor. Her bir tasarım, zamana meydan okuyan benzersiz bir lüks deneyimi sunmak üzere özenle el işçiliğiyle hazırlandı.',
  link_url: '/hakkimizda'
}

export default function LookbookSection({ content }: LookbookSectionProps) {
  const displayContent = content || DEFAULT_LOOKBOOK

  return (
    <section className="px-4 md:px-8 max-w-[1400px] mx-auto py-16 overflow-hidden">
      <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
        
        <div className="w-full md:w-1/2 relative h-[500px] md:h-[700px] overflow-hidden rounded-sm group">
          <Image
            src={displayContent.image_url}
            alt={displayContent.title}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-500" />
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-playfair text-4xl md:text-6xl text-[#1A1A1A] mb-8"
          >
            {displayContent.title}
          </motion.h2>
          
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-[1px] w-16 bg-[#C5A572] mb-8 origin-left"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="prose prose-lg font-inter text-gray-600 mb-12"
          >
            <p className="leading-relaxed">
              {displayContent.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link 
              href={displayContent.link_url || '/hakkimizda'} 
              className="inline-flex items-center gap-4 text-[#1A1A1A] hover:text-[#C5A572] transition-colors group"
            >
              <span className="font-inter text-sm uppercase tracking-widest font-medium">Hikayemizi Keşfet</span>
              <span className="h-[1px] w-12 bg-[#1A1A1A] group-hover:bg-[#C5A572] transition-colors" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
