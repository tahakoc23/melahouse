import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface BlogDetailProps {
  params: Promise<{ slug: string }>
}

const POST_DATA: Record<string, { title: string; date: string; category: string; content: string; image: string }> = {
  'ipek-ve-saten-elbiselerin-bakimi': {
    title: 'İpek ve Saten Elbiselerin Bakımı: Uzun Ömürlü Lüksün Sırları',
    date: '24 Ağustos 2026',
    category: 'Kumaş & Bakım Rehberi',
    image: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">MELA HOUSE koleksiyonlarında kullanılan saf ipek ve dökümlü premium saten kumaşlar, zamansız lüksün simgesidir. Hassas doğal dokuları sebebiyle doğru bakım ilkeleri uygulandığında yıllar boyu ilk günkü ışıltısını ve dökümlü yapısını korurlar.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. İpek ve Saten Kumaşların Yıkama Esasları</h3>
      <p>Saf ipek giysiler kesinlikle yüksek sıcaklıkta veya klasik çamaşır makinelerinin agresif sıkma programlarında yıkanmamalıdır. Soğuk veya ılık suda (maksimum 30°C), ipek kumaşa özel pH dengeli hassas deterjanlar veya bebek şampuanı ile elde nazikçe çitilemeden yıkanması önerilir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">2. Kurutma ve Nem Yönetimi</h3>
      <p>İpek ve dökümlü saten elbiseleri asarken doğrudan güneş ışığına maruz bırakmaktan kaçının; ultraviyole ışınlar ipek liflerini zayıflatabilir. Islak ürünü bükmek veya sıkmak yerine temiz ve kuru bir havlu üzerine sererek fazla nemini alabilir, ardından gölgede havadar bir yerde kurutabilirsiniz.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">3. Profesyonel Ütüleme Teknikleri</h3>
      <p>Ütüleme işleminde elbisenin mutlaka ters yüzünü çevirin. Ütünüzün "İpek / Silk" ayarını kullanarak ve tercihen kumaş ile ütü tabanı arasına koruyucu tülbent koyarak ütüleyin. Buharlı dikey ütüler ipek üzerindeki kırışıklıkları açmak için son derece güvenlidir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">4. Saklama ve Muhafaza Tüyoları</h3>
      <p>İpek elbiselerinizi nefes alabilen pamuklu elbise kılıflarında muhafaza edin. Plastik kılıflar hava sirkülasyonunu engelleyerek nem birikmesine yol açabileceğinden tavsiye edilmez.</p>
    `
  },
  'kruvaze-ve-dokumlu-kesimler-sofistike-stil': {
    title: 'Kruvaze ve Dökümlü Kesimler: Sofistike Kadın Stili & Kombin Önerileri',
    date: '20 Ağustos 2026',
    category: 'Stil Önerileri',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Kadın giyiminde kruvaze yaka ve dökümlü kesimler, çabasız şıklığın ve zarafetin en güçlü temsilcisidir. Vücut hatlarını zarifçe sarmalayan bu akıcı siluetler, gündüzden geceye zahmetsiz bir geçiş sunar.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">Kruvaze Detayların Gücü</h3>
      <p>Kruvaze kesim elbiseler, bel bölgesini vurgulayarak vücut oranlarını dengeler. V-yaka formu ise boyun bölgesini daha uzun ve zarif gösterir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">Aksesuar & Ayakkabı Seçimi</h3>
      <p>Dökümlü bir kruvaze elbiseyi minimal altın takılar, pırlanta küpeler ve ince bantlı stiletto ayakkabılarla tamamlayarak özel akşam yemeklerinde duru bir şıklık yakalayabilirsiniz.</p>
    `
  },
  'minimalist-luks-zamansiz-parcalar': {
    title: 'Minimalist Lüks: Gardırobunuzda Zamansız ve Kapsül Parçalar',
    date: '15 Ağustos 2026',
    category: 'Moda & Trendler',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Sessiz lüks (quiet luxury) felsefesiyle birlikte gösterişten uzak, dökümlü ve kaliteli kumaşlardan üretilen parçalar gardıropların odağı haline geldi.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">Kapsül Gardırop Oluşturmanın 5 Kuralı</h3>
      <p>1. Zamansız nötr renk tonları (krem, şampanya, siyah, taba).<br />2. %100 doğal kumaş tercihleri (ipek, saten, keten).<br />3. Vücut anatominize tam oturan terzi dikimi ayarında kalıplar.</p>
    `
  },
  'vucut-tipine-gore-elbise-secimi-rehberi': {
    title: 'Vücut Tipine Göre Abiye ve Elbise Seçimi Rehberi',
    date: '10 Ağustos 2026',
    category: 'Kombin Rehberi',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Her kadının vücut yapısı benzersizdir. Doğru elbise seçimi, vücut hatlarınızı ön plana çıkarırken kendinizi son derece özgüvenli ve şık hissetmenizi sağlar.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">Kum Saati Vücut Tipi</h3>
      <p>Beli vurgulayan kruvaze ve yırtmaçlı dökümlü saten elbiseler kum saati siluetini büyüleyici bir şekilde sergiler.</p>
    `
  },
  'ic-giyimde-premium-dokunus-ipek-sabahlik': {
    title: 'İç Giyimde Premium Dokunuş: İpek Sabahlık & Kimono Şıklığı',
    date: '05 Ağustos 2026',
    category: 'Lüks İç Giyim',
    image: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Evde geçirdiğiniz anları özel kılmanın ve güne zarif bir başlangıç yapmanın en konforlu yolu ipek dokunuşlardır.</p>
    `
  }
}

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params
  const post = POST_DATA[slug]
  if (!post) return { title: 'Yazı Bulunamadı | MELA HOUSE' }
  return {
    title: `${post.title} | MELA HOUSE Stil Rehberi`,
    description: post.title,
  }
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params
  const post = POST_DATA[slug]

  if (!post) {
    notFound()
  }

  return (
    <div className="bg-[#FAFAF8] text-[#1A1A1A] pt-28 md:pt-36 pb-20 px-4 md:px-8 font-inter min-h-screen">
      <article className="max-w-4xl mx-auto space-y-8 bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-200/80">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C5A572] hover:underline">
          &larr; Tüm Stil Rehberi Yazılarına Dön
        </Link>

        <header className="space-y-4 border-b border-gray-200 pb-6">
          <span className="bg-[#C5A572]/10 text-[#C5A572] text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-xs inline-block">
            {post.category}
          </span>
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-[#1A1A1A] leading-tight">
            {post.title}
          </h1>
          <p className="text-xs text-gray-400">{post.date} • MELA HOUSE Moda Editörü</p>
        </header>

        <div className="relative h-96 w-full rounded-md overflow-hidden bg-gray-100 shadow-sm">
          <img src={post.image} alt={post.title} className="object-cover w-full h-full" />
        </div>

        <div 
          className="prose prose-lg max-w-none text-gray-700 leading-relaxed font-inter space-y-6"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  )
}
