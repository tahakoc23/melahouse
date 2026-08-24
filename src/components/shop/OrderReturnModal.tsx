// @ts-nocheck
"use client";

import { useState } from "react";
import { Loader2, RefreshCw, X, AlertCircle } from "lucide-react";

interface OrderReturnModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

const RETURN_REASONS = [
  "Beden / Ölçü Uymadı",
  "Ürün Beklentimi Karşılamadı",
  "Kumaş / Kalite Beğenilmedi",
  "Hasarlı / Defolu Ürün",
  "Yanlış / Farklı Ürün Gönderildi",
  "Geç Teslimat",
  "Diğer"
];

export default function OrderReturnModal({
  isOpen,
  order,
  onClose,
  onSuccess
}: OrderReturnModalProps) {
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/shop/return-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          explanation
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İade talebi gönderilemedi.");

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Return request error:", err);
      setError(err.message || "İade talebi oluşturulurken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-inter text-xs">
      <div className="bg-white rounded-xs border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2 text-[#1A1A1A]">
            <RefreshCw className="w-4 h-4 text-[#C5A572]" />
            <h3 className="font-playfair font-semibold text-base">
              İade Talebi Oluştur (#{order.order_number})
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-gray-400 hover:text-black font-bold text-base cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">İade Nedeni *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 border rounded-xs text-xs font-medium bg-white text-[#1A1A1A] border-gray-300 focus:ring-1 focus:ring-[#C5A572]"
            >
              {RETURN_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Açıklama (Opsiyonel)</label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="İade etmek isteme nedeniniz hakkında ek bilgi verebilirsiniz..."
              className="w-full p-2.5 border rounded-xs text-xs border-gray-300 focus:ring-1 focus:ring-[#C5A572]"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xs text-[11px] text-amber-900 leading-relaxed">
            <p className="font-bold">14 Günlük Kolay İade Bilgilendirmesi:</p>
            <p className="mt-0.5">İade talebiniz yöneticilerimiz tarafından incelenecek ve adresinize kargo anlaşma kodu tanımlanacaktır.</p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xs text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>İade Talebini Gönder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
