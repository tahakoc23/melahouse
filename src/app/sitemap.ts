import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { BLOG_POSTS } from '@/lib/blogData';
import { CATEGORY_TREE } from '@/components/product/catalog';

const BASE_URL = 'https://www.melahouse.net';

// Regenerate at most hourly so new products show up without a redeploy
export const revalidate = 3600;

const TR_MONTHS: Record<string, number> = {
  ocak: 0, şubat: 1, mart: 2, nisan: 3, mayıs: 4, haziran: 5,
  temmuz: 6, ağustos: 7, eylül: 8, ekim: 9, kasım: 10, aralık: 11,
};

/** "24 Ağustos 2026" -> Date (falls back to now). */
function parseTrDate(value: string): Date {
  const [day, month, year] = value.trim().split(/\s+/);
  const m = TR_MONTHS[(month || '').toLocaleLowerCase('tr')];
  const d = new Date(Number(year), m ?? NaN, Number(day));
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  let products: { slug: string; updated_at: string | null }[] = [];
  let dbCategories: { slug: string; updated_at: string | null }[] = [];
  try {
    const supabase = createPublicClient();
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('products').select('slug, updated_at').eq('is_active', true),
      supabase.from('categories').select('slug, updated_at, is_active'),
    ]);
    products = (p || []) as typeof products;
    dbCategories = ((c || []) as { slug: string; updated_at: string | null; is_active: boolean | null }[]).filter(
      (cat) => cat.is_active !== false
    );
  } catch (err) {
    // Missing env / DB unavailable: still serve static pages, blog and taxonomy
    console.error('sitemap: could not load products/categories', err);
  }

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/urunler/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : now,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  // Active DB categories + storefront taxonomy (deduplicated)
  const categoryLastMod = new Map<string, Date>();
  dbCategories.forEach((c) => categoryLastMod.set(c.slug, c.updated_at ? new Date(c.updated_at) : now));
  CATEGORY_TREE.forEach((cat) => {
    [cat.slug, ...(cat.subcategories || []).map((s) => s.slug)].forEach((slug) => {
      if (!categoryLastMod.has(slug)) categoryLastMod.set(slug, now);
    });
  });
  const categoryUrls: MetadataRoute.Sitemap = Array.from(categoryLastMod.entries()).map(([slug, lastModified]) => ({
    url: `${BASE_URL}/kategori/${slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const blogUrls: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: parseTrDate(post.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/urunler`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/hakkimizda`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/gizlilik-politikasi`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/kullanim-kosullari`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/mesafeli-satis-sozlesmesi`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  return [...staticPages, ...categoryUrls, ...productUrls, ...blogUrls];
}
