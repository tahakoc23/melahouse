import { redirect } from 'next/navigation'

/**
 * Bu sayfa kaldırıldı; kategoriler tek yerden yönetilir: /admin/kategoriler.
 * - Eski "Menüler" sayfası navigation_menus tablosunda olmayan sütunlara (title/url/location)
 *   yazdığı için hiç kayıt oluşturamıyordu; mağaza üst menüsü Header.tsx içindeki varsayılan
 *   menüyle çalışıyor (tablo boş).
 * - Eski "Filtreler" sayfasındaki renk paleti hiçbir yere kaydedilmiyordu; mağaza filtresindeki
 *   renkler ürün varyantlarından otomatik çıkarılıyor. "Yeni/Çok satan" işaretleri ürün
 *   düzenleme sayfasında.
 */
export default function Page() {
  redirect('/admin/kategoriler')
}
