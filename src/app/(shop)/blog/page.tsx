import { Metadata } from 'next'
import Link from 'next/link'
import { BLOG_POSTS } from '@/lib/blogData'

export const metadata: Metadata = {
  title: 'Stil Rehberi & Kadın Giyim Kombin Önerileri | MELA HOUSE',
  description: 'MELA HOUSE Stil Rehberi: Kadın giyim, elbise modelleri, abiye modelleri, ofis kombinleri, yazlık elbise, trençkot ve güvenilir kadın giyim siteleri rehberi.',
}

export default function BlogListingPage() {
  return (
    <div className="bg-[#FAFAF8] text-[#1A1A1A] pt-28 md:pt-36 pb-20 px-4 md:px-8 font-inter min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <header className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[#C5A572] font-semibold text-xs uppercase tracking-widest">
            MELA HOUSE Moda &amp; Stil
          </span>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[#1A1A1A]">
            Stil Rehberi
          </h1>
          <div className="h-[1px] w-24 bg-[#C5A572] mx-auto"></div>
          <p className="text-sm text-gray-600 leading-relaxed max-w-xl mx-auto">
            Kadın giyim kombin önerileri, lüks kumaş bakımı, düğün ve abiye elbise seçim rehberleri ile moda dünyasından en ilham verici içerikler.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
