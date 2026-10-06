/**
 * Server-safe storefront catalog helpers shared by /urunler and /kategori/[slug]
 * (no 'use client' — also imported by the client FilterSidebar).
 */
import { slugifyTr } from '@/app/admin/urunler/_lib/slug';

export const PAGE_SIZE = 12;

export interface CategoryNode {
  name: string;
  slug: string;
  subcategories?: { name: string; slug: string }[];
}

/** Storefront taxonomy (matches the tags written by the admin product form). */
export const CATEGORY_TREE: CategoryNode[] = [
  {
    name: 'Üst Giyim',
    slug: 'ust-giyim',
    subcategories: [
      { name: 'Elbise', slug: 'elbise' },
      { name: 'Gömlek', slug: 'gomlek' },
      { name: 'T-Shirt', slug: 't-shirt' },
      { name: 'Crop', slug: 'crop' },
      { name: 'Kimono', slug: 'kimono' },
      { name: 'Sweatshirt', slug: 'sweatshirt' },
    ],
  },
  {
    name: 'Alt Giyim',
    slug: 'alt-giyim',
    subcategories: [
      { name: 'Pantolon', slug: 'pantolon' },
      { name: 'Etek', slug: 'etek' },
      { name: 'Şort', slug: 'sort' },
      { name: 'Tayt', slug: 'tayt' },
      { name: 'Eşofman', slug: 'esofman' },
      { name: 'Tulum', slug: 'tulum' },
    ],
  },
  { name: 'İç Giyim', slug: 'ic-giyim' },
  {
    name: 'Dış Giyim',
    slug: 'dis-giyim',
    subcategories: [
      { name: 'Trençkot', slug: 'trenckot' },
      { name: 'Ceket', slug: 'ceket' },
      { name: 'Kaban', slug: 'kaban' },
      { name: 'Yelek', slug: 'yelek' },
      { name: 'Mont', slug: 'mont' },
    ],
  },
  { name: 'Takımlar', slug: 'takimlar' },
];

/** Static taxonomy lookup: returns the node name and the slugs it covers (itself + children). */
export function findStaticCategory(slug: string): { name: string; slugs: string[] } | null {
  for (const cat of CATEGORY_TREE) {
    if (cat.slug === slug) {
      return { name: cat.name, slugs: [cat.slug, ...(cat.subcategories || []).map((s) => s.slug)] };
    }
    const sub = cat.subcategories?.find((s) => s.slug === slug);
    if (sub) return { name: sub.name, slugs: [sub.slug] };
  }
  return null;
}

export const normalizeSlug = slugifyTr;

/** Price the customer actually pays: sale_price when it is set and lower. */
export function effectivePrice(p: { base_price?: number | null; sale_price?: number | null }): number {
  const base = Number(p.base_price) || 0;
  const sale = Number(p.sale_price) || 0;
  return sale > 0 && (base <= 0 || sale < base) ? sale : base;
}

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'STD'];

/** Letter sizes in wearing order, then numeric sizes ascending, then anything else. */
export function compareSizes(a: string, b: string): number {
  const ia = SIZE_ORDER.indexOf(a);
  const ib = SIZE_ORDER.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b, 'tr');
}

type SearchParams = { [key: string]: string | string[] | undefined };

const asArray = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

export interface ListingVariant {
  color_name?: string | null;
  color_hex?: string | null;
  size?: string | null;
  stock_quantity?: number | null;
  is_active?: boolean | null;
}

export interface ListingImage {
  image_url: string | null;
  is_primary?: boolean | null;
  sort_order?: number | null;
}

export interface RawListingProduct {
  base_price?: number | null;
  sale_price?: number | null;
  is_featured?: boolean | null;
  tags?: string[] | string | null;
  categories?: { name?: string | null; slug?: string | null } | null;
  product_images?: ListingImage[] | null;
  product_variants?: ListingVariant[] | null;
}

export type ListingProduct<T extends RawListingProduct = RawListingProduct> = Omit<T, 'tags' | 'product_images'> & {
  tags: string[];
  product_images: ListingImage[];
  primary_image: string;
};

const activeVariants = (p: RawListingProduct): ListingVariant[] =>
  (p.product_variants || []).filter((v) => v && v.is_active !== false);

/** Adds primary_image, filters out blob: URLs. */
export function formatListingProduct<T extends RawListingProduct>(p: T): ListingProduct<T> {
  const validImages = (p.product_images || [])
    .filter((i) => i.image_url && !i.image_url.startsWith('blob:'))
    .sort(
      (a, b) =>
        Number(!!b.is_primary) - Number(!!a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
  return {
    ...p,
    product_images: validImages,
    primary_image: validImages[0]?.image_url || '',
    tags: Array.isArray(p.tags) ? p.tags : p.tags ? [p.tags] : [],
  } as ListingProduct<T>;
}

/** True when the product belongs to any of the given category slugs (by category_id or tag). */
export function productInCategories(p: ListingProduct, slugs: string[]): boolean {
  const set = new Set(slugs);
  if (p.categories?.slug && set.has(normalizeSlug(p.categories.slug))) return true;
  return p.tags.some((t) => set.has(normalizeSlug(t)));
}

/**
 * Builds filter options from `scope` (products of the current page/category,
 * before colour/size filters), then applies colour/size filters, sorting and
 * pagination from the query string.
 */
export function buildListing<P extends ListingProduct>(scope: P[], searchParams: SearchParams) {
  // Filter options come only from real variants — nothing is injected.
  const colorMap = new Map<string, string>();
  const sizeSet = new Set<string>();
  scope.forEach((p) => {
    activeVariants(p).forEach((v) => {
      if (v.color_name && !colorMap.has(v.color_name)) colorMap.set(v.color_name, v.color_hex || '#1A1A1A');
      if (v.size) sizeSet.add(v.size);
    });
  });
  const availableColors = Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  const availableSizes = Array.from(sizeSet).sort(compareSizes);

  let list = [...scope];

  const colors = asArray(searchParams.color);
  if (colors.length > 0) {
    list = list.filter((p) => activeVariants(p).some((v) => colors.includes(v.color_name ?? '')));
  }

  const sizes = asArray(searchParams.size);
  if (sizes.length > 0) {
    list = list.filter((p) => activeVariants(p).some((v) => sizes.includes(v.size ?? '')));
  }

  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'en-yeni';
  if (sort === 'fiyat-artan') {
    list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
  } else if (sort === 'fiyat-azalan') {
    list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
  } else if (sort === 'en-cok-satan') {
    // Featured products first, then newest (stable sort keeps created_at order)
    list.sort((a, b) => Number(!!b.is_featured) - Number(!!a.is_featured));
  }

  const totalCount = list.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rawPage = Number(typeof searchParams.page === 'string' ? searchParams.page : 1);
  const currentPage = Number.isInteger(rawPage) ? Math.min(Math.max(rawPage, 1), totalPages) : 1;
  const products = list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return { products, totalCount, currentPage, availableColors, availableSizes };
}

/** Columns needed by listing pages. */
export const LISTING_SELECT = `
  *,
  categories ( id, name, slug ),
  product_images ( image_url, is_primary, sort_order ),
  product_variants ( color_name, color_hex, size, stock_quantity, is_active )
`;
