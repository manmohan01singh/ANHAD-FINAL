/**
 * PRODUCTION-GRADE THEME FLASH FIX
 * Eliminates FOUC (Flash of Unstyled Content) across all pages
 * 
 * WHAT THIS DOES:
 * 1. Injects blocking theme script in <head> of ALL HTML files
 * 2. Removes redundant theme keys (calendar_theme, naamAbhyas_theme, etc.)
 * 3. Removes late-loading theme logic (DOMContentLoaded, window.onload)
 * 4. Ensures single source of truth: anhad_theme
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// BLOCKING THEME SCRIPT (MUST RUN BEFORE PAINT)
// ============================================================================
const BLOCKING_THEME_SCRIPT = `  <!-- CRITICAL: Theme blocker - MUST run before paint -->
  <script>
    (function() {
      try {
        const theme = localStorage.getItem('anhad_theme') || 'auto';
        let effectiveTheme = theme;
        let timeOfDay = localStorage.getItem('anhad_forced_time_of_day');
        if (theme === 'auto') {
          if (timeOfDay && ['morning', 'day', 'evening', 'night'].includes(timeOfDay)) {
            effectiveTheme = (timeOfDay === 'night') ? 'dark' : 'light';
          } else {
            const hour = new Date().getHours();
            effectiveTheme = (hour >= 5 && hour < 20) ? 'light' : 'dark';
            
            if (hour >= 5 && hour < 9) timeOfDay = 'morning';
            else if (hour >= 9 && hour < 16) timeOfDay = 'day';
            else if (hour >= 16 && hour < 20) timeOfDay = 'evening';
            else timeOfDay = 'night';
          }
        }
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        document.documentElement.setAttribute('data-theme-mode', theme);
        if (theme === 'auto') {
          document.documentElement.setAttribute('data-time-of-day', timeOfDay);
        }
        document.documentElement.style.colorScheme = effectiveTheme;
        if (effectiveTheme === 'dark') {
          document.documentElement.classList.add('dark', 'dark-mode');
        } else {
          document.documentElement.classList.remove('dark', 'dark-mode');
        }
        
        let bg = (effectiveTheme === 'dark') ? '#0D0D0F' : '#FAF8F5';
        if (theme === 'auto') {
          if (timeOfDay === 'morning') bg = '#FFF5EC';
          else if (timeOfDay === 'day') bg = '#FFFDF9';
          else if (timeOfDay === 'evening') bg = '#FFF8E7';
          else if (timeOfDay === 'night') bg = '#0F0F12';
        }
        document.documentElement.style.backgroundColor = bg;
        document.documentElement.classList.add('theme-loaded');

        document.addEventListener('DOMContentLoaded', function() {
          if (effectiveTheme === 'dark') document.body.classList.add('dark-mode');
          document.body.classList.add('theme-loaded');
        }, { once: true });

        if (document.documentElement.hasAttribute('data-anhad-home')) {
          try { sessionStorage.removeItem('gurbaniKhoj_state'); } catch(e) {}
        }
      } catch (e) {}
    })();
  </script>`;

const COLOR_SCHEME_META = `  <meta name="color-scheme" content="light dark">`;

// ============================================================================
// FIND ALL HTML FILES
// ============================================================================
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .git, android, etc.
      if (!['node_modules', '.git', 'android', '.gradle', '.idea', 'build'].includes(file)) {
        findHtmlFiles(filePath, fileList);
      }
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// ============================================================================
// FIX INDIVIDUAL HTML FILE
// ============================================================================
function fixHtmlFile(filePath) {
  console.log(`\n📄 Processing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if blocking script already exists and is up to date
  const blockerRegex = /<!--\s*CRITICAL:\s*Theme blocker - MUST run before paint\s*-->\s*<script>[\s\S]*?<\/script>/i;

  if (content.match(blockerRegex)) {
    const existingBlocker = content.match(blockerRegex)[0];
    if (existingBlocker.trim() !== BLOCKING_THEME_SCRIPT.trim()) {
      content = content.replace(blockerRegex, BLOCKING_THEME_SCRIPT);
      modified = true;
      console.log('   ✓ Updated existing blocking theme script to latest version');
    } else {
      console.log('   ✓ Already has up-to-date blocking theme script');
    }
  } else {
    // If some other format exists, remove it
    if (content.includes('CRITICAL: Theme blocker')) {
      content = content.replace(/<!--\s*CRITICAL:\s*Theme blocker[\s\S]*?<\/script>/gi, '');
    }

    // Find <head> tag
    const headMatch = content.match(/<head[^>]*>/i);
    if (!headMatch) {
      console.log('   ⚠️  No <head> tag found, skipping');
      return false;
    }

    const headEndIndex = headMatch.index + headMatch[0].length;

    // Check if color-scheme meta exists
    const hasColorScheme = content.includes('name="color-scheme"');

    // Insert blocking script and color-scheme meta right after <head>
    const insertion = hasColorScheme
      ? BLOCKING_THEME_SCRIPT
      : COLOR_SCHEME_META + '\n' + BLOCKING_THEME_SCRIPT;

    content = content.slice(0, headEndIndex) + '\n' + insertion + content.slice(headEndIndex);
    modified = true;
  }

  // Remove old theme scripts that run on DOMContentLoaded or window.onload
  const oldThemePatterns = [
    // Old inline theme scripts (but keep the new blocking one)
    /<script>\s*\(function\(\)\s*\{\s*try\s*\{\s*const theme = localStorage\.getItem\('anhad_theme'\)[^}]+\}\s*catch[^}]+\}\s*\}\)\(\);\s*<\/script>/gi,
    // Conflicting Nitnem-specific Theme Initialization
    /<!--\s*Theme Initialization \(Instant & Isolated\)\s*-->\s*<script>[\s\S]*?<\/script>/gi,
    /<script>[\s\S]*?nitnem_theme_override[\s\S]*?<\/script>/gi,
  ];

  oldThemePatterns.forEach(pattern => {
    pattern.lastIndex = 0;
    const match = content.match(pattern);
    if (match && !match.some(m => m.includes('CRITICAL'))) {
      content = content.replace(pattern, '');
      console.log('   ✓ Removed old theme script');
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('   ✅ Fixed!');
    return true;
  }

  return false;
}

// ============================================================================
// FIX JAVASCRIPT FILES (REMOVE REDUNDANT THEME KEYS)
// ============================================================================
function fixJavaScriptFiles() {
  console.log('\n\n🔧 FIXING JAVASCRIPT FILES...\n');

  const jsFiles = [
    'frontend/Calendar/gurpurab-calendar.js',
    'frontend/NaamAbhyas/naam-abhyas.js',
    'frontend/NitnemTracker/nitnem-tracker.js',
    'frontend/Notes/notes-ui.js',
    'frontend/RandomShabad/random-shabad.js',
    'frontend/SehajPaath/components/theme-engine.js',
    'frontend/SehajPaath/components/shabad-reader.js',
    'frontend/SehajPaath/components/search-engine.js',
    'frontend/reminders/smart-reminders-ui.js'
  ];

  jsFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  File not found: ${filePath}`);
      return;
    }

    console.log(`\n📄 Processing: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace redundant theme keys with anhad_theme
    const replacements = [
      { from: /localStorage\.getItem\(['"]calendar_theme['"]\)/g, to: "localStorage.getItem('anhad_theme')" },
      { from: /localStorage\.setItem\(['"]calendar_theme['"],\s*/g, to: "localStorage.setItem('anhad_theme', " },
      { from: /localStorage\.getItem\(['"]naamAbhyas_theme['"]\)/g, to: "localStorage.getItem('anhad_theme')" },
      { from: /localStorage\.setItem\(['"]naamAbhyas_theme['"],\s*/g, to: "localStorage.setItem('anhad_theme', " },
      { from: /localStorage\.getItem\(['"]nitnemTracker_theme['"]\)/g, to: "localStorage.getItem('anhad_theme')" },
      { from: /localStorage\.setItem\(['"]nitnemTracker_theme['"],\s*/g, to: "localStorage.setItem('anhad_theme', " },
      { from: /localStorage\.getItem\(['"]gurbani_notes_theme['"]\)/g, to: "localStorage.getItem('anhad_theme')" },
      { from: /localStorage\.setItem\(['"]gurbani_notes_theme['"],\s*/g, to: "localStorage.setItem('anhad_theme', " },
      { from: /localStorage\.getItem\(['"]sehajPaathTheme['"]\)/g, to: "localStorage.getItem('anhad_theme')" },
      { from: /localStorage\.setItem\(['"]sehajPaathTheme['"],\s*/g, to: "localStorage.setItem('anhad_theme', " },
      { from: /localStorage\.getItem\(['"]shabad_theme['"]\)/g, to: "localStorage.getItem('anhad_theme')" },
      { from: /localStorage\.setItem\(['"]shabad_theme['"],\s*/g, to: "localStorage.setItem('anhad_theme', " },
      { from: /localStorage\.getItem\(['"]gurbani_theme['"]\)/g, to: "localStorage.getItem('anhad_theme')" },
      { from: /localStorage\.setItem\(['"]gurbani_theme['"],\s*/g, to: "localStorage.setItem('anhad_theme', " },
      { from: /localStorage\.getItem\(['"]theme['"]\)/g, to: "localStorage.getItem('anhad_theme')" },
      { from: /localStorage\.setItem\(['"]theme['"],\s*/g, to: "localStorage.setItem('anhad_theme', " },
    ];

    replacements.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('   ✅ Unified theme keys to anhad_theme');
    } else {
      console.log('   ✓ Already using anhad_theme');
    }
  });
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║   PRODUCTION-GRADE THEME FLASH FIX                             ║');
console.log('║   Eliminating FOUC across all pages                            ║');
console.log('╚════════════════════════════════════════════════════════════════╝');

const frontendDir = path.join(__dirname, 'frontend');
const htmlFiles = findHtmlFiles(frontendDir);

console.log(`\n📊 Found ${htmlFiles.length} HTML files\n`);
console.log('🔧 FIXING HTML FILES...\n');

let fixedCount = 0;
htmlFiles.forEach(file => {
  if (fixHtmlFile(file)) {
    fixedCount++;
  }
});

console.log(`\n\n✅ Fixed ${fixedCount} HTML files`);

// Fix JavaScript files
fixJavaScriptFiles();

console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
console.log('║   ✅ THEME FLASH FIX COMPLETE                                  ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('\n📋 SUMMARY:');
console.log(`   • ${fixedCount} HTML files updated with blocking theme script`);
console.log('   • All theme keys unified to: anhad_theme');
console.log('   • Late-loading theme logic removed');
console.log('   • Color scheme meta tag added');
console.log('\n🎯 RESULT:');
console.log('   • No more theme flash on page load');
console.log('   • Instant correct theme on navigation');
console.log('   • Consistent theme across all pages');
console.log('\n🧪 TEST:');
console.log('   1. Clear localStorage');
console.log('   2. Navigate between pages');
console.log('   3. Toggle theme and navigate');
console.log('   4. Verify no flash/flicker\n');
