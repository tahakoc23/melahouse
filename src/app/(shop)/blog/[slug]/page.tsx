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
      <p>MELA HOUSE koleksiyonlarında kullanılan saf ipek ve dökümlü premium saten kumaşlar, zamansız lüksün simgesidir. Hassas dokuları sebebiyle doğru bakım uygulandığında yıllar boyu ilk günkü zarafetini korurlar.</p>

      <h3>1. İpek Giysiler Nasıl Yıkanmalı?</h3>
      <p>Saf ipek giysiler kesinlikle yüksek sıcaklıkta çamaşır makinesinde yıkanmamalıdır. Soğuk veya ılık suda, ipek kumaşa özel hassas deterjanlar ile elde nazikçe çitilemeden yıkanması tavsiye edilir.</p>

      <h3>2. Kurutma ve Ütüleme Teknikleri</h3>
      <p>İpek ve saten giysileri direkt güneş ışığı altında kurutmaktan kaçının. Ütüleme işleminde ise elbisenin ters yüzünü çevirip düşük ısıda (ipek ayarında) veya buharlı ütü ile müdahale edilmelidir.</p>

      <h3>3. Saklama Koşulları</h3>
      <p>İpek elbiselerinizi nefes alabilen bez elbise kılıflarında muhafaza edin. Plastik poşetler nem birikmesine sebep olabileceğinden tercih edilmemelidir.</p>
    `
  },
  'kruvaze-ve-dokumlu-kesimler-sofistike-stil': {
    title: 'Kruvaze ve Dökümlü Kesimler: Sofistike Kadın Stili',
    date: '20 Ağustos 2026',
    category: 'Stil Önerileri',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p>Kadın giyiminde kruvaze yaka ve dökümlü kesimler, çabasız şıklığın en güçlü temsilcisidir. Vücut hatlarını zarifçe sarmalayan bu siluetler, gündüzden geceye zahmetsiz bir geçiş sunar.</p>

      <h3>Kombin İpuçları</h3>
      <p>Dökümlü bir kruvaze elbiseyi minimal altın takılar ve ince bantlı topuklu ayakkabılarla tamamlayarak özel akşam yemeklerinde duru bir şıklık yakalayabilirsiniz.</p>
    `
  },
  'minimalist-luks-zamansiz-parcalar': {
    title: 'Minimalist Lüks: Gardırobunuzda Zamansız Parçalar',
    date: '15 Ağustos 2026',
    category: 'Moda & Trendler',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p>Sessiz lüks (quiet luxury) trendiyle birlikte zamansız parçalar gardıropların odağı haline geldi. Kaliteli kumaş dokusu, nötral renk paleti ve mükemmel kalıp kesimleri ile kendi tarzınızı oluşturun.</p>
    `
  }
}

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params
  const post = POST_DATA[slug]
  if (!post) return { title: 'Yazı Bulunamadı' }
  return {
    title: `${post.title} | MELA HOUSE Blog`,
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
    <div className="bg-[#FAFAF8] text-[#1A1A1A] py-16 px-4 md:px-8 font-inter">
      <article className="max-w-4xl mx-auto space-y-8 bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-200/80">
        <Link href="/blog" className="inline-flex items-center gap-1 text-xs font-semibold text-[#C5A572] hover:underline">
          &larr; Tüm Blog Yazılarına Dön
        </Link>

        <header className="space-y-4">
          <span className="bg-[#C5A572]/10 text-[#C5A572] text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-xs inline-block">
            {post.category}
          </span>
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-[#1A1A1A] leading-tight">
            {post.title}
          </h1>
          <p className="text-xs text-gray-400">{post.date} • MELA HOUSE Editör</p>
        </header>

        <div className="relative h-96 w-full rounded-md overflow-hidden bg-gray-100">
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
