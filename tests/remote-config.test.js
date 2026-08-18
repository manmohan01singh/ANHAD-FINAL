import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';

describe('Remote Configuration & Campaign Engine', () => {
  let originalFetch;
  let originalLocalStorage;

  beforeEach(() => {
    localStorage.clear();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function loadFreshManager() {
    delete window.AnhadCampaigns;
    const code = fs.readFileSync(path.resolve(process.cwd(), 'frontend/lib/remote-config.js'), 'utf8');
    const fn = new Function('window', code);
    fn(window);
    return window.AnhadCampaigns;
  }

  it('should initialize with safe built-in defaults if network and cache are unavailable', () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const manager = loadFreshManager();
    expect(manager).toBeDefined();
    
    const active = manager.getActiveCampaign();
    expect(active).toBeDefined();
    expect(active.id).toBe('chaliya-amritvela-2026');
    expect(manager.isFeatureEnabled('enableVirtualLive')).toBe(true);
  });

  it('should prioritize fresh remote config when available', async () => {
    const customConfig = {
      version: '2.0.0',
      featureFlags: { customFlag: true },
      campaigns: [
        {
          id: 'vaisakhi-2026',
          title: 'Vaisakhi Celebration 2026',
          priority: 200,
          active: true,
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2026-12-31T23:59:59Z',
          platforms: ['web', 'android']
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => customConfig
    });

    const manager = loadFreshManager();
    await manager.fetchRemoteConfig();

    const active = manager.getActiveCampaign();
    expect(active.id).toBe('vaisakhi-2026');
    expect(manager.isFeatureEnabled('customFlag')).toBe(true);
  });

  it('should correctly filter campaigns by date schedule (property-based)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 100 }), async (offsetDays) => {
        const now = new Date();
        
        const mockConfig = {
          version: '1.0.0',
          featureFlags: {},
          campaigns: [
            {
              id: 'future-event',
              priority: 500,
              active: true,
              startDate: new Date(now.getTime() + offsetDays * 86400000).toISOString(),
              endDate: new Date(now.getTime() + (offsetDays + 10) * 86400000).toISOString(),
              platforms: ['web']
            }
          ]
        };

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockConfig
        });

        const manager = loadFreshManager();
        await manager.fetchRemoteConfig();
        const active = manager.getActiveCampaign();
        // Since event is in the future, it should NOT be active
        expect(active).toBeNull();
      })
    );
  });

  it('should select the campaign with highest priority when multiple are active', async () => {
    const multiConfig = {
      version: '1.0.0',
      featureFlags: {},
      campaigns: [
        {
          id: 'low-priority-event',
          priority: 10,
          active: true,
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2026-12-31T23:59:59Z'
        },
        {
          id: 'high-priority-gurpurab',
          priority: 500,
          active: true,
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2026-12-31T23:59:59Z'
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => multiConfig
    });

    const manager = loadFreshManager();
    await manager.fetchRemoteConfig();

    const active = manager.getActiveCampaign();
    expect(active.id).toBe('high-priority-gurpurab');
  });
});
