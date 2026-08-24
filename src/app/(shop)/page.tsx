import HeroSlider from '@/components/home/HeroSlider'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import CategoryShowcase from '@/components/home/CategoryShowcase'
import LookbookSection from '@/components/home/LookbookSection'
import { createAdminClient } from '@/lib/supabase/admin'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MELA HOUSE | Lüks Kadın Giyim & İç Giyim',
  description: 'MELA HOUSE ile lüks ve zarafeti keşfedin. Özel tasarım kadın giyim ve iç giyim koleksiyonlarımızla tarzınızı yansıtın.',
}

export default async function HomePage() {
  const supabase = createAdminClient()

  // Fetch slider content
  const { data: sliderContent } = await supabase
    .from('site_content')
    .select('*')
    .eq('content_type', 'slider')

  // Fetch featured products using admin client (only active, non-deleted products)
  const { data: featuredProducts } = await supabase
    .from('products')
    .select(`
      *,
      product_images(*)
    `)
    .eq('is_featured', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(8)

  // Fetch active categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)

  // Fetch lookbook content
  const { data: lookbookContent } = await supabase
    .from('site_content')
    .select('*')
    .eq('content_type', 'lookbook')
    .single()

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <HeroSlider slides={sliderContent || []} />
      
      <div className="py-16 space-y-24 sm:py-24 sm:space-y-32">
        <FeaturedProducts products={featuredProducts || []} />
        <CategoryShowcase categories={categories || []} />
        <LookbookSection content={lookbookContent} />
      </div>
    </div>
  )
}
