'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';

const DEFAULT_MESSAGES = [
  `${new Intl.NumberFormat('tr-TR').format(FREE_SHIPPING_THRESHOLD)} TL ve üzeri siparişlerde ücretsiz kargo`,
  'Teslimattan itibaren 14 gün içinde iade',
];

export default function AnnouncementBar() {
  const [messages, setMessages] = useState<string[]>(DEFAULT_MESSAGES);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Admin'de content_type = 'announcement' kayıt varsa onlar gösterilir
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('site_content')
      .select('title, content, sort_order')
      .eq('content_type', 'announcement')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const msgs = (data || [])
          .map((d: { title: string | null; content: string | null }) => d.title || d.content || '')
          .filter(Boolean);
        if (msgs.length > 0) setMessages(msgs);
      });
  }, []);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => setCurrentIndex(prev => (prev + 1) % messages.length), 4500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="bg-murdum text-white/90 h-8 flex items-center justify-center overflow-hidden" role="region" aria-label="Duyurular">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
          className="eyebrow !text-[10px] !tracking-[0.22em] text-center px-4 truncate"
        >
          {messages[currentIndex % messages.length]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
