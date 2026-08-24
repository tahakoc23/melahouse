const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'scratch') {
        results = results.concat(walk(filePath));
      }
    } else {
      if (/\.(ts|tsx|js|jsx|json|html|css|md)$/.test(file)) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const root = path.join(__dirname, '..', 'src');
const files = walk(root);
let modifiedCount = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace Admin Email & Password
  content = content.replace(/admin@veloria\.com/g, 'admin@melahouse.net');
  content = content.replace(/veloria123/g, 'Melahouse.2026');

  // Replace Brand Name Variations
  content = content.replace(/Veloria Stili/g, 'Mela House Stili');
  content = content.replace(/Veloria/g, 'MELA HOUSE');
  content = content.replace(/veloria\.com\.tr/g, 'melahouse.net');
  content = content.replace(/veloria\.official/g, 'melahouse.official');
  content = content.replace(/@veloria/g, '@melahouse');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log(`Updated: ${path.relative(root, filePath)}`);
  }
});

console.log(`\nSuccessfully updated ${modifiedCount} files with MELA HOUSE branding & new Admin credentials.`);
