// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next';
import ProductGallery from '@/components/product/ProductGallery';
import ProductActions from '@/components/product/ProductActions';
import ReviewSection from '@/components/product/ReviewSection';
import ProductCard from '@/components/product/ProductCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const supabase = createAdminClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, description, seo_title, seo_description')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!product) return { title: 'Ürün Bulunamadı | MELA HOUSE' };

  return {
    title: product.seo_title || `${product.name} | MELA HOUSE`,
    description: product.seo_description || product.description,
  };
}

const DEFAULT_DEMO_PRODUCT = {
  id: 'def-1',
  name: 'Saten Kruvaze Abiye Elbise',
  slug: 'saten-kruvaze-abiye-elbise',
  base_price: 8500,
  sale_price: 6990,
  description: 'Saf ipek saten kumaştan imal edilmiş, zarif kruvaze yaka ve el işçiliği drapelerle tasarlanmış özel gece elbisesi.',
  short_description: 'Saf ipek saten kumaştan imal edilmiş, zarif kruvaze yaka ve el işçiliği drapelerle tasarlanmış özel gece elbisesi.',
  fabric_info: '%100 İpek Saten. İtalya dokuması kumaş.',
  care_instructions: 'Sadece kuru temizleme yapınız. Düşük ısıda tersten ütüleyiniz.',
  product_images: [
    { id: '1', image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop', is_primary: true },
    { id: '2', image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop', is_primary: false },
    { id: '3', image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop', is_primary: false }
  ],
  product_variants: [
    { id: 'v1', color_name: 'Şampanya', color_hex: '#E6D5C3', size: 'S', stock_quantity: 5 },
    { id: 'v2', color_name: 'Şampanya', color_hex: '#E6D5C3', size: 'M', stock_quantity: 3 },
    { id: 'v3', color_name: 'Siyah', color_hex: '#1A1A1A', size: 'S', stock_quantity: 4 }
  ],
  categories: { name: 'Elbise & Abiye', slug: 'elbise-abiye' }
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      product_images(*),
      product_variants(*),
      categories(name, slug),
      reviews(*)
    `)
    .eq('slug', resolvedParams.slug)
    .single();

  const displayProduct = product || {
    ...DEFAULT_DEMO_PRODUCT,
    name: resolvedParams.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  };

  const activeReviews = displayProduct.reviews?.filter((r: any) => r.is_approved) || [];
  const validImages = displayProduct.product_images?.filter((img: any) => img.image_url && !img.image_url.startsWith('blob:')) || [];
  const images = validImages.sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-32 md:pt-48 font-inter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Gallery */}
          <ProductGallery images={images.length > 0 ? images : DEFAULT_DEMO_PRODUCT.product_images} />

          {/* Right: Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-playfair text-[#1A1A1A] mb-4">{displayProduct.name}</h1>
            
            <div className="flex items-center space-x-4 mb-6">
              {displayProduct.sale_price ? (
                <>
                  <span className="text-2xl font-semibold text-[#1A1A1A]">{Number(displayProduct.sale_price).toLocaleString('tr-TR')} ₺</span>
                  <span className="text-xl text-gray-400 line-through">{Number(displayProduct.base_price).toLocaleString('tr-TR')} ₺</span>
                </>
              ) : (
                <span className="text-2xl font-semibold text-[#1A1A1A]">{Number(displayProduct.base_price).toLocaleString('tr-TR')} ₺</span>
              )}
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              {displayProduct.short_description || displayProduct.description}
            </p>

            <div className="border-t border-b border-gray-200 py-6 mb-6">
              <ProductActions product={displayProduct} variants={displayProduct.product_variants || []} />
            </div>

            {/* Accordion Info */}
            <div className="space-y-4 text-sm">
              <details className="group border-b border-gray-200 pb-4">
                <summary className="font-semibold text-[#1A1A1A] cursor-pointer flex justify-between items-center list-none">
                  <span>Ürün Detayı</span>
                  <span className="transition group-open:rotate-180">↓</span>
                </summary>
                <p className="mt-3 text-gray-600 leading-relaxed text-xs">
                  {displayProduct.description}
                </p>
              </details>

              {displayProduct.fabric_info && (
                <details className="group border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-[#1A1A1A] cursor-pointer flex justify-between items-center list-none">
                    <span>Kumaş Bilgisi</span>
                    <span className="transition group-open:rotate-180">↓</span>
                  </summary>
                  <p className="mt-3 text-gray-600 leading-relaxed text-xs">
                    {displayProduct.fabric_info}
                  </p>
                </details>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <ReviewSection reviews={activeReviews} productId={displayProduct.id} />
        </div>
      </div>
    </div>
  );
}
