'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ImageUploader from '@/components/admin/ImageUploader'
import { Badge, Button, Card, Field, Notice, PageHeader, StickyActions, Tabs, TextArea, TextInput } from '@/components/admin/ui'
import { notify } from '@/components/admin/ui/siteToast'
import {
  AnnouncementPreview,
  HeroPreview,
  LookbookPreview,
  isVideoUrl,
  type LookbookDraft,
  type SlideDraft,
} from '@/components/admin/content/HomePreviews'

type Tab = 'slider' | 'announcement' | 'lookbook'

/* Mağazada kayıt yokken görünen varsayılanlar (HeroSlider / AnnouncementBar / LookbookSection) */
const DEFAULT_SLIDES: Omit<SlideDraft, 'key'>[] = [
  {
    title: 'Yeni sezon, sakin bir zarafetle.',
    subtitle: 'Sonbahar · Kış 2026',
    button_text: 'Koleksiyonu keşfet',
    button_link: '/urunler',
    media_url: 'https://images.unsplash.com/photo-1571513800374-df1bbe650e56?q=75&w=1800&auto=format&fit=crop',
  },
]
const DEFAULT_ANNOUNCEMENTS = ['1.000 TL ve üzeri siparişlerde ücretsiz kargo', 'Teslimattan itibaren 14 gün içinde iade']
const DEFAULT_LOOKBOOK: LookbookDraft = {
  title: 'Az parça, doğru parça.',
  description:
    'MELA HOUSE, günlükten davete uzanan bir kadın gardırobunu kumaşı ve kalıbı özenle seçilmiş parçalarla kurar. Koleksiyonlarımızı her sezon küçük ve seçkin tutuyoruz; böylece her parça diğerleriyle kolayca eşleşir.',
  button_text: 'Hikayemiz',
  button_link: '/hakkimizda',
  media_url: 'https://images.unsplash.com/photo-1637248666370-70a4a603c23e?q=80&w=1400&auto=format&fit=crop',
}

let keySeq = 0
const newKey = () => `s${Date.now()}-${keySeq++}`

/** Karşılaştırma için (key alanı hariç) */
const slidesSig = (s: SlideDraft[]) =>
  JSON.stringify(s.map(({ title, subtitle, button_text, button_link, media_url }) => [title, subtitle, button_text, button_link, media_url]))
const annSig = (a: string[]) => JSON.stringify(a.map(t => t.trim()).filter(Boolean))
const lbSig = (l: LookbookDraft) => JSON.stringify(l)

type SiteContentRow = {
  id: string
  content_key: string | null
  content_type: string | null
  title: string | null
  subtitle: string | null
  content: unknown
  media_url: string | null
  link_url: string | null
  link_text: string | null
  sort_order: number | null
}

export default function AdminContentPage() {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<Tab>('slider')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Tab | null>(null)

  const [slides, setSlides] = useState<SlideDraft[]>([])
  const [announcements, setAnnouncements] = useState<string[]>([])
  const [lookbook, setLookbook] = useState<LookbookDraft>(DEFAULT_LOOKBOOK)
  const [previewIndex, setPreviewIndex] = useState(0)

  // Son kaydedilen hâl (değişiklik göstergesi için)
  const [saved, setSaved] = useState({ slides: '', ann: '', lb: '' })
  const [fromDefaults, setFromDefaults] = useState({ slides: false, ann: false, lb: false })

  useEffect(() => {
    let active = true
    supabase
      .from('site_content')
      .select('*')
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setLoadError(error.message)
          setLoading(false)
          return
        }
        const rows = (data || []) as SiteContentRow[]
        const bySort = (a: SiteContentRow, b: SiteContentRow) => (a.sort_order ?? 0) - (b.sort_order ?? 0)

        const sliderRows = rows.filter(d => d.content_type === 'slider').sort(bySort)
        const nextSlides: SlideDraft[] = (
          sliderRows.length
            ? sliderRows.map(s => ({
                title: s.title || '',
                subtitle: s.subtitle || '',
                button_text: s.link_text || 'Keşfet',
                button_link: s.link_url || '/urunler',
                media_url: s.media_url || '',
              }))
            : DEFAULT_SLIDES
        ).map(s => ({ ...s, key: newKey() }))

        const annRows = rows
          .filter(d => d.content_type === 'announcement')
          .sort(bySort)
          .map(d => d.title || '')
          .filter(Boolean)
        const nextAnn = annRows.length ? annRows : DEFAULT_ANNOUNCEMENTS

        const lb = rows.find(d => d.content_key === 'lookbook_section')
        const lbText = typeof lb?.content === 'string' ? lb.content : ''
        const nextLb: LookbookDraft = lb
          ? {
              title: lb.title || DEFAULT_LOOKBOOK.title,
              description: lbText || DEFAULT_LOOKBOOK.description,
              button_text: lb.link_text || DEFAULT_LOOKBOOK.button_text,
              button_link: lb.link_url || DEFAULT_LOOKBOOK.button_link,
              media_url: lb.media_url || DEFAULT_LOOKBOOK.media_url,
            }
          : DEFAULT_LOOKBOOK

        setSlides(nextSlides)
        setAnnouncements(nextAnn)
        setLookbook(nextLb)
        setSaved({ slides: slidesSig(nextSlides), ann: annSig(nextAnn), lb: lbSig(nextLb) })
        setFromDefaults({ slides: !sliderRows.length, ann: !annRows.length, lb: !lb })
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [supabase])

  const dirty = {
    slider: !loading && slidesSig(slides) !== saved.slides,
    announcement: !loading && annSig(announcements) !== saved.ann,
    lookbook: !loading && lbSig(lookbook) !== saved.lb,
  }
  const anyDirty = dirty.slider || dirty.announcement || dirty.lookbook

  // Kaydedilmemiş değişiklik varken sayfadan çıkışta uyar
  useEffect(() => {
    if (!anyDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [anyDirty])

  /* ---------------- Kaydetme (veri mantığı değişmedi) ---------------- */

  const saveSlider = async () => {
    const missing = slides.filter(s => !s.media_url).length
    setSaving('slider')
    try {
      const rows = slides
        .filter(slide => slide.media_url)
        .map((slide, idx) => ({
          content_key: `hero_slide_${idx + 1}`,
          content_type: 'slider',
          title: slide.title,
          subtitle: slide.subtitle,
          link_text: slide.button_text,
          link_url: slide.button_link,
          media_url: slide.media_url,
          sort_order: idx,
          is_active: true,
        }))
      const { error: delError } = await supabase.from('site_content').delete().eq('content_type', 'slider')
      if (delError) throw delError
      if (rows.length > 0) {
        const { error } = await supabase.from('site_content').insert(rows as never)
        if (error) throw error
      }
      const kept = slides.filter(s => s.media_url)
      setSlides(kept)
      setPreviewIndex(0)
      setSaved(s => ({ ...s, slides: slidesSig(kept) }))
      setFromDefaults(f => ({ ...f, slides: false }))
      notify.success(
        rows.length === 0
          ? 'Kapaklar kaldırıldı. Sitede varsayılan kapak görünecek.'
          : `Kapak görselleri kaydedildi.${missing ? ` Görseli olmayan ${missing} kapak atlandı.` : ''}`,
      )
    } catch (err) {
      notify.error(`Kaydedilemedi: ${err instanceof Error ? err.message : 'bilinmeyen hata'}`)
    } finally {
      setSaving(null)
    }
  }

  const saveAnnouncements = async () => {
    setSaving('announcement')
    try {
      const rows = announcements
        .map(t => t.trim())
        .filter(Boolean)
        .map((title, idx) => ({
          content_key: `announcement_${idx + 1}`,
          content_type: 'announcement',
          title,
          sort_order: idx,
          is_active: true,
        }))
      const { error: delError } = await supabase.from('site_content').delete().eq('content_type', 'announcement')
      if (delError) throw delError
      if (rows.length > 0) {
        const { error } = await supabase.from('site_content').insert(rows as never)
        if (error) throw error
      }
      const kept = rows.map(r => r.title)
      setAnnouncements(kept)
      setSaved(s => ({ ...s, ann: annSig(kept) }))
      setFromDefaults(f => ({ ...f, ann: false }))
      notify.success(rows.length ? 'Duyuru bandı kaydedildi.' : 'Duyurular kaldırıldı. Sitede varsayılan duyurular görünecek.')
    } catch (err) {
      notify.error(`Kaydedilemedi: ${err instanceof Error ? err.message : 'bilinmeyen hata'}`)
    } finally {
      setSaving(null)
    }
  }

  const saveLookbook = async () => {
    if (!lookbook.title.trim() || !lookbook.media_url) {
      notify.error('Bölümün sitede görünmesi için başlık ve görsel gerekli.')
      return
    }
    setSaving('lookbook')
    try {
      const { error } = await supabase.from('site_content').upsert(
        {
          content_key: 'lookbook_section',
          content_type: 'banner',
          title: lookbook.title,
          content: lookbook.description,
          link_text: lookbook.button_text,
          link_url: lookbook.button_link,
          media_url: lookbook.media_url,
          is_active: true,
        } as never,
        { onConflict: 'content_key' },
      )
      if (error) throw error
      setSaved(s => ({ ...s, lb: lbSig(lookbook) }))
      setFromDefaults(f => ({ ...f, lb: false }))
      notify.success('Marka bölümü kaydedildi.')
    } catch (err) {
      notify.error(`Kaydedilemedi: ${err instanceof Error ? err.message : 'bilinmeyen hata'}`)
    } finally {
      setSaving(null)
    }
  }

  const revert = () => {
    if (tab === 'slider') {
      setSlides(JSON.parse(saved.slides).map((a: string[]) => ({
        key: newKey(),
        title: a[0],
        subtitle: a[1],
        button_text: a[2],
        button_link: a[3],
        media_url: a[4],
      })))
      setPreviewIndex(0)
    }
    if (tab === 'announcement') setAnnouncements(JSON.parse(saved.ann))
    if (tab === 'lookbook') setLookbook(JSON.parse(saved.lb))
  }

  /* ---------------- Yardımcılar ---------------- */

  const updateSlide = (idx: number, patch: Partial<SlideDraft>) =>
    setSlides(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const to = idx + dir
    if (to < 0 || to >= slides.length) return
    setSlides(prev => {
      const next = [...prev]
      ;[next[idx], next[to]] = [next[to], next[idx]]
      return next
    })
    setPreviewIndex(to)
  }

  const moveAnn = (idx: number, dir: -1 | 1) => {
    const to = idx + dir
    if (to < 0 || to >= announcements.length) return
    setAnnouncements(prev => {
      const next = [...prev]
      ;[next[idx], next[to]] = [next[to], next[idx]]
      return next
    })
  }

  const tabLabel = (label: string, isDirty: boolean) => (isDirty ? `${label} (kaydedilmedi)` : label)
  const currentDirty = dirty[tab]
  const notInDb = tab === 'slider' ? fromDefaults.slides : tab === 'announcement' ? fromDefaults.ann : fromDefaults.lb
  const saveCurrent = tab === 'slider' ? saveSlider : tab === 'announcement' ? saveAnnouncements : saveLookbook
  const saveLabel = tab === 'slider' ? 'Kapakları kaydet' : tab === 'announcement' ? 'Duyuruları kaydet' : 'Marka bölümünü kaydet'
  const previewSlide = slides[Math.min(previewIndex, Math.max(0, slides.length - 1))]

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="İçerik" description="Ana sayfadaki kapak görselleri, üst duyuru bandı ve marka bölümü." />

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'slider', label: tabLabel('Kapak görselleri', dirty.slider) },
          { value: 'announcement', label: tabLabel('Duyuru bandı', dirty.announcement) },
          { value: 'lookbook', label: tabLabel('Marka bölümü', dirty.lookbook) },
        ]}
      />

      {loadError && (
        <Notice tone="danger" title="İçerik yüklenemedi">
          {loadError}. Sayfayı yenileyin.
        </Notice>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-kul">
          <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
        </div>
      ) : (
        !loadError && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* ---------------- Düzenleme alanı ---------------- */}
            <div className="min-w-0 space-y-4">
              {tab === 'slider' && (
                <>
                  {fromDefaults.slides && (
                    <Notice>Henüz kapak kaydedilmemiş. Sitede aşağıdaki varsayılan kapak görünüyor.</Notice>
                  )}
                  {slides.length === 0 && (
                    <Notice tone="warning">Kapak yok. Kaydederseniz sitede varsayılan kapak görünür.</Notice>
                  )}
                  {slides.map((slide, idx) => (
                    <Card
                      key={slide.key}
                      title={
                        <span className="flex items-center gap-2">
                          Kapak {idx + 1}
                          {!slide.media_url && <Badge tone="warning">Görsel gerekli</Badge>}
                        </span>
                      }
                      actions={
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setPreviewIndex(idx)} aria-pressed={previewIndex === idx}>
                            {previewIndex === idx ? 'Önizlemede' : 'Önizle'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => moveSlide(idx, -1)} disabled={idx === 0} aria-label={`Kapak ${idx + 1} yukarı taşı`}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveSlide(idx, 1)}
                            disabled={idx === slides.length - 1}
                            aria-label={`Kapak ${idx + 1} aşağı taşı`}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              setSlides(prev => prev.filter((_, i) => i !== idx))
                              setPreviewIndex(0)
                            }}
                            aria-label={`Kapak ${idx + 1} kaldır`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      }
                    >
                      <div className="space-y-4" onFocusCapture={() => setPreviewIndex(idx)}>
                        <Field label="Görsel" hint="Yatay, en az 1600 px genişliğinde fotoğraf önerilir.">
                          <ImageUploader
                            bucket="content"
                            folder="slider"
                            existingImages={slide.media_url ? [slide.media_url] : []}
                            maxFiles={1}
                            onUploadSuccess={(urls: string[]) => updateSlide(idx, { media_url: urls[0] || '' })}
                            onRemoveImage={() => updateSlide(idx, { media_url: '' })}
                          />
                        </Field>
                        {isVideoUrl(slide.media_url) && (
                          <Notice tone="warning">Ana sayfa kapağı şu an yalnızca fotoğraf gösterir. Video yerine fotoğraf yükleyin.</Notice>
                        )}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <TextInput label="Başlık" value={slide.title} onChange={e => updateSlide(idx, { title: e.target.value })} placeholder="ör. Yeni sezon geldi" />
                          <TextInput
                            label="Üst yazı"
                            hint="Başlığın üstündeki küçük yazı."
                            value={slide.subtitle}
                            onChange={e => updateSlide(idx, { subtitle: e.target.value })}
                            placeholder="ör. Sonbahar · Kış 2026"
                          />
                          <TextInput label="Buton yazısı" value={slide.button_text} onChange={e => updateSlide(idx, { button_text: e.target.value })} placeholder="ör. Koleksiyonu keşfet" />
                          <TextInput
                            label="Buton linki"
                            value={slide.button_link}
                            onChange={e => updateSlide(idx, { button_link: e.target.value })}
                            placeholder="/urunler"
                            hint="ör. /urunler ya da /kategori/elbise"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button
                    variant="secondary"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => {
                      setSlides(prev => [...prev, { key: newKey(), title: '', subtitle: '', button_text: 'Keşfet', button_link: '/urunler', media_url: '' }])
                      setPreviewIndex(slides.length)
                    }}
                  >
                    Kapak ekle
                  </Button>
                </>
              )}

              {tab === 'announcement' && (
                <Card title="Duyurular" description="Sitenin en üstündeki bantta sırayla döner. Kısa tutun.">
                  {fromDefaults.ann && (
                    <div className="mb-4">
                      <Notice>Henüz duyuru kaydedilmemiş. Sitede bu varsayılan duyurular görünüyor.</Notice>
                    </div>
                  )}
                  <ol className="space-y-2">
                    {announcements.map((text, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-5 shrink-0 text-right text-xs text-kul">{idx + 1}.</span>
                        <input
                          type="text"
                          value={text}
                          maxLength={90}
                          aria-label={`Duyuru ${idx + 1}`}
                          onChange={e => setAnnouncements(prev => prev.map((t, i) => (i === idx ? e.target.value : t)))}
                          placeholder="ör. 1.000 TL üzeri ücretsiz kargo"
                          className="h-10 min-w-0 flex-1 rounded-md border border-[#DCD6CF] bg-white px-3 text-sm text-ink placeholder:text-[#A8A19A] focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                        />
                        <Button size="sm" variant="ghost" onClick={() => moveAnn(idx, -1)} disabled={idx === 0} aria-label={`Duyuru ${idx + 1} yukarı taşı`}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveAnn(idx, 1)}
                          disabled={idx === announcements.length - 1}
                          aria-label={`Duyuru ${idx + 1} aşağı taşı`}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-700 hover:bg-rose-50"
                          onClick={() => setAnnouncements(prev => prev.filter((_, i) => i !== idx))}
                          aria-label={`Duyuru ${idx + 1} kaldır`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ol>
                  {announcements.length === 0 && <p className="text-sm text-kul">Duyuru yok. Kaydederseniz sitede varsayılan duyurular görünür.</p>}
                  <Button
                    className="mt-4"
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setAnnouncements(prev => [...prev, ''])}
                  >
                    Duyuru ekle
                  </Button>
                </Card>
              )}

              {tab === 'lookbook' && (
                <Card title="Marka bölümü" description="Ana sayfanın altındaki mürdüm renkli tanıtım alanı.">
                  {fromDefaults.lb && (
                    <div className="mb-4">
                      <Notice>Henüz kaydedilmemiş. Sitede bu varsayılan içerik görünüyor.</Notice>
                    </div>
                  )}
                  <div className="space-y-4">
                    <Field label="Görsel" required hint="Dikey (4:5) fotoğraf önerilir.">
                      <ImageUploader
                        bucket="content"
                        folder="lookbook"
                        existingImages={lookbook.media_url ? [lookbook.media_url] : []}
                        maxFiles={1}
                        onUploadSuccess={(urls: string[]) => setLookbook(l => ({ ...l, media_url: urls[0] || '' }))}
                        onRemoveImage={() => setLookbook(l => ({ ...l, media_url: '' }))}
                      />
                    </Field>
                    {isVideoUrl(lookbook.media_url) && (
                      <Notice tone="warning">Bu bölüm şu an yalnızca fotoğraf gösterir. Video yerine fotoğraf yükleyin.</Notice>
                    )}
                    <TextInput label="Başlık" required value={lookbook.title} onChange={e => setLookbook(l => ({ ...l, title: e.target.value }))} />
                    <TextArea label="Metin" rows={5} value={lookbook.description} onChange={e => setLookbook(l => ({ ...l, description: e.target.value }))} />
                    <TextInput
                      label="Link"
                      hint={'"Hikayemiz" yazısına tıklayınca açılan sayfa.'}
                      value={lookbook.button_link}
                      onChange={e => setLookbook(l => ({ ...l, button_link: e.target.value }))}
                      placeholder="/hakkimizda"
                    />
                  </div>
                </Card>
              )}
            </div>

            {/* ---------------- Önizleme ---------------- */}
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <p className="mb-2 text-[13px] font-medium text-ink">Sitede görünümü</p>
              {tab === 'slider' && <HeroPreview slide={previewSlide} index={Math.min(previewIndex, slides.length - 1)} total={slides.length} />}
              {tab === 'announcement' && <AnnouncementPreview messages={announcements} />}
              {tab === 'lookbook' && <LookbookPreview data={lookbook} />}
              <p className="mt-2 text-xs text-kul">Küçültülmüş önizleme. Kaydettikten sonra sitede görünür.</p>
            </aside>
          </div>
        )
      )}

      {!loading && !loadError && (
        <StickyActions
          note={
            currentDirty ? (
              <span className="flex items-center gap-2 text-ink">
                <span aria-hidden className="h-2 w-2 rounded-full bg-murdum" /> Kaydedilmemiş değişiklikler var
              </span>
            ) : (
              'Tüm değişiklikler kaydedildi'
            )
          }
        >
          {currentDirty && (
            <Button variant="ghost" onClick={revert} disabled={saving !== null}>
              Geri al
            </Button>
          )}
          <Button onClick={saveCurrent} loading={saving === tab} disabled={(!currentDirty && !notInDb) || saving !== null}>
            {saveLabel}
          </Button>
        </StickyActions>
      )}
    </div>
  )
}
