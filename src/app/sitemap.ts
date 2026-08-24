import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://veloria.com.tr';
  const supabase = await createClient();

  // Fetch active products
  const { data: products } = await supabase
    .from('products' as any)
    .select('slug, updated_at')
    .eq('is_active', true);

  // Fetch active categories
  const { data: categories } = await supabase
    .from('categories' as any)
    .select('slug')
    .eq('is_active', true);

  const productUrls: MetadataRoute.Sitemap = (products || []).map((product: any) => ({
    url: `${baseUrl}/urunler/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at as string) : new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  const categoryUrls: MetadataRoute.Sitemap = (categories || []).map((category: any) => ({
    url: `${baseUrl}/kategori/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/urunler`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/hakkimizda`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  return [...staticPages, ...categoryUrls, ...productUrls];
}
