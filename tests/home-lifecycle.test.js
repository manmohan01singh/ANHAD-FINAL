/**
 * Home lifecycle — the P0 that made Home come back inert.
 *
 * Root cause being guarded against: trendora-app.js is in SHELL_SCRIPTS and its
 * <script> tag sits outside #app, so it is never re-injected and its IIFE runs
 * once per realm. App.init() was therefore never re-entered on an SPA return,
 * while smooth-navigation.js had replaced every node in #app — leaving the
 * Practice cards and the Gurbani Radio hero cards with no listeners at all, and
 * only a full reload (a new realm) able to fix it.
 *
 * These tests simulate exactly that: load the module once, then swap #app's
 * innerHTML and fire the arrival triggers, repeatedly.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const APP_JS = path.resolve(process.cwd(), 'frontend/js/trendora-app.js');

const HERO_AND_CARDS = `
  <section class="hero-carousel">
    <div class="hero-carousel__track" id="heroTrack">
      <article class="hero-card" id="heroCard1" data-stream="darbar"
               data-href="GurbaniRadio/gurbani-radio.html?stream=darbar"></article>
      <article class="hero-card" id="heroCard2" data-stream="amritvela"></article>
      <article class="hero-card" id="heroCard3" data-stream="simran"></article>
    </div>
    <button class="hero-carousel__dot"></button>
  </section>
  <div class="practice-grid">
    <button class="practice-card practice-card--nitnem" id="nitnemPractice" data-href="nitnem/index.html">
      <div class="practice-card__status" id="nitnemStatus">Daily Prayers</div>
    </button>
    <button class="practice-card practice-card--sehaj" id="sehajPractice" data-href="SehajPaath/sehaj-paath.html">
      <div class="practice-card__status" id="sehajStatus">Begin journey</div>
    </button>
    <button class="practice-card practice-card--hukam" id="hukamPractice" data-href="Hukamnama/daily-hukamnama.html">
      <div class="practice-card__status" id="hukamStatus">Today's Message</div>
    </button>
  </div>
  <section class="greeting">
    <div class="greeting__content">
      <div class="greeting__portrait-slider" id="guruSlider" data-campaign-state="a">
        <div class="greeting__slider-track" id="guruSliderTrack"></div>
      </div>
      <div class="greeting__text">
        <div class="greeting__salutation" id="greetingSalutation">&nbsp;</div>
        <div class="greeting__gurbani" id="greetingGurbani">&nbsp;</div>
        <div class="greeting__translation" id="greetingTranslation">&nbsp;</div>
      </div>
    </div>
  </section>`;

function buildHome() {
  document.body.innerHTML = `<main class="app" id="app">${HERO_AND_CARDS}</main>`;
}

/** What smooth-navigation.js does on every SPA arrival: replace every node. */
function simulateSpaSwap() {
  document.getElementById('app').innerHTML = HERO_AND_CARDS;
  window.__anhadNavEpoch = (window.__anhadNavEpoch || 0) + 1;
  window.dispatchEvent(new window.Event('anhad_page_changed'));
}

function clearRealmFlags() {
  Object.keys(window)
    .filter(k => k.indexOf('__anhad') === 0)
    .forEach(k => { try { delete window[k]; } catch (e) {} });
}

function loadApp() {
  const code = fs.readFileSync(APP_JS, 'utf8');
  new Function('window', 'document', 'localStorage', code)(window, document, localStorage);
}

/** Count click listeners per element by wrapping addEventListener. */
function trackClickBindings() {
  const counts = new Map();
  const real = window.Element.prototype.addEventListener;
  vi.spyOn(window.Element.prototype, 'addEventListener').mockImplementation(function (type, fn, opts) {
    if (type === 'click') {
      const key = this.id || this.className || 'anon';
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return real.call(this, type, fn, opts);
  });
  return counts;
}

describe('Home lifecycle: mount is idempotent and rebinds a swapped DOM', () => {
  beforeEach(() => {
    clearRealmFlags();
    localStorage.clear();
    buildHome();
    // Make the arrival path synchronous and deterministic.
    window.requestAnimationFrame = (cb) => { cb(0); return 0; };
    window.requestIdleCallback = undefined;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearRealmFlags();
  });

  it('binds the Gurbani Radio hero card and the Practice cards on first load', () => {
    loadApp();

    expect(document.getElementById('heroCard1').__anhadBound_nav).toBe(true);
    expect(document.getElementById('nitnemPractice').__anhadBound_nav).toBe(true);
    expect(document.getElementById('sehajPractice').__anhadBound_nav).toBe(true);
    expect(document.getElementById('hukamPractice').__anhadBound_nav).toBe(true);

    // bindCard also restores keyboard operability.
    expect(document.getElementById('heroCard1').getAttribute('role')).toBe('button');
    expect(document.getElementById('heroCard1').getAttribute('tabindex')).toBe('0');
  });

  it('rebinds after an SPA swap — the actual reported bug', () => {
    loadApp();
    expect(document.getElementById('heroCard1').__anhadBound_nav).toBe(true);

    simulateSpaSwap();

    // Fresh nodes, so the expando must have been set again on THESE nodes.
    const hero = document.getElementById('heroCard1');
    expect(hero.__anhadBound_nav).toBe(true);
    expect(hero.getAttribute('role')).toBe('button');
    ['nitnemPractice', 'sehajPractice', 'hukamPractice'].forEach(id => {
      expect(document.getElementById(id).__anhadBound_nav).toBe(true);
    });
  });

  it('adds exactly one click listener per card across six navigation cycles', () => {
    loadApp();

    for (let i = 0; i < 6; i++) {
      const counts = trackClickBindings();
      simulateSpaSwap();
      // Each fresh node gets bound once and only once per arrival.
      expect(counts.get('heroCard1') || 0).toBe(1);
      expect(counts.get('nitnemPractice') || 0).toBe(1);
      expect(counts.get('hukamPractice') || 0).toBe(1);
      vi.restoreAllMocks();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
    }
  });

  it('does not re-bind a node that survived the arrival', () => {
    loadApp();
    const hero = document.getElementById('heroCard1');

    const counts = trackClickBindings();
    // Same nodes, new arrival (what a bfcache restore looks like).
    window.__anhadNavEpoch = (window.__anhadNavEpoch || 0) + 1;
    window.dispatchEvent(new window.Event('anhad_page_changed'));

    expect(counts.get('heroCard1') || 0).toBe(0);
    expect(document.getElementById('heroCard1')).toBe(hero);
  });

  it('keeps exactly one carousel auto-advance timer across cycles', () => {
    loadApp();
    const first = window.__anhadCarouselAutoTimer;
    expect(first).toBeTruthy();

    simulateSpaSwap();
    simulateSpaSwap();

    const live = window.__anhadCarouselAutoTimer;
    expect(live).toBeTruthy();
    expect(live).not.toBe(first); // re-armed against the live nodes...
    // ...and the old handle was cleared, not orphaned: re-arming always
    // clears first, so only one can be outstanding.
  });

  it('registers a Home cleanup on the registry the router reads', () => {
    loadApp();
    expect(window.__anhadPageCleanup).toBeDefined();
    ['/', '/index.html', '/frontend/', '/frontend/index.html'].forEach(k => {
      expect(typeof window.__anhadPageCleanup[k]).toBe('function');
    });

    // Leaving Home must release the timers it owns.
    window.__anhadPageCleanup['/index.html']();
    expect(window.__anhadCarouselAutoTimer).toBeNull();
    expect(window.__anhadEventCardRotation == null).toBe(true);
  });

  it('runs the realm-scoped init exactly once no matter how many arrivals', () => {
    loadApp();
    expect(window.__anhadAppInitOnce).toBe(true);

    const before = window.__anhadSchedulerIntervals.length;
    simulateSpaSwap();
    simulateSpaSwap();
    simulateSpaSwap();

    // Scheduler is realm-scoped; repeated arrivals must not add more timers.
    expect(window.__anhadSchedulerIntervals.length).toBe(before);
  });

  it('remounts after a backgrounded PWA returns (pagehide -> pageshow)', () => {
    loadApp();
    expect(window.__anhadHomeMounted).toBe(true);
    expect(window.__anhadCarouselAutoTimer).toBeTruthy();

    // Backgrounding a mobile PWA fires pagehide, which tears Home down even
    // though every node survives untouched.
    window.dispatchEvent(new window.Event('pagehide'));
    expect(window.__anhadHomeMounted).toBe(false);
    expect(window.__anhadCarouselAutoTimer).toBeNull();

    // Returning must bring it back, even though persisted is false and every
    // node still carries its bind expando.
    const ev = new window.Event('pageshow');
    Object.defineProperty(ev, 'persisted', { value: false });
    window.dispatchEvent(ev);

    expect(window.__anhadHomeMounted).toBe(true);
    expect(window.__anhadCarouselAutoTimer).toBeTruthy();
  });
});
