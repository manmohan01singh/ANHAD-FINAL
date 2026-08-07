const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '../frontend/css');
fs.readdirSync(cssDir).forEach(file => {
  if (file.endsWith('.css')) {
    const full = path.join(cssDir, file);
    const content = fs.readFileSync(full, 'utf8');
    if (content.includes('greeting__slide') || content.includes('greeting__guru-portrait') || content.includes('portrait-slider')) {
      console.log(`Found in: frontend/css/${file}`);
    }
  }
});
