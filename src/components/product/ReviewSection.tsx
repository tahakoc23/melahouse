'use client';

import { useState } from 'react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  users?: {
    full_name: string;
  };
}

interface ReviewSectionProps {
  reviews: Review[];
  productId: string;
}

export default function ReviewSection({ reviews, productId }: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);
  
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`text-lg ${i < Math.round(rating) ? 'text-[#C5A572]' : 'text-gray-200'}`}>
        ★
      </span>
    ));
  };

  return (
    <div className="py-12 border-t border-gray-100 mt-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-2xl font-playfair mb-2">Müşteri Yorumları</h2>
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
        
        <button 
          onClick={() => setShowForm(!showForm)}
          className="mt-4 md:mt-0 px-6 py-2 border border-black text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
        >
          {showForm ? 'İptal' : 'Yorum Yaz'}
        </button>
      </div>

      {showForm && (
        <div className="bg-cream-50 p-6 mb-8">
          <h3 className="font-playfair text-xl mb-4">Değerlendirmeniz</h3>
          {/* Form UI placeholder since we don't have auth state yet */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Puanınız</label>
              <div className="flex space-x-1 cursor-pointer">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} className="text-2xl text-gray-300 hover:text-[#C5A572]">★</span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2">Yorumunuz</label>
              <textarea 
                className="w-full border-gray-200 border p-3 focus:ring-[#C5A572] focus:border-[#C5A572] outline-none" 
                rows={4} 
              />
            </div>
            <button className="bg-black text-white px-8 py-3 text-sm uppercase tracking-widest hover:bg-[#C5A572] transition-colors">
              Gönder
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {reviews.map(review => (
          <div key={review.id} className="border-b border-gray-100 pb-6">
            <div className="flex justify-between mb-2">
              <div className="flex space-x-1">
                {renderStars(review.rating)}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString('tr-TR')}
              </span>
            </div>
            <p className="text-sm font-medium mb-2">{review.users?.full_name || 'Gizli Kullanıcı'}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
