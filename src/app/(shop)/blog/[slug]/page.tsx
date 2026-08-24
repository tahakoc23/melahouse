import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BLOG_POSTS } from '@/lib/blogData'

interface BlogDetailProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params
  const post = BLOG_POSTS.find(p => p.slug === slug)
  if (!post) return { title: 'Yazı Bulunamadı | MELA HOUSE' }
  return {
    title: `${post.title} | MELA HOUSE Stil Rehberi`,
    description: post.excerpt,
    keywords: [post.category, 'kadın giyim', 'kadın elbise modelleri', 'MELA HOUSE'],
  }
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params
  const post = BLOG_POSTS.find(p => p.slug === slug)

  if (!post) {
    notFound()
  }

  // Related articles
  const relatedPosts = BLOG_POSTS.filter(p => p.slug !== slug).slice(0, 3)

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

        <div className="relative h-[450px] w-full rounded-md overflow-hidden bg-gray-100 shadow-sm">
          <img src={post.image} alt={post.title} className="object-cover w-full h-full" />
        </div>

        <div 
          className="prose prose-lg max-w-none text-gray-700 leading-relaxed font-inter space-y-6"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Related Posts Section */}
        <div className="pt-12 border-t border-gray-200 space-y-6">
          <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A]">
            İlginizi Çekebilecek Diğer Rehberler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map(rel => (
              <div key={rel.id} className="bg-gray-50 p-4 rounded-xs border border-gray-200 space-y-2">
                <span className="text-[10px] text-[#C5A572] uppercase font-bold">{rel.category}</span>
                <h4 className="font-playfair font-semibold text-sm line-clamp-2 text-[#1A1A1A]">
                  <Link href={`/blog/${rel.slug}`} className="hover:text-[#C5A572]">
                    {rel.title}
                  </Link>
                </h4>
                <Link href={`/blog/${rel.slug}`} className="text-[11px] text-[#C5A572] font-semibold hover:underline block pt-1">
                  Oku &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}
