'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Slide {
  id: string
  title: string
  subtitle?: string
  image_url: string
  link_url?: string
  link_text?: string
}

interface HeroSliderProps {
  slides?: Slide[]
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 'default-hero-1',
    title: 'Yeni Sezon Koleksiyonu',
    subtitle: 'ZARAFETİN VE LÜKSÜN SİMGESİ',
    image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop',
    link_url: '/urunler',
    link_text: 'Koleksiyonu Keşfet'
  },
  {
    id: 'default-hero-2',
    title: 'Lüks İç Giyim & İpek',
    subtitle: 'SAF İPEK DOKUNUŞLARI',
    image_url: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?q=80&w=2000&auto=format&fit=crop',
    link_url: '/urunler',
    link_text: 'Ürünleri İncele'
  }
]

export default function HeroSlider({ slides }: HeroSliderProps) {
  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [activeSlides.length, isPaused])

  const currentSlide = activeSlides[currentIndex]

  return (
    <section 
      className="relative h-[100dvh] w-full overflow-hidden bg-[#1A1A1A]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={currentSlide.image_url}
            alt={currentSlide.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl"
          >
            {currentSlide.subtitle && (
              <h3 className="font-inter text-xs md:text-sm uppercase tracking-[0.3em] text-[#C5A572] mb-6 font-semibold">
                {currentSlide.subtitle}
              </h3>
            )}
            <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl text-[#FAFAF8] font-medium mb-10 leading-tight">
              {currentSlide.title}
            </h1>
            {currentSlide.link_url && (
              <Link 
                href={currentSlide.link_url}
                className="inline-block border border-[#C5A572] text-[#FAFAF8] bg-black/30 backdrop-blur-xs px-10 py-4 font-inter text-xs tracking-widest uppercase hover:bg-[#C5A572] hover:text-[#1A1A1A] transition-all duration-300 shadow-lg"
              >
                {currentSlide.link_text || 'Keşfet'}
              </Link>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {activeSlides.length > 1 && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4 z-20">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className="group py-4 px-2 cursor-pointer"
              aria-label={`Go to slide ${idx + 1}`}
            >
              <div 
                className={`h-[2px] w-12 transition-all duration-300 ${
                  idx === currentIndex 
                    ? 'bg-[#C5A572]' 
                    : 'bg-white/40 group-hover:bg-white/70'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
