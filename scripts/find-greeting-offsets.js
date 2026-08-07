const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '../frontend/css');
fs.readdirSync(cssDir).forEach(file => {
  if (file.endsWith('.css')) {
    const content = fs.readFileSync(file === 'index.html' ? path.join(__dirname, '../frontend/index.html') : path.join(cssDir, file), 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      if (l.includes('.greeting') || l.includes('guruSliderTrack')) {
        if (l.includes('padding') || l.includes('margin') || l.includes('left') || l.includes('transform')) {
          console.log(`${file}:${i+1}: ${l.trim().substring(0, 100)}`);
        }
      }
    });
  }
});
