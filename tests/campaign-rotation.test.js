/**
 * Campaign rotation — the in-greeting announcement.
 *
 * These cover the contract that made the behaviour change worth doing:
 *   - the retired permanent-dismissal flag is purged from every device
 *   - nothing at all happens when no campaign is active (no DOM, no timer)
 *   - exactly one rotation timer survives repeated Home mounts
 *   - "the server said nothing is active" never falls back to the built-in
 *   - reduced motion slows the cadence and then stops entirely
 *   - PortraitSlider's DOM is never touched
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const RENDERER = path.resolve(process.cwd(), 'frontend/js/campaign-renderer.js');

const CAMPAIGN = {
  id: 'chaliya-amritvela-2026',
  title: 'Chaliya Amritvela Trust 2026',
  content: {
    announce: {
      badge: 'CHALIYA 2026',
      title: 'Chaliya 2026',
      line: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ',
      sub: 'Coming Soon'
    }
  }
};

/** Home's greeting box, matching frontend/index.html's structure. */
function mountGreetingDom() {
  document.body.innerHTML = `
    <div id="campaignMount" hidden></div>
    <section class="greeting">
      <div class="greeting__content">
        <div class="greeting__portrait-slider" id="guruSlider" data-campaign-state="a">
          <div class="greeting__slider-track" id="guruSliderTrack">
            ${Array.from({ length: 11 }, (_, i) => `<div class="greeting__slide" data-i="${i}"></div>`).join('')}
          </div>
          <div class="greeting__announce" id="greetingAnnounce" hidden aria-hidden="true">
            <div class="greeting__announce-disc">
              <span class="greeting__announce-ik">ੴ</span>
              <span class="greeting__announce-badge" id="greetingAnnounceBadge"></span>
            </div>
          </div>
        </div>
        <div class="greeting__text">
          <div class="greeting__salutation" id="greetingSalutation">&nbsp;</div>
          <div class="greeting__gurbani" id="greetingGurbani">&nbsp;</div>
          <div class="greeting__translation" id="greetingTranslation">&nbsp;</div>
          <div class="greeting__announce-text" id="greetingAnnounceText" hidden aria-hidden="true">
            <div class="greeting__announce-title" id="greetingAnnounceTitle"></div>
            <div class="greeting__announce-line" id="greetingAnnounceLine"></div>
            <div class="greeting__announce-sub" id="greetingAnnounceSub"></div>
          </div>
        </div>
      </div>
    </section>`;
}

function stubResolver({ active, source }) {
  window.AnhadCampaigns = {
    getActiveCampaign: () => active,
    getSource: () => source,
    isFeatureEnabled: () => true
  };
}

function stubReducedMotion(reduce) {
  window.matchMedia = vi.fn().mockImplementation(q => ({
    matches: reduce && q.includes('prefers-reduced-motion'),
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn()
  }));
}

function loadRenderer() {
  // The file self-guards on window.__anhadCampaignRendererInit, so clear it to
  // get a genuinely fresh module in each test.
  delete window.__anhadCampaignRendererInit;
  delete window.AnhadCampaignRenderer;
  const code = fs.readFileSync(RENDERER, 'utf8');
  new Function('window', 'document', 'localStorage', code)(window, document, localStorage);
  return window.AnhadCampaignRenderer;
}

describe('campaign rotation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    stubReducedMotion(false);
    // isHome() reads location.pathname; jsdom defaults to '/'.
    mountGreetingDom();
    window.__anhadCampaignRotationTimer = null;
    window.__anhadCampaignRotationSig = null;
    delete window.__anhadCampaignMotionBound;
    delete window.__anhadPageCleanup;
  });

  afterEach(() => {
    try { window.AnhadCampaignRenderer?.stopRotation(); } catch (e) {}
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete window.AnhadCampaigns;
  });

  it('purges the retired permanent-dismissal flag on load', () => {
    localStorage.setItem('anhad_campaign_dismissed_v1', JSON.stringify({ 'chaliya-amritvela-2026': Date.now() }));
    stubResolver({ active: CAMPAIGN, source: 'remote' });

    loadRenderer();

    expect(localStorage.getItem('anhad_campaign_dismissed_v1')).toBeNull();
    // ...and the previously-suppressed campaign shows again.
    expect(document.getElementById('greetingAnnounce').hidden).toBe(false);
  });

  it('is a complete no-op when no campaign is active', () => {
    stubResolver({ active: null, source: 'remote' });

    loadRenderer();

    expect(document.getElementById('greetingAnnounce').hidden).toBe(true);
    expect(document.getElementById('greetingAnnounceText').hidden).toBe(true);
    expect(document.getElementById('guruSlider').getAttribute('data-campaign-state')).toBe('a');
    expect(document.getElementById('campaignMount').hidden).toBe(true);
    expect(window.__anhadCampaignRotationTimer).toBeNull();
  });

  it('keeps exactly one rotation timer across repeated Home mounts', () => {
    stubResolver({ active: CAMPAIGN, source: 'remote' });
    const api = loadRenderer();

    const first = window.__anhadCampaignRotationTimer;
    expect(first).toBeTruthy();

    // Three more arrivals with identical content must not restart anything.
    api.update();
    api.update();
    api.update();

    expect(window.__anhadCampaignRotationTimer).toBe(first);
  });

  it('re-arms with a single timer after a full leave/return cycle', () => {
    stubResolver({ active: CAMPAIGN, source: 'remote' });
    const api = loadRenderer();
    const cleared = [];
    const realClear = globalThis.clearInterval;
    vi.spyOn(globalThis, 'clearInterval').mockImplementation(id => { cleared.push(id); return realClear(id); });

    const before = window.__anhadCampaignRotationTimer;
    api.stopRotation();
    expect(window.__anhadCampaignRotationTimer).toBeNull();
    expect(cleared).toContain(before);

    api.update();
    expect(window.__anhadCampaignRotationTimer).toBeTruthy();
    expect(window.__anhadCampaignRotationTimer).not.toBe(before);
  });

  it('rotates A -> B -> A without touching PortraitSlider DOM', () => {
    stubResolver({ active: CAMPAIGN, source: 'remote' });
    loadRenderer();
    const slider = document.getElementById('guruSlider');
    const track = document.getElementById('guruSliderTrack');

    expect(slider.getAttribute('data-campaign-state')).toBe('a');

    vi.advanceTimersByTime(5000 * 4);            // 4 ticks -> State B
    expect(slider.getAttribute('data-campaign-state')).toBe('b');
    expect(document.getElementById('greetingAnnounceBadge').textContent).toBe('CHALIYA 2026');

    vi.advanceTimersByTime(5000 * 2);            // 2 more -> back to State A
    expect(slider.getAttribute('data-campaign-state')).toBe('a');

    // PortraitSlider's rebuild guard is `track.children.length === 11`.
    expect(track.children.length).toBe(11);
    expect(track.querySelectorAll('.greeting__slide').length).toBe(11);
    // The announcement must never be mistaken for a slide.
    expect(document.getElementById('greetingAnnounce').classList.contains('greeting__slide')).toBe(false);
    // The three greeting text nodes stay PortraitSlider's alone.
    expect(document.getElementById('greetingSalutation').textContent).toBe(' ');
  });

  it('never resurrects a campaign the server has switched off', () => {
    // Server reachable, nothing active -> authoritative. No fallback.
    stubResolver({ active: null, source: 'remote' });
    loadRenderer();
    expect(window.__anhadCampaignRotationTimer).toBeNull();
    expect(document.getElementById('greetingAnnounce').hidden).toBe(true);

    // Same for a cached server answer.
    window.AnhadCampaignRenderer.stopRotation();
    stubResolver({ active: null, source: 'cache' });
    window.AnhadCampaignRenderer.update();
    expect(window.__anhadCampaignRotationTimer).toBeNull();
  });

  it('honours reduced motion: slower cadence, shown once, then no timer at all', () => {
    stubReducedMotion(true);
    stubResolver({ active: CAMPAIGN, source: 'remote' });
    loadRenderer();

    expect(window.__anhadCampaignRotationTimer).toBeTruthy();

    // Reduced cadence is 20s, and the B period is A_TICKS(4) + 1.
    vi.advanceTimersByTime(20000 * 4);
    expect(document.getElementById('guruSlider').getAttribute('data-campaign-state')).toBe('b');

    // After that single showing the interval is cleared outright, so there is
    // no ongoing motion left to respect.
    expect(window.__anhadCampaignRotationTimer).toBeNull();
  });

  it('registers a composing Home cleanup that stops the rotation', () => {
    const prior = vi.fn();
    window.__anhadPageCleanup = { '/index.html': prior };
    stubResolver({ active: CAMPAIGN, source: 'remote' });
    loadRenderer();

    expect(window.__anhadCampaignRotationTimer).toBeTruthy();
    window.__anhadPageCleanup['/index.html']();

    expect(prior).toHaveBeenCalledTimes(1);          // did not clobber
    expect(window.__anhadCampaignRotationTimer).toBeNull();
  });
});
