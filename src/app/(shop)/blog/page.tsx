import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Stil Rehberi & Lüks Kadın Giyim Blogu | MELA HOUSE',
  description: 'MELA HOUSE lüks kadın giyim, ipek ve saten kumaş bakım rehberi, sezon kombin önerileri, zamansız stil ipuçları ve elbise seçimi rehberi.',
}

const BLOG_POSTS = [
  {
    id: '1',
    title: 'İpek ve Saten Elbiselerin Bakımı: Uzun Ömürlü Lüksün Sırları',
    slug: 'ipek-ve-saten-elbiselerin-bakimi',
    excerpt: 'Saf ipek ve dökümlü saten kumaşlar, doğru bakımla yıllar boyu ilk günkü ışıltısını ve yumuşak dokusunu korur. İpek giysilerinizi nasıl yıkamalı, ütülemeli ve saklamalısınız?',
    date: '24 Ağustos 2026',
    readTime: '6 dk okuma',
    category: 'Kumaş & Bakım Rehberi',
    image: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: '2',
    title: 'Kruvaze ve Dökümlü Kesimler: Sofistike Kadın Stili & Kombin Önerileri',
    slug: 'kruvaze-ve-dokumlu-kesimler-sofistike-stil',
    excerpt: 'Gece davetlerinden özel akşam yemeklerine, kruvaze detayların ve akıcı siluetlerin kadın gardırobundaki vazgeçilmez yeri. Doğru takı ve ayakkabı seçimiyle zamansız şıklık.',
    date: '20 Ağustos 2026',
    readTime: '7 dk okuma',
    category: 'Stil Önerileri',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: '3',
    title: 'Minimalist Lüks: Gardırobunuzda Zamansız ve Kapsül Parçalar',
    slug: 'minimalist-luks-zamansiz-parcalar',
    excerpt: 'Geçici trendlerin ötesinde zamansız bir stil oluşturmanın 5 altın kuralı. Kaliteli kumaşlar, nötr renk paleti ve mükemmel kalıp kesimleri ile kişisel tarzınızı taçlandırın.',
    date: '15 Ağustos 2026',
    readTime: '5 dk okuma',
    category: 'Moda & Trendler',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: '4',
    title: 'Vücut Tipine Göre Abiye ve Elbise Seçimi Rehberi',
    slug: 'vucut-tipine-gore-elbise-secimi-rehberi',
    excerpt: 'Kum saati, armut veya dikdörtgen vücut tipinize en uygun elbise kalıbını nasıl seçmelisiniz? Doğru kesimle duruşunuzu ve zarafetinizi ön plana çıkarma tüyoları.',
    date: '10 Ağustos 2026',
    readTime: '8 dk okuma',
    category: 'Kombin Rehberi',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: '5',
    title: 'İç Giyimde Premium Dokunuş: İpek Sabahlık & Kimono Şıklığı',
    slug: 'ic-giyimde-premium-dokunus-ipek-sabahlik',
    excerpt: 'Evde ve özel anlarınızda kendinizi şımartmanın en zarif yolu. İpek saten sabahlık ve kimonoların ev modasındaki yeri ve kumaş seçim tüyoları.',
    date: '05 Ağustos 2026',
    readTime: '4 dk okuma',
    category: 'Lüks İç Giyim',
    image: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=1200&auto=format&fit=crop'
  }
]

export default function BlogListingPage() {
  return (
    <div className="bg-[#FAFAF8] text-[#1A1A1A] pt-28 md:pt-36 pb-20 px-4 md:px-8 font-inter min-h-screen">
      <div className="max-w-6xl mx-auto space-y-12">
        
        <header className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[#C5A572] font-semibold text-xs uppercase tracking-widest">
            MELA HOUSE Moda &amp; Stil
          </span>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[#1A1A1A]">
            Stil Rehberi
          </h1>
          <div className="h-[1px] w-24 bg-[#C5A572] mx-auto"></div>
          <p className="text-sm text-gray-600 leading-relaxed max-w-xl mx-auto">
            Lüks kumaş bakımı, zamansız kombin önerileri, vücut tipine göre elbise seçimi ve moda dünyasından en ilham verici rehber içerikler.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map(post => (
            <article key={post.id} className="bg-white rounded-lg overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                <img
                  src={post.image}
                  alt={post.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-[#1A1A1A]/85 backdrop-blur-md text-[#C5A572] text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-xs">
                  {post.category}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="font-playfair text-xl font-semibold text-[#1A1A1A] group-hover:text-[#C5A572] transition-colors leading-snug">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#C5A572] hover:text-[#1A1A1A] transition-colors pt-2"
                >
                  Devamını Oku &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>
    </div>
  )
}
