"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  velocityX: number;
  velocityY: number;
  shape: 'square' | 'circle' | 'sparkle';
}

const GOLD_COLORS = [
  '#C5A572',
  '#D4BA8A',
  '#E6CA94',
  '#A68B5B',
  '#1A1A1A',
  '#F3E5AB',
  '#FFD700',
  '#FFF'
];

export function LuxuryConfetti({ active = false, duration = 4000 }: { active?: boolean; duration?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(active);

  useEffect(() => {
    if (!active) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    // Generate 60 gold & luxury particles
    const newParticles: Particle[] = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage across screen
      y: -10 - Math.random() * 20, // initial top offset
      size: Math.random() * 10 + 6,
      color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
      rotation: Math.random() * 360,
      velocityX: (Math.random() - 0.5) * 80,
      velocityY: Math.random() * 400 + 300,
      shape: i % 3 === 0 ? 'sparkle' : i % 2 === 0 ? 'circle' : 'square'
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[120] overflow-hidden select-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: '-5vh',
            rotate: p.rotation,
            opacity: 1,
            scale: 0.2
          }}
          animate={{
            x: `${p.x + (p.velocityX > 0 ? 15 : -15)}vw`,
            y: '105vh',
            rotate: p.rotation + 720,
            opacity: [0, 1, 1, 0.8, 0],
            scale: [0.2, 1, 1.2, 0.8, 0.4]
          }}
          transition={{
            duration: Math.random() * 2 + 2.5,
            ease: [0.25, 0.1, 0.25, 1],
            delay: Math.random() * 0.4
          }}
          style={{
            position: 'absolute',
            width: p.shape === 'sparkle' ? p.size * 1.5 : p.size,
            height: p.shape === 'sparkle' ? p.size * 1.5 : p.size,
            backgroundColor: p.shape === 'sparkle' ? 'transparent' : p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            boxShadow: `0 0 10px ${p.color}`
          }}
        >
          {p.shape === 'sparkle' && (
            <svg viewBox="0 0 24 24" fill={p.color} className="w-full h-full drop-shadow-md">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
}
