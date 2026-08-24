'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ChevronLeft, ChevronRight, Play, Film, Video } from 'lucide-react';
import { isVideoUrl, getMediaType, getYoutubeEmbedUrl } from '@/components/admin/ImageUploader';

interface ProductGalleryProps {
  images: { id: string; image_url: string; alt_text?: string }[];
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function ExternalLinkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );
}

export default function ProductGallery({ images }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) {
    return <div className="aspect-[3/4] w-full bg-gray-100 flex items-center justify-center font-inter text-gray-400">Görsel Yok</div>;
  }

  const currentMediaUrl = images[currentIndex]?.image_url || '';
  const mediaType = getMediaType(currentMediaUrl);
  const isVid = isVideoUrl(currentMediaUrl);
  const ytEmbed = mediaType === 'youtube' ? getYoutubeEmbedUrl(currentMediaUrl) : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isVid) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    });
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row gap-4 font-inter">
        {/* Thumbnails Strip */}
        <div className="flex md:flex-col gap-3 md:w-24 overflow-x-auto md:overflow-y-auto no-scrollbar">
          {images.map((image, index) => {
            const itemType = getMediaType(image.image_url);
            const itemIsVid = isVideoUrl(image.image_url);
            const videoThumbUrl = itemType === 'video' ? `${image.image_url}#t=0.1` : '';

            return (
              <button
                type="button"
                key={image.id || index}
                onClick={() => setCurrentIndex(index)}
                className={`relative aspect-[3/4] w-20 md:w-full flex-shrink-0 border-2 transition-all cursor-pointer overflow-hidden rounded-xs bg-[#FAFAF8] ${
                  index === currentIndex ? 'border-[#C5A572] shadow-sm ring-1 ring-[#C5A572]' : 'border-gray-200 hover:border-gray-300 opacity-75 hover:opacity-100'
                }`}
              >
                {itemIsVid ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                    {itemType === 'video' ? (
                      <video 
                        src={videoThumbUrl} 
                        className="w-full h-full object-cover" 
                        muted 
                        playsInline 
                        preload="metadata" 
                      />
                    ) : null}
                    
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white z-10">
                      {itemType === 'instagram' ? (
                        <InstagramIcon className="w-5 h-5 text-pink-400" />
                      ) : itemType === 'youtube' ? (
                        <Video className="w-5 h-5 text-red-500" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#C5A572] flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      )}
                    </span>
                  </div>
                ) : (
                  <Image
                    unoptimized
                    src={image.image_url}
                    alt={image.alt_text || 'Thumbnail'}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Main Image / Video Container */}
        <div 
          ref={containerRef}
          onClick={() => !isVid && setIsLightboxOpen(true)}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => !isVid && setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setZoomPos({ x: 50, y: 50 });
          }}
          className={`relative aspect-[3/4] flex-1 bg-[#FAFAF8] overflow-hidden group rounded-xs border border-gray-200 select-none ${
            isVid ? 'cursor-default' : 'cursor-zoom-in'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {mediaType === 'instagram' ? (
                <div className="relative w-full h-full bg-[#1A1A1A] text-white flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-lg animate-pulse">
                    <div className="w-full h-full bg-[#1A1A1A] rounded-[14px] flex items-center justify-center">
                      <InstagramIcon className="w-8 h-8 text-pink-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold text-xs uppercase tracking-widest">
                      INSTAGRAM REEL VİDEOSU
                    </span>
                    <h4 className="font-playfair text-lg font-semibold text-white">Veloria Özel Koleksiyon Videosu</h4>
                  </div>

                  <a 
                    href={currentMediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white font-medium text-xs px-6 py-2.5 rounded-xs flex items-center gap-2 transition-all shadow-md cursor-pointer hover:scale-105"
                  >
                    <span>Instagram'da İzle (Reel)</span>
                    <ExternalLinkIcon className="w-4 h-4" />
                  </a>
                </div>
              ) : mediaType === 'youtube' && ytEmbed ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <iframe 
                    src={ytEmbed} 
                    className="w-full h-full border-0" 
                    title="YouTube Video" 
                    allowFullScreen 
                  />
                  <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 z-20 pointer-events-none">
                    <Video className="w-4 h-4" /> YouTube Video
                  </span>
                </div>
              ) : mediaType === 'video' ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video 
                    src={currentMediaUrl} 
                    controls 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    preload="metadata"
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute top-3 left-3 bg-[#C5A572] text-white text-xs font-bold px-2.5 py-1 rounded-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 z-20 pointer-events-none">
                    <Film className="w-4 h-4" /> Ürün Videosu
                  </span>
                </div>
              ) : (
                <Image
                  unoptimized
                  src={currentMediaUrl}
                  alt={images[currentIndex]?.alt_text || 'Product Image'}
                  fill
                  className="object-cover pointer-events-none"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={currentIndex === 0}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* 2.5x Magnified Zoom Layer for Desktop Hover (Images Only) */}
          {!isVid && (
            <div 
              className="hidden md:block absolute inset-0 pointer-events-none transition-opacity duration-150 ease-out z-10"
              style={{
                opacity: isHovered ? 1 : 0,
                backgroundImage: `url("${currentMediaUrl}")`,
                backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                backgroundSize: '250%',
                backgroundRepeat: 'no-repeat'
              }}
            />
          )}

          {/* Circle Target Cursor Line Overlay for Desktop (Images Only) */}
          {!isVid && isHovered && (
            <div 
              className="hidden md:block absolute w-20 h-20 border border-[#C5A572]/60 bg-[#C5A572]/10 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 shadow-lg backdrop-blur-[1px] z-20"
              style={{
                left: `${zoomPos.x}%`,
                top: `${zoomPos.y}%`
              }}
            />
          )}

          {/* Mobile Zoom Icon Badge */}
          {!isVid && (
            <div className="md:hidden absolute bottom-3 right-3 bg-black/60 text-white p-2 rounded-full backdrop-blur-xs">
              <ZoomIn className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && !isVid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 font-inter"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 z-[110] text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              aria-label="Kapat"
            >
              <X className="w-7 h-7" />
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-[110] text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                  aria-label="Önceki"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-[110] text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                  aria-label="Sonraki"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Lightbox Image Container */}
            <div 
              className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                unoptimized
                src={currentMediaUrl}
                alt="Product High Res Lightbox"
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
