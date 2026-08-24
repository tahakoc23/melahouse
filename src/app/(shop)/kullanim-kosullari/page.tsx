import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kullanım Koşulları | MELA HOUSE',
  description: 'MELA HOUSE web sitesi kullanım şartları, fikri mülkiyet hakları ve alışveriş kuralları.',
}

export default function KullanimKosullariPage() {
  return (
    <div className="bg-[#FAFAF8] text-[#1A1A1A] pt-28 md:pt-36 pb-20 px-4 md:px-8 font-inter min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-200/80">
        
        <header className="border-b border-gray-200 pb-6">
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-[#1A1A1A] mb-3">
            Kullanım Koşulları
          </h1>
          <p className="text-xs text-gray-500">
            MELA HOUSE (melahouse.net) Web Sitesi Kullanım ve Hizmet Şartları
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <h2 className="font-playfair text-xl font-semibold text-[#C5A572]">
            1. Genel Şartlar
          </h2>
          <p>
            Bu web sitesine (<strong>https://melahouse.net</strong>) erişerek ve kullanarak, MELA HOUSE tarafından sunulan tüm kullanım koşullarını kabul etmiş sayılırsınız. Şirketimiz bu koşulları dilediği zaman güncelleme hakkını saklı tutar.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <h2 className="font-playfair text-xl font-semibold text-[#C5A572]">
            2. Fikri ve Sınai Mülkiyet Hakları
          </h2>
          <p>
            MELA HOUSE markası, logosu, web sitesinde yer alan tüm görsel tasarımlar, ürün fotoğrafları, grafikler ve yazılı içerikler MELA HOUSE'a aittir. Yazılı izin alınmaksızın kopyalanamaz, çoğaltılamaz veya ticari amaçla kullanılamaz.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <h2 className="font-playfair text-xl font-semibold text-[#C5A572]">
            3. Ürün Bilgileri ve Fiyatlandırma
          </h2>
          <p>
            Sitemizde sergilenen ürün fiyatları ve stok durumları anlık olarak güncellenmektedir. MELA HOUSE, tipografik veya sistemsel fiyat hatalarından sorumlu tutulamaz ve siparişi iptal etme hakkını saklı tutar.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <h2 className="font-playfair text-xl font-semibold text-[#C5A572]">
            4. İletişim
          </h2>
          <p>
            Kullanım koşulları hakkındaki tüm soru ve görüşleriniz için <strong>info@melahouse.net</strong> adresi üzerinden bizimle iletişime geçebilirsiniz.
          </p>
        </section>

      </div>
    </div>
  )
}
