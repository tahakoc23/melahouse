"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ToastProps {
  isOpen: boolean;
  type?: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  isOpen,
  type = 'success',
  title,
  message,
  onClose,
  duration = 3500
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const config = {
    success: {
      bg: 'bg-[#1A1A1A]/95 border-[#C5A572] shadow-[0_10px_30px_rgba(197,165,114,0.3)]',
      text: 'text-white',
      icon: (
        <div className="relative">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.4 }}
            className="w-8 h-8 rounded-full bg-[#C5A572]/20 flex items-center justify-center border border-[#C5A572]/40"
          >
            <CheckCircle2 className="w-5 h-5 text-[#C5A572]" />
          </motion.div>
          <Sparkles className="w-3.5 h-3.5 text-[#D4BA8A] absolute -top-1 -right-1 animate-pulse" />
        </div>
      ),
      defaultTitle: 'İşlem Başarılı'
    },
    error: {
      bg: 'bg-rose-950/95 border-rose-500 shadow-[0_10px_30px_rgba(244,63,94,0.3)]',
      text: 'text-white',
      icon: (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.4 }}
          className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/40"
        >
          <XCircle className="w-5 h-5 text-rose-400" />
        </motion.div>
      ),
      defaultTitle: 'Hata Oluştu'
    },
    info: {
      bg: 'bg-[#1A1A1A]/95 border-sky-500 shadow-[0_10px_30px_rgba(14,165,233,0.3)]',
      text: 'text-white',
      icon: (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.4 }}
          className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500/40"
        >
          <AlertCircle className="w-5 h-5 text-sky-400" />
        </motion.div>
      ),
      defaultTitle: 'Bilgilendirme'
    }
  }[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-6 right-6 z-[110] max-w-sm w-full font-inter pointer-events-auto select-none"
        >
          <div className={`p-4 rounded-xs border backdrop-blur-lg flex items-start gap-3.5 relative overflow-hidden ${config.bg} ${config.text}`}>
            {config.icon}

            <div className="flex-1 text-xs pr-2">
              <h4 className="font-playfair font-semibold text-sm text-[#C5A572] mb-0.5 tracking-wide">
                {title || config.defaultTitle}
              </h4>
              <p className="text-gray-200 leading-relaxed text-xs">
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Countdown Progress Bar */}
            {duration > 0 && (
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#C5A572] to-[#D4BA8A]"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
