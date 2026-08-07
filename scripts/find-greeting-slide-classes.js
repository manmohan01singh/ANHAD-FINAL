const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend');

function searchFiles(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      searchFiles(full);
    } else if (file.endsWith('.css') || file.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('greeting__slide--active')) {
        const rel = full.replace(/.*\\frontend\\/, 'frontend/').replace(/\\/g, '/');
        console.log(`Found greeting__slide--active in: ${rel}`);
      }
    }
  });
}

searchFiles(frontendDir);
