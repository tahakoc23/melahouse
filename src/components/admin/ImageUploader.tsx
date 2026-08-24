// @ts-nocheck
'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { X, Upload, Film, Link as LinkIcon, Plus, GripVertical, Video, ExternalLink } from 'lucide-react'

interface ImageUploaderProps {
  bucket: string
  folder?: string
  onUploadSuccess: (urls: string[]) => void
  onReorder?: (urls: string[]) => void
  existingImages?: string[]
  onRemoveImage?: (url: string) => void
  maxFiles?: number
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

export function getInstagramEmbedUrl(url: string): string | null {
  try {
    const match = url.match(/instagram\.com\/(reel|p)\/([^/?#]+)/i);
    if (match && match[2]) {
      return `https://www.instagram.com/${match[1]}/${match[2]}/embed`;
    }
  } catch (e) {}
  return null;
}

export function getYoutubeEmbedUrl(url: string): string | null {
  try {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    }
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  } catch (e) {}
  return null;
}

export function getMediaType(url: string): 'image' | 'video' | 'instagram' | 'youtube' {
  if (!url) return 'image';
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com/reel/') || lower.includes('instagram.com/p/')) {
    return 'instagram';
  }
  if (lower.includes('youtube.com/watch') || lower.includes('youtu.be/')) {
    return 'youtube';
  }
  if (
    url.startsWith('data:video/') || 
    url.startsWith('blob:') ||
    lower.endsWith('.mp4') || 
    lower.endsWith('.webm') || 
    lower.endsWith('.mov') || 
    lower.endsWith('.avi') ||
    lower.includes('/video') ||
    lower.includes('video/')
  ) {
    return 'video';
  }
  return 'image';
}

export function isVideoUrl(url: string): boolean {
  const type = getMediaType(url);
  return type === 'video' || type === 'instagram' || type === 'youtube';
}

export default function ImageUploader({ 
  bucket, 
  folder = '', 
  onUploadSuccess, 
  onReorder,
  existingImages = [],
  onRemoveImage,
  maxFiles = 10
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [customUrl, setCustomUrl] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const supabase = createClient()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setProgress(0)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const filePath = folder ? `${folder}/${fileName}` : fileName

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg')
          })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)
          uploadedUrls.push(publicUrl)
        } else {
          console.error('Upload error:', uploadError)
          alert('Dosya yüklenirken hata oluştu: ' + uploadError.message)
        }

        setProgress(Math.round(((i + 1) / acceptedFiles.length) * 100))
      }

      if (uploadedUrls.length > 0) {
        onUploadSuccess(uploadedUrls)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      alert('Medya yüklenirken bir hata oluştu: ' + (error.message || error))
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [bucket, folder, onUploadSuccess, supabase])

  const handleAddCustomUrl = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = customUrl.trim();
    if (!trimmed) return;
    onUploadSuccess([trimmed]);
    setCustomUrl('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleAddCustomUrl(e);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi']
    },
    maxFiles: maxFiles - existingImages.length,
    disabled: uploading || existingImages.length >= maxFiles
  })

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newImages = [...existingImages]
    const [draggedItem] = newImages.splice(draggedIndex, 1)
    newImages.splice(dropIndex, 0, draggedItem)

    setDraggedIndex(null)
    if (onReorder) {
      onReorder(newImages)
    }
  }

  return (
    <div className="space-y-4 font-inter">
      {/* Custom Video / Instagram / Image URL Paste Box */}
      <div className="bg-gray-50/80 p-3 rounded-xs border border-gray-200 space-y-2">
        <label className="block text-xs font-semibold text-[#1A1A1A]">
          Video Linki veya Görsel URL Yapıştırarak Ekle (Instagram Reel, YouTube, MP4 URL)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://instagram.com/reel/..., https://youtube.com/... veya https://.../video.mp4"
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#C5A572]"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCustomUrl}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white text-xs font-semibold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ekle</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop File Upload Area */}
      {existingImages.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xs p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-[#C5A572] bg-amber-50/50' : 'border-gray-300 hover:border-[#C5A572] bg-white'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-[#C5A572] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Upload className="w-5 h-5 text-[#C5A572]" />
              )}
            </div>
            <div className="text-xs">
              <span className="font-semibold text-[#1A1A1A]">Bilgisayardan Fotoğraf veya Video Yükle</span>
              <span className="text-gray-500"> (Sürükleyin veya Tıklayın)</span>
            </div>
            <p className="text-[10px] text-gray-400">PNG, JPG, WEBP, MP4, MOV, WEBM (Maks. {maxFiles - existingImages.length} dosya)</p>
          </div>
          {uploading && (
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#C5A572] h-1.5 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>
      )}

      {/* Uploaded Media Thumbnails Grid */}
      {existingImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
            <span>Yüklenen Medyalar ({existingImages.length}/{maxFiles})</span>
            <span className="text-[10px] text-gray-400">Sürükleyerek sıralamayı değiştirebilirsiniz</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {existingImages.map((url, index) => {
              const mediaType = getMediaType(url);
              const isVid = isVideoUrl(url);

              return (
                <div
                  key={url + index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`relative aspect-[3/4] bg-[#FAFAF8] rounded-xs border overflow-hidden group cursor-move ${
                    draggedIndex === index ? 'opacity-40 border-dashed border-[#C5A572]' : 'border-gray-200 shadow-xs'
                  }`}
                >
                  <div className="absolute top-1 left-1 z-10 p-1 bg-black/50 text-white rounded-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-3 h-3" />
                  </div>

                  {index === 0 && (
                    <span className="absolute top-1 right-1 z-10 bg-[#C5A572] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wider shadow-xs">
                      Kapak
                    </span>
                  )}

                  {isVid ? (
                    <div className="relative w-full h-full bg-black flex items-center justify-center">
                      {mediaType === 'video' ? (
                        <video 
                          src={`${url}#t=0.1`} 
                          className="w-full h-full object-cover" 
                          muted 
                          playsInline 
                          preload="metadata" 
                        />
                      ) : (
                        <div className="text-center p-2 space-y-1">
                          {mediaType === 'instagram' ? (
                            <InstagramIcon className="w-6 h-6 text-pink-400 mx-auto" />
                          ) : (
                            <Video className="w-6 h-6 text-red-500 mx-auto" />
                          )}
                          <span className="text-[10px] text-gray-300 block font-semibold truncate max-w-[100px]">
                            {mediaType === 'instagram' ? 'Reel Video' : 'YouTube Video'}
                          </span>
                        </div>
                      )}
                      
                      <span className="absolute bottom-1 left-1 bg-[#C5A572] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wider flex items-center gap-1 shadow-xs z-10">
                        <Film className="w-3 h-3" /> Video
                      </span>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={url} alt={`Media ${index + 1}`} className="w-full h-full object-cover" />
                  )}

                  {onRemoveImage && (
                    <button
                      type="button"
                      onClick={() => onRemoveImage(url)}
                      className="absolute bottom-1 right-1 z-10 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xs shadow-xs transition-colors cursor-pointer"
                      title="Medyayı Sil"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
