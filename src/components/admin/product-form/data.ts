/**
 * Ürün yönetimi veri katmanı (tarayıcı Supabase istemcisi; yazmalara admin RLS izin verir).
 * Her Supabase hatası kontrol edilir; yeni üründe görsel/varyant eklenemezse ürün geri silinir.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { formatTurkishPrice } from '@/app/admin/urunler/_lib/price'
import { generateMainSku, pickUniqueSlug, slugifyTr } from '@/app/admin/urunler/_lib/slug'
import {
  DETAIL_OPTIONS,
  OUT_OF_STOCK_TAG,
  STD_SIZE,
  compareSizes,
  foreignTags,
  parentCategoryName,
  presetHex,
  trLower,
  type CategoryRow,
} from './constants'
import { activeVariants, parseStock, priceNumbers } from './logic'
import { cellKey, type ProductFormState, type ScrapedInfo, type StockCell, type SupplierRow } from './types'

// Tabloların bir kısmı (suppliers, supplier_products, product_costs, is_out_of_stock) üretilmiş
// tiplerde yok; bu katman tipsiz istemci kullanır ve satırları aşağıdaki arayüzlerle karşılar.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, 'public', any>
let client: Db | null = null
export function db(): Db {
  if (!client) client = createClient() as unknown as Db
  return client
}

type PgError = { message: string; code?: string } | null

function friendly(err: PgError, fallback: string): string {
  if (!err) return fallback
  if (err.code === '23505') {
    if (/sku/i.test(err.message)) return 'Bu SKU kodu başka bir üründe kullanılıyor. SKU’yu değiştirin.'
    if (/slug/i.test(err.message)) return 'Bu URL başka bir ürün tarafından kullanılıyor.'
    return 'Aynı kayıt zaten var.'
  }
  if (err.code === '42501' || /row-level security/i.test(err.message)) return 'Bu işlem için yetkiniz yok. Yeniden giriş yapın.'
  return `${fallback} (${err.message})`
}

/* ------------------------------------------------------------------ */
/* Seçenekler                                                          */
/* ------------------------------------------------------------------ */

export async function loadCategories(): Promise<CategoryRow[]> {
  const { data, error } = await db().from('categories').select('id, name, slug, parent_id, is_active').order('name')
  if (error) throw new Error(friendly(error, 'Kategoriler yüklenemedi'))
  return (data || []) as CategoryRow[]
}

export async function loadSuppliers(): Promise<SupplierRow[]> {
  const { data, error } = await db().from('suppliers').select('id, name, domain, website_url').order('name')
  if (error) throw new Error(friendly(error, 'Toptancılar yüklenemedi'))
  return (data || []) as SupplierRow[]
}

export async function createSupplier(name: string, productUrl?: string): Promise<SupplierRow> {
  let website_url: string | undefined
  if (productUrl) {
    try {
      website_url = new URL(productUrl).origin
    } catch {
      website_url = undefined
    }
  }
  const res = await fetch('/api/admin/suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim(), website_url }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.supplier) throw new Error(json.error || 'Toptancı eklenemedi.')
  return json.supplier as SupplierRow
}

export async function scrapeSupplierUrl(url: string): Promise<ScrapedInfo> {
  const res = await fetch('/api/admin/suppliers/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'scrape_preview', product_url: url.trim() }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.data) throw new Error(json.error || 'Ürün bilgileri alınamadı. Linki kontrol edin.')
  return json.data as ScrapedInfo
}

/* ------------------------------------------------------------------ */
/* Boş form                                                            */
/* ------------------------------------------------------------------ */

export function emptyForm(): ProductFormState {
  return {
    name: '',
    slug: '',
    categoryId: '',
    description: '',
    fabric: '',
    care: '',
    details: [],
    images: [],
    imageAlts: {},
    colors: [{ key: 'c1', name: '', hex: '' }],
    sizes: [],
    cells: {},
    mainSku: generateMainSku(),
    cost: '',
    base: '',
    sale: '',
    isActive: true,
    isFeatured: false,
    isNew: true,
    outOfStock: false,
    supplier: { supplierId: '', url: '', linkId: null, sourceId: null, scraped: null },
  }
}

const priceText = (n: unknown) => {
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? formatTurkishPrice(v) : ''
}

/* ------------------------------------------------------------------ */
/* Ürün yükleme (düzenleme)                                            */
/* ------------------------------------------------------------------ */

export interface LoadedProduct {
  state: ProductFormState
  originalSlug: string
  originalVariantIds: string[]
  /** Formun yönetmediği etiketler (korunur) */
  extraTags: string[]
  isActiveSaved: boolean
}

interface ProductRow {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  fabric_info: string | null
  care_instructions: string | null
  base_price: number | null
  sale_price: number | null
  category_id: string | null
  is_featured: boolean | null
  is_new: boolean | null
  is_active: boolean | null
  tags: string[] | null
  is_out_of_stock: boolean | null
}

interface VariantRow {
  id: string
  color_name: string | null
  color_hex: string | null
  size: string | null
  sku: string | null
  stock_quantity: number | null
  is_active: boolean | null
}

export async function loadProduct(id: string, categories: CategoryRow[]): Promise<LoadedProduct | null> {
  const d = db()
  const [prodRes, imgRes, varRes, costRes, linkRes] = await Promise.all([
    d.from('products').select('*').eq('id', id).maybeSingle(),
    d.from('product_images').select('image_url, alt_text, sort_order, is_primary').eq('product_id', id).order('sort_order'),
    d.from('product_variants').select('id, color_name, color_hex, size, sku, stock_quantity, is_active, created_at').eq('product_id', id).order('created_at'),
    d.from('product_costs').select('cost_price').eq('product_id', id).maybeSingle(),
    d.from('supplier_products').select('id, supplier_id, product_url, price').eq('admin_product_id', id).order('created_at', { ascending: false }).limit(1),
  ])
  if (prodRes.error) throw new Error(friendly(prodRes.error, 'Ürün yüklenemedi'))
  if (!prodRes.data) return null
  if (imgRes.error) throw new Error(friendly(imgRes.error, 'Görseller yüklenemedi'))
  if (varRes.error) throw new Error(friendly(varRes.error, 'Bedenler yüklenemedi'))
  // Maliyet ve toptancı tabloları yalnızca admin içindir; okunamazsa form yine açılır.
  const p = prodRes.data as ProductRow
  const tags = Array.isArray(p.tags) ? p.tags : []

  // Görseller: önce kapak, sonra sıra
  const imgs = ((imgRes.data || []) as { image_url: string | null; alt_text: string | null; sort_order: number | null; is_primary: boolean | null }[])
    .filter(i => i.image_url)
    .sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const images = imgs.map(i => i.image_url as string)
  const imageAlts: Record<string, string> = {}
  imgs.forEach(i => {
    if (i.alt_text) imageAlts[i.image_url as string] = i.alt_text
  })

  // Varyantlar: siparişte kullanıldığı için pasifleştirilmiş olanlar gizli kalır
  const vars = ((varRes.data || []) as VariantRow[]).filter(v => v.is_active !== false)
  const colorKeys = new Map<string, string>()
  const colors: ProductFormState['colors'] = []
  const sizes: string[] = []
  const cells: Record<string, StockCell> = {}
  for (const v of vars) {
    const name = (v.color_name || '').trim()
    const norm = trLower(name)
    let key = colorKeys.get(norm)
    if (!key) {
      key = `c${colors.length + 1}`
      colorKeys.set(norm, key)
      colors.push({ key, name, hex: v.color_hex || presetHex(name) || '' })
    }
    const size = (v.size || STD_SIZE).trim() || STD_SIZE
    if (!sizes.includes(size)) sizes.push(size)
    cells[cellKey(key, size)] = { id: v.id, sku: v.sku || '', stock: String(Math.max(0, v.stock_quantity ?? 0)) }
  }
  if (colors.length === 0) colors.push({ key: 'c1', name: '', hex: '' })
  sizes.sort(compareSizes)

  const firstSku = vars.find(v => v.sku)?.sku || ''
  const skuParts = firstSku.split('-')
  const mainSku = skuParts.length >= 4 ? skuParts.slice(0, -1).join('-') : generateMainSku()

  const link = !linkRes.error ? ((linkRes.data || [])[0] as { id: string; supplier_id: string | null; product_url: string | null; price: number | null } | undefined) : undefined
  const costValue = !costRes.error && costRes.data ? Number((costRes.data as { cost_price: number | null }).cost_price) : NaN
  const cost = Number.isFinite(costValue) && costValue > 0 ? costValue : Number(link?.price) || 0

  const details = DETAIL_OPTIONS.filter(o => tags.some(t => trLower(t) === trLower(o)))

  const state: ProductFormState = {
    name: p.name || '',
    slug: p.slug || '',
    categoryId: p.category_id || '',
    description: p.description || p.short_description || '',
    fabric: p.fabric_info || '',
    care: p.care_instructions || '',
    details,
    images,
    imageAlts,
    colors,
    sizes,
    cells,
    mainSku,
    cost: priceText(cost),
    base: priceText(p.base_price),
    sale: priceText(p.sale_price),
    isActive: p.is_active !== false,
    isFeatured: !!p.is_featured,
    isNew: !!p.is_new,
    outOfStock: p.is_out_of_stock === true || tags.includes(OUT_OF_STOCK_TAG),
    supplier: {
      supplierId: link?.supplier_id || '',
      url: link?.product_url || '',
      linkId: link?.id || null,
      sourceId: null,
      scraped: null,
    },
  }

  return {
    state,
    originalSlug: p.slug || '',
    originalVariantIds: vars.map(v => v.id),
    extraTags: foreignTags(tags, categories),
    isActiveSaved: p.is_active !== false,
  }
}

/** /admin/urunler/yeni?from_supplier=<id> için toptancı ürünü */
export interface SupplierProductRow {
  id: string
  supplier_id: string | null
  admin_product_id: string | null
  title: string | null
  product_url: string | null
  sku: string | null
  price: number | null
  stock_status: string | null
  color: string | null
  fabric: string | null
  description: string | null
  image_url: string | null
  raw_metadata: Record<string, unknown> | null
}

export async function loadSupplierProduct(id: string): Promise<SupplierProductRow | null> {
  const { data, error } = await db().from('supplier_products').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(friendly(error, 'Toptancı ürünü yüklenemedi'))
  return (data as SupplierProductRow) || null
}

/* ------------------------------------------------------------------ */
/* Kaydetme                                                            */
/* ------------------------------------------------------------------ */

export interface SaveContext {
  mode: 'create' | 'edit'
  productId?: string
  originalSlug: string
  originalVariantIds: string[]
  extraTags: string[]
  categories: CategoryRow[]
}

export interface SaveResult {
  id: string
  slug: string
  /** Ürün kaydedildi ama bazı yan adımlar başarısız oldu */
  problems: string[]
  /** Yeni eklenen varyantların id'leri (hücre anahtarına göre) */
  insertedIds: Record<string, string>
  /** Silinen/pasifleştirilen varyant id'leri */
  removedIds: string[]
  /** Toptancı bağlantı satırı id'si (oluşturulduysa/korunduysa) */
  linkId: string | null
}

function buildTags(s: ProductFormState, ctx: SaveContext): string[] {
  const tags: string[] = []
  const cat = ctx.categories.find(c => c.id === s.categoryId)
  if (cat) {
    tags.push(cat.name)
    const parent = parentCategoryName(cat, ctx.categories)
    if (parent && parent !== cat.name) tags.push(parent)
  }
  tags.push(...s.details)
  for (const t of ctx.extraTags) if (!tags.some(x => trLower(x) === trLower(t))) tags.push(t)
  if (s.outOfStock) tags.push(OUT_OF_STOCK_TAG)
  return tags
}

function productPayload(s: ProductFormState, ctx: SaveContext, slug: string) {
  const p = priceNumbers(s)
  const description = s.description.trim()
  return {
    name: s.name.trim(),
    slug,
    description,
    short_description: description,
    fabric_info: s.fabric.trim(),
    care_instructions: s.care.trim(),
    base_price: p.base && p.base > 0 ? p.base : 0,
    sale_price: p.sale && p.sale > 0 ? p.sale : null,
    category_id: s.categoryId || null,
    tags: buildTags(s, ctx),
    is_active: s.isActive,
    is_featured: s.isFeatured,
    is_new: s.isNew,
    is_out_of_stock: s.outOfStock,
    seo_title: s.name.trim(),
    seo_description: description.replace(/\s+/g, ' ').slice(0, 155),
  }
}

function variantRecord(v: ReturnType<typeof activeVariants>[number]) {
  const n = parseStock(v.cell.stock)
  return {
    color_name: v.colorName || null,
    color_hex: v.colorHex || presetHex(v.colorName) || null,
    size: v.size,
    sku: v.cell.sku.trim(),
    stock_quantity: n && !Number.isNaN(n) ? n : 0,
    is_active: true,
  }
}

function imageRecords(s: ProductFormState, productId: string) {
  return s.images.map((url, idx) => ({
    product_id: productId,
    image_url: url,
    alt_text: s.imageAlts[url]?.trim() || null,
    sort_order: idx,
    is_primary: idx === 0,
  }))
}

async function saveCost(productId: string, s: ProductFormState): Promise<string | null> {
  const { cost } = priceNumbers(s)
  const d = db()
  if (cost !== null && cost > 0) {
    const { error } = await d
      .from('product_costs')
      .upsert({ product_id: productId, cost_price: cost, updated_at: new Date().toISOString() }, { onConflict: 'product_id' })
    return error ? friendly(error, 'Alış fiyatı kaydedilemedi') : null
  }
  const { error } = await d.from('product_costs').delete().eq('product_id', productId)
  return error ? friendly(error, 'Alış fiyatı silinemedi') : null
}

/** Toptancı bağlantısı: mevcut satırı günceller, kaynak satırı bağlar ya da yenisini ekler. */
async function saveSupplierLink(productId: string, s: ProductFormState): Promise<{ linkId: string | null; problem: string | null }> {
  const d = db()
  const sup = s.supplier
  const url = sup.url.trim()
  const { cost } = priceNumbers(s)
  const common: Record<string, unknown> = { admin_product_id: productId, supplier_id: sup.supplierId || null }
  if (cost !== null && cost > 0) common.price = cost

  // 1. Zaten bağlı satır
  if (sup.linkId) {
    if (!url && !sup.supplierId) {
      // Bağlantı kaldırıldı: toptancı ürünü listede kalır, sadece bu üründen ayrılır
      const { error } = await d.from('supplier_products').update({ admin_product_id: null }).eq('id', sup.linkId)
      return { linkId: error ? sup.linkId : null, problem: error ? friendly(error, 'Toptancı bağlantısı kaldırılamadı') : null }
    }
    const patch = { ...common, ...(url ? { product_url: url } : {}) }
    const { error } = await d.from('supplier_products').update(patch).eq('id', sup.linkId)
    return { linkId: sup.linkId, problem: error ? friendly(error, 'Toptancı bağlantısı kaydedilemedi') : null }
  }

  // 2. Toptancılar sayfasından gelen ürün: o satırı bu ürüne bağla
  if (sup.sourceId) {
    const patch = { ...common, ...(url ? { product_url: url } : {}) }
    const { error } = await d.from('supplier_products').update(patch).eq('id', sup.sourceId)
    return { linkId: error ? null : sup.sourceId, problem: error ? friendly(error, 'Toptancı ürünü bağlanamadı') : null }
  }

  if (!url) {
    return {
      linkId: null,
      problem: sup.supplierId ? 'Toptancı kaydedilmedi: bağlantı için toptancıdaki ürün linki gerekir.' : null,
    }
  }

  // 3. Aynı link daha önce kaydedilmişse onu kullan, yoksa yeni satır
  const { data: existing, error: findErr } = await d
    .from('supplier_products')
    .select('id, admin_product_id')
    .eq('product_url', url)
    .limit(1)
  if (findErr) return { linkId: null, problem: friendly(findErr, 'Toptancı bağlantısı kaydedilemedi') }
  const found = (existing || [])[0] as { id: string; admin_product_id: string | null } | undefined
  if (found && (!found.admin_product_id || found.admin_product_id === productId)) {
    const { error } = await d.from('supplier_products').update(common).eq('id', found.id)
    return { linkId: error ? null : found.id, problem: error ? friendly(error, 'Toptancı bağlantısı kaydedilemedi') : null }
  }

  const sc = sup.scraped
  const { data: inserted, error } = await d
    .from('supplier_products')
    .insert({
      ...common,
      title: sc?.title || s.name.trim(),
      product_url: url,
      sku: sc?.sku || null,
      price: cost ?? sc?.price ?? 0,
      stock_status: sc?.stock_status || (s.outOfStock ? 'stokta_yok' : 'stokta_var'),
      color: sc?.color || s.colors[0]?.name || null,
      fabric: sc?.fabric || s.fabric.trim() || null,
      description: sc?.description || null,
      image_url: sc?.image_url || s.images[0] || null,
      raw_metadata: { ...(sc?.raw_metadata || {}), sizes: sc?.sizes || s.sizes.join(', ') },
    })
    .select('id')
    .single()
  if (error) return { linkId: null, problem: friendly(error, 'Toptancı bağlantısı kaydedilemedi') }
  return { linkId: (inserted as { id: string }).id, problem: null }
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let q = db().from('products').select('id, slug').like('slug', `${base}%`)
  if (excludeId) q = q.neq('id', excludeId)
  const { data, error } = await q
  if (error) throw new Error(friendly(error, 'URL kontrol edilemedi'))
  return pickUniqueSlug(base, ((data || []) as { slug: string }[]).map(r => r.slug))
}

export async function saveProduct(s: ProductFormState, ctx: SaveContext): Promise<SaveResult> {
  return ctx.mode === 'create' ? createProduct(s, ctx) : updateProduct(s, ctx)
}

async function createProduct(s: ProductFormState, ctx: SaveContext): Promise<SaveResult> {
  const d = db()
  const base = slugifyTr(s.slug) || slugifyTr(s.name) || `urun-${Date.now()}`
  const slug = await uniqueSlug(base)

  const { data: created, error: prodErr } = await d.from('products').insert(productPayload(s, ctx, slug)).select('id').single()
  if (prodErr || !created) throw new Error(friendly(prodErr, 'Ürün kaydedilemedi'))
  const id = (created as { id: string }).id

  const rollback = async (message: string): Promise<never> => {
    await d.from('product_images').delete().eq('product_id', id)
    await d.from('product_variants').delete().eq('product_id', id)
    await d.from('products').delete().eq('id', id)
    throw new Error(`${message} Ürün kaydedilmedi, tekrar deneyin.`)
  }

  if (s.images.length > 0) {
    const { error } = await d.from('product_images').insert(imageRecords(s, id))
    if (error) await rollback(friendly(error, 'Görseller kaydedilemedi') + '.')
  }

  const active = activeVariants(s)
  const insertedIds: Record<string, string> = {}
  if (active.length > 0) {
    const { data: rows, error } = await d
      .from('product_variants')
      .insert(active.map(v => ({ product_id: id, ...variantRecord(v) })))
      .select('id, sku')
    if (error) await rollback(friendly(error, 'Bedenler kaydedilemedi') + '.')
    const bySku = new Map(((rows || []) as { id: string; sku: string }[]).map(r => [r.sku, r.id]))
    active.forEach(v => {
      const vid = bySku.get(v.cell.sku.trim())
      if (vid) insertedIds[v.key] = vid
    })
  }

  const problems: string[] = []
  const costProblem = await saveCost(id, s)
  if (costProblem) problems.push(costProblem)
  const link = await saveSupplierLink(id, s)
  if (link.problem) problems.push(link.problem)

  return { id, slug, problems, insertedIds, removedIds: [], linkId: link.linkId }
}

async function updateProduct(s: ProductFormState, ctx: SaveContext): Promise<SaveResult> {
  const d = db()
  const id = ctx.productId as string
  const slug = slugifyTr(s.slug) || ctx.originalSlug
  if (!slug) throw new Error('Geçerli bir URL yazın.')

  if (slug !== ctx.originalSlug) {
    const { data: clash, error } = await d.from('products').select('id').eq('slug', slug).neq('id', id).limit(1)
    if (error) throw new Error(friendly(error, 'URL kontrol edilemedi'))
    if (clash && clash.length > 0) throw new Error(`“${slug}” adresi başka bir üründe kullanılıyor. Farklı bir URL yazın.`)
  }

  const { error: prodErr } = await d.from('products').update(productPayload(s, ctx, slug)).eq('id', id)
  if (prodErr) throw new Error(friendly(prodErr, 'Ürün kaydedilemedi'))

  const problems: string[] = []

  // Görseller: önce yeni seti ekle, sonra eskileri sil (ekleme başarısızsa ürün görselsiz kalmaz)
  const { data: oldImgs, error: oldImgErr } = await d.from('product_images').select('id').eq('product_id', id)
  if (oldImgErr) {
    problems.push(friendly(oldImgErr, 'Görseller okunamadı'))
  } else {
    let ok = true
    if (s.images.length > 0) {
      const { error } = await d.from('product_images').insert(imageRecords(s, id))
      if (error) {
        ok = false
        problems.push(friendly(error, 'Görseller kaydedilemedi'))
      }
    }
    const oldIds = ((oldImgs || []) as { id: string }[]).map(r => r.id)
    if (ok && oldIds.length > 0) {
      const { error } = await d.from('product_images').delete().in('id', oldIds)
      if (error) problems.push(friendly(error, 'Eski görseller silinemedi'))
    }
  }

  // Varyantlar: id ile güncelle, yenileri ekle, çıkarılanları sil (siparişte geçiyorsa gizle + stok 0)
  const active = activeVariants(s)
  const keptIds = new Set(active.map(v => v.cell.id).filter(Boolean) as string[])
  const removedIds: string[] = []
  for (const vid of ctx.originalVariantIds.filter(v => !keptIds.has(v))) {
    const { error: delErr } = await d.from('product_variants').delete().eq('id', vid)
    if (delErr) {
      const { error: deactErr } = await d.from('product_variants').update({ is_active: false, stock_quantity: 0 }).eq('id', vid)
      if (deactErr) {
        problems.push(friendly(deactErr, 'Bir beden kaldırılamadı'))
        continue
      }
    }
    removedIds.push(vid)
  }

  for (const v of active.filter(v => v.cell.id)) {
    const { error } = await d.from('product_variants').update(variantRecord(v)).eq('id', v.cell.id as string)
    if (error) problems.push(friendly(error, `${v.cell.sku} güncellenemedi`))
  }

  const insertedIds: Record<string, string> = {}
  const fresh = active.filter(v => !v.cell.id)
  if (fresh.length > 0) {
    const { data: rows, error } = await d
      .from('product_variants')
      .insert(fresh.map(v => ({ product_id: id, ...variantRecord(v) })))
      .select('id, sku')
    if (error) {
      problems.push(friendly(error, 'Yeni bedenler eklenemedi'))
    } else {
      const bySku = new Map(((rows || []) as { id: string; sku: string }[]).map(r => [r.sku, r.id]))
      fresh.forEach(v => {
        const vid = bySku.get(v.cell.sku.trim())
        if (vid) insertedIds[v.key] = vid
      })
    }
  }

  const costProblem = await saveCost(id, s)
  if (costProblem) problems.push(costProblem)
  const link = await saveSupplierLink(id, s)
  if (link.problem) problems.push(link.problem)

  return { id, slug, problems, insertedIds, removedIds, linkId: link.linkId }
}

/* ------------------------------------------------------------------ */
/* Liste işlemleri                                                     */
/* ------------------------------------------------------------------ */

export interface ListProduct {
  id: string
  name: string
  slug: string
  base_price: number | null
  sale_price: number | null
  is_active: boolean | null
  is_out_of_stock: boolean | null
  tags: string[] | null
  category_id: string | null
  created_at: string | null
  categories: { name: string } | null
  product_images: { image_url: string | null; is_primary: boolean | null; sort_order: number | null }[]
  product_variants: { id: string; sku: string | null; stock_quantity: number | null; is_active: boolean | null }[]
}

export async function loadProductList(): Promise<ListProduct[]> {
  const { data, error } = await db()
    .from('products')
    .select(
      'id, name, slug, base_price, sale_price, is_active, is_out_of_stock, tags, category_id, created_at, categories(name), product_images(image_url, is_primary, sort_order), product_variants(id, sku, stock_quantity, is_active)',
    )
    .order('created_at', { ascending: false })
  if (error) throw new Error(friendly(error, 'Ürünler yüklenemedi'))
  return (data || []) as unknown as ListProduct[]
}

export async function setProductActive(id: string, active: boolean): Promise<void> {
  const { error } = await db().from('products').update({ is_active: active }).eq('id', id)
  if (error) throw new Error(friendly(error, 'Durum değiştirilemedi'))
}

export async function deleteProduct(id: string): Promise<void> {
  // Görseller, bedenler, maliyet, yorumlar ve favoriler veritabanında ON DELETE CASCADE;
  // sipariş kalemleri ürün adını sakladığı için geçmiş siparişler bozulmaz (product_id NULL olur).
  const { error } = await db().from('products').delete().eq('id', id)
  if (error) throw new Error(friendly(error, 'Ürün silinemedi'))
}

/** Ürünü taslak olarak kopyalar (görseller, aktif bedenler yeni SKU ile, alış fiyatı). */
export async function duplicateProduct(id: string): Promise<{ id: string; name: string }> {
  const d = db()
  const [prodRes, imgRes, varRes, costRes] = await Promise.all([
    d.from('products').select('*').eq('id', id).single(),
    d.from('product_images').select('image_url, alt_text, sort_order, is_primary').eq('product_id', id).order('sort_order'),
    d.from('product_variants').select('color_name, color_hex, color_image_url, size, stock_quantity, price_override, is_active, created_at').eq('product_id', id).order('created_at'),
    d.from('product_costs').select('cost_price').eq('product_id', id).maybeSingle(),
  ])
  if (prodRes.error || !prodRes.data) throw new Error(friendly(prodRes.error, 'Ürün okunamadı'))
  if (imgRes.error) throw new Error(friendly(imgRes.error, 'Görseller okunamadı'))
  if (varRes.error) throw new Error(friendly(varRes.error, 'Bedenler okunamadı'))

  const src = prodRes.data as Record<string, unknown>
  const name = `${String(src.name || '').trim()} (kopya)`
  const slug = await uniqueSlug(`${slugifyTr(String(src.slug || src.name || 'urun'))}-kopya`)

  const copy: Record<string, unknown> = { ...src }
  delete copy.id
  delete copy.created_at
  delete copy.updated_at
  copy.name = name
  copy.slug = slug
  copy.is_active = false
  copy.seo_title = name

  const { data: created, error: insErr } = await d.from('products').insert(copy).select('id').single()
  if (insErr || !created) throw new Error(friendly(insErr, 'Kopya oluşturulamadı'))
  const newId = (created as { id: string }).id

  const fail = async (msg: string): Promise<never> => {
    await d.from('products').delete().eq('id', newId)
    throw new Error(`${msg} Kopya oluşturulmadı.`)
  }

  const imgs = (imgRes.data || []) as Record<string, unknown>[]
  if (imgs.length) {
    const { error } = await d.from('product_images').insert(imgs.map(i => ({ ...i, product_id: newId })))
    if (error) await fail(friendly(error, 'Görseller kopyalanamadı') + '.')
  }

  const vars = ((varRes.data || []) as Record<string, unknown>[]).filter(v => v.is_active !== false)
  if (vars.length) {
    const main = generateMainSku()
    const rows = vars.map((v, i) => {
      const r = { ...v }
      delete r.created_at
      return { ...r, product_id: newId, sku: `${main}-${i + 1}`, is_active: true }
    })
    const { error } = await d.from('product_variants').insert(rows)
    if (error) await fail(friendly(error, 'Bedenler kopyalanamadı') + '.')
  }

  const cost = !costRes.error && costRes.data ? Number((costRes.data as { cost_price: number }).cost_price) : 0
  if (cost > 0) {
    await d.from('product_costs').upsert({ product_id: newId, cost_price: cost, updated_at: new Date().toISOString() }, { onConflict: 'product_id' })
  }
  return { id: newId, name }
}
