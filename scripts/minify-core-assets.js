/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MINIFY CORE ASSETS ENGINE (Phase 11 Step 4 & 5)
 * 
 * Safely compresses CSSOM and JavaScript bundles by removing excess whitespace,
 * comments, and line breaks without modifying variable names or logic contracts.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ')             // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1') // Strip spaces around syntax tokens
    .trim();
}

function minifyJs(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multiline comments
    .replace(/^\s*\/\/.*/gm, '')       // Remove single-line comments
    .replace(/\n\s*\n/g, '\n')         // Remove empty lines
    .trim();
}

function processMinification() {
  console.log('\n===============================================================');
  console.log('       MINIFYING CORE CSS & JS ASSETS FOR LIGHTHOUSE CRP        ');
  console.log('===============================================================\n');

  const cssFiles = [
    'frontend/css/trendora-premium.css',
    'frontend/css/ios-override.css',
    'frontend/css/desktop-responsive.css',
    'frontend/css/anhad-core.css'
  ];

  const jsFiles = [
    'frontend/js/trendora-app.js',
    'frontend/lib/smooth-navigation.js',
    'frontend/js/homepage-data.js'
  ];

  cssFiles.forEach(rel => {
    const full = path.join(__dirname, '..', rel);
    if (fs.existsSync(full)) {
      const orig = fs.readFileSync(full, 'utf8');
      const min = minifyCss(orig);
      fs.writeFileSync(full, min, 'utf8');
      console.log(`✅ Minified ${rel}: ${Math.round(orig.length/1024)} KB -> ${Math.round(min.length/1024)} KB`);
    }
  });

  jsFiles.forEach(rel => {
    const full = path.join(__dirname, '..', rel);
    if (fs.existsSync(full)) {
      const orig = fs.readFileSync(full, 'utf8');
      const min = minifyJs(orig);
      fs.writeFileSync(full, min, 'utf8');
      console.log(`✅ Minified ${rel}: ${Math.round(orig.length/1024)} KB -> ${Math.round(min.length/1024)} KB`);
    }
  });

  console.log('\n✅ Core asset minification complete.\n');
}

processMinification();
