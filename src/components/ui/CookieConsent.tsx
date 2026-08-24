'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Check } from 'lucide-react'

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('melahouse_cookie_consent')
    if (!consent) {
      // Delay pop-up slightly for smooth UX entrance
      const timer = setTimeout(() => setIsVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem('melahouse_cookie_consent', 'accepted_all')
    setIsVisible(false)
  }

  const handleAcceptNecessary = () => {
    localStorage.setItem('melahouse_cookie_consent', 'accepted_necessary')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:max-w-md z-50 bg-[#1A1A1A]/95 backdrop-blur-md text-[#FAFAF8] p-6 rounded-lg border border-[#C5A572]/40 shadow-2xl font-inter"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 text-[#C5A572]">
              <Cookie className="w-5 h-5 animate-pulse" />
              <h3 className="font-playfair text-lg font-semibold tracking-wide text-white">
                Çerez Kullanımı &amp; KVKK
              </h3>
            </div>
            <button
              onClick={handleAcceptNecessary}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed mb-5">
            MELA HOUSE olarak alışveriş deneyiminizi iyileştirmek, kişiselleştirilmiş içerikler sunmak ve site trafiğimizi analiz etmek amacıyla çerezler kullanıyoruz. Detaylı bilgi için{' '}
            <Link href="/gizlilik-politikasi" className="text-[#C5A572] underline hover:text-white transition-colors">
              Gizlilik ve Çerez Politikamızı
            </Link>{' '}
            inceleyebilirsiniz.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={handleAcceptAll}
              className="w-full sm:w-auto flex-1 bg-[#C5A572] hover:bg-[#b09260] text-[#1A1A1A] font-semibold text-xs py-2.5 px-4 rounded-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md cursor-pointer uppercase tracking-wider"
            >
              <Check className="w-3.5 h-3.5" />
              Tümünü Kabul Et
            </button>
            <button
              onClick={handleAcceptNecessary}
              className="w-full sm:w-auto bg-transparent border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-medium text-xs py-2.5 px-4 rounded-xs transition-all duration-200 cursor-pointer uppercase tracking-wider"
            >
              Yalnızca Gerekli
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
