/**
 * Turkish price helpers shared by the admin product create/edit pages.
 *
 * Turkish convention: "." groups thousands, "," separates decimals
 *   "1.299,90" -> 1299.9
 *   "1299,9"   -> 1299.9
 *   "1.299"    -> 1299
 * A lone "." followed by 1-2 digits at the end ("1299.90") is treated as a
 * decimal separator so pasted values in international format still work.
 */
export function parseTurkishPrice(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;

  let s = input.replace(/[^\d.,]/g, '');
  if (!s) return null;

  if (s.includes(',')) {
    // Comma is the decimal separator; every dot is a thousands separator.
    const lastComma = s.lastIndexOf(',');
    const intPart = s.slice(0, lastComma).replace(/[.,]/g, '');
    const decPart = s.slice(lastComma + 1).replace(/[.,]/g, '');
    s = decPart ? `${intPart || '0'}.${decPart}` : intPart;
  } else {
    const dotCount = (s.match(/\./g) || []).length;
    const decimalDot = dotCount === 1 && /\.\d{1,2}$/.test(s);
    s = decimalDot ? s : s.replace(/\./g, '');
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

/** 1299.9 -> "1.299,90", 2000 -> "2.000" */
export function formatTurkishPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '';
  const n = Number(value);
  const hasFraction = Math.round(n * 100) % 100 !== 0;
  return n.toLocaleString('tr-TR', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

/** Keeps only characters that can appear in a Turkish price while typing. */
export function sanitizePriceInput(raw: string): string {
  return raw.replace(/[^\d.,]/g, '');
}

/**
 * Returns a Turkish error message, or null when the prices are valid.
 * salePrice null/0 means "no discount".
 */
export function validatePrices(basePrice: number | null, salePrice: number | null): string | null {
  if (basePrice === null || basePrice <= 0) {
    return 'Normal satış fiyatı 0’dan büyük olmalıdır.';
  }
  if (salePrice !== null && salePrice > 0 && salePrice >= basePrice) {
    return 'İndirimli fiyat, normal satış fiyatından düşük olmalıdır.';
  }
  return null;
}
