/**
 * Sipariş durumu etiketleri ve admin sayfalarında ortak kullanılan küçük yardımcılar.
 * Durum listesi veritabanındaki orders_status_check kısıtıyla birebir aynıdır.
 */

import type { ComponentProps } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Badge } from './index'

export type BadgeTone = NonNullable<ComponentProps<typeof Badge>['tone']>

export const ORDER_STATUSES = [
  'odeme_bekliyor',
  'siparis_alindi',
  'odeme_alindi',
  'hazirlaniyor',
  'kargoya_verildi',
  'teslim_edildi',
  'iade_talebi',
  'iade_edildi',
  'iptal_edildi',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: BadgeTone; hint: string }> = {
  odeme_bekliyor: { label: 'Ödeme bekliyor', tone: 'warning', hint: 'Müşteri kartla ödemeyi henüz tamamlamadı.' },
  siparis_alindi: { label: 'Yeni · kapıda ödeme', tone: 'info', hint: 'Ödeme teslimatta alınacak.' },
  odeme_alindi: { label: 'Yeni · ödendi', tone: 'info', hint: 'Ödeme alındı, hazırlanmayı bekliyor.' },
  hazirlaniyor: { label: 'Hazırlanıyor', tone: 'accent', hint: 'Paketlenip kargoya verilecek.' },
  kargoya_verildi: { label: 'Kargoda', tone: 'neutral', hint: 'Müşteriye doğru yolda.' },
  teslim_edildi: { label: 'Teslim edildi', tone: 'success', hint: 'Sipariş tamamlandı.' },
  iade_talebi: { label: 'İade talebi', tone: 'warning', hint: 'Müşteri iade istedi, onayınızı bekliyor.' },
  iade_edildi: { label: 'İade edildi', tone: 'neutral', hint: 'İade tamamlandı, ürünler stoğa geri eklendi.' },
  iptal_edildi: { label: 'İptal edildi', tone: 'danger', hint: 'Sipariş iptal edildi.' },
}

export function statusMeta(status: string | null | undefined) {
  return ORDER_STATUS_META[status as OrderStatus] ?? { label: status || 'Bilinmiyor', tone: 'neutral' as BadgeTone, hint: '' }
}

/** Hazırlanması gereken (aksiyon bekleyen) siparişler */
export const ACTION_NEEDED_STATUSES: OrderStatus[] = ['siparis_alindi', 'odeme_alindi', 'hazirlaniyor']

/** Ciroya sayılmayanlar: iptal, iade ve ödemesi tamamlanmamış kart siparişleri */
export const NON_REVENUE_STATUSES: OrderStatus[] = ['iptal_edildi', 'iade_edildi', 'odeme_bekliyor']

export function countsAsRevenue(status: string | null | undefined) {
  return !NON_REVENUE_STATUSES.includes(status as OrderStatus)
}

/**
 * Tipsiz tarayıcı istemcisi. src/types/database.ts ilişkileri ve RPC'leri tanımlamadığı için
 * ilişkili seçimlerde tipli istemci hata veriyor; sonuçları sayfalarda kendi tiplerimize çeviriyoruz.
 */
export function createAdminBrowserClient(): SupabaseClient {
  return createClient() as unknown as SupabaseClient
}

/* ------------------------------------------------------------------ */

export type AddressJson = {
  full_name?: string
  fullName?: string
  name?: string
  phone?: string
  email?: string
  address_line?: string
  line?: string
  address?: string
  neighborhood?: string
  district?: string
  city?: string
  postal_code?: string
  zip?: string
} | null

export function addressOf(value: unknown): AddressJson {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as AddressJson
  if (typeof value === 'string' && value.trim()) return { address_line: value }
  return null
}

export function addressLines(value: unknown): string[] {
  const a = addressOf(value)
  if (!a) return []
  const lines: string[] = []
  const name = a.full_name || a.fullName || a.name
  if (name) lines.push(name)
  const street = a.address_line || a.line || a.address
  if (street) lines.push(a.neighborhood ? `${a.neighborhood}, ${street}` : street)
  const region = [a.district, a.city].filter(Boolean).join(' / ')
  if (region) lines.push(region + (a.postal_code || a.zip ? ` ${a.postal_code || a.zip}` : ''))
  if (a.phone) lines.push(a.phone)
  return lines
}

export function customerNameOf(order: { profiles?: { full_name?: string | null } | null; shipping_address?: unknown }) {
  const a = addressOf(order.shipping_address)
  return order.profiles?.full_name || a?.full_name || a?.fullName || a?.name || 'İsimsiz müşteri'
}

export function customerEmailOf(order: { profiles?: { email?: string | null } | null; shipping_address?: unknown }) {
  return order.profiles?.email || addressOf(order.shipping_address)?.email || ''
}

export function customerPhoneOf(order: { profiles?: { phone?: string | null } | null; shipping_address?: unknown }) {
  return order.profiles?.phone || addressOf(order.shipping_address)?.phone || ''
}

export function orderNo(order: { order_number?: string | null; id: string }) {
  return order.order_number || order.id.slice(0, 8).toUpperCase()
}

export function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

/** "[İADE TALEBİ] Nedeni: X | Açıklama: Y" satırını ayrıştırır (son talep) */
export function parseReturnRequest(notes: string | null | undefined): { reason: string; explanation: string } | null {
  if (!notes) return null
  const lines = notes.split('\n').filter(l => l.startsWith('[İADE TALEBİ]'))
  const last = lines[lines.length - 1]
  if (!last) return null
  const body = last.replace('[İADE TALEBİ]', '').trim()
  const m = body.match(/^Nedeni:\s*(.*?)(?:\s*\|\s*Açıklama:\s*(.*))?$/)
  if (!m) return { reason: body, explanation: '' }
  return { reason: m[1] || '', explanation: m[2] || '' }
}

/** Notlardan sistemin eklediği iade satırlarını ayırır; geriye müşteri/yönetici notu kalır */
export function plainNotes(notes: string | null | undefined) {
  if (!notes) return ''
  return notes
    .split('\n')
    .filter(l => !l.startsWith('[İADE TALEBİ]') && !l.startsWith('[İADE REDDEDİLDİ]'))
    .join('\n')
    .trim()
}

/** Kenar çubuğundaki sayaçları yenilemek için sayfalardan çağrılır */
export const ADMIN_COUNTS_EVENT = 'admin:counts-changed'
export function refreshAdminCounts() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ADMIN_COUNTS_EVENT))
}

export function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    const msg = (err as { message: string }).message
    if (/row-level security|permission denied/i.test(msg)) return 'Bu işlem için yetkiniz yok. Yönetici hesabıyla giriş yaptığınızdan emin olun.'
    if (/Failed to fetch|NetworkError/i.test(msg)) return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'
    return msg || fallback
  }
  return fallback
}
