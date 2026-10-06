// @ts-nocheck
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/public';
import ProductGallery from '@/components/product/ProductGallery';
import ProductActions from '@/components/product/ProductActions';
import ReviewSection from '@/components/product/ReviewSection';
import ProductSchema from '@/components/seo/ProductSchema';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { effectivePrice } from '@/components/product/catalog';

const SITE_URL = 'https://www.melahouse.net';

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
const VIDEO_URL_RE = /(\.(mp4|webm|mov|m4v|ogv|avi)([?#].*)?$)|instagram\.com|youtube\.com|youtu\.be/i;

/**
 * Loads an active product by slug (deduplicated between generateMetadata and
 * the page). Returns null for unknown or inactive (is_active=false) products.
 */
const getProduct = cache(async (slug: string) => {
  const supabase = createPublicClient();
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      product_images(*),
      product_variants(*),
      categories(name, slug),
      reviews(*)
    `)
    .eq('slug', safeDecode(slug))
    .maybeSingle();

  if (!product || product.is_active === false) return null;
  return product;
});

const stripBrand = (title: string) => title.replace(/\s*[|–-]\s*MELA HOUSE.*$/i, '').trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  // Root layout template appends "| MELA HOUSE" — never include the brand here
  if (!product) return { title: 'Ürün Bulunamadı' };

  const description = (product.seo_description || product.short_description || product.description || '').slice(0, 160);
  const ogImages = (product.product_images || [])
    .filter((i) => i.image_url && !i.image_url.startsWith('blob:') && !VIDEO_URL_RE.test(i.image_url))
    .sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary))
    .slice(0, 1)
    .map((i) => ({ url: i.image_url, alt: product.name }));

  return {
    title: stripBrand(product.seo_title || product.name) || product.name,
    description,
    alternates: { canonical: `/urunler/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `${SITE_URL}/urunler/${product.slug}`,
      images: ogImages,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const activeReviews = product.reviews?.filter((r) => r.is_approved) || [];
  const images = (product.product_images || [])
    .filter((img) => img.image_url && !img.image_url.startsWith('blob:'))
    .sort(
      (a, b) =>
        Number(!!b.is_primary) - Number(!!a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
  const variants = (product.product_variants || []).filter((v) => v.is_active !== false);

  const basePrice = Number(product.base_price) || 0;
  const price = effectivePrice(product);
  const hasDiscount = price < basePrice;

  const tags: string[] = Array.isArray(product.tags) ? product.tags : product.tags ? [product.tags] : [];
  const isOutOfStock =
    tags.includes('Tükendi') ||
    (variants.length > 0 && !variants.some((v) => Number(v.stock_quantity) > 0));

  const productUrl = `${SITE_URL}/urunler/${product.slug}`;
  const ratings = activeReviews.map((r) => Number(r.rating)).filter((n: number) => n > 0);
  const avgRating = ratings.length > 0 ? Number((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)) : undefined;

  const breadcrumbs = [
    { name: 'Ana Sayfa', url: SITE_URL },
    { name: 'Ürünler', url: `${SITE_URL}/urunler` },
    ...(product.categories?.slug
      ? [{ name: product.categories.name, url: `${SITE_URL}/kategori/${product.categories.slug}` }]
      : []),
    { name: product.name, url: productUrl },
  ];

  const formatTry = (n: number) => `${n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`;

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-32 md:pt-48 font-inter">
      <ProductSchema
        product={{
          name: product.name,
          description: product.short_description || product.description || product.name,
          images: images.filter((i) => !VIDEO_URL_RE.test(i.image_url)).map((i) => i.image_url),
          price,
          sku: variants[0]?.sku || undefined,
          inStock: !isOutOfStock,
          rating: avgRating,
          reviewCount: ratings.length || undefined,
          url: productUrl,
        }}
      />
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Gallery (shows a neutral placeholder when there are no images) */}
          <ProductGallery images={images} productName={product.name} />

          {/* Right: Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-playfair text-[#1A1A1A] mb-4">{product.name}</h1>

            <div className="flex items-center space-x-4 mb-6">
              {hasDiscount ? (
                <>
                  <span className="text-2xl font-semibold text-[#1A1A1A]">{formatTry(price)}</span>
                  <span className="text-xl text-gray-400 line-through">{formatTry(basePrice)}</span>
                </>
              ) : (
                <span className="text-2xl font-semibold text-[#1A1A1A]">{formatTry(price)}</span>
              )}
            </div>

            {(product.short_description || product.description) && (
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {product.short_description || product.description}
              </p>
            )}

            <div className="border-t border-b border-gray-200 py-6 mb-6">
              <ProductActions product={{ ...product, product_images: images, product_variants: variants }} />
            </div>

            {/* Accordion Info */}
            <div className="space-y-4 text-sm">
              {product.description && (
                <details className="group border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-[#1A1A1A] cursor-pointer flex justify-between items-center list-none">
                    <span>Ürün Detayı</span>
                    <span className="transition group-open:rotate-180">↓</span>
                  </summary>
                  <p className="mt-3 text-gray-600 leading-relaxed text-xs whitespace-pre-line">
                    {product.description}
                  </p>
                </details>
              )}

              {product.fabric_info && (
                <details className="group border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-[#1A1A1A] cursor-pointer flex justify-between items-center list-none">
                    <span>Kumaş Bilgisi</span>
                    <span className="transition group-open:rotate-180">↓</span>
                  </summary>
                  <p className="mt-3 text-gray-600 leading-relaxed text-xs whitespace-pre-line">
                    {product.fabric_info}
                  </p>
                </details>
              )}

              {product.care_instructions && (
                <details className="group border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-[#1A1A1A] cursor-pointer flex justify-between items-center list-none">
                    <span>Bakım Talimatı</span>
                    <span className="transition group-open:rotate-180">↓</span>
                  </summary>
                  <p className="mt-3 text-gray-600 leading-relaxed text-xs whitespace-pre-line">
                    {product.care_instructions}
                  </p>
                </details>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <ReviewSection reviews={activeReviews} productId={product.id} />
        </div>
      </div>
    </div>
  );
}
