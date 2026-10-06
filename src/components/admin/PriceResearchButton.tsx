'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, X } from 'lucide-react'
import PriceResearchPanel from './PriceResearchPanel'

interface Props {
  productName: string
  fabric?: string
  costPrice?: number
  onApplyPrice: (price: number) => void
}

/** Ürün formundaki fiyat alanının altında: piyasa araştırmasını modal içinde açar. */
export default function PriceResearchButton({ productName, fabric, costPrice, onApplyPrice }: Props) {
  const [open, setOpen] = useState(false)
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setRunKey(k => k + 1)
          setOpen(true)
        }}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-[#C5A572] text-[#1A1A1A] hover:bg-[#C5A572] hover:text-white rounded-xs text-xs font-semibold transition-colors cursor-pointer"
      >
        <TrendingUp size={14} /> Piyasa fiyatını araştır
      </button>
      {!productName.trim() && (
        <p className="text-[10px] text-gray-400 mt-1">Önce ürün adını girin; araştırma bu ada göre yapılır.</p>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center overflow-y-auto p-4 md:p-10"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Piyasa fiyat araştırması"
        >
          <div className="bg-[#FAFAF8] w-full max-w-5xl rounded-md shadow-2xl p-5 md:p-6 relative" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 p-1.5 hover:bg-gray-200 rounded-full cursor-pointer"
              aria-label="Kapat"
            >
              <X size={16} />
            </button>
            <PriceResearchPanel
              key={runKey}
              compact
              initialQuery={productName}
              fabric={fabric}
              costPrice={costPrice}
              autoRun={!!productName.trim()}
              onApplyPrice={price => {
                onApplyPrice(price)
                setOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
