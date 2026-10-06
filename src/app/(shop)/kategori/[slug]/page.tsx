import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/public';
import type { Database } from '@/types/database';
import ProductGrid from '@/components/product/ProductGrid';
import FilterSidebar from '@/components/product/FilterSidebar';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import {
  LISTING_SELECT,
  buildListing,
  findStaticCategory,
  formatListingProduct,
  normalizeSlug,
  productInCategories,
} from '@/components/product/catalog';

const SITE_URL = 'https://www.melahouse.net';

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Resolves a category slug to its display name and the slugs it covers.
 * DB categories win (proper Turkish name, e.g. "İç Giyim"); the storefront
 * taxonomy is the fallback because product tags are written from it.
 * Returns null for unknown or deactivated categories.
 */
const resolveCategory = cache(async (rawSlug: string) => {
  const slug = normalizeSlug(safeDecode(rawSlug));
  if (!slug) return null;

  const supabase = createPublicClient();
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, description, is_active, seo_title, seo_description')
    .eq('slug', slug)
    .maybeSingle();
  const dbCat = data as Pick<
    Database['public']['Tables']['categories']['Row'],
    'id' | 'name' | 'slug' | 'description' | 'is_active' | 'seo_title' | 'seo_description'
  > | null;

  if (dbCat && dbCat.is_active === false) return null;

  const staticCat = findStaticCategory(slug);
  if (!dbCat && !staticCat) return null;

  const slugs = new Set<string>(staticCat?.slugs || [slug]);
  if (dbCat) {
    const { data: children } = await supabase
      .from('categories')
      .select('slug')
      .eq('parent_id', dbCat.id)
      .or('is_active.is.null,is_active.eq.true');
    ((children || []) as { slug: string }[]).forEach((c) => slugs.add(normalizeSlug(c.slug)));
  }

  return {
    slug,
    name: dbCat?.name || staticCat!.name,
    description: dbCat?.description || null,
    seoTitle: dbCat?.seo_title || null,
    seoDescription: dbCat?.seo_description || null,
    slugs: Array.from(slugs),
  };
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategory(slug);
  if (!category) return { title: 'Kategori Bulunamadı' };

  // Root layout template appends "| MELA HOUSE"
  const title = (category.seoTitle || category.name).replace(/\s*[|–-]\s*MELA HOUSE\s*$/i, '');
  return {
    title,
    description: category.seoDescription || category.description || `MELA HOUSE ${category.name} koleksiyonunu keşfedin.`,
    alternates: { canonical: `/kategori/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  const category = await resolveCategory(slug);
  if (!category) {
    notFound();
  }

  const supabase = createPublicClient();
  const { data: dbProducts } = await supabase
    .from('products')
    .select(LISTING_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Filter options are built from this category's products only
  const scope = (dbProducts || [])
    .map(formatListingProduct)
    .filter((p) => productInCategories(p, category.slugs));

  const { products, totalCount, currentPage, availableColors, availableSizes } = buildListing(
    scope,
    resolvedSearchParams
  );

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-32 md:pt-48">
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', url: SITE_URL },
          { name: category.name, url: `${SITE_URL}/kategori/${category.slug}` },
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h1 className="font-playfair text-3xl md:text-4xl text-[#1A1A1A] mb-8">{category.name}</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 flex-shrink-0">
            <FilterSidebar availableColors={availableColors} availableSizes={availableSizes} />
          </aside>

          <main className="flex-1">
            <ProductGrid products={products} totalCount={totalCount} currentPage={currentPage} />
          </main>
        </div>
      </div>
    </div>
  );
}
