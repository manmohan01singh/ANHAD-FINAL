/**
 * SHABAD READER - JS FIXES TO APPLY
 * Add these code blocks to frontend/GurbaniKhoj/shabad-reader.js
 */

// ═══════════════════════════════════════════════════════════════
// 1. GURU NAMES MAPPING - Add near top of file (after line 10)
// ═══════════════════════════════════════════════════════════════
const GURU_NAMES = {
    '1': 'Guru Nanak Dev Ji',
    '2': 'Guru Angad Dev Ji',
    '3': 'Guru Amar Das Ji',
    '4': 'Guru Ram Das Ji',
    '5': 'Guru Arjan Dev Ji',
    '9': 'Guru Tegh Bahadur Ji',
    'bhagat-kabir': 'Bhagat Kabir Ji',
    'bhagat-farid': 'Bhagat Farid Ji',
    'bhagat-ravidas': 'Bhagat Ravidas Ji',
    'bhagat-namdev': 'Bhagat Namdev Ji',
    'bhagat-beni': 'Bhagat Beni Ji',
    'bhai-gurdas': 'Bhai Gurdas Ji',
    'bhai-nand-lal': 'Bhai Nand Lal Ji'
};

// ═══════════════════════════════════════════════════════════════
// 2. UPDATE TITLE WITH GURU NAME - Find loadShabad() function
// Replace the line that sets navSubtitle with:
// ═══════════════════════════════════════════════════════════════
function updateShabadTitle(shabad) {
    // Parse mahalla from writer or raag info
    let guruName = 'Sri Guru Granth Sahib Ji';
    
    if (shabad.writer) {
        const writer = shabad.writer.english.toLowerCase();
        const mahalla = writer.match(/m(\d+)/)?.[1] || writer.match(/mahalla (\d+)/)?.[1];
        
        if (mahalla && GURU_NAMES[mahalla]) {
            guruName = GURU_NAMES[mahalla];
        } else if (writer.includes('kabir')) {
            guruName = GURU_NAMES['bhagat-kabir'];
        } else if (writer.includes('farid')) {
            guruName = GURU_NAMES['bhagat-farid'];
        } else if (writer.includes('ravidas')) {
            guruName = GURU_NAMES['bhagat-ravidas'];
        } else if (writer.includes('namdev')) {
            guruName = GURU_NAMES['bhagat-namdev'];
        } else if (writer.includes('gurdas')) {
            guruName = GURU_NAMES['bhai-gurdas'];
        }
    }
    
    DOM.navSubtitle.textContent = guruName;
}

// Call this after loading shabad data:
// updateShabadTitle(shabadData);

// ═══════════════════════════════════════════════════════════════
// 3. HIDE AUDIO & FOCUS MODE SECTIONS - Add in init function
// ═══════════════════════════════════════════════════════════════
function hideUnnecessarySections() {
    // Hide audio section
    const audioSection = document.querySelector('.settings-section:has(#autoPlaySwitch)');
    if (audioSection) audioSection.style.display = 'none';
    
    // Hide individual audio controls
    ['autoPlaySwitch', 'repeatRow', 'bgAudioRow'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const row = el.closest('.settings-row');
            if (row) row.style.display = 'none';
        }
    });
    
    // Hide focus mode
    const focusModeRow = document.querySelector('.settings-row:has([data-setting="focusMode"])');
    if (focusModeRow) focusModeRow.style.display = 'none';
}

// Call this in DOMContentLoaded or init():
// hideUnnecessarySections();

// ═══════════════════════════════════════════════════════════════
// 4. FIX LINE SPACING - Find lineSpacingSegmented click handler
// ═══════════════════════════════════════════════════════════════
function applyLineSpacing(spacing) {
    // spacing values: 'compact' = 1.4, 'normal' = 1.7, 'loose' = 2.0
    const spacingValues = {
        'compact': '1.4',
        'normal': '1.7',
        'loose': '2.0'
    };
    
    const value = spacingValues[spacing] || '1.7';
    
    // Apply to CSS variable
    document.documentElement.style.setProperty('--line-height-multiplier', value);
    
    // Apply directly to verses
    document.querySelectorAll('.gurmukhi, .hindi-gurbani').forEach(el => {
        el.style.lineHeight = value;
    });
    
    // Save preference
    localStorage.setItem('gurbani_line_spacing', spacing);
}

// Wire up to segmented control:
// DOM.lineSpacingSegmented?.querySelectorAll('button').forEach(btn => {
//     btn.addEventListener('click', () => {
//         const spacing = btn.dataset.value;
//         applyLineSpacing(spacing);
//     });
// });

// ═══════════════════════════════════════════════════════════════
// 5. FIX FONT CHANGING - Add font switching logic
// ═══════════════════════════════════════════════════════════════
const GURBANI_FONTS = {
    'noto': '"Noto Sans Gurmukhi", sans-serif',
    'raavi': '"Raavi", sans-serif',
    'anmollipi': '"AnmolLipi", sans-serif',
    'gurbaniakhar': '"GurbaniAkhar", sans-serif'
};

function applyGurbaniFont(fontKey) {
    const fontFamily = GURBANI_FONTS[fontKey] || GURBANI_FONTS['noto'];
    
    // Apply to CSS variable
    document.documentElement.style.setProperty('--gurbani-font', fontFamily);
    
    // Apply directly to all Gurmukhi text
    document.querySelectorAll('.gurmukhi').forEach(el => {
        el.style.fontFamily = fontFamily;
    });
    
    // Save preference
    localStorage.setItem('gurbani_font', fontKey);
    
    // Update UI indicator
    const activeFont = document.querySelector('#activeFontVal');
    if (activeFont) {
        activeFont.textContent = fontKey.charAt(0).toUpperCase() + fontKey.slice(1);
    }
}

// Load saved font on init:
// const savedFont = localStorage.getItem('gurbani_font') || 'noto';
// applyGurbaniFont(savedFont);

// Wire up font selector if you have one:
// DOM.fontRowBtn?.addEventListener('click', () => {
//     // Show font picker modal with GURBANI_FONTS options
// });

// ═══════════════════════════════════════════════════════════════
// 6. HEADER HIDE ON SCROLL - Add this near init/DOMContentLoaded
// ═══════════════════════════════════════════════════════════════
function initHeaderHideOnScroll() {
    let lastScrollTop = 0;
    const iosNav = document.querySelector('.ios-nav');
    const threshold = 80;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > threshold) {
            if (scrollTop > lastScrollTop) {
                // Scrolling down - hide header
                iosNav?.classList.add('nav-hidden');
            } else if (scrollTop < lastScrollTop) {
                // Scrolling up - show header
                iosNav?.classList.remove('nav-hidden');
            }
        } else {
            // Near top - always show
            iosNav?.classList.remove('nav-hidden');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });
}

// Call in DOMContentLoaded:
// initHeaderHideOnScroll();

// ═══════════════════════════════════════════════════════════════
// COMPLETE INIT FUNCTION EXAMPLE
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    // ... existing init code ...
    
    // Add these new functions:
    hideUnnecessarySections();
    initHeaderHideOnScroll();
    
    // Load saved preferences
    const savedFont = localStorage.getItem('gurbani_font') || 'noto';
    applyGurbaniFont(savedFont);
    
    const savedSpacing = localStorage.getItem('gurbani_line_spacing') || 'normal';
    applyLineSpacing(savedSpacing);
    
    // ... rest of init code ...
});
