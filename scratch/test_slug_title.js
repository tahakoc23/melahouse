function formatTitleFromUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    // Extract slug before -p-
    const match = pathname.match(/\/([^\/]+)-p-([A-Za-z0-9]+)/);
    if (match) {
      const rawSlug = match[1];
      const clean = rawSlug
        .replace(/[-_]/g, ' ')
        .replace(/\b(ax24sm|u6852az23hs|c5995ax24sm)\b/gi, '')
        .trim();

      return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  } catch {}
  return '';
}

console.log(formatTitleFromUrl('https://www.hepsiburada.com/defacto-gomlek-yaka-cizgili-keten-kisa-kollu-tulum-c5995ax24sm-p-HBCV00006E0VX2'));
console.log(formatTitleFromUrl('https://www.hepsiburada.com/kadin-askili-halka-detayli-arkadan-capraz-tulum-p-HBCV0000EG7YGE'));
console.log(formatTitleFromUrl('https://www.hepsiburada.com/adl-dusuk-kollu-tulum-bej-18246883000-p-HBCV0000F8BVFC'));
