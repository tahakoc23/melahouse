'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewSectionProps {
  reviews: Review[];
  productId: string;
}

const RATING_LABELS = ['', 'Hiç beğenmedim', 'Beğenmedim', 'İdare eder', 'Beğendim', 'Çok beğendim'];

export default function ReviewSection({ reviews, productId }: ReviewSectionProps) {
  const { user, loading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const avgRating =
    reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0';

  const renderStars = (value: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <span key={i} aria-hidden className={`text-lg ${i < Math.round(value) ? 'text-gold' : 'text-gray-200'}`}>
        ★
      </span>
    ));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('Yorum yazmak için giriş yapmalısınız.');
      return;
    }
    if (rating < 1) {
      setError('Lütfen 1 ile 5 arasında bir puan seçin.');
      return;
    }
    const text = comment.trim();
    if (text.length < 10) {
      setError('Yorumunuz en az 10 karakter olmalı.');
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await supabase
      .from('reviews')
      .insert({ product_id: productId, user_id: user.id, rating, comment: text.slice(0, 1000) } as never);
    setSubmitting(false);
    if (insertError) {
      setError(
        insertError.code === '23505'
          ? 'Bu ürün için zaten bir yorumunuz var.'
          : 'Yorumunuz gönderilemedi. Lütfen tekrar deneyin.',
      );
      return;
    }
    setSubmitted(true);
    setShowForm(false);
    setRating(0);
    setComment('');
  };

  return (
    <div className="py-12 border-t border-gray-100 mt-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-2xl font-display mb-2">Müşteri Yorumları</h2>
          {reviews.length > 0 ? (
            <div className="flex items-center space-x-4">
              <div className="flex">{renderStars(Number(avgRating))}</div>
              <span className="text-sm font-medium">{avgRating} / 5</span>
              <span className="text-sm text-gray-500">({reviews.length} değerlendirme)</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Henüz yorum yapılmamış. İlk yorumu siz yazın!</p>
          )}
        </div>

        {!submitted && (
          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setError('');
            }}
            className="mt-4 md:mt-0 px-6 py-2 border border-black text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            {showForm ? 'İptal' : 'Yorum Yaz'}
          </button>
        )}
      </div>

      {submitted && (
        <p role="status" className="mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          Teşekkürler! Yorumunuz alındı; onaylandıktan sonra burada yayınlanacak.
        </p>
      )}

      {showForm && (
        <div className="bg-tas/40 p-6 mb-8">
          <h3 className="font-display text-xl mb-4">Değerlendirmeniz</h3>
          {!authLoading && !user ? (
            <p className="text-sm text-gray-600">
              Yorum yazmak için{' '}
              <Link href={`/giris?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`} className="underline">
                giriş yapın
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <fieldset>
                <legend className="block text-sm mb-2">Puanınız</legend>
                <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHover(s)}
                      aria-label={`${s} yıldız`}
                      aria-pressed={rating === s}
                      className={`text-3xl leading-none cursor-pointer transition-colors ${
                        s <= (hover || rating) ? 'text-gold' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-3 text-xs text-gray-500">{RATING_LABELS[hover || rating]}</span>
                </div>
              </fieldset>
              <div>
                <label htmlFor="review-comment" className="block text-sm mb-2">
                  Yorumunuz
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  maxLength={1000}
                  className="w-full border-gray-200 border p-3 focus:border-ink outline-none bg-white"
                  rows={4}
                  placeholder="Kumaş, kalıp ve beden hakkındaki deneyiminizi paylaşın"
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-rose-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="bg-black text-white px-8 py-3 text-sm uppercase tracking-widest hover:bg-murdum transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Gönderiliyor…' : 'Gönder'}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="space-y-6">
        {reviews.map(review => (
          <div key={review.id} className="border-b border-gray-100 pb-6">
            <div className="flex justify-between mb-2">
              <div className="flex space-x-1">{renderStars(review.rating)}</div>
              <span className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
            </div>
            <p className="text-sm font-medium mb-2">Doğrulanmış müşteri</p>
            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
