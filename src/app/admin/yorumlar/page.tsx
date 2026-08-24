// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Trash2 } from 'lucide-react'

export default function ReviewsPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*, products(name), profiles(full_name)')
      .order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  const handleUpdateStatus = async (id: string, isApproved: boolean) => {
    const { error } = await supabase.from('reviews' as any).update({ is_approved: isApproved }).eq('id', id)
    if (error) alert('Hata: ' + error.message)
    else {
      setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: isApproved } : r))
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Yorumu silmek istediğinize emin misiniz?')) {
      const { error } = await supabase.from('reviews').delete().eq('id', id)
      if (error) alert('Hata: ' + error.message)
      else setReviews(reviews.filter(r => r.id !== id))
    }
  }

  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending') return r.is_approved === false
    if (filter === 'approved') return r.is_approved === true
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-playfair text-[#1A1A1A]">Yorum Yönetimi</h1>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded-md bg-white text-sm"
        >
          <option value="all">Tümü</option>
          <option value="pending">Onay Bekleyenler</option>
          <option value="approved">Onaylananlar</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3">Puan</th>
              <th className="px-4 py-3">Yorum</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td></tr>
            ) : filteredReviews.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Yorum bulunamadı.</td></tr>
            ) : (
              filteredReviews.map((review) => (
                <tr key={review.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#1A1A1A] max-w-[150px] truncate">{review.products?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{review.profiles?.full_name || 'Anonim'}</td>
                  <td className="px-4 py-3 text-[#C5A572]">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{review.comment}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${review.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {review.is_approved ? 'Onaylı' : 'Bekliyor'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {!review.is_approved ? (
                      <button onClick={() => handleUpdateStatus(review.id, true)} className="inline-flex p-1 text-green-600 hover:bg-green-50 rounded" title="Onayla">
                        <Check size={18} />
                      </button>
                    ) : (
                      <button onClick={() => handleUpdateStatus(review.id, false)} className="inline-flex p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Onayı Kaldır">
                        <X size={18} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(review.id)} className="inline-flex p-1 text-red-600 hover:bg-red-50 rounded" title="Sil">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
