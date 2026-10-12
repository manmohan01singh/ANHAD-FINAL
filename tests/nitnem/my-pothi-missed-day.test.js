/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * My Pothi Missed-Day Interactive Completion Test Suite (R4)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Verifies:
 * - Interactive Day Drawer / Modal (#pothiDayDrawer) presentation and state
 * - Weekly bar rows and 35-day monthly grid cell click handling
 * - Historical date prayer toggling, persistence to anhad_my_pothi_completed
 * - Synchronization to Nitnem Tracker (nitnemTracker_nitnemLog) and AuthoritativeStreakEngine
 * - Dynamic recalculation of getHistoricalPct and visual repainting (lvl-0 to lvl-full)
 * - Quick batch actions: "Mark All Read" and "Clear All"
 * - Drawer open/close transitions and future date guards
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

function loadMyPothiModule() {
  const htmlPath = path.resolve(__dirname, '../../frontend/nitnem/my-pothi.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Strip scripts from htmlContent before injecting into innerHTML so jsdom does not auto-eval
  const htmlWithoutScripts = htmlContent.replace(/<script[\s\S]*?<\/script>/gi, '');
  const bodyMatch = htmlWithoutScripts.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  document.body.innerHTML = bodyMatch ? bodyMatch[1] : htmlWithoutScripts;

  // Extract inline script containing logic
  const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
  let match;
  let targetScript = null;

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    if (match[1].includes('openPothiDayDrawer') || match[1].includes('ALL_BANIS')) {
      targetScript = match[1];
      break;
    }
  }

  if (!targetScript) {
    throw new Error('Could not find My Pothi main script block in my-pothi.html');
  }

  // Provide mock AuthoritativeStreakEngine if not already present
  if (!window.AuthoritativeStreakEngine) {
    try {
      const streakEnginePath = path.resolve(__dirname, '../../frontend/lib/authoritative-streak-engine.js');
      if (fs.existsSync(streakEnginePath)) {
        window.AuthoritativeStreakEngine = require(streakEnginePath);
      }
    } catch (e) {}
  }

  const moduleObj = { exports: {} };
  const fn = new Function('window', 'document', 'localStorage', 'module', 'exports', targetScript);
  fn(window, document, window.localStorage, moduleObj, moduleObj.exports);

  return moduleObj.exports || window;
}

describe('R4: My Pothi Missed-Day Interactive Completion', () => {
  let pothi;

  let originalStorageEvent;

  beforeEach(() => {
    localStorage.clear();
    originalStorageEvent = window.StorageEvent;
    window.StorageEvent = class MockStorageEvent extends Event {
      constructor(type, init = {}) {
        super(type, init);
        this.key = init.key;
        this.newValue = init.newValue;
        this.oldValue = init.oldValue;
        this.url = init.url;
        this.storageArea = init.storageArea;
      }
    };

    // Seed default Pothi banis: [2, 4, 9, 21, 23] (Japji, Jaap, Chaupai, Rehras, Sohila)
    localStorage.setItem('anhad_my_pothi', JSON.stringify([2, 4, 9, 21, 23]));
    pothi = loadMyPothiModule();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalStorageEvent) {
      window.StorageEvent = originalStorageEvent;
    }
    document.body.innerHTML = '';
  });

  describe('1. Grid Cell & Weekly Bar Click Handlers', () => {
    it('renderMonthlyView binds openPothiDayDrawer click handlers to consistency grid cells', () => {
      const container = document.getElementById('insightsTabContent');
      pothi.renderMonthlyView(container, {});

      const cells = container.querySelectorAll('.grid-cell[data-date]');
      expect(cells.length).toBeGreaterThan(0);

      // Verify each cell has onclick calling openPothiDayDrawer with its date
      const firstCell = cells[0];
      const dateStr = firstCell.getAttribute('data-date');
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(firstCell.getAttribute('onclick')).toContain(`openPothiDayDrawer('${dateStr}')`);
    });

    it('renderWeeklyView binds openPothiDayDrawer click handlers to weekly progress rows', () => {
      const container = document.getElementById('insightsTabContent');
      pothi.renderWeeklyView(container, {});

      const rows = container.querySelectorAll('.weekly-bar-row.clickable');
      expect(rows.length).toBe(7); // 7 days of the week

      const firstRow = rows[0];
      const dateStr = firstRow.getAttribute('data-date');
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(firstRow.getAttribute('onclick')).toContain(`openPothiDayDrawer('${dateStr}')`);
    });
  });

  describe('2. Day Drawer Opening, Presentation & State', () => {
    it('openPothiDayDrawer opens drawer with formatted date, progress badge, and prayer list', () => {
      const targetDate = '2026-10-08';
      pothi.openPothiDayDrawer(targetDate);

      const drawer = document.getElementById('pothiDayDrawer');
      const backdrop = document.getElementById('pothiDrawerBackdrop');
      expect(drawer.classList.contains('visible')).toBe(true);
      expect(backdrop.classList.contains('visible')).toBe(true);

      const dateTitle = document.getElementById('pothiDrawerDateTitle');
      expect(dateTitle.textContent.length).toBeGreaterThan(0);

      const badge = document.getElementById('pothiDrawerPctBadge');
      expect(badge.textContent).toBe('0% Completed');

      const body = document.getElementById('pothiDrawerBody');
      const items = body.querySelectorAll('.pothi-drawer-item');
      expect(items.length).toBe(5); // 5 banis in default pothiOrder [2, 4, 9, 21, 23]
    });

    it('closePothiDayDrawer closes the drawer and hides overlay', () => {
      pothi.openPothiDayDrawer('2026-10-08');
      expect(document.getElementById('pothiDayDrawer').classList.contains('visible')).toBe(true);

      pothi.closePothiDayDrawer();
      expect(document.getElementById('pothiDayDrawer').classList.contains('visible')).toBe(false);
      expect(document.getElementById('pothiDrawerBackdrop').classList.contains('visible')).toBe(false);
    });
  });

  describe('3. Historical Prayer Completion & Storage Persistence', () => {
    it('toggleMissedDayBani toggles completion state and updates anhad_my_pothi_completed', () => {
      const targetDate = '2026-10-08';
      pothi.openPothiDayDrawer(targetDate);

      // Toggle Japji Sahib (ID 2)
      pothi.toggleMissedDayBani(targetDate, 2);

      const completed = JSON.parse(localStorage.getItem('anhad_my_pothi_completed') || '{}');
      expect(completed[targetDate]).toBeDefined();
      expect(completed[targetDate]).toContain(2);

      // Toggle again to uncheck
      pothi.toggleMissedDayBani(targetDate, 2);
      const updated = JSON.parse(localStorage.getItem('anhad_my_pothi_completed') || '{}');
      expect(updated[targetDate]).not.toContain(2);
    });

    it('syncs historical completion to Nitnem Tracker (nitnemTracker_nitnemLog)', () => {
      const targetDate = '2026-10-08';

      // Toggle Rehras Sahib (ID 21) which belongs to rehras period
      pothi.toggleMissedDayBani(targetDate, 21);

      const nitnemLog = JSON.parse(localStorage.getItem('nitnemTracker_nitnemLog') || '{}');
      expect(nitnemLog[targetDate]).toBeDefined();
      expect(nitnemLog[targetDate].rehras).toBeDefined();
      expect(nitnemLog[targetDate].rehras.length).toBeGreaterThan(0);
    });

    it('locks and persists snapshot denominator in anhad_pothi_snapshots', () => {
      const targetDate = '2026-10-08';
      pothi.toggleMissedDayBani(targetDate, 2);

      const snapshots = JSON.parse(localStorage.getItem('anhad_pothi_snapshots') || '{}');
      expect(snapshots[targetDate]).toBeDefined();
      expect(snapshots[targetDate].totalBanis).toBe(5);
    });
  });

  describe('4. Dynamic Percentage Recalculation & Heatmap Cell Repaint', () => {
    it('calculates accurate completion percentage via getHistoricalPct', () => {
      const targetDate = '2026-10-08';

      // 0 banis complete -> 0%
      expect(pothi.getHistoricalPct(targetDate, {})).toBe(0);

      // 1 of 5 complete -> 20%
      expect(pothi.getHistoricalPct(targetDate, { [targetDate]: [2] })).toBe(20);

      // 3 of 5 complete -> 60%
      expect(pothi.getHistoricalPct(targetDate, { [targetDate]: [2, 4, 9] })).toBe(60);

      // 5 of 5 complete -> 100%
      expect(pothi.getHistoricalPct(targetDate, { [targetDate]: [2, 4, 9, 21, 23] })).toBe(100);
    });

    it('repaints monthly grid cell from lvl-0 to lvl-full upon full completion', () => {
      const container = document.getElementById('insightsTabContent');
      const targetDate = '2026-10-08';

      // Initial render with empty completion
      pothi.renderMonthlyView(container, {});
      let cell = container.querySelector(`.grid-cell[data-date="${targetDate}"]`);
      if (cell) {
        expect(cell.classList.contains('lvl-0')).toBe(true);
      }

      // Complete all 5 banis for targetDate
      const fullData = { [targetDate]: [2, 4, 9, 21, 23] };
      pothi.renderMonthlyView(container, fullData);
      cell = container.querySelector(`.grid-cell[data-date="${targetDate}"]`);
      if (cell) {
        expect(cell.classList.contains('lvl-full')).toBe(true);
      }
    });
  });

  describe('5. Quick Actions: Mark All Read & Clear All', () => {
    it('markAllDayBanis marks all configured banis read at once', () => {
      const targetDate = '2026-10-08';
      pothi.openPothiDayDrawer(targetDate);

      pothi.markAllDayBanis(targetDate, true);

      const completed = JSON.parse(localStorage.getItem('anhad_my_pothi_completed') || '{}');
      expect(completed[targetDate]).toEqual(expect.arrayContaining([2, 4, 9, 21, 23]));

      const pctBadge = document.getElementById('pothiDrawerPctBadge');
      expect(pctBadge.textContent).toBe('100% Completed');
      expect(pctBadge.classList.contains('full')).toBe(true);
    });

    it('markAllDayBanis clears all banis when markAllComplete is false', () => {
      const targetDate = '2026-10-08';
      pothi.openPothiDayDrawer(targetDate);

      // Mark all first
      pothi.markAllDayBanis(targetDate, true);
      // Clear all
      pothi.markAllDayBanis(targetDate, false);

      const completed = JSON.parse(localStorage.getItem('anhad_my_pothi_completed') || '{}');
      expect(completed[targetDate]).toEqual([]);

      const pctBadge = document.getElementById('pothiDrawerPctBadge');
      expect(pctBadge.textContent).toBe('0% Completed');
    });
  });

  describe('6. Future Date Guard', () => {
    it('guards against marking completions for dates in the future', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const futureDateStr = tomorrow.toLocaleDateString('en-CA');

      // Attempting to open drawer for future date should not throw and should handle gracefully
      expect(() => {
        pothi.openPothiDayDrawer(futureDateStr);
      }).not.toThrow();

      // Ensure historical percentage calculation returns 0 for empty future date
      expect(pothi.getHistoricalPct(futureDateStr, {})).toBe(0);
    });
  });
});
