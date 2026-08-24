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

const root = path.join(__dirname, '..');
const files = walk(root);
const matches = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (/veloria/i.test(content)) {
    matches.push(f);
  }
});

console.log(`Found ${matches.length} files containing 'veloria':`);
matches.forEach(m => console.log(m));
