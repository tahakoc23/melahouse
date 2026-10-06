'use client'

import { useId, useState } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button, Card, Notice } from '@/components/admin/ui'
import { generateMainSku, nextVariantSku } from '@/app/admin/urunler/_lib/slug'
import { COLOR_PRESETS, LOW_STOCK_LIMIT, SIZE_PRESETS, STD_SIZE, compareSizes, normalizeSize, presetHex, sizeLabel } from './constants'
import { ensureCells, parseStock, totalStock } from './logic'
import { StepTitle } from './fields'
import { cellKey, type FieldErrors, type ProductFormState } from './types'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type SetForm = (fn: (s: ProductFormState) => ProductFormState) => void

function detectPreset(sizes: string[]): string {
  if (sizes.includes(STD_SIZE)) return 'standart'
  if (sizes.some(s => /^\d+$/.test(s))) return 'rakam'
  return 'harf'
}

export default function VariantStockCard({
  form,
  setForm,
  errors,
  step,
}: {
  form: ProductFormState
  setForm: SetForm
  errors: FieldErrors
  step: number
}) {
  const [preset, setPreset] = useState(() => detectPreset(form.sizes))
  const [customSize, setCustomSize] = useState('')
  const [bulk, setBulk] = useState('')
  const listId = useId()
  const multiColor = form.colors.length > 1

  const withCells = (s: ProductFormState): ProductFormState => ({ ...s, cells: ensureCells(s) })

  const setSizes = (next: string[]) =>
    setForm(s => withCells({ ...s, sizes: Array.from(new Set(next)).sort(compareSizes) }))

  const toggleSize = (size: string) => {
    const on = form.sizes.includes(size)
    if (on) return setSizes(form.sizes.filter(x => x !== size))
    // "Standart" tek beden demektir; diğer bedenlerle karışmaz
    if (size === STD_SIZE) return setSizes([STD_SIZE])
    setSizes([...form.sizes.filter(x => x !== STD_SIZE), size])
  }

  const addCustomSize = () => {
    const size = normalizeSize(customSize)
    if (!size) return
    setCustomSize('')
    if (!form.sizes.includes(size)) toggleSize(size)
  }

  const addColor = () =>
    setForm(s => {
      const max = s.colors.reduce((m, c) => Math.max(m, Number(c.key.slice(1)) || 0), 0)
      return withCells({ ...s, colors: [...s.colors, { key: `c${max + 1}`, name: '', hex: '' }] })
    })

  const updateColor = (key: string, patch: { name?: string; hex?: string }) =>
    setForm(s => ({
      ...s,
      colors: s.colors.map(c => {
        if (c.key !== key) return c
        const next = { ...c, ...patch }
        if (patch.name !== undefined && patch.hex === undefined) next.hex = presetHex(patch.name) || (presetHex(c.name) ? '' : c.hex)
        return next
      }),
    }))

  const removeColor = (key: string) => setForm(s => ({ ...s, colors: s.colors.filter(c => c.key !== key) }))

  const setCell = (key: string, patch: { stock?: string; sku?: string }) =>
    setForm(s => ({ ...s, cells: { ...s.cells, [key]: { ...s.cells[key], ...patch } } }))

  const applyBulk = () => {
    const n = parseStock(bulk)
    if (n === null || Number.isNaN(n)) return
    setForm(s => {
      const cells = { ...s.cells }
      for (const c of s.colors) for (const size of s.sizes) {
        const k = cellKey(c.key, size)
        if (cells[k]) cells[k] = { ...cells[k], stock: String(n) }
      }
      return { ...s, cells }
    })
    setBulk('')
  }

  /** Henüz kaydedilmemiş varyantlara yeni SKU verir (kayıtlılar değişmez) */
  const regenerateSkus = () =>
    setForm(s => {
      const main = generateMainSku()
      const cells = { ...s.cells }
      const fixed = Object.values(cells).filter(c => c.id)
      const assigned: { sku: string }[] = [...fixed]
      for (const [k, c] of Object.entries(cells)) {
        if (c.id) continue
        const sku = nextVariantSku(main, assigned)
        assigned.push({ sku })
        cells[k] = { ...c, sku }
      }
      return { ...s, mainSku: main, cells }
    })

  const presetSizes = SIZE_PRESETS.find(p => p.id === preset)?.sizes ?? []
  const otherSelected = form.sizes.filter(s => !presetSizes.includes(s))
  const total = totalStock(form)
  const hasNewCells = Object.values(form.cells).some(c => !c.id)

  return (
    <div id="pf-variants" className="scroll-mt-24">
      <Card
        title={<StepTitle n={step}>Beden ve stok</StepTitle>}
        description="Bedenleri seçin, her birinin stok adedini yazın."
      >
        <div className="space-y-5">
          {/* Beden seçimi */}
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink">
              Bedenler<span className="ml-0.5 text-murdum">*</span>
            </legend>
            <div role="radiogroup" aria-label="Beden tipi" className="mb-3 inline-flex rounded-md border border-[#DCD6CF] bg-[#FAF9F7] p-0.5">
              {SIZE_PRESETS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={preset === p.id}
                  onClick={() => setPreset(p.id)}
                  className={cx(
                    'h-8 rounded px-3 text-[13px] font-medium transition-colors cursor-pointer',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink',
                    preset === p.id ? 'bg-white text-ink shadow-sm' : 'text-kul hover:text-ink',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {presetSizes.map(size => {
                const on = form.sizes.includes(size)
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSize(size)}
                    className={cx(
                      'h-9 min-w-[2.75rem] rounded-md border px-3 text-[13px] font-medium transition-colors cursor-pointer',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                      on ? 'border-ink bg-ink text-white' : 'border-[#DCD6CF] bg-white text-ink hover:border-ink',
                    )}
                  >
                    {sizeLabel(size)}
                  </button>
                )
              })}
              {preset !== 'standart' && (
                <button
                  type="button"
                  onClick={() => setSizes([...form.sizes.filter(x => x !== STD_SIZE), ...presetSizes])}
                  className="h-9 rounded-md px-2 text-[13px] text-kul underline-offset-2 hover:text-ink hover:underline cursor-pointer"
                >
                  Tümünü seç
                </button>
              )}
            </div>
            {otherSelected.length > 0 && (
              <p className="mt-2 text-xs text-kul">
                Diğer seçili bedenler:{' '}
                {otherSelected.map((s, i) => (
                  <span key={s}>
                    {i > 0 && ', '}
                    <button type="button" className="font-medium text-ink underline-offset-2 hover:underline cursor-pointer" onClick={() => toggleSize(s)} aria-label={`${sizeLabel(s)} bedenini kaldır`}>
                      {sizeLabel(s)} ×
                    </button>
                  </span>
                ))}
              </p>
            )}
            <div className="mt-3 flex max-w-xs gap-2">
              <input
                type="text"
                value={customSize}
                onChange={e => setCustomSize(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomSize()
                  }
                }}
                placeholder="Başka beden (ör. 3XL, 48)"
                aria-label="Listede olmayan beden"
                className="h-9 w-full rounded-md border border-[#DCD6CF] bg-white px-3 text-sm text-ink placeholder:text-[#A8A19A] focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
              <Button type="button" variant="secondary" size="sm" className="h-9" onClick={addCustomSize} disabled={!customSize.trim()}>
                Ekle
              </Button>
            </div>
            {errors.sizes && (
              <p role="alert" className="mt-1.5 text-xs text-rose-700">
                {errors.sizes}
              </p>
            )}
          </fieldset>

          {/* Renkler (çok renkli ürün) */}
          {multiColor && (
            <fieldset className="space-y-2">
              <legend className="mb-1 text-[13px] font-medium text-ink">Renkler</legend>
              <datalist id={listId}>
                {COLOR_PRESETS.map(c => (
                  <option key={c.name} value={c.name} />
                ))}
              </datalist>
              {form.colors.map((c, i) => (
                <div key={c.key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={c.hex || '#cccccc'}
                    onChange={e => updateColor(c.key, { hex: e.target.value })}
                    aria-label={`${c.name || `Renk ${i + 1}`} renk tonu`}
                    className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-[#DCD6CF] bg-white p-1"
                  />
                  <input
                    type="text"
                    list={listId}
                    value={c.name}
                    onChange={e => updateColor(c.key, { name: e.target.value })}
                    placeholder={i === 0 ? 'Ana renk (Temel bilgiler)' : 'Renk adı, ör. Bej'}
                    aria-label={`Renk ${i + 1} adı`}
                    className="h-9 w-full max-w-xs rounded-md border border-[#DCD6CF] bg-white px-3 text-sm text-ink placeholder:text-[#A8A19A] focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                  {i > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeColor(c.key)} aria-label={`${c.name || 'Bu rengi'} kaldır`} icon={<Trash2 className="h-4 w-4" />}>
                      <span className="sr-only sm:not-sr-only">Kaldır</span>
                    </Button>
                  )}
                </div>
              ))}
              {errors.colors && (
                <p role="alert" className="text-xs text-rose-700">
                  {errors.colors}
                </p>
              )}
            </fieldset>
          )}

          {/* Stok tablosu */}
          {form.sizes.length > 0 ? (
            <div>
              <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={bulk}
                    onChange={e => setBulk(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        applyBulk()
                      }
                    }}
                    placeholder="Adet"
                    aria-label="Tüm bedenlere yazılacak stok"
                    className="h-8 w-20 rounded-md border border-[#DCD6CF] bg-white px-2 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={applyBulk} disabled={bulk === '' || Number.isNaN(parseStock(bulk))}>
                    Tüm bedenlere yaz
                  </Button>
                </div>
                {hasNewCells && (
                  <Button type="button" variant="ghost" size="sm" onClick={regenerateSkus} icon={<RefreshCw className="h-3.5 w-3.5" />}>
                    Yeni SKU üret
                  </Button>
                )}
              </div>

              <div className="overflow-hidden rounded-md border border-[#E7E3DE]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#FAF9F7] text-xs text-kul">
                      <th scope="col" className="px-3 py-2 font-medium">Beden</th>
                      <th scope="col" className="w-28 px-3 py-2 font-medium">Stok</th>
                      <th scope="col" className="px-3 py-2 font-medium">SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.colors.map((c, ci) => (
                      <ColorRows
                        key={c.key}
                        showHeader={multiColor}
                        colorName={c.name || (ci === 0 ? 'Ana renk' : `Renk ${ci + 1}`)}
                        colorHex={c.hex}
                        rows={form.sizes.map(size => {
                          const k = cellKey(c.key, size)
                          return { key: k, size, cell: form.cells[k] }
                        })}
                        onCell={setCell}
                        invalidEmpty={!!errors.stock}
                      />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#FAF9F7]">
                      <td className="px-3 py-2 text-[13px] font-medium text-ink">Toplam</td>
                      <td className="px-3 py-2 text-[13px] font-semibold text-ink" colSpan={2}>
                        {total} adet
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {(errors.stock || errors.sku) && (
                <p role="alert" className="mt-1.5 text-xs text-rose-700">
                  {errors.stock || errors.sku}
                </p>
              )}
              {!errors.stock && (
                <p className="mt-1.5 text-xs text-kul">
                  Stoğu {LOW_STOCK_LIMIT} ve altındaki bedenler listede “Az stok” olarak işaretlenir. Elinizde olmayan bedene 0 yazın.
                </p>
              )}
            </div>
          ) : (
            <Notice tone="neutral">Beden seçince stok tablosu burada açılır.</Notice>
          )}

          <div>
            <Button type="button" variant="secondary" size="sm" onClick={addColor} icon={<Plus className="h-4 w-4" />}>
              Başka renk ekle
            </Button>
            {!multiColor && <p className="mt-1.5 text-xs text-kul">Ürün birden fazla renkte satılıyorsa ekleyin; tablo renk × beden olur.</p>}
          </div>
        </div>
      </Card>
    </div>
  )
}

function ColorRows({
  showHeader,
  colorName,
  colorHex,
  rows,
  onCell,
  invalidEmpty,
}: {
  showHeader: boolean
  colorName: string
  colorHex: string
  rows: { key: string; size: string; cell: { id?: string; sku: string; stock: string } | undefined }[]
  onCell: (key: string, patch: { stock?: string; sku?: string }) => void
  invalidEmpty: boolean
}) {
  return (
    <>
      {showHeader && (
        <tr className="border-t border-[#EFEBE6] bg-white">
          <th scope="rowgroup" colSpan={3} className="px-3 pb-1 pt-3 text-left text-[13px] font-semibold text-ink">
            <span className="inline-flex items-center gap-2">
              {colorHex && <span aria-hidden className="h-3 w-3 rounded-full border border-black/10" style={{ background: colorHex }} />}
              {colorName}
            </span>
          </th>
        </tr>
      )}
      {rows.map(({ key, size, cell }) => {
        if (!cell) return null
        const n = parseStock(cell.stock)
        const bad = Number.isNaN(n) || (invalidEmpty && n === null)
        return (
          <tr key={key} className="border-t border-[#F3F0EC]">
            <td className="px-3 py-1.5 font-medium text-ink">{sizeLabel(size)}</td>
            <td className="px-3 py-1.5">
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={cell.stock}
                onChange={e => onCell(key, { stock: e.target.value })}
                placeholder="0"
                aria-label={`${showHeader ? `${colorName} ` : ''}${sizeLabel(size)} stok`}
                aria-invalid={bad || undefined}
                className={cx(
                  'h-9 w-20 rounded-md border bg-white px-2 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink',
                  bad ? 'border-rose-400' : 'border-[#DCD6CF]',
                )}
              />
            </td>
            <td className="px-3 py-1.5">
              <input
                type="text"
                value={cell.sku}
                onChange={e => onCell(key, { sku: e.target.value.toUpperCase() })}
                aria-label={`${showHeader ? `${colorName} ` : ''}${sizeLabel(size)} SKU`}
                className="h-9 w-full min-w-[9rem] rounded-md border border-[#DCD6CF] bg-white px-2 font-mono text-xs text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </td>
          </tr>
        )
      })}
    </>
  )
}
