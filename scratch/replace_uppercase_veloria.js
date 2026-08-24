const fs = require('fs');

const files = [
  'src/app/admin/email/page.tsx',
  'src/app/loading.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/layout/Header.tsx',
  'src/components/layout/PageViewTracker.tsx',
  'src/hooks/useWishlist.ts',
  'src/stores/cartStore.ts'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/VELORIA/g, 'MELA HOUSE');
  content = content.replace(/veloria_unique_visited_date/g, 'melahouse_unique_visited_date');
  content = content.replace(/veloria_guest_wishlist/g, 'melahouse_guest_wishlist');
  content = content.replace(/veloria-cart/g, 'melahouse-cart');
  fs.writeFileSync(f, content, 'utf8');
});

console.log("Uppercase VELORIA and local storage keys updated cleanly.");
