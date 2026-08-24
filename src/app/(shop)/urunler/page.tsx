// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin';
import ProductGrid from '@/components/product/ProductGrid';
import FilterSidebar from '@/components/product/FilterSidebar';

export const metadata = {
  title: 'Tüm Ürünler | Veloria',
};

const normalizeSlug = (str: string) => {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const supabase = createAdminClient();

  const { data: dbProducts } = await supabase
    .from('products')
    .select(`
      *,
      categories ( id, name, slug ),
      product_images ( image_url, is_primary, sort_order ),
      product_variants ( color_name, color_hex, size )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const formattedDbProducts = dbProducts?.map(p => {
    const validImages = p.product_images?.filter(i => i.image_url && !i.image_url.startsWith('blob:')) || [];
    const primaryImg = validImages[0]?.image_url || '';
    const catSlug = p.categories?.slug || (Array.isArray(p.tags) ? normalizeSlug(p.tags[0]) : normalizeSlug(p.tags || ''));
    
    return {
      ...p,
      primary_image: primaryImg,
      category_slug: catSlug,
      tags: Array.isArray(p.tags) ? p.tags : (p.tags ? [p.tags] : ['Elbise'])
    };
  }) || [];

  let list = formattedDbProducts;

  // Extract exact color names & sizes from DB products
  const colorMap = new Map<string, string>();
  list.forEach(p => {
    p.product_variants?.forEach((v: any) => {
      if (v.color_name && v.color_hex && !colorMap.has(v.color_name)) {
        colorMap.set(v.color_name, v.color_hex);
      }
    });
  });

  if (colorMap.size === 0) {
    colorMap.set('Siyah', '#1A1A1A');
    colorMap.set('Şampanya', '#E6D5C3');
    colorMap.set('Kırmızı', '#D62828');
    colorMap.set('Altın', '#C5A572');
  }

  const availableColors = Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  const availableSizes = Array.from(new Set(list.flatMap(p => (p.product_variants?.map((v: any) => v.size) || p.sizes || [])).filter(Boolean)));

  // Filter Category / Subcategory
  if (resolvedParams.category) {
    const targetCat = normalizeSlug(String(resolvedParams.category));
    list = list.filter(p => {
      if (p.categories?.slug && normalizeSlug(p.categories.slug) === targetCat) return true;
      if (p.category_slug && normalizeSlug(p.category_slug) === targetCat) return true;
      if (p.parent_category && normalizeSlug(p.parent_category) === targetCat) return true;
      if (Array.isArray(p.tags)) {
        return p.tags.some((t: string) => {
          const normTag = normalizeSlug(t);
          return normTag === targetCat || targetCat.includes(normTag) || normTag.includes(targetCat);
        });
      }
      return false;
    });
  }

  // Filter Color
  if (resolvedParams.color) {
    const selectedColors = Array.isArray(resolvedParams.color) ? resolvedParams.color : [resolvedParams.color];
    list = list.filter(p => {
      const pColors = p.product_variants?.map((v: any) => v.color_name) || [p.color_name];
      return pColors.some((c: string) => selectedColors.includes(c));
    });
  }

  // Filter Size
  if (resolvedParams.size) {
    const selectedSizes = Array.isArray(resolvedParams.size) ? resolvedParams.size : [resolvedParams.size];
    list = list.filter(p => {
      const pSizes = p.product_variants?.map((v: any) => v.size) || p.sizes || [];
      return pSizes.some((s: string) => selectedSizes.includes(s));
    });
  }

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-32 md:pt-48">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 flex-shrink-0">
            <FilterSidebar availableColors={availableColors} availableSizes={availableSizes} />
          </aside>
          
          <main className="flex-1">
            <ProductGrid products={list} totalCount={list.length} currentPage={1} />
          </main>
        </div>
      </div>
    </div>
  );
}
