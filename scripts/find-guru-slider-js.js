const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '../frontend/js/trendora-app.js');
const content = fs.readFileSync(jsPath, 'utf8');

const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('guruSliderTrack') || l.includes('greeting__slide') || l.includes('GuruSlider')) {
    console.log(`Line ${i + 1}: ${l.trim().substring(0, 120)}`);
  }
});
