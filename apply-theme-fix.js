/**
 * THEME FLASH FIX - Automated Application Script
 * This script applies the production-grade theme fix to all HTML files
 */

const fs = require('fs');
const path = require('path');

// The blocking script that prevents FOUC
const THEME_BLOCKER = `<script>
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

// Meta tag for color scheme
const COLOR_SCHEME_META = '<meta name="color-scheme" content="light dark">';

// Files to process
const htmlFiles = [
  'frontend/index.html',
  'frontend/Dashboard/dashboard.html',
  'frontend/NitnemTracker/nitnem-tracker.html',
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
  'frontend/offline.html'
];

function applyThemeFix(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipped (not found): ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if theme blocker already exists
    if (content.includes('anhad_theme') && content.includes('document.documentElement.classList')) {
      console.log(`✓ Already fixed: ${filePath}`);
      return false;
    }

    // Remove old theme scripts (DOMContentLoaded, window.onload, etc.)
    const oldThemePatterns = [
      /document\.addEventListener\(['"]DOMContentLoaded['"],\s*function\(\)\s*\{[^}]*theme[^}]*\}\);?/gi,
      /window\.addEventListener\(['"]load['"],\s*function\(\)\s*\{[^}]*theme[^}]*\}\);?/gi,
      /window\.onload\s*=\s*function\(\)\s*\{[^}]*theme[^}]*\};?/gi
    ];

    oldThemePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    });

    // Add color-scheme meta if not present
    if (!content.includes('color-scheme')) {
      content = content.replace('</head>', `  ${COLOR_SCHEME_META}\n</head>`);
      modified = true;
    }

    // Insert theme blocker as FIRST script in <head>
    const headMatch = content.match(/<head[^>]*>/i);
    if (headMatch) {
      const headEndIndex = headMatch.index + headMatch[0].length;
      content = content.slice(0, headEndIndex) + '\n  ' + THEME_BLOCKER + content.slice(headEndIndex);
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🚀 Starting Theme Flash Fix Application...\n');

let fixed = 0;
let skipped = 0;
let errors = 0;

htmlFiles.forEach(file => {
  const result = applyThemeFix(file);
  if (result === true) fixed++;
  else if (result === false) skipped++;
  else errors++;
});

console.log('\n📊 Summary:');
console.log(`✅ Fixed: ${fixed} files`);
console.log(`⚠️  Skipped: ${skipped} files`);
console.log(`❌ Errors: ${errors} files`);
console.log('\n✨ Theme flash fix application complete!');
