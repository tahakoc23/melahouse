import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mesafeli Satış Sözleşmesi | MELA HOUSE',
  description: 'MELA HOUSE 6502 sayılı Tüketicinin Korunması Hakkında Kanun uyarınca Mesafeli Satış Sözleşmesi.',
}

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <div className="bg-[#FAFAF8] text-[#1A1A1A] pt-28 md:pt-36 pb-20 px-4 md:px-8 font-inter min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-200/80">
        
        <header className="border-b border-gray-200 pb-6">
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-[#1A1A1A] mb-3">
            Mesafeli Satış Sözleşmesi
          </h1>
          <p className="text-xs text-gray-500">
            6502 Sayılı Tüketicinin Korunması Hakkında Kanun Uyarınca Düzenlenmiştir.
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <h2 className="font-playfair text-xl font-semibold text-[#C5A572]">
            Madde 1 - Taraflar
          </h2>
          <p>
            <strong>SATICI:</strong> MELA HOUSE (melahouse.net)<br />
            <strong>E-Posta:</strong> info@melahouse.net<br />
            <strong>ALICI:</strong> www.melahouse.net web sitesinden sipariş veren müşteri.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <h2 className="font-playfair text-xl font-semibold text-[#C5A572]">
            Madde 2 - Sözleşmenin Konusu
          </h2>
          <p>
            İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait <strong>melahouse.net</strong> web sitesinden elektronik ortamda siparişini yaptığı ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <h2 className="font-playfair text-xl font-semibold text-[#C5A572]">
            Madde 3 - Cayma Hakkı
          </h2>
          <p>
            ALICI, ürünü teslim aldığı tarihten itibaren 14 (on dört) gün içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Cayma hakkının kullanılması için bu süre içinde SATICI'ya <strong>info@melahouse.net</strong> e-posta adresi üzerinden bildirimde bulunulması şarttır.
          </p>
          <p className="text-xs text-gray-500 italic">
            * Hijyen koşulları gereği ambalajı açılmış, denenmiş veya hijyen bandı çıkarılmış iç giyim ve özel giyim ürünlerinde mevzuat gereği cayma hakkı kullanılamamaktadır.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <h2 className="font-playfair text-xl font-semibold text-[#C5A572]">
            Madde 4 - Teslimat ve İade
          </h2>
          <p>
            Sipariş edilen ürünler, anlaşmalı kargo firmaları aracılığıyla ALICI'nın bildirdiği teslimat adresine güvenli bir şekilde ulaştırılır.
          </p>
        </section>

      </div>
    </div>
  )
}
