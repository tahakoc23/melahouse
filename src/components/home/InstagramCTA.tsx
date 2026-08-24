'use client'

import { motion } from 'framer-motion'

export default function InstagramCTA() {
  return (
    <section className="relative py-32 overflow-hidden bg-[#1A1A1A] flex flex-col items-center justify-center text-center px-4">
      {/* Subtle background pattern or gold line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-24 bg-gradient-to-b from-transparent to-[#C5A572]/50" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-24 bg-gradient-to-t from-transparent to-[#C5A572]/50" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center max-w-2xl mx-auto"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#C5A572" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="mb-8"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
        </svg>

        <h2 className="font-playfair text-4xl md:text-5xl text-[#FAFAF8] mb-6 font-light tracking-wide">
          Bizi Instagram'da Takip Edin
        </h2>
        
        <p className="font-inter text-[#FAFAF8]/70 mb-10 tracking-widest uppercase text-sm">
          @melahouse.official
        </p>

        <a 
          href="https://instagram.com/melahouse.official"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-10 py-4 bg-[#C5A572] text-[#1A1A1A] font-inter text-sm uppercase tracking-widest hover:bg-[#b09260] transition-colors duration-300"
        >
          Profili Ziyaret Et
        </a>
      </motion.div>
    </section>
  )
}
