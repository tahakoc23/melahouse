'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Mail, Search, Send, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Table, Tabs, Td, TextArea, TextInput, Th } from '@/components/admin/ui'
import { SiteConfirmDialog } from '@/components/admin/ui/SiteConfirmDialog'
import { notify } from '@/components/admin/ui/siteToast'
import { EMAIL_TEMPLATES, buildEmailHtml, isSafeLink, type EmailDraft } from '@/components/admin/email/emailTemplates'

type Tab = 'compose' | 'history'
type Audience = 'all' | 'ordered' | 'single'

/** API ile aynı sınır: tek seferde en fazla 500 alıcı */
const MAX_RECIPIENTS = 500
/** Aynı anda gönderilen istek sayısı */
const CONCURRENCY = 4
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface EmailLog {
  id: string
  recipient_email: string
  subject: string
  status: string
  sent_at: string | null
  created_at: string
}

/** Resend anahtarı / alan adı ayarı eksikse dönen hatalar */
function isConfigError(msg: string) {
  return /api key|apikey|api_key|unauthori[sz]ed|forbidden|not verified|domain|missing.*key|restricted/i.test(msg)
}

const uniqEmails = (list: (string | null | undefined)[]) =>
  Array.from(new Set(list.map(e => (e || '').trim().toLowerCase()).filter(e => EMAIL_RE.test(e))))

export default function AdminEmailPage() {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<Tab>('compose')

  // İçerik
  const [templateId, setTemplateId] = useState(EMAIL_TEMPLATES[0].id)
  const [draft, setDraft] = useState<EmailDraft>(EMAIL_TEMPLATES[0].draft)

  // Alıcılar
  const [audience, setAudience] = useState<Audience>('single')
  const [singleEmail, setSingleEmail] = useState('')
  const [allEmails, setAllEmails] = useState<string[] | null>(null)
  const [orderedEmails, setOrderedEmails] = useState<string[] | null>(null)
  const [audienceError, setAudienceError] = useState<string | null>(null)

  // Gönderim
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<{ done: number; ok: number; failed: number; total: number } | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const stopRef = useRef(false)

  // Geçmiş
  const [logs, setLogs] = useState<EmailLog[] | null>(null)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [logQuery, setLogQuery] = useState('')

  /* ---------------- Veri ---------------- */

  useEffect(() => {
    let active = true
    ;(async () => {
      const [{ data: profiles, error: pErr }, { data: orders, error: oErr }] = await Promise.all([
        supabase.from('profiles').select('id, email, role'),
        supabase.from('orders').select('user_id').not('user_id', 'is', null),
      ])
      if (!active) return
      if (pErr || oErr) {
        setAudienceError((pErr || oErr)!.message)
        return
      }
      const customers = ((profiles || []) as { id: string; email: string | null; role: string | null }[]).filter(p => p.role !== 'admin')
      const orderedIds = new Set(((orders || []) as { user_id: string | null }[]).map(o => o.user_id))
      setAllEmails(uniqEmails(customers.map(c => c.email)))
      setOrderedEmails(uniqEmails(customers.filter(c => orderedIds.has(c.id)).map(c => c.email)))
    })()
    return () => {
      active = false
    }
  }, [supabase])

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from('email_logs')
      .select('id, recipient_email, subject, status, sent_at, created_at')
      .order('created_at', { ascending: false })
      .limit(300)
    if (error) setLogsError(error.message)
    else {
      setLogsError(null)
      setLogs((data || []) as EmailLog[])
    }
  }

  /* ---------------- Hesaplananlar ---------------- */

  const html = useMemo(() => buildEmailHtml(draft), [draft])

  const recipients: string[] = useMemo(() => {
    if (audience === 'single') return EMAIL_RE.test(singleEmail.trim()) ? [singleEmail.trim().toLowerCase()] : []
    if (audience === 'all') return allEmails || []
    return orderedEmails || []
  }, [audience, singleEmail, allEmails, orderedEmails])

  const problems: string[] = []
  if (!draft.subject.trim()) problems.push('Konu yazın.')
  if (!draft.heading.trim() && !draft.body.trim()) problems.push('Başlık ya da metin yazın.')
  if (draft.buttonText.trim() && !isSafeLink(draft.buttonLink)) problems.push('Buton linki https:// ile başlamalı.')
  if (audience === 'single' && !EMAIL_RE.test(singleEmail.trim())) problems.push('Geçerli bir e-posta adresi girin.')
  if (audience !== 'single' && recipients.length === 0) problems.push('Bu grupta alıcı yok.')
  if (recipients.length > MAX_RECIPIENTS) problems.push(`Tek seferde en fazla ${MAX_RECIPIENTS} kişiye gönderilebilir.`)

  const set = (key: keyof EmailDraft, value: string) => setDraft(d => ({ ...d, [key]: value }))

  const pickTemplate = (id: string) => {
    const t = EMAIL_TEMPLATES.find(x => x.id === id)
    if (!t) return
    setTemplateId(id)
    setDraft(t.draft)
  }

  /* ---------------- Gönderim ---------------- */

  const sendOne = async (to: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject: draft.subject.trim(), html }),
      })
      if (res.ok) return { ok: true }
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      return { ok: false, error: data.error || `Sunucu hatası (${res.status})` }
    } catch {
      return { ok: false, error: 'Bağlantı hatası' }
    }
  }

  const send = async () => {
    setConfirmOpen(false)
    const list = [...recipients]
    if (!list.length) return
    stopRef.current = false
    setSending(true)
    setConfigError(null)
    const state = { done: 0, ok: 0, failed: 0, total: list.length }
    setProgress({ ...state })
    let firstError = ''
    let cfgErr = ''

    // Her alıcıya ayrı e-posta: alıcılar birbirinin adresini görmez
    let cursor = 0
    const worker = async () => {
      while (cursor < list.length && !stopRef.current && !cfgErr) {
        const to = list[cursor++]
        const r = await sendOne(to)
        state.done++
        if (r.ok) state.ok++
        else {
          state.failed++
          firstError ||= r.error || ''
          if (r.error && isConfigError(r.error)) cfgErr = r.error
        }
        setProgress({ ...state })
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, list.length) }, worker))

    setSending(false)
    if (cfgErr) {
      setConfigError(cfgErr)
      notify.error('E-posta servisi ayarlı değil. Gönderim durduruldu.')
    } else if (stopRef.current) {
      notify.info(`Durduruldu. ${state.ok} e-posta gönderildi.`)
    } else if (state.failed === 0) {
      notify.success(state.ok === 1 ? 'E-posta gönderildi.' : `${state.ok} e-posta gönderildi.`)
    } else {
      notify.error(`${state.ok} gönderildi, ${state.failed} gönderilemedi. ${firstError}`)
    }
    if (logs) loadLogs()
  }

  /* ---------------- Görünüm ---------------- */

  const audienceOptions: { value: Audience; label: string; hint: string; icon: React.ReactNode }[] = [
    {
      value: 'all',
      label: 'Tüm müşteriler',
      hint: allEmails === null ? 'Sayılıyor…' : `${allEmails.length} kişi`,
      icon: <Users className="h-4 w-4" />,
    },
    {
      value: 'ordered',
      label: 'Sipariş vermiş müşteriler',
      hint: orderedEmails === null ? 'Sayılıyor…' : `${orderedEmails.length} kişi`,
      icon: <Users className="h-4 w-4" />,
    },
    { value: 'single', label: 'Tek kişi', hint: 'E-posta adresi yazın', icon: <Mail className="h-4 w-4" /> },
  ]

  const filteredLogs = (logs || []).filter(l => {
    const q = logQuery.trim().toLowerCase()
    return !q || l.recipient_email.toLowerCase().includes(q) || l.subject.toLowerCase().includes(q)
  })

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <PageHeader title="E-posta" description="Müşterilere kampanya ve bilgilendirme e-postası gönderin." />

      <Tabs<Tab>
        value={tab}
        onChange={t => {
          setTab(t)
          if (t === 'history' && logs === null) loadLogs()
        }}
        tabs={[
          { value: 'compose', label: 'Yeni e-posta' },
          { value: 'history', label: 'Geçmiş' },
        ]}
      />

      {tab === 'compose' && (
        <div className="space-y-6">
          {configError && (
            <Notice tone="danger" title="E-posta servisi ayarlı değil">
              Gönderim yapılamadı: {configError}. Sunucuda RESEND_API_KEY tanımlı ve gönderen alan adı (melahouse.net) Resend&apos;de
              doğrulanmış olmalı. Bunu geliştiriciye iletin.
            </Notice>
          )}

          {/* 1. Şablon */}
          <section aria-labelledby="sablon-baslik">
            <h2 id="sablon-baslik" className="mb-3 text-[13px] font-medium text-ink">
              1. Şablon seçin
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="radiogroup" aria-label="Şablon">
              {EMAIL_TEMPLATES.map(t => {
                const on = t.id === templateId
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => pickTemplate(t.id)}
                    className={`rounded-lg border bg-white p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
                      on ? 'border-ink ring-1 ring-ink' : 'border-[#E7E3DE] hover:border-ink'
                    }`}
                  >
                    <p className="text-sm font-medium text-ink">{t.name}</p>
                    <p className="mt-0.5 text-xs text-kul">{t.description}</p>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-kul">Şablon değiştirince yazdıklarınız şablonun metniyle değişir.</p>
          </section>

          {/* 2. İçerik + önizleme */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="2. İçeriği düzenleyin">
              <div className="space-y-4">
                <TextInput label="Konu" required value={draft.subject} onChange={e => set('subject', e.target.value)} maxLength={150} />
                <TextInput label="Başlık" value={draft.heading} onChange={e => set('heading', e.target.value)} />
                <TextArea
                  label="Metin"
                  rows={7}
                  value={draft.body}
                  onChange={e => set('body', e.target.value)}
                  hint="Paragrafları boş satırla ayırın."
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextInput label="Buton yazısı" value={draft.buttonText} onChange={e => set('buttonText', e.target.value)} hint="Boş bırakırsanız buton çıkmaz." />
                  <TextInput
                    label="Buton linki"
                    type="url"
                    value={draft.buttonLink}
                    onChange={e => set('buttonLink', e.target.value)}
                    placeholder="https://melahouse.net/urunler"
                    error={draft.buttonText.trim() && draft.buttonLink && !isSafeLink(draft.buttonLink) ? 'https:// ile başlayan tam link girin.' : null}
                  />
                </div>
              </div>
            </Card>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <p className="mb-2 text-[13px] font-medium text-ink">Önizleme</p>
              <div className="overflow-hidden rounded-lg border border-[#E7E3DE] bg-white">
                <div className="border-b border-[#EFEBE6] px-4 py-2.5 text-[13px]">
                  <span className="text-kul">Konu: </span>
                  <span className="font-medium text-ink">{draft.subject || '—'}</span>
                </div>
                <iframe title="E-posta önizlemesi" srcDoc={html} sandbox="" className="h-[520px] w-full bg-[#F7F6F4]" />
              </div>
            </div>
          </div>

          {/* 3. Alıcılar */}
          <Card title="3. Alıcıları seçin">
            {audienceError && (
              <div className="mb-4">
                <Notice tone="warning">Müşteri listesi alınamadı: {audienceError}</Notice>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Alıcılar">
              {audienceOptions.map(o => {
                const on = audience === o.value
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setAudience(o.value)}
                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
                      on ? 'border-ink bg-[#FAF9F7] ring-1 ring-ink' : 'border-[#E7E3DE] bg-white hover:border-ink'
                    }`}
                  >
                    <span className="mt-0.5 text-kul">{o.icon}</span>
                    <span>
                      <span className="block text-sm font-medium text-ink">{o.label}</span>
                      <span className="block text-xs text-kul">{o.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            {audience === 'single' && (
              <TextInput
                className="mt-4 max-w-md"
                label="E-posta adresi"
                type="email"
                value={singleEmail}
                onChange={e => setSingleEmail(e.target.value)}
                placeholder="musteri@ornek.com"
                hint="Göndermeden önce kendi adresinize deneme gönderebilirsiniz."
              />
            )}
            {audience !== 'single' && (
              <p className="mt-4 text-xs text-kul">
                Her kişiye ayrı e-posta gider; alıcılar birbirini görmez. Kampanya e-postaları için müşterinin ticari ileti izni olmalıdır.
              </p>
            )}
          </Card>

          {/* Gönder */}
          <div className="flex flex-col gap-3 rounded-lg border border-[#E7E3DE] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[13px]">
              {sending && progress ? (
                <span className="flex items-center gap-2 text-ink">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress.done} / {progress.total} gönderiliyor
                  {progress.failed > 0 && <span className="text-rose-700">· {progress.failed} hata</span>}
                </span>
              ) : progress ? (
                <span className="text-kul">
                  Son gönderim: {progress.ok} başarılı{progress.failed ? `, ${progress.failed} başarısız` : ''}.
                </span>
              ) : problems.length ? (
                <span className="text-kul">{problems[0]}</span>
              ) : (
                <span className="text-ink">{recipients.length} kişiye gönderilmeye hazır.</span>
              )}
            </div>
            <div className="flex gap-2">
              {sending && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    stopRef.current = true
                  }}
                >
                  Durdur
                </Button>
              )}
              <Button onClick={() => setConfirmOpen(true)} disabled={sending || problems.length > 0} loading={sending} icon={<Send className="h-4 w-4" />}>
                {recipients.length === 1 ? 'E-postayı gönder' : `${recipients.length} kişiye gönder`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <Card padded={false}>
          <div className="border-b border-[#EFEBE6] p-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kul" />
              <input
                type="search"
                value={logQuery}
                onChange={e => setLogQuery(e.target.value)}
                placeholder="Alıcı ya da konu ara"
                aria-label="Geçmişte ara"
                className="h-10 w-full rounded-md border border-[#DCD6CF] bg-white pl-9 pr-3 text-sm text-ink placeholder:text-[#A8A19A] focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>
          {logsError ? (
            <div className="p-4">
              <Notice tone="danger">Geçmiş alınamadı: {logsError}</Notice>
            </div>
          ) : logs === null ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-kul">
              <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
            </div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState icon={<Mail className="h-5 w-5" />} title={logs.length ? 'Eşleşen kayıt yok' : 'Henüz e-posta gönderilmedi'} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Tarih</Th>
                  <Th>Konu</Th>
                  <Th>Alıcı</Th>
                  <Th>Durum</Th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(l => (
                  <tr key={l.id}>
                    <Td className="whitespace-nowrap text-[13px] text-kul">
                      {new Date(l.sent_at || l.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Td>
                    <Td className="max-w-[280px] truncate">{l.subject}</Td>
                    <Td className="max-w-[240px] truncate text-[13px]">{l.recipient_email}</Td>
                    <Td>{l.status === 'sent' ? <Badge tone="success">Gönderildi</Badge> : <Badge tone="danger">Gönderilemedi</Badge>}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      <SiteConfirmDialog
        open={confirmOpen}
        title={recipients.length === 1 ? 'E-posta gönderilsin mi?' : `${recipients.length} kişiye gönderilsin mi?`}
        message={
          <>
            <p>
              Konu: <span className="font-medium text-ink">{draft.subject}</span>
            </p>
            <p className="mt-1">{recipients.length === 1 ? recipients[0] : 'Gönderilen e-posta geri alınamaz.'}</p>
          </>
        }
        confirmLabel="Gönder"
        onConfirm={send}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}
