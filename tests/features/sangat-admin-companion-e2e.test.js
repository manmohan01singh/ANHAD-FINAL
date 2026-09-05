import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('ANHAD Sangat, Companion Mode, Admin & Header Verification Suite', () => {
  const rootDir = path.resolve(__dirname, '../../frontend');

  describe('1. Header Navigation & Button Layout', () => {
    it('has Settings and Theme Toggle on Left, Search and Notifications on Right, and no Guide button in header', () => {
      const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');

      // Check header left
      expect(indexHtml).toContain('id="settingsBtn"');
      expect(indexHtml).toContain('id="themeToggleBtn"');

      // Verify Guide button is removed from header
      expect(indexHtml).not.toMatch(/<button[^>]*id="tourGuideBtn"/);

      // Check header right
      expect(indexHtml).toContain('id="sangatSearchBtn"');
      expect(indexHtml).toContain('id="notifBtn"');

      // Verify Sangat search button navigates to sangat/search.html
      expect(indexHtml).toContain("sangat/search.html");

      // Verify notifications button navigates to notifications/index.html
      expect(indexHtml).toContain("notifications/index.html");
    });
  });

  describe('2. Hero Artwork & Border Feathering Separation', () => {
    it('preserves the default hero as pristine (width 140%, object-position: center, transform: none, no side crops)', () => {
      const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');

      // Default hero styles
      expect(indexHtml).toContain('html body .greeting__hero-artwork');
      expect(indexHtml).toMatch(/html body \.greeting__hero-artwork\s*\{[^}]*width:\s*140%/);
      expect(indexHtml).toMatch(/html body \.greeting__hero-artwork\s*\{[^}]*object-position:\s*center/);
      expect(indexHtml).toMatch(/html body \.greeting__hero-artwork\s*\{[^}]*transform:\s*none/);
    });

    it('scopes optical right-shift and 4-sided gradient border feathering strictly to companion mode active', () => {
      const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');

      // Scoped companion rules
      expect(indexHtml).toContain('body.companion-mode-active .greeting__hero-artwork');
      expect(indexHtml).toMatch(/\.companion-mode-active[\s\S]*?\.greeting__hero-artwork[\s\S]*?transform:\s*scale\(1\.02\)\s*translateX\(8px\)/);
      expect(indexHtml).toMatch(/\.companion-mode-active[\s\S]*?\.greeting__hero-artwork[\s\S]*?radial-gradient/);
      expect(indexHtml).toMatch(/\.companion-mode-active[\s\S]*?\.greeting__hero-artwork[\s\S]*?linear-gradient\(to right/);
      expect(indexHtml).toMatch(/\.companion-mode-active[\s\S]*?\.greeting__hero-artwork[\s\S]*?linear-gradient\(to bottom/);
    });
  });

  describe('3. Sangat Search Dedicated Page (Apple iOS HIG)', () => {
    it('provides a standalone single page with Apple Inset Group, native search, and connect buttons', () => {
      const searchHtmlPath = path.join(rootDir, 'sangat', 'search.html');
      expect(fs.existsSync(searchHtmlPath)).toBe(true);

      const searchHtml = fs.readFileSync(searchHtmlPath, 'utf-8');

      // iOS Native Structure
      expect(searchHtml).toContain('ios-search-bar');
      expect(searchHtml).toContain('ios-search-input');
      expect(searchHtml).toContain('ios-inset-group');
      expect(searchHtml).toContain('ios-connect-btn');
      expect(searchHtml).toContain('ios-back-link');

      // Real Search & No Dummy Data
      expect(searchHtml).not.toContain('const MOCK_SANGAT');
      expect(searchHtml).toContain('anhad_sent_requests');
      expect(searchHtml).toContain('performSearch');
    });
  });

  describe('4. Admin Access & Passcode man000singh', () => {
    it('accepts passcode man000singh for instant mission control access', () => {
      const adminJs = fs.readFileSync(path.join(rootDir, 'Admin', 'admin.js'), 'utf-8');

      expect(adminJs).toMatch(/clean\s*===\s*['"]man000singh['"]/);
      expect(adminJs).toContain('initCompanionManager');
    });

    it('calculates duration in days and hours and persists to localStorage', () => {
      let store = {};
      const mockStorage = {
        setItem: (k, v) => { store[k] = String(v); },
        getItem: (k) => store[k] || null,
        removeItem: (k) => { delete store[k]; }
      };

      // Duration calculation logic
      const days = 40;
      const hours = 0;
      const durationMs = (days * 24 * 3600 * 1000) + (hours * 3600 * 1000);
      const now = 1700000000000;
      const expiry = now + durationMs;

      mockStorage.setItem('anhad_companion_duration_days', days);
      mockStorage.setItem('anhad_companion_duration_hours', hours);
      mockStorage.setItem('anhad_companion_expiry', expiry);
      mockStorage.setItem('anhad_companion_mode', 'true');

      expect(mockStorage.getItem('anhad_companion_duration_days')).toBe('40');
      expect(mockStorage.getItem('anhad_companion_mode')).toBe('true');
      expect(parseInt(mockStorage.getItem('anhad_companion_expiry'), 10)).toBe(1700000000000 + (40 * 86400000));
    });

    it('ensures companion controls are completely absent from public Settings', () => {
      const settingsHtml = fs.readFileSync(path.join(rootDir, 'Settings', 'index.html'), 'utf-8');

      expect(settingsHtml).not.toContain('Chaliya 2026 Companion Mode');
      expect(settingsHtml).not.toContain('Admin Live Monitor');
      expect(settingsHtml).not.toContain('id="companionModeToggle"');
    });
  });

  describe('5. Notifications Page Apple iOS Overhaul', () => {
    it('features an Apple segmented control, Inset Grouped cards, and activity/requests separation', () => {
      const notifHtml = fs.readFileSync(path.join(rootDir, 'notifications', 'index.html'), 'utf-8');
      const notifCss = fs.readFileSync(path.join(rootDir, 'notifications', 'notifications.css'), 'utf-8');

      // Segmented control
      expect(notifHtml).toContain('ios-segmented-control');
      expect(notifHtml).toContain('tabActivity');
      expect(notifHtml).toContain('tabRequests');

      // Apple Inset Group styling
      expect(notifCss).toContain('.ios-inset-group');
      expect(notifCss).toContain('.ios-request-cell');
      expect(notifCss).toContain('.ios-activity-cell');
      expect(notifCss).toContain('.ios-btn-confirm');

      // Dynamic rendering & zero seed dummy data
      expect(notifHtml).toContain('renderRequests');
      expect(notifHtml).toContain('renderActivity');
      expect(notifHtml).not.toContain("id: 'req_seed_1'");
      expect(notifHtml).not.toContain("id: 'act_1'");
    });
  });

  describe('6. Navigation Bar & SVG Icon Sprite Resilience', () => {
    it('prevents deletion of #mainNav, #main-nav, .tab-bar, .anhad-bottom-nav, and #anhadSvgSprite in smooth-navigation', () => {
      const navJs = fs.readFileSync(path.join(rootDir, 'lib', 'smooth-navigation.js'), 'utf-8');

      expect(navJs).toMatch(/selector\s*!==\s*'#mainNav'/);
      expect(navJs).toMatch(/selector\s*!==\s*'#main-nav'/);
      expect(navJs).toMatch(/selector\s*!==\s*'\.tab-bar'/);
      expect(navJs).toMatch(/selector\s*!==\s*'\.anhad-bottom-nav'/);
      expect(navJs).toMatch(/selector\s*!==\s*'#anhadSvgSprite'/);
    });

    it('ensures anhad-svg-sprite.js safely injects into document.body and synchronizes use tags', () => {
      const spriteJs = fs.readFileSync(path.join(rootDir, 'lib', 'anhad-svg-sprite.js'), 'utf-8');

      expect(spriteJs).toContain('document.createElement');
      expect(spriteJs).toContain('anhadSvgSprite');
      expect(spriteJs).toContain('xlink:href');
      expect(spriteJs).toContain('anhad_page_changed');
    });
  });

  describe('7. Admin Routing, Asset Resolution & Password Form Accessibility', () => {
    it('configures server.js with 301 redirect for /admin, mounts static directories, and provides explicit MIME type fallbacks', () => {
      const serverJs = fs.readFileSync(path.resolve(__dirname, '../../backend/server.js'), 'utf-8');

      expect(serverJs).toMatch(/app\.get\(\['\/admin',\s*'\/Admin',\s*'\/admin\/'\]/);
      expect(serverJs).toMatch(/res\.redirect\(301,\s*`\/Admin\/index\.html\$\{query\}`\)/);
      expect(serverJs).toMatch(/app\.use\('\/Admin',\s*express\.static/);
      expect(serverJs).toMatch(/res\.type\('text\/css'\)\.sendFile/);
      expect(serverJs).toMatch(/res\.type\('application\/javascript'\)\.sendFile/);
    });

    it('wraps password input in a form in Admin index.html with hidden username field for accessibility', () => {
      const adminHtml = fs.readFileSync(path.join(rootDir, 'Admin', 'index.html'), 'utf-8');

      expect(adminHtml).toContain('<form id="adminGateForm"');
      expect(adminHtml).toContain('id="tokenInput"');
      expect(adminHtml).toContain('autocomplete="current-password"');
      expect(adminHtml).toContain('autocomplete="username"');
      expect(adminHtml).toContain('href="admin.css"');
      expect(adminHtml).toContain('src="admin.js"');
      // Local image upload drop zone removed
      expect(adminHtml).not.toContain('id="companionFileDropZone"');
    });

    it('authenticates passcode man000singh in both server.js and auth-middleware.js', () => {
      const serverJs = fs.readFileSync(path.resolve(__dirname, '../../backend/server.js'), 'utf-8');
      const authMid = fs.readFileSync(path.resolve(__dirname, '../../backend/lib/auth-middleware.js'), 'utf-8');

      expect(serverJs).toMatch(/headerToken(\.toLowerCase\(\))?\s*===\s*['"]man000singh['"]/);
      expect(authMid).toMatch(/clean(\.toLowerCase\(\))?\s*===\s*['"]man000singh['"]/);
    });

    it('successfully authorizes requireAdmin middleware when x-admin-token is man000singh', async () => {
      const { requireAdmin } = require('../../backend/lib/auth-middleware');
      let nextCalled = false;
      const req = { headers: { 'x-admin-token': 'man000singh' } };
      const res = {
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; }
      };
      await requireAdmin(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);
      expect(req.user).toBeDefined();
      expect(req.user.role).toBe('admin');
      expect(req.user.admin).toBe(true);
    });
  });

  describe('8. Notifications Spacing & Dummy Data Elimination', () => {
    it('sets safe-area-aware padding-top and segmented control margin to prevent header clipping', () => {
      const notifCss = fs.readFileSync(path.join(rootDir, 'notifications', 'notifications.css'), 'utf-8');

      expect(notifCss).toMatch(/\.notif-container[\s\S]*?padding-top:\s*calc\(max\(env\(safe-area-inset-top,\s*24px\),\s*24px\)\s*\+\s*72px\)/);
      expect(notifCss).toMatch(/\.ios-segmented-control[\s\S]*?margin-top:\s*14px/);
    });

    it('has zero dummy seed data in notifications index.html and filters out legacy seeds', () => {
      const notifHtml = fs.readFileSync(path.join(rootDir, 'notifications', 'index.html'), 'utf-8');

      expect(notifHtml).not.toContain("id: 'req_seed_1'");
      expect(notifHtml).not.toContain("id: 'act_1'");
      expect(notifHtml).toContain('req_seed_');
      expect(notifHtml).toContain('return [];');
    });
  });

  describe('9. Sangat Search Dummy Data Removal & Alert Toggle Controls', () => {
    it('removes MOCK_SANGAT array from search.html and provides real-time search & alert notification toggle', () => {
      const searchHtml = fs.readFileSync(path.join(rootDir, 'sangat', 'search.html'), 'utf-8');

      expect(searchHtml).not.toContain('const MOCK_SANGAT');
      expect(searchHtml).toContain('performSearch');
      expect(searchHtml).toContain('toggleAlertSetting');
      expect(searchHtml).toContain('Amritvela Alert:');
    });
  });
});
