import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası ve KVKK Aydınlatma Metni',
  description: 'MELA HOUSE Gizlilik Politikası, Kişisel Verilerin Korunması Kanunu (KVKK) ve Çerez Politikası hakkında detaylı bilgilendirme.',
}

export default function GizlilikPolitikasiPage() {
  return (
    <div className="bg-[#FAFAF8] text-[#1A1A1A] py-16 px-4 md:px-8 font-inter">
      <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-200/80">
        
        <header className="border-b border-gray-200 pb-6">
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-[#1A1A1A] mb-3">
            Gizlilik Politikası &amp; KVKK Aydınlatma Metni
          </h1>
          <p className="text-xs text-gray-500">
            Son Güncelleme Tarihi: 24 Ağustos 2026 | MELA HOUSE (melahouse.net)
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <h2 className="font-playfair text-xl font-semibold text-[#1A1A1A] text-[#C5A572]">
            1. Veri Sorumlusunun Kimliği
          </h2>
          <p>
            MELA HOUSE olarak ("Şirket" veya "Biz"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla, müşterilerimizin ve web sitemizi (<strong>https://melahouse.net</strong>) ziyaret eden kullanıcılarımızın kişisel verilerini korumayı en üst düzey önceliğimiz kabul ediyoruz.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <h2 className="font-playfair text-xl font-semibold text-[#1A1A1A] text-[#C5A572]">
            2. Toplanan Kişisel Veriler ve İşleme Amaçları
          </h2>
          <p>
            MELA HOUSE üzerinden gerçekleştirdiğiniz alışverişlerde, üyelik işlemlerinde veya bülten aboneliklerinde aşağıdaki kişisel verileriniz işlenmektedir:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li><strong>Kimlik Bilgileri:</strong> Ad, soyad.</li>
            <li><strong>İletişim Bilgileri:</strong> E-posta adresi (info@melahouse.net altyapısı), telefon numarası, teslimat ve fatura adresi.</li>
            <li><strong>Müşteri İşlem Bilgileri:</strong> Sipariş geçmişi, sepet bilgileri, ödeme durumu, talep ve şikayetler.</li>
            <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, log kayıtları, çerez (cookie) verileri.</li>
          </ul>
          <p>
            Bu veriler; siparişlerin teslim edilmesi, faturalandırma, müşteri hizmetleri desteği sağlanması ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <h2 className="font-playfair text-xl font-semibold text-[#1A1A1A] text-[#C5A572]">
            3. Kişisel Verilerin Aktarılması
          </h2>
          <p>
            Kişisel verileriniz, yalnızca siparişinizin tamamlanması amacıyla yetkili kargo şirketleri, güvenli ödeme altyapısı sağlayıcıları (Shopier/Iyzico) ve yasal mercilerin talebi durumunda ilgili resmi kurumlar ile paylaşılmaktadır. Kişisel verileriniz kesinlikle 3. şahıslara satılmaz veya pazarlama amacıyla devredilmez.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <h2 className="font-playfair text-xl font-semibold text-[#1A1A1A] text-[#C5A572]">
            4. KVKK Kapsamındaki Haklarınız (Madde 11)
          </h2>
          <p>
            KVKK'nın 11. maddesi uyarınca veri sahipleri; kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, verilerin düzeltilmesini veya silinmesini isteme haklarına sahiptir.
          </p>
          <p>
            Tüm talepleriniz için bizimle <strong>info@melahouse.net</strong> e-posta adresi üzerinden iletişime geçebilirsiniz.
          </p>
        </section>

      </div>
    </div>
  )
}
