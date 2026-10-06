'use client'

import { useState } from 'react'
import PriceResearchPanel from '@/components/admin/PriceResearchPanel'
import { Card, ChipGroup, Field, PageHeader, Select, TextInput } from '@/components/admin/ui'
import { CATEGORIES, COLORS, DETAILS, FABRICS } from '@/lib/research/dictionary'
import { parseTurkishPrice, sanitizePriceInput } from '@/app/admin/urunler/_lib/price'

const FABRIC_CHIPS = FABRICS.filter(f => f.key !== 'polyester').map(f => ({ value: f.label }))
const COLOR_CHIPS = COLORS.map(c => ({ value: c.label }))
const DETAIL_CHIPS = DETAILS.map(d => ({ value: d.label }))

export default function PriceResearchPage() {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [fabric, setFabric] = useState('')
  const [details, setDetails] = useState<string[]>([])
  const [costInput, setCostInput] = useState('')
  // Panel, "Araştır"a basıldığı andaki bilgilerle yeniden kurulur
  const [runKey, setRunKey] = useState(0)
  const [submitted, setSubmitted] = useState<null | {
    name: string
    category: string
    color: string
    fabric: string
    details: string[]
  }>(null)

  const cost = parseTurkishPrice(costInput) ?? undefined
  const canSearch = name.trim().length > 1 || !!category

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Fiyat araştırması"
        description="Bir ürünün piyasadaki fiyatını öğrenin. Ürün tipini, rengini, kumaşını ve modelini ne kadar doğru girerseniz sonuçlar o kadar isabetli olur."
      />

      <Card title="Ürün bilgisi">
        <form
          className="space-y-5"
          onSubmit={e => {
            e.preventDefault()
            if (!canSearch) return
            setSubmitted({ name, category, color, fabric, details })
            setRunKey(k => k + 1)
          }}
        >
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
            <TextInput
              label="Ürün adı"
              placeholder="ör. Kruvaze yaka saten midi elbise"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Select label="Ürün tipi" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Seçin</option>
              {CATEGORIES.map(c => (
                <option key={c.key} value={c.label}>
                  {c.label}
                </option>
              ))}
            </Select>
            <TextInput
              label="Alış fiyatı (isteğe bağlı)"
              inputMode="decimal"
              placeholder="ör. 1.250"
              suffix="₺"
              value={costInput}
              onChange={e => setCostInput(sanitizePriceInput(e.target.value))}
              hint="Kâr marjını hesaplamak için"
            />
          </div>

          <Field label="Renk">
            <ChipGroup options={COLOR_CHIPS} value={color ? [color] : []} onChange={v => setColor(v[0] || '')} multiple={false} />
          </Field>
          <Field label="Kumaş">
            <ChipGroup options={FABRIC_CHIPS} value={fabric ? [fabric] : []} onChange={v => setFabric(v[0] || '')} multiple={false} />
          </Field>
          <Field label="Model detayları" hint="Boy, kol ve yaka seçimi en çok isabeti artırır.">
            <ChipGroup options={DETAIL_CHIPS} value={details} onChange={setDetails} />
          </Field>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSearch}
              className="inline-flex h-11 items-center justify-center rounded-md bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-murdum disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Piyasayı araştır
            </button>
          </div>
        </form>
      </Card>

      {submitted && (
        <div className="mt-6">
          <PriceResearchPanel key={runKey} autoRun attributes={submitted} costPrice={cost} />
        </div>
      )}
    </div>
  )
}
