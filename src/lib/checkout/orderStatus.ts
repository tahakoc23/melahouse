// Sipariş durumları tek yerde. Değerler admin paneli (siparisler/[id]) ve
// siparislerim sayfasındaki STATUS_CONFIG ile uyumludur.

/** Kartla (Shopier) ödeme bekleyen sipariş. Sadece bu durumdaki siparişler ödemeye/callback'e açıktır. */
export const ORDER_STATUS_PAYMENT_PENDING = 'odeme_bekliyor'

/** Shopier ödemesi başarıyla alındı (mevcut callback'in kullandığı durum). */
export const ORDER_STATUS_PAID = 'hazirlaniyor'

/** Kapıda ödeme siparişi alındı (ödeme teslimatta). */
export const ORDER_STATUS_COD_RECEIVED = 'siparis_alindi'

/** Ödeme başarısız / iptal. */
export const ORDER_STATUS_PAYMENT_FAILED = 'iptal_edildi'

export type PaymentMethod = 'card' | 'cod'

export const PAYMENT_METHODS: readonly PaymentMethod[] = ['card', 'cod'] as const
