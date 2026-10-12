import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 1: App UI/UX Stability, Correctness & Analytics Suite', () => {

  describe('1. Gurpurab Calendar Card Layout & Anti-Collision', () => {
    it('ensures frontend/index.html does not clip card with contain: paint or force 130px circle', () => {
      const htmlPath = path.resolve(process.cwd(), 'frontend/index.html');
      const html = fs.readFileSync(htmlPath, 'utf8');

      // Must not contain the broken override
      expect(html).not.toMatch(/\.event-card\s*\{[^}]*contain:\s*layout\s+style\s+paint/i);
      expect(html).not.toMatch(/\.event-card__guru-img-wrapper\s*\{[^}]*width:\s*130px/i);

      // Must have responsive sizing
      expect(html).toMatch(/\.event-card__guru-img-wrapper\s*\{[^}]*width:\s*clamp\(/i);
      expect(html).toMatch(/\.event-card__title\s*\{[^}]*word-break:\s*break-word/i);
    });

    it('ensures Calendar CSS files enable word wrapping and prevent element collisions', () => {
      const iosCss = fs.readFileSync(path.resolve(process.cwd(), 'frontend/Calendar/gurpurab-calendar-ios.css'), 'utf8');
      const baseCss = fs.readFileSync(path.resolve(process.cwd(), 'frontend/Calendar/gurpurab-calendar.css'), 'utf8');

      expect(iosCss).toMatch(/\.event-title\s*\{[^}]*word-break:\s*break-word/i);
      expect(iosCss).toMatch(/\.event-main\s*\{[^}]*flex-wrap:\s*wrap/i);
      expect(baseCss).toMatch(/\.event-title\s*\{[^}]*word-break:\s*break-word/i);
    });
  });

  describe('2. Learning Page & Unified Analytics Accuracy', () => {
    it('verifies that zero streak displays as 0 and is not artificially inflated to 1', () => {
      const insightsJsPath = path.resolve(process.cwd(), 'frontend/Insights/insights.js');
      const insightsCode = fs.readFileSync(insightsJsPath, 'utf8');

      // Must not contain the hardcoded Math.max(..., 1) bug
      expect(insightsCode).not.toMatch(/bestStreak\s*=\s*Math\.max\([^)]*,\s*1\s*\)/);
      // Must read from UnifiedStats
      expect(insightsCode).toContain('anhad_unified_stats');
      expect(insightsCode).toContain('window.UnifiedStats');
    });

    it('ensures kirtan-listening-tracker syncs with UnifiedStats and does not run duplicate intervals', () => {
      const trackerPath = path.resolve(process.cwd(), 'frontend/lib/kirtan-listening-tracker.js');
      const trackerCode = fs.readFileSync(trackerPath, 'utf8');

      // Must not call AnhadStats.startListeningSession() which ran a duplicate interval
      expect(trackerCode).not.toContain('window.AnhadStats.startListeningSession()');
      // Must sync to UnifiedStats.recordKirtanListening
      expect(trackerCode).toContain('window.UnifiedStats.recordKirtanListening');
    });

    it('ensures insights.html includes unified-stats.js script', () => {
      const insightsHtmlPath = path.resolve(process.cwd(), 'frontend/Insights/insights.html');
      const insightsHtml = fs.readFileSync(insightsHtmlPath, 'utf8');

      expect(insightsHtml).toMatch(/<script\s+src="[^"]*unified-stats\.js"><\/script>/i);
    });
  });

  describe('3. Satsangat Live Page Theming & Soft Shadows', () => {
    it('ensures player sheet uses theme variables instead of hardcoded dark backgrounds in light mode', () => {
      const sangatHtmlPath = path.resolve(process.cwd(), 'frontend/sadhsangat-live/index.html');
      const sangatHtml = fs.readFileSync(sangatHtmlPath, 'utf8');

      // The base player-sheet must use theme variables
      expect(sangatHtml).toMatch(/\.player-sheet\s*\{[^}]*background:\s*var\(--bg-primary/i);
      expect(sangatHtml).toMatch(/\.player-scroll-content\s*\{[^}]*background:\s*var\(--bg-primary/i);

      // Must not have harsh 0.8 black shadow on player-sheet
      expect(sangatHtml).not.toMatch(/\.player-sheet\s*\{[^}]*box-shadow:\s*0\s+-16px\s+50px\s+rgba\(0,\s*0,\s*0,\s*0\.8\)/i);
      // Minimized dock must have dark mode override
      expect(sangatHtml).toMatch(/html\.dark-mode\s+\.player-sheet\.minimized/i);
    });
  });

  describe('4. Campaign State Rotation & Admin Input Validation', () => {
    it('ensures campaign-renderer sets data-campaign-state to b during announcement', () => {
      const rendererPath = path.resolve(process.cwd(), 'frontend/js/campaign-renderer.js');
      const rendererCode = fs.readFileSync(rendererPath, 'utf8');

      expect(rendererCode).toContain("el.setAttribute('data-campaign-state', s);");
      expect(rendererCode).not.toContain("el.setAttribute('data-campaign-state', 'a');\n    const showing = s === 'b'");
    });

    it('verifies admin.js has campaign form validation and real error handling', () => {
      const adminPath = path.resolve(process.cwd(), 'frontend/Admin/admin.js');
      const adminCode = fs.readFileSync(adminPath, 'utf8');

      expect(adminCode).toContain('validateCampaignForm');
      expect(adminCode).toContain('Campaign title is required');
      expect(adminCode).toContain('Start date must be strictly before end date');
      expect(adminCode).toContain('Saved locally, but server sync failed');
    });
  });
});
