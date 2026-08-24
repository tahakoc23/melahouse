'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SizeGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SizeGuide({ isOpen: controlledIsOpen, onClose }: SizeGuideProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = controlledIsOpen !== undefined;
  const showModal = isControlled ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalIsOpen(false);
    }
  };

  return (
    <>
      {!isControlled && (
        <button 
          type="button"
          onClick={() => setInternalIsOpen(true)}
          className="text-xs text-gray-500 underline hover:text-black transition-colors cursor-pointer"
        >
          Beden Tablosu
        </button>
      )}

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-[#FAFAF8] p-6 md:p-8 z-50 shadow-2xl border border-gray-100 rounded-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-playfair text-2xl text-[#1A1A1A]">Beden Ölçü Tablosu</h3>
                <button 
                  type="button"
                  onClick={handleClose} 
                  className="text-gray-400 hover:text-black p-1 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="overflow-x-auto font-inter">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 text-[#1A1A1A] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Beden</th>
                      <th className="py-3 px-4 font-semibold">Göğüs (cm)</th>
                      <th className="py-3 px-4 font-semibold">Bel (cm)</th>
                      <th className="py-3 px-4 font-semibold">Kalça (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    <tr><td className="py-3 px-4 font-medium">XS</td><td className="py-3 px-4">82-86</td><td className="py-3 px-4">62-66</td><td className="py-3 px-4">88-92</td></tr>
                    <tr><td className="py-3 px-4 font-medium">S</td><td className="py-3 px-4">86-90</td><td className="py-3 px-4">66-70</td><td className="py-3 px-4">92-96</td></tr>
                    <tr><td className="py-3 px-4 font-medium">M</td><td className="py-3 px-4">90-94</td><td className="py-3 px-4">70-74</td><td className="py-3 px-4">96-100</td></tr>
                    <tr><td className="py-3 px-4 font-medium">L</td><td className="py-3 px-4">94-98</td><td className="py-3 px-4">74-78</td><td className="py-3 px-4">100-104</td></tr>
                    <tr><td className="py-3 px-4 font-medium">XL</td><td className="py-3 px-4">98-102</td><td className="py-3 px-4">78-82</td><td className="py-3 px-4">104-108</td></tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
