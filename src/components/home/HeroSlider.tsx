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

// Admin panelinden (İçerik Yönetimi > Slider) görsel eklenmediğinde gösterilen kapak
const DEFAULT_SLIDES: Slide[] = [
  {
    id: 'default-hero-1',
    title: 'Yeni sezon, sakin bir zarafetle.',
    subtitle: 'Sonbahar · Kış 2026',
    image_url: 'https://images.unsplash.com/photo-1571513800374-df1bbe650e56?q=75&w=1800&auto=format&fit=crop',
    link_url: '/urunler',
    link_text: 'Koleksiyonu keşfet',
  },
  {
    id: 'default-hero-2',
    title: 'Ölçülü kesimler, sezonsuz parçalar.',
    subtitle: 'Takımlar',
    image_url: 'https://images.unsplash.com/photo-1668952135120-7d997b1b3778?q=75&w=1800&auto=format&fit=crop',
    link_url: '/kategori/takimlar',
    link_text: 'Takımları gör',
  },
]

const ease = [0.22, 1, 0.36, 1] as const

export default function HeroSlider({ slides }: HeroSliderProps) {
  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused) return
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeSlides.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [activeSlides.length, isPaused])

  const currentSlide = activeSlides[currentIndex]

  return (
    <section
      aria-label="Öne çıkan koleksiyon"
      className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-ink text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease }}
          className="absolute inset-0"
        >
          <Image
            src={currentSlide.image_url}
            alt={currentSlide.title}
            fill
            sizes="100vw"
            className="object-cover object-[50%_30%]"
            priority={currentIndex === 0}
          />
        </motion.div>
      </AnimatePresence>

      {/* Okunabilirlik için alttan koyulaşan perde */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-ink/30" />

      <div className="relative z-10 h-full max-w-[1600px] mx-auto px-5 md:px-10 flex flex-col justify-end pb-6 md:pb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-4 md:mb-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={`copy-${currentSlide.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.8, ease, delay: 0.25 }}
              className="max-w-md"
            >
              {currentSlide.subtitle && <p className="eyebrow text-gold-light mb-4">{currentSlide.subtitle}</p>}
              <h2 className="font-display italic text-3xl md:text-[2.6rem] leading-[1.1] mb-6">{currentSlide.title}</h2>
              {currentSlide.link_url && (
                <Link
                  href={currentSlide.link_url}
                  className="inline-flex items-center gap-4 bg-white text-ink px-8 py-4 eyebrow hover:bg-gold-light transition-colors duration-500"
                >
                  {currentSlide.link_text || 'Keşfet'}
                  <span aria-hidden className="block h-px w-8 bg-current" />
                </Link>
              )}
            </motion.div>
          </AnimatePresence>

          {activeSlides.length > 1 && (
            <div className="flex items-center gap-4" role="tablist" aria-label="Kapak görselleri">
              <span className="font-display text-sm tabular-nums">
                {String(currentIndex + 1).padStart(2, '0')}
                <span className="text-white/50"> / {String(activeSlides.length).padStart(2, '0')}</span>
              </span>
              <div className="flex gap-2">
                {activeSlides.map((s, idx) => (
                  <button
                    key={s.id}
                    role="tab"
                    aria-selected={idx === currentIndex}
                    onClick={() => setCurrentIndex(idx)}
                    className="py-3 cursor-pointer"
                    aria-label={`${idx + 1}. görsel`}
                  >
                    <span
                      className={`block h-px transition-all duration-700 ${
                        idx === currentIndex ? 'w-14 bg-white' : 'w-6 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dergi kapağı manşeti */}
        <div className="overflow-hidden border-t border-white/25 pt-2">
          <p
            aria-hidden
            className="animate-masthead font-display font-normal leading-[0.82] tracking-[-0.02em] whitespace-nowrap text-center text-[clamp(2.4rem,calc((100vw_-_5rem)/6.7),14.5rem)]"
          >
            MELA HOUSE
          </p>
        </div>
      </div>
      <h1 className="sr-only">MELA HOUSE — Kadın Giyim ve İç Giyim</h1>
    </section>
  )
}
