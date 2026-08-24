import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Blog & Lüks Moda Rehberi | MELA HOUSE',
  description: 'MELA HOUSE lüks kadın giyim, ipek ve saten bakım rehberi, sezon kombin önerileri ve zamansız stil yazıları.',
}

const BLOG_POSTS = [
  {
    id: '1',
    title: 'İpek ve Saten Elbiselerin Bakımı: Uzun Ömürlü Lüksün Sırları',
    slug: 'ipek-ve-saten-elbiselerin-bakimi',
    excerpt: 'Saf ipek ve dökümlü saten kumaşlar, doğru bakımla yıllar boyu ilk günkü ışıltısını korur. İpek giysilerinizi nasıl yıkamalı ve saklamalısınız?',
    date: '24 Ağustos 2026',
    readTime: '4 dk okuma',
    category: 'Kumaş & Bakım Rehberi',
    image: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '2',
    title: 'Kruvaze ve Dökümlü Kesimler: Sofistike Kadın Stili',
    slug: 'kruvaze-ve-dokumlu-kesimler-sofistike-stil',
    excerpt: 'Gece davetlerinden özel akşam yemeklerine, kruvaze detayların ve akıcı siluetlerin kadın gardırobundaki vazgeçilmez yeri.',
    date: '20 Ağustos 2026',
    readTime: '5 dk okuma',
    category: 'Stil Önerileri',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '3',
    title: 'Minimalist Lüks: Gardırobunuzda Zamansız Parçalar',
    slug: 'minimalist-luks-zamansiz-parcalar',
    excerpt: 'Trendlerin ötesinde zamansız bir stil oluşturmanın 5 altın kuralı. Kaliteli kumaşlar ve doğru renk paleti ile kapsül gardırop rehberi.',
    date: '15 Ağustos 2026',
    readTime: '3 dk okuma',
    category: 'Moda & Trendler',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop'
  }
]

export default function BlogListingPage() {
  return (
    <div className="bg-[#FAFAF8] text-[#1A1A1A] py-16 px-4 md:px-8 font-inter">
      <div className="max-w-6xl mx-auto space-y-12">
        
        <header className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[#1A1A1A]">
            MELA HOUSE Blog &amp; Stil Rehberi
          </h1>
          <div className="h-[1px] w-20 bg-[#C5A572] mx-auto"></div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Lüks kumaş bakımı, zamansız kombin önerileri ve moda dünyasından en ilham verici içerikler.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map(post => (
            <article key={post.id} className="bg-white rounded-lg overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="relative h-60 w-full overflow-hidden bg-gray-100">
                <img
                  src={post.image}
                  alt={post.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-[#1A1A1A]/80 backdrop-blur-md text-[#C5A572] text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-xs">
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
