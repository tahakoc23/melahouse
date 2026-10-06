import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import ProductGrid from '@/components/product/ProductGrid';
import FilterSidebar from '@/components/product/FilterSidebar';
import {
  LISTING_SELECT,
  buildListing,
  findStaticCategory,
  formatListingProduct,
  normalizeSlug,
  productInCategories,
} from '@/components/product/catalog';

// Root layout template appends "| MELA HOUSE"
export const metadata: Metadata = {
  title: 'Tüm Ürünler',
  description: 'MELA HOUSE lüks kadın giyim koleksiyonunun tamamını keşfedin.',
  alternates: { canonical: '/urunler' },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const supabase = createPublicClient();

  const { data: dbProducts } = await supabase
    .from('products')
    .select(LISTING_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  let scope = (dbProducts || []).map(formatListingProduct);

  // Legacy ?category= support (links now go to /kategori/[slug])
  if (resolvedParams.category) {
    const targetCat = normalizeSlug(String(resolvedParams.category));
    if (targetCat === 'en-cok-satanlar' || targetCat === 'one-cikanlar') {
      scope = scope.filter((p) => p.is_featured === true);
    } else {
      const slugs = findStaticCategory(targetCat)?.slugs || [targetCat];
      scope = scope.filter((p) => productInCategories(p, slugs));
    }
  }

  const { products, totalCount, currentPage, availableColors, availableSizes } = buildListing(
    scope,
    resolvedParams
  );

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-28 md:pt-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h1 className="sr-only">Tüm Ürünler</h1>
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
