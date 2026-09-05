/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD GURPURAB CELEBRATION SYSTEM
 * Data-Driven Reusable Architecture for Sacred Sikh Days
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function(window) {
  'use strict';

  if (window.GurpurabSystem) return;

  const GURPURAB_REGISTRY = [
    {
      id: 'guru-nanak-prakash',
      title: 'Prakash Purab • Sri Guru Nanak Dev Ji',
      gurmukhiTitle: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ • ਧੰਨ ਧੰਨ ਸ੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ',
      guru: 'Sri Guru Nanak Dev Ji',
      dateMonthDay: '11-15', // Configurable calendar date or active override
      badgeText: 'Prakash Gurpurab',
      pankti: 'ਸਤਿਗੁਰ ਨਾਨਕ ਪ੍ਰਗਟਿਆ ਮਿਟੀ ਧੁੰਧੁ ਜਗਿ ਚਾਨਣੁ ਹੋਆ ॥',
      translation: 'With the emergence of the True Guru Nanak, the mist cleared and light filled the world.',
      cta: {
        label: 'Listen to Gurpurab Kirtan',
        action: 'play',
        stream: 'darbar'
      }
    },
    {
      id: 'guru-gobind-singh-prakash',
      title: 'Prakash Purab • Sri Guru Gobind Singh Ji',
      gurmukhiTitle: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ • ਸਰਬੰਸ ਦਾਨੀ ਸ੍ਰੀ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ',
      guru: 'Sri Guru Gobind Singh Ji',
      dateMonthDay: '01-05',
      badgeText: 'Prakash Gurpurab',
      pankti: 'ਦੇਹ ਸਿਵਾ ਬਰੁ ਮੋਹਿ ਇਹੈ ਸੁਭ ਕਰਮਨ ਤੇ ਕਬਹੂੰ ਨ ਟਰੋਂ ॥',
      translation: 'Grant me this boon, O Lord, that I may never falter from performing righteous deeds.',
      cta: {
        label: 'Listen to Dasam Bani Kirtan',
        action: 'play',
        stream: 'amritvela'
      }
    },
    {
      id: 'gurgaddi-sggs',
      title: 'Gurgaddi Divas • Sri Guru Granth Sahib Ji',
      gurmukhiTitle: 'ਗੁਰਗੱਦੀ ਦਿਵਸ • ਜੁਗੋ ਜੁਗ ਅਟੱਲ ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ',
      guru: 'Sri Guru Granth Sahib Ji',
      dateMonthDay: '10-20',
      badgeText: 'Gurgaddi Divas',
      pankti: 'ਸਭ ਸਿਖਨ ਕਉ ਹੁਕਮ ਹੈ ਗੁਰੂ ਮਾਨਿਓ ਗ੍ਰੰਥ ॥',
      translation: 'All Sikhs are commanded to accept the Granth as their Guru.',
      cta: {
        label: 'Today\'s Hukamnama',
        action: 'open',
        url: 'Hukamnama/daily-hukamnama.html'
      }
    },
    {
      id: 'bandi-chhor',
      title: 'Bandi Chhor Divas • Sri Guru Hargobind Sahib Ji',
      gurmukhiTitle: 'ਬੰਦੀ ਛੋੜ ਦਿਵਸ • ਦਾਤਾ ਬੰਦੀ ਛੋੜ ਸ੍ਰੀ ਗੁਰੂ ਹਰਿਗੋਬਿੰਦ ਸਾਹਿਬ ਜੀ',
      guru: 'Sri Guru Hargobind Sahib Ji',
      dateMonthDay: '11-01',
      badgeText: 'Bandi Chhor Divas',
      pankti: 'ਸਤਿਗੁਰ ਬੰਦੀ ਛੋੜ ਹੈ ਜੀਵਨ ਮੁਕਤਿ ਕਰੈ ਓਡੀਣਾ ॥',
      translation: 'The True Guru is the Deliverer from bondage, who liberates beings and dissolves sorrow.',
      cta: {
        label: 'Listen to Darbar Sahib Live',
        action: 'play',
        stream: 'darbar'
      }
    }
  ];

  let currentActiveEvent = null;

  function getActiveEvent() {
    // Check manual override first (for testing or admin preview)
    const overrideId = localStorage.getItem('anhad_forced_gurpurab');
    if (overrideId) {
      if (overrideId === 'none') return null;
      const found = GURPURAB_REGISTRY.find(e => e.id === overrideId);
      if (found) return found;
    }

    // Match calendar month-day (MM-DD)
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${mm}-${dd}`;

    const match = GURPURAB_REGISTRY.find(e => e.dateMonthDay === todayStr);
    return match || null;
  }

  function renderGurpurabBanner(event) {
    if (!event) {
      const existing = document.getElementById('gurpurabSacredFrame');
      if (existing) existing.remove();
      return;
    }

    const container = document.getElementById('campaignSlot') || document.querySelector('.greeting');
    if (!container) return;

    let frame = document.getElementById('gurpurabSacredFrame');
    if (!frame) {
      frame = document.createElement('div');
      frame.id = 'gurpurabSacredFrame';
      frame.className = 'gurpurab-sacred-frame';
      container.parentNode.insertBefore(frame, container.nextSibling);
    }

    frame.innerHTML = `
      <div class="gurpurab-toran-garland">
        <span class="gurpurab-toran-flower">🌼</span>
        <span class="gurpurab-toran-knot"></span>
        <span class="gurpurab-toran-flower">🌸</span>
        <span class="gurpurab-toran-knot"></span>
        <span class="gurpurab-toran-flower">🌼</span>
        <span class="gurpurab-toran-knot"></span>
        <span class="gurpurab-toran-flower">🌸</span>
        <span class="gurpurab-toran-knot"></span>
        <span class="gurpurab-toran-flower">🌼</span>
      </div>

      <div class="gurpurab-corner gurpurab-corner--tl"></div>
      <div class="gurpurab-corner gurpurab-corner--tr"></div>

      <div class="gurpurab-content">
        <div class="gurpurab-badge">✦ ${event.badgeText} ✦</div>
        <div class="gurpurab-title-gurmukhi">${event.gurmukhiTitle}</div>
        <div class="gurpurab-title-english">${event.title}</div>

        <div class="gurpurab-pankti-box">
          <div class="gurpurab-pankti">${event.pankti}</div>
          <div class="gurpurab-translation">${event.translation}</div>
        </div>

        <button class="gurpurab-cta-btn ios-haptic" type="button" id="gurpurabCtaBtn">
          <span>☬</span>
          <span>${event.cta.label}</span>
        </button>
      </div>
    `;

    const ctaBtn = frame.querySelector('#gurpurabCtaBtn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        if (event.cta.action === 'play' && window.AnhadAudio) {
          window.AnhadAudio.play(event.cta.stream || 'darbar');
        } else if (event.cta.url) {
          if (window.navigateTo) window.navigateTo(event.cta.url);
          else window.location.href = event.cta.url;
        }
      });
    }
  }

  function init() {
    currentActiveEvent = getActiveEvent();
    if (currentActiveEvent) {
      renderGurpurabBanner(currentActiveEvent);
    }
  }

  function activate(id) {
    if (id) {
      localStorage.setItem('anhad_forced_gurpurab', id);
    } else {
      localStorage.removeItem('anhad_forced_gurpurab');
    }
    init();
  }

  function deactivate() {
    localStorage.setItem('anhad_forced_gurpurab', 'none');
    renderGurpurabBanner(null);
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    window.addEventListener('anhad_page_changed', init);
  }

  window.GurpurabSystem = {
    init,
    activate,
    deactivate,
    getActiveEvent,
    registry: GURPURAB_REGISTRY
  };

})(typeof window !== 'undefined' ? window : globalThis);
