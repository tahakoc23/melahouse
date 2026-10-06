'use client'

/**
 * Ana sayfa önizlemeleri (İçerik sayfası). Mağazadaki bileşenlerin küçük ölçekli
 * kopyasıdır; yazı tipleri mağazayla aynı olsun diye burada font-display kullanılır.
 */

import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { getMediaType } from '@/components/admin/ImageUploader'

export interface SlideDraft {
  key: string
  title: string
  subtitle: string
  button_text: string
  button_link: string
  media_url: string
}

export interface LookbookDraft {
  title: string
  description: string
  button_text: string
  button_link: string
  media_url: string
}

export const isVideoUrl = (url: string) => !!url && getMediaType(url) !== 'image'

function Media({ url, className }: { url: string; className?: string }) {
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-[#2A2326] text-white/40 ${className || ''}`}>
        <ImageOff className="h-6 w-6" aria-label="Görsel yok" />
      </div>
    )
  }
  if (isVideoUrl(url)) {
    return <video src={url} muted playsInline loop autoPlay className={`object-cover ${className || ''}`} />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={`object-cover ${className || ''}`} />
}

export function HeroPreview({ slide, index, total }: { slide: SlideDraft | undefined; index: number; total: number }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-ink text-white">
      {slide && <Media url={slide.media_url} className="absolute inset-0 h-full w-full object-[50%_30%]" />}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-ink/30" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <div className="min-w-0 max-w-[75%]">
          {slide?.subtitle && <p className="mb-1.5 truncate text-[8px] uppercase tracking-[0.28em] text-white/80">{slide.subtitle}</p>}
          <p className="line-clamp-2 font-display text-lg italic leading-tight">{slide?.title || 'Başlık'}</p>
          {slide?.button_text && (
            <span className="mt-2 inline-flex items-center gap-2 bg-white px-3 py-1.5 text-[8px] uppercase tracking-[0.28em] text-ink">
              {slide.button_text}
              <span aria-hidden className="block h-px w-3 bg-current" />
            </span>
          )}
        </div>
        {total > 1 && (
          <span className="shrink-0 font-display text-[11px] tabular-nums">
            {String(index + 1).padStart(2, '0')}
            <span className="text-white/50"> / {String(total).padStart(2, '0')}</span>
          </span>
        )}
      </div>
    </div>
  )
}

export function AnnouncementPreview({ messages }: { messages: string[] }) {
  const list = messages.map(m => m.trim()).filter(Boolean)
  const [i, setI] = useState(0)
  useEffect(() => {
    if (list.length <= 1) return
    const t = setInterval(() => setI(prev => prev + 1), 3000)
    return () => clearInterval(t)
  }, [list.length])
  const current = list.length ? list[i % list.length] : ''
  return (
    <div className="overflow-hidden rounded-md border border-[#E7E3DE]">
      <div className="flex h-8 items-center justify-center bg-murdum px-4" aria-live="polite">
        <p className="truncate text-[10px] uppercase tracking-[0.22em] text-white/90">{current || 'Duyuru yok'}</p>
      </div>
      <div className="flex h-12 items-center justify-between bg-white px-4">
        <span className="h-2 w-10 rounded bg-[#ECE6DF]" />
        <span className="font-display text-sm tracking-[0.2em] text-ink">MELA HOUSE</span>
        <span className="h-2 w-10 rounded bg-[#ECE6DF]" />
      </div>
    </div>
  )
}

export function LookbookPreview({ data }: { data: LookbookDraft }) {
  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-md bg-murdum text-white">
      <div className="relative col-span-2 aspect-[4/5]">
        <Media url={data.media_url} className="absolute inset-0 h-full w-full" />
      </div>
      <div className="col-span-3 flex flex-col justify-center gap-2 p-4">
        <p className="text-[8px] uppercase tracking-[0.28em] text-white/70">Felsefemiz</p>
        <p className="line-clamp-3 font-display text-xl italic leading-[1]">{data.title || 'Başlık'}</p>
        <p className="line-clamp-4 text-[10px] leading-relaxed text-white/75">{data.description}</p>
        <p className="mt-1 text-[8px] uppercase tracking-[0.28em] underline underline-offset-4">Hikayemiz</p>
      </div>
    </div>
  )
}
