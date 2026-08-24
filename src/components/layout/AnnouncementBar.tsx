'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function AnnouncementBar() {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('content_value')
        .like('content_key', 'announcement%');

      if (!error && data) {
        const msgs = data.map((d: any) => d.content_value);
        setMessages(msgs.length > 0 ? msgs : ['Ücretsiz Kargo - 1000 TL Üzeri Siparişlerde']);
      } else {
        setMessages(['Ücretsiz Kargo - 1000 TL Üzeri Siparişlerde']);
      }
    };
    fetchAnnouncements();
  }, [supabase]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Hide on homepage ('/') or if dismissed / empty
  if (!isVisible || messages.length === 0 || pathname === '/') return null;

  return (
    <div className="bg-black text-[#C5A572] text-xs md:text-sm font-medium py-2 px-4 relative z-50">
      <div className="container mx-auto max-w-7xl flex items-center justify-center relative h-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="absolute text-center px-8"
          >
            {messages[currentIndex]}
          </motion.div>
        </AnimatePresence>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[#C5A572] hover:text-white transition-colors cursor-pointer"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
