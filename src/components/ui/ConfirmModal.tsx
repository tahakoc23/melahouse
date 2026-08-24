"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, HelpCircle, X, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title = "İşlem Onayı",
  message,
  confirmText = "Onayla",
  cancelText = "Vazgeç",
  type = 'warning',
  isLoading = false,
  onConfirm,
  onClose
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const typeConfig = {
    warning: {
      icon: <HelpCircle className="w-8 h-8 text-[#C5A572]" />,
      btnBg: 'bg-[#1A1A1A] hover:bg-[#C5A572] text-white',
    },
    danger: {
      icon: <AlertTriangle className="w-8 h-8 text-rose-500" />,
      btnBg: 'bg-rose-700 hover:bg-rose-800 text-white',
    },
    info: {
      icon: <CheckCircle2 className="w-8 h-8 text-sky-500" />,
      btnBg: 'bg-[#1A1A1A] hover:bg-sky-700 text-white',
    }
  }[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-inter text-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white rounded-xs border border-gray-200 max-w-sm w-full p-6 space-y-4 shadow-2xl relative"
          >
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-2 pt-2">
              <div className="p-3 bg-gray-50 rounded-full border border-gray-100 mb-1">
                {typeConfig.icon}
              </div>
              <h3 className="font-playfair font-semibold text-lg text-[#1A1A1A]">
                {title}
              </h3>
              <p className="text-gray-600 text-xs leading-relaxed px-2">
                {message}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xs text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 py-2.5 px-4 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${typeConfig.btnBg}`}
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
