// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminNotificationModal from '@/components/ui/AdminNotificationModal'
import { Mail, Send, Eye, History, CheckCircle2, Users, FileText, Sparkles } from 'lucide-react'

const EMAIL_TEMPLATES = [
  {
    id: 'tpl-1',
    name: 'Siparişiniz Başarıyla Alındı (Sipariş Onayı)',
    category: 'Sipariş Bildirimi',
    subject: 'Siparişiniz Alındı — MELA HOUSE Lüks Kadın Giyim',
    content: `
      <div style="background-color: #FAFAF8; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center;">
        <div style="max-w: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 4px; padding: 40px 30px; text-align: left;">
          <div style="text-align: center; border-bottom: 2px solid #C5A572; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #1A1A1A; letter-spacing: 2px; margin: 0;">MELA HOUSE</h1>
            <p style="font-size: 11px; color: #C5A572; text-transform: uppercase; tracking: 3px; margin-top: 5px;">LÜKS KADIN GİYİM & İÇ GİYİM</p>
          </div>
          
          <h2 style="font-size: 20px; color: #1A1A1A; font-weight: 600; margin-bottom: 15px;">Siparişiniz İçin Teşekkür Ederiz Sayın Müşterimiz,</h2>
          <p style="font-size: 14px; color: #555555; line-height: 1.6; margin-bottom: 25px;">
            Siparişiniz başarıyla alınmış olup özenle hazırlanmak üzere atölyemize iletilmiştir. Sipariş detaylarınız aşağıdadır:
          </p>

          <div style="background-color: #FAFAF8; border: 1px solid #eeeeee; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
            <p style="font-size: 13px; color: #1A1A1A; margin: 0 0 10px 0;"><strong>Sipariş Durumu:</strong> Hazırlanıyor</p>
            <p style="font-size: 13px; color: #1A1A1A; margin: 0 0 10px 0;"><strong>Kargo Firması:</strong> Yurtiçi Kargo (Express)</p>
            <p style="font-size: 13px; color: #1A1A1A; margin: 0;"><strong>Tahmini Teslimat:</strong> 1-3 İş Günü</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://melahouse.net/siparislerim" style="background-color: #1A1A1A; color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 12px; font-weight: bold; border-radius: 2px; display: inline-block; letter-spacing: 1px;">SİPARİŞİMİ TAKİP ET</a>
          </div>

          <div style="border-t: 1px solid #eeeeee; margin-top: 40px; pt: 20px; text-align: center; font-size: 11px; color: #888888;">
            <p>© 2026 MELA HOUSE Official. Tüm Hakları Saklıdır.</p>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'tpl-2',
    name: 'Kargonuz Yola Çıktı (Teslimat Bildirimi)',
    category: 'Kargo Bildirimi',
    subject: 'Kargonuz Yola Çıktı! 🚚 — MELA HOUSE',
    content: `
      <div style="background-color: #FAFAF8; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center;">
        <div style="max-w: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 4px; padding: 40px 30px; text-align: left;">
          <div style="text-align: center; border-bottom: 2px solid #C5A572; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #1A1A1A; letter-spacing: 2px; margin: 0;">MELA HOUSE</h1>
          </div>
          
          <h2 style="font-size: 20px; color: #1A1A1A; font-weight: 600; margin-bottom: 15px;">Müjde! Paketinizi Yola Çıkardık 📦</h2>
          <p style="font-size: 14px; color: #555555; line-height: 1.6; margin-bottom: 25px;">
            Siparişiniz özel korumalı kutusunda paketlendi ve kargo kuryesine teslim edildi.
          </p>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
            <p style="font-size: 13px; color: #166534; margin: 0 0 5px 0; font-weight: bold;">Kargo Takip Numarası:</p>
            <p style="font-size: 18px; color: #1A1A1A; font-family: monospace; font-weight: bold; margin: 0;">YK-8492049182</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://melahouse.net/siparislerim" style="background-color: #C5A572; color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 12px; font-weight: bold; border-radius: 2px; display: inline-block; letter-spacing: 1px;">KARGOM NEREDE?</a>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'tpl-3',
    name: 'Büyük Sezon İndirimi (%50 İndirim Fırsatı)',
    category: 'Kampanya & İndirim',
    subject: '✨ Sadece Üyelerimize Özel %50 Dev Sezon İndirimi Başladı!',
    content: `
      <div style="background-color: #1A1A1A; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center; color: #ffffff;">
        <div style="max-w: 600px; margin: 0 auto; background-color: #242424; border: 1px solid #C5A572; border-radius: 4px; padding: 40px 30px; text-align: center;">
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; color: #C5A572; letter-spacing: 3px; margin: 0;">MELA HOUSE</h1>
          <p style="font-size: 11px; color: #cccccc; text-transform: uppercase; letter-spacing: 4px; margin-top: 10px;">ÖZEL SEZON FIRSATI</p>
          
          <div style="margin: 30px 0; padding: 25px; border-top: 1px solid #333333; border-bottom: 1px solid #333333;">
            <h2 style="font-size: 36px; color: #ffffff; font-weight: bold; margin: 0;">SEÇİLİ PARÇALARDA</h2>
            <h3 style="font-size: 52px; color: #C5A572; font-weight: 900; margin: 10px 0; font-family: Georgia, serif;">%50 İNDİRİM</h3>
            <p style="font-size: 13px; color: #dddddd; line-height: 1.6;">İpek elbiseler, saten gecelikler ve özel tasarım takımlarda kaçırılmayacak fırsatlar başladı.</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://melahouse.net/urunler" style="background-color: #C5A572; color: #1A1A1A; text-decoration: none; padding: 16px 36px; font-size: 13px; font-weight: bold; border-radius: 2px; display: inline-block; letter-spacing: 2px; text-transform: uppercase;">İNDİRİMLERİ İNCELE ↗</a>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'tpl-4',
    name: 'Yeni Sezon Koleksiyon Lansmanı',
    category: 'Lansman Duyurusu',
    subject: '🌸 MELA HOUSE 2026 İlkbahar & Yaz Koleksiyonu Yayında',
    content: `
      <div style="background-color: #FAFAF8; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center;">
        <div style="max-w: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 4px; padding: 40px 30px; text-align: center;">
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #1A1A1A; letter-spacing: 2px; margin: 0;">MELA HOUSE</h1>
          <p style="font-size: 11px; color: #C5A572; text-transform: uppercase; letter-spacing: 3px; margin-top: 8px;">YENİ SEZON LANSMANI</p>
          
          <h2 style="font-size: 22px; color: #1A1A1A; font-weight: 600; margin: 25px 0 15px 0; font-family: Georgia, serif;">Zamansız Zarafetin Yeni Yüzü</h2>
          <p style="font-size: 14px; color: #555555; line-height: 1.6; margin-bottom: 30px;">
            Yalın çizgiler, nefes alan ipek dokular ve zengin renk paletleriyle hazırlanan 2026 Koleksiyonumuzu hemen keşfedin.
          </p>

          <div style="text-align: center;">
            <a href="https://melahouse.net/urunler" style="background-color: #1A1A1A; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 12px; font-weight: bold; border-radius: 2px; display: inline-block; letter-spacing: 1px;">KOLEKSİYONA GÖZ AT</a>
          </div>
        </div>
      </div>
    `
  }
]

export default function AdminEmailPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'templates' | 'compose' | 'history'>('templates')
  
  const [selectedTemplate, setSelectedTemplate] = useState(EMAIL_TEMPLATES[0])
  const [recipientType, setRecipientType] = useState<'all' | 'custom'>('all')
  const [customEmail, setCustomEmail] = useState('')
  const [subject, setSubject] = useState(EMAIL_TEMPLATES[0].subject)
  const [htmlContent, setHtmlContent] = useState(EMAIL_TEMPLATES[0].content)
  const [previewMode, setPreviewMode] = useState(false)
  const [sending, setSending] = useState(false)

  const [sentLogs, setSentLogs] = useState<any[]>([
    {
      id: 'log-1',
      template_name: 'Büyük Sezon İndirimi (%50 İndirim Fırsatı)',
      recipient: 'Tüm Kayıtlı Müşteriler (42 Kullanıcı)',
      sent_at: '2026-08-22 14:30',
      status: 'Başarıyla İletildi'
    }
  ])

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  })

  const handleSelectTemplate = (tpl: any) => {
    setSelectedTemplate(tpl)
    setSubject(tpl.subject)
    setHtmlContent(tpl.content)
    setActiveTab('compose')
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      const recipientText = recipientType === 'all' ? 'Tüm Kayıtlı Kullanıcılar' : customEmail;
      
      // Call Email API
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientType === 'all' ? 'tum-uyeler@melahouse.net' : customEmail,
          subject,
          html: htmlContent
        })
      });

      // Add to Sent Logs
      const newLog = {
        id: `log-${Date.now()}`,
        template_name: selectedTemplate?.name || 'Özel E-posta',
        recipient: recipientText,
        sent_at: new Date().toLocaleString('tr-TR'),
        status: 'Başarıyla İletildi'
      }

      setSentLogs([newLog, ...sentLogs])

      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'E-posta Gönderildi',
        message: `${recipientText} alıcısına e-posta şablonu başarıyla iletildi.`
      })
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Gönderim Hatası',
        message: err.message || 'E-posta gönderilirken bir hata oluştu.'
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-inter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">E-posta Pazarlama & Bildirim Merkezi</h1>
        <p className="text-xs text-gray-500 mt-1">Hazır profesyonel şablonlar ile müşterilerinize sipariş onayları, kargo bildirimleri ve dev kampanya duyuruları gönderin.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white p-2 rounded-lg shadow-xs gap-2">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'templates' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Sparkles size={16} className="text-[#C5A572]" />
          <span>1. Şablon Kütüphanesi</span>
        </button>

        <button
          onClick={() => setActiveTab('compose')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'compose' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Send size={16} className="text-[#C5A572]" />
          <span>2. E-posta Gönder / Hazırla</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'history' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <History size={16} className="text-[#C5A572]" />
          <span>3. Gönderim Geçmişi</span>
        </button>
      </div>

      {/* TAB 1: TEMPLATES GALLERY */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EMAIL_TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold bg-[#C5A572]/20 text-[#1A1A1A] px-2 py-0.5 rounded-xs uppercase tracking-wider">
                    {tpl.category}
                  </span>
                </div>
                <h3 className="font-playfair text-lg font-bold text-[#1A1A1A]">{tpl.name}</h3>
                <p className="text-xs text-gray-500 font-mono">Konu: {tpl.subject}</p>
              </div>

              {/* Preview Box */}
              <div className="border border-gray-200 rounded-xs p-3 max-h-44 overflow-y-auto bg-gray-50 text-xs scale-90 origin-top">
                <div dangerouslySetInnerHTML={{ __html: tpl.content }} />
              </div>

              <button
                onClick={() => handleSelectTemplate(tpl)}
                className="w-full bg-[#1A1A1A] hover:bg-[#C5A572] text-white py-2.5 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Send size={14} />
                <span>Bu Şablonu Kullan & Gönder</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: COMPOSE & SEND */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSendEmail} className="lg:col-span-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-playfair text-lg font-bold text-[#1A1A1A] border-b pb-2">E-posta Detayları</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Alıcı Seçimi *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientType('all')}
                  className={`p-2.5 border rounded-xs text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    recipientType === 'all' ? 'border-[#C5A572] bg-[#FAFAF8] text-[#1A1A1A]' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Users size={16} />
                  <span>Tüm Kayıtlı Üyeler</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('custom')}
                  className={`p-2.5 border rounded-xs text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    recipientType === 'custom' ? 'border-[#C5A572] bg-[#FAFAF8] text-[#1A1A1A]' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Mail size={16} />
                  <span>Tekil E-posta Gir</span>
                </button>
              </div>
            </div>

            {recipientType === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Hedef E-posta Adresi *</label>
                <input 
                  required
                  type="email" 
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="ör. musteri@example.com"
                  className="w-full p-2.5 border rounded-xs text-xs" 
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">E-posta Konusu (Subject) *</label>
              <input 
                required
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2.5 border rounded-xs text-xs font-medium" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">HTML Şablon Kodu</label>
              <textarea 
                rows={10} 
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full p-2.5 border rounded-xs text-xs font-mono bg-gray-50" 
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-[#1A1A1A] hover:bg-[#C5A572] text-white py-3 rounded-xs font-semibold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Send size={16} />
              <span>{sending ? 'Gönderiliyor...' : 'E-postayı Hemen Gönder'}</span>
            </button>
          </form>

          {/* Live Preview Pane */}
          <div className="lg:col-span-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-playfair text-lg font-bold text-[#1A1A1A] border-b pb-2 flex items-center gap-2">
              <Eye size={18} className="text-[#C5A572]" />
              <span>Canlı Şablon Önizlemesi</span>
            </h3>

            <div className="border border-gray-200 rounded-xs p-4 bg-gray-100 min-h-[450px] max-h-[600px] overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SENT LOGS */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-playfair text-lg font-bold text-[#1A1A1A]">E-posta Gönderim Geçmişi</h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b font-semibold">
              <tr>
                <th className="px-4 py-3">Tarih / Saat</th>
                <th className="px-4 py-3">Kullanılan Şablon</th>
                <th className="px-4 py-3">Alıcılar</th>
                <th className="px-4 py-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {sentLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-500">{log.sent_at}</td>
                  <td className="px-4 py-3 font-semibold text-[#1A1A1A]">{log.template_name}</td>
                  <td className="px-4 py-3 text-gray-700">{log.recipient}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-xs text-[10px] font-bold">
                      <CheckCircle2 size={12} />
                      <span>{log.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notification Modal */}
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
