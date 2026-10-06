'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, EyeOff, MessageSquare, Star, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Tabs } from '@/components/admin/ui'
import { ConfirmDialog } from '@/components/admin/ui/AdminDialog'
import { createAdminBrowserClient, errorMessage, formatDate, refreshAdminCounts } from '@/components/admin/ui/orderHelpers'

type Review = {
  id: string
  product_id: string
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string | null
  products: { name: string | null; slug: string | null } | null
  profiles: { full_name: string | null; email: string | null } | null
}

type TabKey = 'bekleyen' | 'yayinda'

export default function AdminReviewsPage() {
  const supabase = useMemo(() => createAdminBrowserClient(), [])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('bekleyen')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('reviews')
      .select('id, product_id, rating, comment, is_approved, created_at, products(name, slug), profiles(full_name, email)')
      .order('created_at', { ascending: false })
    if (err) setError(errorMessage(err, 'Yorumlar yüklenemedi.'))
    else {
      setReviews((data || []) as unknown as Review[])
      setError(null)
    }
    setLoading(false)
  }, [supabase])

  // İlk yükleme: load() içindeki setState çağrıları istek tamamlandıktan sonra çalışır
  useEffect(() => {
    const run = () => {
      load().catch(() => {})
    }
    run()
  }, [load])

  const setApproved = async (r: Review, approved: boolean) => {
    setBusyId(r.id)
    const { data, error: err } = await supabase.from('reviews').update({ is_approved: approved }).eq('id', r.id).select('id')
    setBusyId(null)
    if (err || !data || data.length === 0) {
      toast.error(errorMessage(err, 'Yorum güncellenemedi. Sayfayı yenileyip tekrar deneyin.'))
      return
    }
    setReviews(prev => prev.map(x => (x.id === r.id ? { ...x, is_approved: approved } : x)))
    toast.success(approved ? 'Yorum yayınlandı.' : 'Yorum yayından kaldırıldı. Onay bekleyenler listesine taşındı.')
    refreshAdminCounts()
  }

  const remove = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { data, error: err } = await supabase.from('reviews').delete().eq('id', deleteTarget.id).select('id')
    setDeleting(false)
    if (err || !data || data.length === 0) {
      toast.error(errorMessage(err, 'Yorum silinemedi. Sayfayı yenileyip tekrar deneyin.'))
      return
    }
    setReviews(prev => prev.filter(x => x.id !== deleteTarget.id))
    setDeleteTarget(null)
    toast.success('Yorum silindi.')
    refreshAdminCounts()
  }

  const pending = reviews.filter(r => !r.is_approved)
  const live = reviews.filter(r => r.is_approved)
  const list = tab === 'bekleyen' ? pending : live

  return (
    <div>
      <PageHeader title="Yorumlar" description="Onayladığınız yorumlar ürün sayfasında görünür." />

      <Tabs
        tabs={[
          { value: 'bekleyen' as TabKey, label: 'Onay bekleyen', count: pending.length },
          { value: 'yayinda' as TabKey, label: 'Yayında', count: live.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      {error && (
        <div className="mb-4">
          <Notice tone="danger" title="Yorumlar yüklenemedi">
            <p>{error}</p>
            <button
              type="button"
              className="mt-1 font-medium underline"
              onClick={() => {
                setLoading(true)
                load()
              }}
            >
              Tekrar dene
            </button>
          </Notice>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Yorumlar yükleniyor">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-32 animate-pulse rounded-lg border border-[#E7E3DE] bg-white" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MessageSquare className="h-5 w-5" />}
            title={tab === 'bekleyen' ? 'Onay bekleyen yorum yok' : 'Yayında yorum yok'}
            description={
              tab === 'bekleyen'
                ? 'Müşteriler yeni yorum yazdığında onayınız için burada görünür.'
                : 'Onay bekleyen sekmesinden yorumları onaylayarak yayına alabilirsiniz.'
            }
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {list.map(r => (
            <li key={r.id} className="rounded-lg border border-[#E7E3DE] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {r.products?.slug ? (
                    <a
                      href={`/urunler/${r.products.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-ink hover:underline"
                    >
                      {r.products.name || 'Ürün'}
                    </a>
                  ) : (
                    <p className="font-medium">{r.products?.name || 'Silinmiş ürün'}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-kul">
                    <Stars rating={r.rating} />
                    <span>{r.profiles?.full_name || r.profiles?.email || 'İsimsiz müşteri'}</span>
                    <span>{formatDate(r.created_at)}</span>
                  </div>
                </div>
                {r.is_approved ? <Badge tone="success">Yayında</Badge> : <Badge tone="warning">Onay bekliyor</Badge>}
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
                {r.comment?.trim() || <span className="text-kul">Yorum metni yok, yalnızca puan verilmiş.</span>}
              </p>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteTarget(r)}>
                  Sil
                </Button>
                {r.is_approved ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<EyeOff className="h-4 w-4" />}
                    loading={busyId === r.id}
                    onClick={() => setApproved(r, false)}
                  >
                    Yayından kaldır
                  </Button>
                ) : (
                  <Button size="sm" icon={<Check className="h-4 w-4" />} loading={busyId === r.id} onClick={() => setApproved(r, true)}>
                    Onayla
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        tone="danger"
        title="Yorumu sil"
        message="Yorum kalıcı olarak silinir ve geri alınamaz. Sadece gizlemek istiyorsanız yayından kaldırın."
        confirmLabel="Yorumu sil"
      />
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`5 üzerinden ${r} puan`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < r ? 'fill-murdum text-murdum' : 'text-[#DCD6CF]'}`} aria-hidden="true" />
      ))}
    </span>
  )
}
