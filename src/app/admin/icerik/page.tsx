// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ImageUploader from '@/components/admin/ImageUploader'
import AdminNotificationModal from '@/components/ui/AdminNotificationModal'
import { Save, Plus, Trash2, Layout, Megaphone, Image as ImageIcon, BookOpen } from 'lucide-react'

export default function AdminContentPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'slider' | 'announcement' | 'banner' | 'lookbook'>('slider')

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  })

  // Hero Slider State (Ana Sayfa Dönen Manşet Görselleri)
  const [slides, setSlides] = useState<any[]>([
    {
      id: 'slide-1',
      title: 'ZAMANSIZ LÜKS & İPEK KOLEKSİYONU',
      subtitle: 'MELA HOUSE 2026 Özel Gece ve Abiye Tasarımları',
      button_text: 'KOLEKSİYONU KEŞFET',
      button_link: '/urunler',
      media_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop'
    }
  ])

  // Announcement Bar State (Sitenin En Üst Duyuru Bantı)
  const [announcements, setAnnouncements] = useState<string[]>([
    'Ücretsiz Kargo — 1000 TL Üzeri Siparişlerde',
    'MELA HOUSE Lüks Kadın Giyim — Yeni Sezon Koleksiyonu Yayında'
  ])

  // Lookbook State (Marka Hikayesi ve Editoryal Görsel)
  const [lookbook, setLookbook] = useState({
    title: 'İtalyan İpeği & El İşçiliği Zarafeti',
    description: 'MELA HOUSE, her bir dikişinde yüksek terzilik sanatını ve zamansız kadın zarafetini buluşturuyor. Özel geceleriniz ve davetleriniz için tasarlanan siluetler...',
    button_text: 'HİKAYEMİZİ KEŞFET',
    button_link: '/hakkimizda',
    media_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop'
  })

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const { data } = await supabase.from('site_content' as any).select('*')
      if (data && data.length > 0) {
        const sliderItems = data.filter((d: any) => d.content_type === 'slider')
        if (sliderItems.length > 0) {
          setSlides(sliderItems.map((s: any) => ({
            id: s.id,
            title: s.title || '',
            subtitle: s.subtitle || '',
            button_text: s.button_text || 'KEŞFET',
            button_link: s.button_link || '/urunler',
            media_url: s.image_url || ''
          })))
        }

        const lookbookItem = data.find((d: any) => d.content_key === 'lookbook_section')
        if (lookbookItem) {
          setLookbook({
            title: lookbookItem.title || lookbook.title,
            description: lookbookItem.description || lookbook.description,
            button_text: lookbookItem.button_text || lookbook.button_text,
            button_link: lookbookItem.button_link || lookbook.button_link,
            media_url: lookbookItem.image_url || lookbook.media_url
          })
        }
      }
    } catch (err) {
      console.error('Error fetching site_content:', err)
    }
  }

  const handleSaveSlider = async () => {
    setLoading(true)
    try {
      for (const slide of slides) {
        await supabase.from('site_content' as any).upsert({
          id: slide.id.startsWith('slide-') ? undefined : slide.id,
          content_key: `hero_slide_${slide.id}`,
          content_type: 'slider',
          title: slide.title,
          subtitle: slide.subtitle,
          button_text: slide.button_text,
          button_link: slide.button_link,
          image_url: slide.media_url,
          is_active: true
        })
      }
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Manşet Görselleri Güncellendi',
        message: 'Ana sayfa manşet slaytları ve videoları başarıyla kaydedildi.'
      })
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Kaydedilirken Hata Oluştu',
        message: err.message || 'İçerik kaydedilemedi.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLookbook = async () => {
    setLoading(true)
    try {
      await supabase.from('site_content' as any).upsert({
        content_key: 'lookbook_section',
        content_type: 'lookbook',
        title: lookbook.title,
        description: lookbook.description,
        button_text: lookbook.button_text,
        button_link: lookbook.button_link,
        image_url: lookbook.media_url,
        is_active: true
      })
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Lookbook Alanı Güncellendi',
        message: 'Marka hikayesi ve görseli başarıyla güncellendi.'
      })
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Kaydedilirken Hata Oluştu',
        message: err.message || 'İçerik kaydedilemedi.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-inter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">Ana Sayfa & Görsel İçerik Yönetimi</h1>
        <p className="text-xs text-gray-500 mt-1">Sitenizin ana sayfasındaki manşet slaytlarını, videolarını, duyuru bandını ve marka hikayesini buradan bilgisayarınızdan yükleyerek kolayca yönetebilirsiniz.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2 bg-white p-2 rounded-lg shadow-xs">
        <button
          onClick={() => setActiveTab('slider')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'slider' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Layout size={16} className="text-[#C5A572]" />
          <span>1. Ana Sayfa Manşet Slaytları (Hero Slider)</span>
        </button>

        <button
          onClick={() => setActiveTab('announcement')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'announcement' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Megaphone size={16} className="text-[#C5A572]" />
          <span>2. Sitenin En Üst Duyuru Çubuğu</span>
        </button>

        <button
          onClick={() => setActiveTab('lookbook')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'lookbook' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BookOpen size={16} className="text-[#C5A572]" />
          <span>3. Lookbook & Marka Hikayesi</span>
        </button>
      </div>

      {/* Tab 1: Hero Slider */}
      {activeTab === 'slider' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xs text-xs text-amber-900">
            <p className="font-bold">📌 Nerede Görünür?</p>
            <p>Bu alan, müşterilerinizin sitemize girdiğinde <strong>ana sayfanın en üstünde gördüğü tam ekran dönen manşet alanıdır</strong>. Bilgisayarınızdan yüksek kaliteli fotoğraf veya video (.mp4) yükleyebilirsiniz.</p>
          </div>

          {slides.map((slide, idx) => (
            <div key={slide.id || idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-[#1A1A1A] text-sm font-playfair">{idx + 1}. Manşet Slayt Görseli / Videosu</h3>
                {slides.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => setSlides(slides.filter((_, i) => i !== idx))}
                    className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-xs text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Slaytı Sil</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bilgisayardan Fotoğraf veya Video (.MP4) Yükleyin</label>
                <ImageUploader 
                  bucket="content"
                  folder="slider"
                  existingImages={slide.media_url ? [slide.media_url] : []}
                  maxFiles={1}
                  onUploadSuccess={(urls) => {
                    const newSlides = [...slides]
                    newSlides[idx].media_url = urls[0]
                    setSlides(newSlides)
                  }}
                  onRemoveImage={() => {
                    const newSlides = [...slides]
                    newSlides[idx].media_url = ''
                    setSlides(newSlides)
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Manşet Başlığı (Büyük Yazı)</label>
                  <input 
                    type="text" 
                    value={slide.title} 
                    onChange={(e) => {
                      const newSlides = [...slides]
                      newSlides[idx].title = e.target.value
                      setSlides(newSlides)
                    }}
                    placeholder="ör. ZAMANSIZ LÜKS & İPEK KOLEKSİYONU"
                    className="w-full p-2.5 border rounded-xs text-xs" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Alt Açıklama Metni</label>
                  <input 
                    type="text" 
                    value={slide.subtitle} 
                    onChange={(e) => {
                      const newSlides = [...slides]
                      newSlides[idx].subtitle = e.target.value
                      setSlides(newSlides)
                    }}
                    placeholder="ör. MELA HOUSE 2026 Özel Gece Tasarımları"
                    className="w-full p-2.5 border rounded-xs text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Buton Yazısı</label>
                  <input 
                    type="text" 
                    value={slide.button_text} 
                    onChange={(e) => {
                      const newSlides = [...slides]
                      newSlides[idx].button_text = e.target.value
                      setSlides(newSlides)
                    }}
                    placeholder="ör. KOLEKSİYONU KEŞFET"
                    className="w-full p-2.5 border rounded-xs text-xs" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Buton Yönlendirme Linki</label>
                  <input 
                    type="text" 
                    value={slide.button_link} 
                    onChange={(e) => {
                      const newSlides = [...slides]
                      newSlides[idx].button_link = e.target.value
                      setSlides(newSlides)
                    }}
                    placeholder="ör. /urunler veya /kategori/elbise"
                    className="w-full p-2.5 border rounded-xs text-xs font-mono" 
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setSlides([...slides, {
                id: `slide-${Date.now()}`,
                title: 'YENİ SEZON TASARIMLARI',
                subtitle: 'Şık ve Zarif Kadın Koleksiyonu',
                button_text: 'ŞİMDİ İNCELE',
                button_link: '/urunler',
                media_url: ''
              }])}
              className="border border-dashed border-gray-300 hover:border-[#C5A572] bg-white px-4 py-2.5 rounded-xs text-xs font-semibold text-[#1A1A1A] flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} className="text-[#C5A572]" />
              <span>Yeni Manşet Slaytı Ekle</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSaveSlider}
              className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-6 py-2.5 rounded-xs text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save size={16} />
              <span>Manşet Değişikliklerini Kaydet</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Announcement Bar */}
      {activeTab === 'announcement' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xs text-xs text-amber-900">
            <p className="font-bold">📌 Nerede Görünür?</p>
            <p>Bu alan, sitemizin <strong>en tepesinde bulunan siyah/altın renkli duyuru bantıdır</strong>. Müşterilerinize "Ücretsiz Kargo", "Sezon İndirimi" gibi kampanya duyurularını buradan yazabilirsiniz.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-semibold text-[#1A1A1A] text-sm border-b pb-2 font-playfair">En Üst Bant Kampanya Yazıları</h3>
            
            {announcements.map((text, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input 
                  type="text" 
                  value={text} 
                  onChange={(e) => {
                    const newArr = [...announcements]
                    newArr[idx] = e.target.value
                    setAnnouncements(newArr)
                  }}
                  className="flex-1 p-2.5 border rounded-xs text-xs font-medium" 
                  placeholder="ör. Ücretsiz Kargo — 1000 TL Üzeri Siparişlerde" 
                />
                <button 
                  type="button"
                  onClick={() => setAnnouncements(announcements.filter((_, i) => i !== idx))}
                  className="p-2.5 text-rose-600 hover:bg-rose-50 border rounded-xs cursor-pointer"
                  title="Duyuruyu Sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setAnnouncements([...announcements, "Yeni Sezon Fırsatları MELA HOUSE'da"])}
              className="border border-dashed border-gray-300 hover:border-[#C5A572] bg-white px-4 py-2 rounded-xs text-xs font-semibold text-[#1A1A1A] flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} className="text-[#C5A572]" />
              <span>Yeni Duyuru Metni Ekle</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Lookbook */}
      {activeTab === 'lookbook' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xs text-xs text-amber-900">
            <p className="font-bold">📌 Nerede Görünür?</p>
            <p>Bu alan, ana sayfanızın alt kısmında bulunan <strong>"Lookbook / Marka Hikayesi"</strong> tanıtım kartıdır. Bilgisayarınızdan markanızı en iyi yansıtan yüksek çözünürlüklü editoryal görseli yükleyebilirsiniz.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bilgisayardan Editoryal Görsel / Video Yükleyin</label>
              <ImageUploader 
                bucket="content"
                folder="lookbook"
                existingImages={lookbook.media_url ? [lookbook.media_url] : []}
                maxFiles={1}
                onUploadSuccess={(urls) => setLookbook({ ...lookbook, media_url: urls[0] })}
                onRemoveImage={() => setLookbook({ ...lookbook, media_url: '' })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lookbook Başlığı</label>
              <input 
                type="text" 
                value={lookbook.title} 
                onChange={(e) => setLookbook({ ...lookbook, title: e.target.value })}
                className="w-full p-2.5 border rounded-xs text-xs font-semibold" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Marka Hikayesi / Açıklama Metni</label>
              <textarea 
                rows={4} 
                value={lookbook.description} 
                onChange={(e) => setLookbook({ ...lookbook, description: e.target.value })}
                className="w-full p-2.5 border rounded-xs text-xs leading-relaxed" 
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleSaveLookbook}
                className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-6 py-2.5 rounded-xs text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Save size={16} />
                <span>Lookbook İçeriğini Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Notification Modal */}
      <AdminNotificationModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        primaryButtonText="Tamam"
        onPrimaryClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  )
}
