const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend');

function searchFiles(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      searchFiles(full);
    } else if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('guruSliderTrack') || content.includes('greeting__slide')) {
        const rel = full.replace(/.*\\frontend\\/, 'frontend/').replace(/\\/g, '/');
        console.log(`Found reference in: ${rel}`);
      }
    }
  });
}

searchFiles(frontendDir);
