'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ArrowRight, Film, ImagePlus, Link as LinkIcon, Loader2, Star, Video, X } from 'lucide-react'

interface ImageUploaderProps {
  bucket: string
  folder?: string
  onUploadSuccess: (urls: string[]) => void
  onReorder?: (urls: string[]) => void
  existingImages?: string[]
  onRemoveImage?: (url: string) => void
  maxFiles?: number
  /** İsteğe bağlı: görsel başına alternatif metin (erişilebilirlik / SEO) */
  altTexts?: Record<string, string>
  onAltTextChange?: (url: string, alt: string) => void
}

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  )
}

export function getInstagramEmbedUrl(url: string): string | null {
  try {
    const match = url.match(/instagram\.com\/(reel|p)\/([^/?#]+)/i)
    if (match && match[2]) {
      return `https://www.instagram.com/${match[1]}/${match[2]}/embed`
    }
  } catch {}
  return null
}

export function getYoutubeEmbedUrl(url: string): string | null {
  try {
    let videoId = ''
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0]
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0]
    }
    if (videoId) return `https://www.youtube.com/embed/${videoId}`
  } catch {}
  return null
}

const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v', 'ogv', 'avi']

const MIME_EXTENSION: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/** Lower-cased file extension of a URL's path (ignores query string and hash). */
function getUrlExtension(url: string): string {
  let path = url
  try {
    path = new URL(url).pathname
  } catch {
    path = url.split(/[?#]/)[0]
  }
  const last = path.split('/').pop() || ''
  const dot = last.lastIndexOf('.')
  return dot >= 0 ? last.slice(dot + 1).toLowerCase() : ''
}

export function getMediaType(url: string): 'image' | 'video' | 'instagram' | 'youtube' {
  if (!url) return 'image'
  const lower = url.toLowerCase()
  if (lower.includes('instagram.com/reel/') || lower.includes('instagram.com/p/')) {
    return 'instagram'
  }
  if (lower.includes('youtube.com/watch') || lower.includes('youtu.be/')) {
    return 'youtube'
  }
  // Decide by MIME (data URLs) or by the real file extension — never by a
  // "video" substring, which matched folder/product names like ".../video-elbise.jpg".
  if (lower.startsWith('data:video/')) return 'video'
  if (VIDEO_EXTENSIONS.includes(getUrlExtension(url))) return 'video'
  return 'image'
}

export function isVideoUrl(url: string): boolean {
  const type = getMediaType(url)
  return type === 'video' || type === 'instagram' || type === 'youtube'
}

const MAX_FILE_MB = 50

export default function ImageUploader({
  bucket,
  folder = '',
  onUploadSuccess,
  onReorder,
  existingImages = [],
  onRemoveImage,
  maxFiles = 10,
  altTexts,
  onAltTextChange,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [customUrl, setCustomUrl] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  // Always call the latest callback / see the latest count, even when an
  // upload started several renders ago (avoids stale-closure overwrites).
  const onUploadSuccessRef = useRef(onUploadSuccess)
  const existingCountRef = useRef(existingImages.length)
  useEffect(() => {
    onUploadSuccessRef.current = onUploadSuccess
    existingCountRef.current = existingImages.length
  })

  const remainingSlots = Math.max(0, maxFiles - existingImages.length)
  const single = maxFiles === 1

  const onDrop = useCallback(
    async (droppedFiles: File[]) => {
      setError(null)
      const slots = Math.max(0, maxFiles - existingCountRef.current)
      const tooBig = droppedFiles.filter(f => f.size > MAX_FILE_MB * 1024 * 1024)
      const candidates = droppedFiles.filter(f => f.size <= MAX_FILE_MB * 1024 * 1024)
      const acceptedFiles = candidates.slice(0, slots)
      const notes: string[] = []
      if (tooBig.length) notes.push(`${tooBig.length} dosya ${MAX_FILE_MB} MB’tan büyük olduğu için atlandı.`)
      if (candidates.length > slots) notes.push(`En fazla ${maxFiles} medya eklenebilir; ${candidates.length - slots} dosya atlandı.`)
      if (acceptedFiles.length === 0) {
        if (notes.length) setError(notes.join(' '))
        return
      }

      setUploading(true)
      setProgress(0)
      const uploadedUrls: string[] = []

      try {
        for (let i = 0; i < acceptedFiles.length; i++) {
          const file = acceptedFiles[i]
          const nameExt = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
          const fileExt = nameExt || MIME_EXTENSION[file.type] || 'bin'
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
          const filePath = folder ? `${folder}/${fileName}` : fileName
          const isVideoFile = file.type.startsWith('video/') || VIDEO_EXTENSIONS.includes(fileExt)

          const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || (isVideoFile ? 'video/mp4' : 'image/jpeg'),
          })

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from(bucket).getPublicUrl(filePath)
            uploadedUrls.push(publicUrl)
          } else {
            console.error('Upload error:', uploadError)
            notes.push(`“${file.name}” yüklenemedi: ${uploadError.message}`)
          }

          setProgress(Math.round(((i + 1) / acceptedFiles.length) * 100))
        }

        if (uploadedUrls.length > 0) {
          onUploadSuccessRef.current(uploadedUrls)
        }
      } catch (err) {
        console.error('Upload error:', err)
        notes.push(`Yükleme yarıda kaldı: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setUploading(false)
        setProgress(0)
        if (notes.length) setError(notes.join(' '))
      }
    },
    [bucket, folder, maxFiles, supabase],
  )

  const handleAddCustomUrl = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const trimmed = customUrl.trim()
    if (!trimmed) return
    if (existingImages.length >= maxFiles) {
      setError(`En fazla ${maxFiles} medya eklenebilir. Yeni eklemek için önce birini kaldırın.`)
      return
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      setError('http:// veya https:// ile başlayan bir bağlantı yapıştırın.')
      return
    }
    if (existingImages.includes(trimmed)) {
      setError('Bu bağlantı zaten ekli.')
      return
    }
    setError(null)
    onUploadSuccess([trimmed])
    setCustomUrl('')
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi'],
    },
    disabled: uploading || remainingSlots === 0,
  })

  const move = (from: number, to: number) => {
    if (!onReorder || to < 0 || to >= existingImages.length || from === to) return
    const next = [...existingImages]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onReorder(next)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null) return
    move(draggedIndex, dropIndex)
    setDraggedIndex(null)
  }

  const iconBtn =
    'flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-ink shadow-sm hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-40 cursor-pointer'

  return (
    <div className="space-y-4">
      {existingImages.length > 0 && (
        <div>
          {!single && existingImages.length > 1 && onReorder && (
            <p className="mb-2 text-xs text-kul">İlk görsel kapak olur. Sürükleyerek ya da oklarla sırayı değiştirin.</p>
          )}
          <ul className={single ? 'grid max-w-[220px] grid-cols-1 gap-3' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'}>
            {existingImages.map((url, index) => {
              const mediaType = getMediaType(url)
              const isVid = isVideoUrl(url)
              return (
                <li key={url} className="space-y-1.5">
                  <div
                    draggable={!!onReorder && !single}
                    onDragStart={e => {
                      setDraggedIndex(index)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={e => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={e => handleDrop(e, index)}
                    onDragEnd={() => setDraggedIndex(null)}
                    className={`group relative aspect-[3/4] overflow-hidden rounded-md border bg-[#F7F6F4] ${
                      draggedIndex === index ? 'border-dashed border-ink opacity-40' : 'border-[#E7E3DE]'
                    } ${onReorder && !single ? 'cursor-move' : ''}`}
                  >
                    {index === 0 && !single && (
                      <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white">Kapak</span>
                    )}

                    {isVid ? (
                      <div className="relative flex h-full w-full items-center justify-center bg-ink">
                        {mediaType === 'video' ? (
                          <video src={`${url}#t=0.1`} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                        ) : (
                          <div className="space-y-1 p-2 text-center text-white/80">
                            {mediaType === 'instagram' ? <InstagramIcon className="mx-auto h-6 w-6" /> : <Video className="mx-auto h-6 w-6" aria-hidden />}
                            <span className="block text-xs">{mediaType === 'instagram' ? 'Instagram videosu' : 'YouTube videosu'}</span>
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink">
                          <Film className="h-3 w-3" aria-hidden /> Video
                        </span>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={url} alt={altTexts?.[url] || `Görsel ${index + 1}`} className="h-full w-full object-cover" />
                    )}

                    <div className="absolute right-1.5 top-1.5 z-10 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                      {onRemoveImage && (
                        <button type="button" onClick={() => onRemoveImage(url)} className={iconBtn} aria-label={`Görsel ${index + 1}’i kaldır`} title="Kaldır">
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
                    {onReorder && !single && existingImages.length > 1 && (
                      <div className="absolute inset-x-1.5 bottom-1.5 z-10 flex justify-between gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                        <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} className={iconBtn} aria-label={`Görsel ${index + 1}’i sola taşı`}>
                          <ArrowLeft className="h-4 w-4" aria-hidden />
                        </button>
                        {index !== 0 && (
                          <button
                            type="button"
                            onClick={() => move(index, 0)}
                            className={`${iconBtn} w-auto gap-1 px-2 text-[11px] font-medium`}
                            aria-label={`Görsel ${index + 1}’i kapak yap`}
                          >
                            <Star className="h-3.5 w-3.5" aria-hidden /> Kapak yap
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => move(index, index + 1)}
                          disabled={index === existingImages.length - 1}
                          className={iconBtn}
                          aria-label={`Görsel ${index + 1}’i sağa taşı`}
                        >
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    )}
                  </div>
                  {onAltTextChange && !isVid && (
                    <input
                      type="text"
                      value={altTexts?.[url] || ''}
                      onChange={e => onAltTextChange(url, e.target.value)}
                      placeholder="Alt metin (isteğe bağlı)"
                      aria-label={`Görsel ${index + 1} alt metni`}
                      className="h-8 w-full rounded-md border border-[#DCD6CF] bg-white px-2 text-xs text-ink placeholder:text-[#A8A19A] focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {existingImages.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-7 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
            isDragActive ? 'border-ink bg-[#F1EEEA]' : 'border-[#CFC8C0] bg-[#FAF9F7] hover:border-ink'
          } ${uploading ? 'cursor-wait opacity-70' : ''}`}
        >
          <input {...getInputProps()} aria-label="Bilgisayardan görsel veya video seç" />
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-sm">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ImagePlus className="h-5 w-5" aria-hidden />}
          </span>
          <p className="text-sm font-medium text-ink">
            {uploading ? `Yükleniyor… %${progress}` : isDragActive ? 'Bırakın, yükleyelim' : 'Görselleri buraya sürükleyin ya da tıklayıp seçin'}
          </p>
          <p className="mt-1 text-xs text-kul">
            JPG, PNG, WEBP veya MP4 · en fazla {MAX_FILE_MB} MB · {remainingSlots} yer kaldı
          </p>
          {uploading && (
            <div className="mt-3 h-1 w-full max-w-xs overflow-hidden rounded-full bg-[#E7E3DE]">
              <div className="h-1 bg-ink transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {existingImages.length < maxFiles && (
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor={`url-${bucket}-${folder}`}>
            Ya da bağlantı yapıştırın
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kul" aria-hidden />
              <input
                id={`url-${bucket}-${folder}`}
                type="url"
                inputMode="url"
                value={customUrl}
                onChange={e => {
                  setCustomUrl(e.target.value)
                  setError(null)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCustomUrl(e)
                }}
                placeholder="Görsel, MP4, Instagram Reel veya YouTube linki"
                className="h-10 w-full rounded-md border border-[#DCD6CF] bg-white pl-9 pr-3 text-sm text-ink placeholder:text-[#A8A19A] focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCustomUrl}
              disabled={!customUrl.trim()}
              className="inline-flex h-10 items-center rounded-md border border-[#DCD6CF] bg-white px-4 text-sm font-medium text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Ekle
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          {error}
        </p>
      )}
    </div>
  )
}
