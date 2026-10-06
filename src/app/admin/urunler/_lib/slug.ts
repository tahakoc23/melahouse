/**
 * Turkish-safe slugify shared by the admin product pages (and storefront
 * category matching).
 *   "İç Giyim"          -> "ic-giyim"
 *   "Şık Çiçekli Ağır"  -> "sik-cicekli-agir"
 */
export function slugifyTr(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .toString()
    .trim()
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining marks (e.g. "i̇", "é")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Given a desired slug and the slugs already taken, returns `base`,
 * or `base-2`, `base-3`, ... whichever is free first.
 */
export function pickUniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** SKU helpers */
export function generateMainSku(): string {
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `MH-${new Date().getFullYear()}-${randomStr}`;
}

/**
 * Next free variant SKU of the form `${mainSku}-N`, never colliding with
 * SKUs already present in `variants` (even after rows were removed).
 */
export function nextVariantSku(mainSku: string, variants: { sku?: string | null }[]): string {
  const existing = new Set(variants.map((v) => v.sku).filter(Boolean) as string[]);
  const prefix = `${mainSku}-`;
  let max = 0;
  for (const sku of existing) {
    if (sku.startsWith(prefix)) {
      const n = Number(sku.slice(prefix.length));
      if (Number.isInteger(n) && n > max) max = n;
    }
  }
  let next = max + 1;
  while (existing.has(`${prefix}${next}`)) next++;
  return `${prefix}${next}`;
}
