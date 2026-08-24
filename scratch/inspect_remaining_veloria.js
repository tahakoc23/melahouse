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
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/veloria/i.test(line)) {
      console.log(`${f}:${idx + 1}: ${line.trim()}`);
    }
  });
});
