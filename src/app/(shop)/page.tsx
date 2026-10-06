import HeroSlider from '@/components/home/HeroSlider'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import CategoryShowcase from '@/components/home/CategoryShowcase'
import LookbookSection from '@/components/home/LookbookSection'
import ServicePromises from '@/components/home/ServicePromises'
import { createPublicClient } from '@/lib/supabase/public'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  // Kök layout şablonu "| MELA HOUSE" eklediği için ana sayfada mutlak başlık
  title: { absolute: 'MELA HOUSE | Kadın Giyim & İç Giyim' },
  description:
    'MELA HOUSE; elbise, üst ve alt giyim, dış giyim, takım ve iç giyimde seçkin kadın koleksiyonları sunar. 1.000 TL üzeri ücretsiz kargo, 14 gün iade.',
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const supabase = createPublicClient()

  const [{ data: sliderContent }, { data: featuredProducts }, { data: categories }, { data: lookbookContent }] =
    await Promise.all([
      supabase
        .from('site_content')
        .select('*')
        .eq('content_type', 'slider')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('products')
        .select('*, product_images(*)')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('categories').select('*').eq('is_active', true),
      supabase.from('site_content').select('*').eq('content_key', 'lookbook_section').eq('is_active', true).maybeSingle(),
    ])

  // site_content sütunları: media_url, content, link_url, link_text
  type ContentRow = {
    id: string
    title: string | null
    subtitle: string | null
    content: string | null
    media_url: string | null
    link_url: string | null
    link_text: string | null
  }
  const slides = ((sliderContent || []) as ContentRow[])
    .filter(s => s.media_url)
    .map(s => ({
      id: s.id,
      title: s.title || '',
      subtitle: s.subtitle || undefined,
      image_url: s.media_url as string,
      link_url: s.link_url || undefined,
      link_text: s.link_text || undefined,
    }))
  const lb = lookbookContent as ContentRow | null
  const lookbook =
    lb && lb.media_url && lb.title
      ? { title: lb.title, image_url: lb.media_url, description: lb.content || '', link_url: lb.link_url || undefined }
      : null

  return (
    <div className="flex flex-col min-h-screen bg-white text-ink">
      <HeroSlider slides={slides} />
      <ServicePromises />

      <div className="py-16 sm:py-24 space-y-20 sm:space-y-28">
        <CategoryShowcase categories={categories || []} />
        <FeaturedProducts products={featuredProducts || []} />
      </div>

      <LookbookSection content={lookbook} />
    </div>
  )
}
