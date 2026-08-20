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

    // The built-in config still carries the Chaliya campaign so it can be
    // enabled remotely without an app release...
    const config = manager.getConfig();
    expect(config.campaigns.some(c => c.id === 'chaliya-amritvela-2026')).toBe(true);

    // ...and it now ships ACTIVE. That reversed deliberately: the consumption
    // layer used to be a dismissible card that took over its own slot on Home,
    // so shipping it dark was the only safe default. It is now the in-greeting
    // rotating announcement, which swaps in place of the Guru portraits inside
    // their already-fixed 172px box and cycles back — no extra space, no
    // dismiss control, nothing to take over. So an offline device with no
    // cached response is expected to resolve Chaliya as the active campaign.
    const active = manager.getActiveCampaign();
    expect(active).not.toBeNull();
    expect(active.id).toBe('chaliya-amritvela-2026');

    // The announcement copy the rotator renders must be present, or State B
    // would fade in to an empty disc.
    expect(active.content.announce.badge).toBeTruthy();
    expect(active.content.announce.title).toBeTruthy();

    // Provenance must say builtin here — remote-config.js only reports
    // 'remote'/'cache' once it has actually heard from the server, and
    // campaign-renderer.js relies on that distinction to decide whether a null
    // active campaign means "the owner switched it off" or "never connected".
    expect(manager.getSource()).toBe('builtin');

    // Feature flags still resolve from the built-in defaults.
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
