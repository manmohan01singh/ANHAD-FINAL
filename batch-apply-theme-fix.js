#!/usr/bin/env node
/**
 * BATCH THEME FIX APPLICATION
 * Applies the blocking theme script to all HTML files
 */

const fs = require('fs');
const path = require('path');

const THEME_BLOCKER = `  <!-- CRITICAL: Theme blocker - MUST run before paint -->
  <script>
(function() {
  try {
    const theme = localStorage.getItem('anhad_theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
  </script>`;

const COLOR_SCHEME_META = '  <meta name="color-scheme" content="light dark">';

const HTML_FILES = [
  'frontend/NaamAbhyas/naam-abhyas.html',
  'frontend/SehajPaath/sehaj-paath.html',
  'frontend/SehajPaath/reader.html',
  'frontend/SehajPaath/shabad-reader.html',
  'frontend/SehajPaath/gurbani-search.html',
  'frontend/nitnem/reader.html',
  'frontend/nitnem/index.html',
  'frontend/nitnem/my-pothi.html',
  'frontend/nitnem/japji-sahib.html',
  'frontend/nitnem/jaap-sahib.html',
  'frontend/nitnem/chaupai-sahib.html',
  'frontend/nitnem/anand-sahib.html',
  'frontend/nitnem/rehras-sahib.html',
  'frontend/nitnem/sohila-sahib.html',
  'frontend/nitnem/tav-prasad-savaiye.html',
  'frontend/nitnem/category/sggs.html',
  'frontend/nitnem/category/dasam.html',
  'frontend/nitnem/category/sarbloh.html',
  'frontend/nitnem/category/nitnem.html',
  'frontend/nitnem/category/favorites.html',
  'frontend/GurbaniKhoj/gurbani-khoj.html',
  'frontend/GurbaniKhoj/shabad-reader.html',
  'frontend/RandomShabad/random-shabad.html',
  'frontend/GurbaniRadio/gurbani-radio.html',
  'frontend/Hukamnama/daily-hukamnama.html',
  'frontend/Calendar/gurpurab-calendar.html',
  'frontend/Notes/notes.html',
  'frontend/Profile/profile.html',
  'frontend/reminders/smart-reminders.html',
  'frontend/reminders/alarm.html',
  'frontend/Insights/insights.html',
  'frontend/Favorites/favorites.html',
  'frontend/offline.html',
  'frontend/Homepage/ios-homepage.html',
  'frontend/Homepage/splash-screen.html'
];

function applyFix(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  SKIP: ${filePath} (not found)`);
      return { status: 'skip', file: filePath };
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if already has the blocking script
    if (content.includes('anhad_theme') && content.includes('CRITICAL: Theme blocker')) {
      console.log(`✓ OK: ${filePath} (already fixed)`);
      return { status: 'ok', file: filePath };
    }

    // Find <head> tag
    const headMatch = content.match(/<head[^>]*>/i);
    if (!headMatch) {
      console.log(`❌ ERROR: ${filePath} (no <head> tag found)`);
      return { status: 'error', file: filePath };
    }

    // Add color-scheme meta if not present
    if (!content.includes('color-scheme')) {
      const headEndIndex = headMatch.index + headMatch[0].length;
      content = content.slice(0, headEndIndex) + '\n' + COLOR_SCHEME_META + content.slice(headEndIndex);
      modified = true;
    }

    // Insert theme blocker right after <head>
    const headEndIndex = content.indexOf('>', headMatch.index) + 1;
    content = content.slice(0, headEndIndex) + '\n' + THEME_BLOCKER + content.slice(headEndIndex);
    modified = true;

    // Write back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ FIXED: ${filePath}`);
    return { status: 'fixed', file: filePath };

  } catch (error) {
    console.error(`❌ ERROR: ${filePath} - ${error.message}`);
    return { status: 'error', file: filePath, error: error.message };
  }
}

// Main execution
console.log('🚀 Starting batch theme fix application...\n');
console.log(`📁 Processing ${HTML_FILES.length} files...\n`);

const results = HTML_FILES.map(applyFix);

// Summary
const fixed = results.filter(r => r.status === 'fixed').length;
const ok = results.filter(r => r.status === 'ok').length;
const skipped = results.filter(r => r.status === 'skip').length;
const errors = results.filter(r => r.status === 'error').length;

console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Fixed:   ${fixed} files`);
console.log(`✓  OK:      ${ok} files (already fixed)`);
console.log(`⚠️  Skipped: ${skipped} files (not found)`);
console.log(`❌ Errors:  ${errors} files`);
console.log('='.repeat(60));

if (errors > 0) {
  console.log('\n❌ Files with errors:');
  results.filter(r => r.status === 'error').forEach(r => {
    console.log(`  - ${r.file}${r.error ? ': ' + r.error : ''}`);
  });
}

console.log('\n✨ Batch theme fix complete!');
console.log('\n📝 Next steps:');
console.log('  1. Test navigation between pages');
console.log('  2. Verify no theme flash occurs');
console.log('  3. Check console for errors');
console.log('  4. Update JavaScript files to use anhad_theme only');

process.exit(errors > 0 ? 1 : 0);
