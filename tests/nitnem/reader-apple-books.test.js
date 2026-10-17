import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Nitnem Reader - Apple Books Redesign & Engine Verification', () => {
    const htmlPath = path.resolve(__dirname, '../../frontend/nitnem/reader.html');
    const cssPath = path.resolve(__dirname, '../../frontend/nitnem/css/reader.css');
    const jsPath = path.resolve(__dirname, '../../frontend/nitnem/js/reader-engine.js');

    let htmlContent = '';
    let cssContent = '';
    let jsContent = '';

    beforeEach(() => {
        htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        cssContent = fs.readFileSync(cssPath, 'utf-8');
        jsContent = fs.readFileSync(jsPath, 'utf-8');
        document.body.innerHTML = htmlContent;
    });

    describe('1. HTML DOM Structure & Floating Controls', () => {
        it('includes blocking anti-FOUC theme detector supporting all 4 themes', () => {
            expect(htmlContent).toContain("effectiveTheme !== 'light' && effectiveTheme !== 'sepia' && effectiveTheme !== 'charcoal' && effectiveTheme !== 'dark'");
            expect(htmlContent).toContain("document.documentElement.setAttribute('data-theme'");
        });

        it('has readerStickyTopBar with header Aa button', () => {
            const topBar = document.getElementById('readerStickyTopBar');
            expect(topBar).not.toBeNull();
            const headerAaBtn = document.getElementById('headerAaBtn');
            expect(headerAaBtn).not.toBeNull();
            expect(headerAaBtn?.getAttribute('aria-label')).toBe('Quick Appearance & Fonts');

            // Header hierarchy: Back button, centered title, action buttons
            const backBtn = topBar?.querySelector('.reader-back');
            expect(backBtn).not.toBeNull();
            expect(backBtn?.getAttribute('aria-label')).toBe('Back to Banis');
            expect(backBtn?.querySelector('svg')).not.toBeNull();

            const title = document.getElementById('readerTitle');
            expect(title).not.toBeNull();
            expect(title?.querySelector('.reader-gurmukhi')).not.toBeNull();
            expect(title?.querySelector('.reader-english')).not.toBeNull();

            const bookmarkBtn = document.getElementById('bookmarkBtn');
            const tickBtn = document.getElementById('tickBtn');
            const settingsBtn = document.getElementById('settingsBtn');
            expect(bookmarkBtn).not.toBeNull();
            expect(tickBtn).not.toBeNull();
            expect(settingsBtn).not.toBeNull();

            // Progress bar is pinned to the header
            const progressBar = topBar?.querySelector('#progressBar');
            expect(progressBar).not.toBeNull();

            // Segmented mode switcher
            const toggles = topBar?.querySelectorAll('.toggle-btn');
            expect(toggles?.length).toBe(4);
            const toggleIds = Array.from(toggles || []).map(b => b.id);
            expect(toggleIds).toEqual(['toggleGurmukhi', 'toggleRoman', 'toggleEnglish', 'togglePunjabi']);
        });

        it('has floating Apple Books bottom bar with all required controls', () => {
            const bottomBar = document.getElementById('readerBottomBar');
            expect(bottomBar).not.toBeNull();
            expect(bottomBar?.getAttribute('aria-label')).toBe('Reading Floating Toolbar');

            // Progress pill & ring
            const progressBtn = document.getElementById('bottomProgressBtn');
            const progressRing = document.getElementById('bottomProgressRing');
            const progressText = document.getElementById('bottomProgressText');
            expect(progressBtn).not.toBeNull();
            expect(progressRing).not.toBeNull();
            expect(progressText).not.toBeNull();

            // Auto-scroll toggle and speed button
            const autoScrollBtn = document.getElementById('bottomAutoScrollBtn');
            const speedBtn = document.getElementById('bottomSpeedBtn');
            const speedLabel = document.getElementById('bottomSpeedLabel');
            expect(autoScrollBtn).not.toBeNull();
            expect(speedBtn).not.toBeNull();
            expect(speedLabel).not.toBeNull();
            expect(speedLabel?.textContent?.trim()).toBe('2x');

            // Aa appearance pill and Scroll-to-top pill
            const aaBtn = document.getElementById('bottomAaBtn');
            const scrollTopBtn = document.getElementById('bottomScrollTopBtn');
            expect(aaBtn).not.toBeNull();
            expect(scrollTopBtn).not.toBeNull();
        });

        it('has Apple Books Aa Quick Appearance Sheet with palette, font sizing, and auto-scroll', () => {
            const overlay = document.getElementById('aaMenuOverlay');
            const sheet = document.getElementById('aaMenuSheet');
            expect(overlay).not.toBeNull();
            expect(sheet).not.toBeNull();

            // 4 theme swatches
            const swatches = document.querySelectorAll('.aa-theme-swatch');
            expect(swatches.length).toBe(4);
            const themes = Array.from(swatches).map(s => s.getAttribute('data-theme'));
            expect(themes).toEqual(['light', 'sepia', 'charcoal', 'dark']);

            // View Mode Segmented Pills (Gurmukhi, Roman, English, Punjabi)
            const viewModePills = document.querySelectorAll('.aa-mode-pill');
            expect(viewModePills.length).toBe(4);
            const modeTypes = Array.from(viewModePills).map(p => p.getAttribute('data-type'));
            expect(modeTypes).toEqual(['gurmukhi', 'roman', 'english', 'punjabi']);

            // Font slider and steppers with calibrated 18px-56px range
            expect(document.getElementById('aaSizeMinusBtn')).not.toBeNull();
            expect(document.getElementById('aaSizePlusBtn')).not.toBeNull();
            const fontSlider = document.getElementById('aaFontSlider');
            expect(fontSlider).not.toBeNull();
            expect(fontSlider?.getAttribute('min')).toBe('18');
            expect(fontSlider?.getAttribute('max')).toBe('56');
            expect(document.getElementById('aaSizeBadge')).not.toBeNull();

            // Font family selector & text alignment
            expect(document.getElementById('aaFontSelect')).not.toBeNull();
            const alignButtons = document.querySelectorAll('.aa-align-btn');
            expect(alignButtons.length).toBe(3);

            // Auto-scroll toggle & 5 speed pills
            expect(document.getElementById('aaAutoScrollToggle')).not.toBeNull();
            const speedPills = document.querySelectorAll('.aa-speed-pill');
            expect(speedPills.length).toBe(5);

            // Link to deep settings drawer
            expect(document.getElementById('aaMoreSettingsBtn')).not.toBeNull();
        });

        it('has Settings drawer with all 4 themes in theme selector', () => {
            const drawerThemes = document.querySelectorAll('#settingsDrawer .theme-bubble');
            expect(drawerThemes.length).toBe(4);
            const themes = Array.from(drawerThemes).map(s => s.getAttribute('data-theme'));
            expect(themes).toEqual(['light', 'sepia', 'charcoal', 'dark']);
        });
    });

    describe('2. CSS Color Calibrations & Editorial Gurmukhi Typography', () => {
        it('calibrates all 4 Apple Books themes in reader.css and prevents dark-mode from overriding charcoal', () => {
            expect(cssContent).toContain('[data-theme="light"]');
            expect(cssContent).toContain('#FAF8F5'); // Warm paper
            expect(cssContent).toContain('[data-theme="sepia"]');
            expect(cssContent).toContain('#F4ECD8'); // Cream sepia
            expect(cssContent).toContain('[data-theme="charcoal"]');
            expect(cssContent).toContain('#202124'); // Charcoal slate
            expect(cssContent).toContain('[data-theme="dark"]');
            expect(cssContent).toContain('#000000'); // True OLED Black
            expect(cssContent).toContain(':not([data-theme="charcoal"])'); // Prevents OLED black from hijacking charcoal slate
        });

        it('calibrates editorial Gurmukhi typography tokens and Aa view mode pills', () => {
            expect(cssContent).toContain('--line-spacing: 2.1');
            expect(cssContent).toContain('.verse-gurmukhi.manglacharan');
            expect(cssContent).toContain('.rubric-badge');
            expect(cssContent).toContain('.reader-bottom-bar');
            expect(cssContent).toContain('.aa-menu-sheet');
            expect(cssContent).toContain('.aa-segmented-modes');
            expect(cssContent).toContain('.aa-mode-pill');
        });

        it('calibrates iOS 18 glassmorphism, hairline border, and 44x44 touch hit tokens', () => {
            expect(cssContent).toContain('--border-subtle');
            expect(cssContent).toContain('saturate(180%) blur(20px)');
            expect(cssContent).toContain('.reader-sticky-top-bar');
            expect(cssContent).toContain('.reader-header');
            expect(cssContent).toContain('.reader-btn::after');
        });
    });

    describe('3. Engine Logic & Event Wiring', () => {
        it('supports all 4 themes in reader-engine.js setTheme and DEFAULTS', () => {
            expect(jsContent).toContain("validThemes = ['light', 'sepia', 'charcoal', 'dark']");
            expect(jsContent).toContain("theme: 'dark'");
            expect(jsContent).toContain("autoScrollSpeed: 2");
        });

        it('supports both ?id= and ?bani=<slug> URL routing', () => {
            expect(jsContent).toContain("const baniSlug = params.get('bani');");
            expect(jsContent).toContain("'japji-sahib': 2");
            expect(jsContent).toContain("'chaupai-sahib': 9");
            expect(jsContent).toContain("'anand-sahib': 10");
            expect(jsContent).toContain("'rehras-sahib': 21");
            expect(jsContent).toContain("'kirtan-sohila': 23");
            expect(jsContent).toContain("'sukhmani-sahib': 24");
        });

        it('wires up tap-to-toggle, pause-on-interaction, and keyboard shortcuts', () => {
            expect(jsContent).toContain("pauseAutoScroll");
            expect(jsContent).toContain("els.headerAaBtn?.addEventListener('click', toggleAaMenu)");
            expect(jsContent).toContain("els.bottomAaBtn?.addEventListener('click', toggleAaMenu)");
            expect(jsContent).toContain("els.bottomAutoScrollBtn?.addEventListener('click', toggleAutoScroll)");
            expect(jsContent).toContain("els.bottomSpeedBtn?.addEventListener('click', cycleAutoScrollSpeed)");
            expect(jsContent).toContain("els.aaFontSlider?.addEventListener('input'");
            expect(jsContent).toContain("e.key === ' '");
            expect(jsContent).toContain("e.key === 'a' || e.key === 'A'");
            expect(jsContent).toContain("document.querySelectorAll('.aa-mode-pill')");
        });

        it('auto-scroll engine implements 60fps/120fps requestAnimationFrame with speed multipliers and keeps bottom bar accessible', () => {
            expect(jsContent).toContain("AUTO_SCROLL_SPEEDS = {");
            expect(jsContent).toContain("requestAnimationFrame(step)");
            expect(jsContent).toContain("cancelAnimationFrame");
            // Critical fix: ensure bottomBar is kept visible while state.isAutoScrolling is active
            expect(jsContent).toContain("if (bottomBar && !state.isAutoScrolling) bottomBar.classList.toggle('hidden', scrollingDown);");
        });

        it('guarantees top bar recovery and smooth auto-hide on reading canvas scroll', () => {
            expect(jsContent).toContain("if (scrollTop <= 20)");
            expect(jsContent).toContain("if (stickyTopBar) stickyTopBar.classList.remove('hidden');");
        });
    });
});
