'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, ArrowRight, Plus } from 'lucide-react'

interface AdminNotificationModalProps {
  isOpen: boolean
  type?: 'success' | 'error'
  title: string
  message: string
  primaryButtonText?: string
  onPrimaryClick: () => void
  secondaryButtonText?: string
  onSecondaryClick?: () => void
}

export default function AdminNotificationModal({
  isOpen,
  type = 'success',
  title,
  message,
  primaryButtonText = 'Ürünler Listesine Git',
  onPrimaryClick,
  secondaryButtonText,
  onSecondaryClick
}: AdminNotificationModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-inter">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-[#1A1A1A] border border-[#C5A572]/40 rounded-sm shadow-2xl p-8 max-w-md w-full text-center text-white relative overflow-hidden"
        >
          {/* Top Gold Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C5A572] via-[#E6D5C3] to-[#C5A572]" />

          {/* Icon */}
          <div className="flex justify-center mb-5">
            {type === 'success' ? (
              <div className="w-16 h-16 rounded-full bg-[#C5A572]/15 border border-[#C5A572] flex items-center justify-center text-[#C5A572] shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500 flex items-center justify-center text-rose-500 shadow-lg">
                <AlertTriangle className="w-9 h-9" />
              </div>
            )}
          </div>

          {/* Title & Message */}
          <h2 className="font-playfair text-2xl font-semibold mb-2 tracking-wide text-white">
            {title}
          </h2>
          <p className="text-gray-300 text-xs leading-relaxed mb-8">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {secondaryButtonText && onSecondaryClick && (
              <button
                type="button"
                onClick={onSecondaryClick}
                className="flex-1 py-3 px-4 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-xs font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-[#C5A572]" />
                <span>{secondaryButtonText}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onPrimaryClick}
              className="flex-1 py-3 px-4 bg-[#C5A572] hover:bg-[#b59461] text-[#1A1A1A] font-bold rounded-xs text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{primaryButtonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
