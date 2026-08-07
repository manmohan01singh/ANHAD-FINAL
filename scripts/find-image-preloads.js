const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend');

function getAllFiles(dirPath, files = []) {
  fs.readdirSync(dirPath).forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = getAllFiles(fullPath, files);
    } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
      files.push(fullPath);
    }
  });
  return files;
}

const targetImages = [
  'darbar-sahib-morning-bg.webp',
  'darbar-sahib-day-bg.webp',
  'darbar-sahib-evening-bg.webp',
  'new-night-bg.webp',
  'night-amritvela-kirtan.webp',
  'night-waheguru-simran.webp'
];

const files = getAllFiles(frontendDir);
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  targetImages.forEach(img => {
    if (content.includes(img)) {
      const rel = f.replace(/.*\\frontend\\/, 'frontend/').replace(/\\/g, '/');
      console.log(`Found ${img} in ${rel}`);
    }
  });
});
