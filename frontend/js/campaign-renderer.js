/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD CAMPAIGN RENDERER
 *
 * The consumption half of the remote campaign engine. lib/remote-config.js
 * already resolved everything — schedule window, platform targeting, priority
 * across overlapping campaigns, and the remote -> cache -> built-in fallback
 * chain — and exposed it as window.AnhadCampaigns, but nothing in the app ever
 * read it. This file is what turns that resolved config into UI.
 *
 * Design rules, in priority order:
 *   1. ADDITIVE ONLY. With no active campaign this renders nothing and the
 *      normal ANHAD experience is exactly what it was. A campaign system must
 *      never be able to blank the app it decorates.
 *   2. TOTAL FAILURE TOLERANCE. Every render is wrapped; malformed or partial
 *      campaign content degrades to "render less", never to an exception.
 *   3. AUTOMATIC BOTH WAYS. Activation and deactivation are both driven by the
 *      resolver, so a campaign ending restores the normal UI with no code
 *      change and no app release.
 *   4. QUIET. ANHAD is a Gurbani product, not a marketing surface — one banner
 *      and at most one announcement, never a dashboard of promos.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // This file is a SHELL_SCRIPT candidate and is also re-entered on SPA
  // navigation; bind listeners once per JS realm.
  if (window.__anhadCampaignRendererInit) return;
  window.__anhadCampaignRendererInit = true;

  const MOUNT_ID = 'campaignMount';
  const DISMISS_KEY = 'anhad_campaign_dismissed_v1';

  function safe(label, fn) {
    try { return fn(); }
    catch (e) { console.warn('[Campaign] ' + label + ' failed:', e); return null; }
  }

  function isHome() {
    const p = window.location.pathname;
    return p === '/' || p === '/frontend/' ||
      p.endsWith('/index.html') || p.endsWith('/frontend/');
  }

  function getMount() {
    return document.getElementById(MOUNT_ID);
  }

  /** Campaigns the user has explicitly dismissed, by id. */
  function readDismissed() {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) { return {}; }
  }

  function markDismissed(id) {
    try {
      const all = readDismissed();
      all[id] = Date.now();
      localStorage.setItem(DISMISS_KEY, JSON.stringify(all));
    } catch (e) { /* dismissal is a nicety, never a hard failure */ }
  }

  /**
   * Countdown text for a campaign that has an endDate. Returns null when there
   * is nothing meaningful to say, so the caller can omit the element entirely
   * rather than render an empty one.
   */
  function countdownText(campaign) {
    if (!campaign.endDate) return null;
    const end = new Date(campaign.endDate);
    if (isNaN(end.getTime())) return null;
    const ms = end.getTime() - Date.now();
    if (ms <= 0) return null;
    const days = Math.floor(ms / 86400000);
    if (days >= 1) return days === 1 ? '1 day remaining' : days + ' days remaining';
    const hours = Math.floor(ms / 3600000);
    if (hours >= 1) return hours === 1 ? '1 hour remaining' : hours + ' hours remaining';
    return 'Ends today';
  }

  function resolveUrl(url) {
    if (!url) return null;
    // Campaign content is authored remotely. Only allow same-origin relative
    // paths and explicit https — never javascript:, data: or similar.
    if (/^https:\/\//i.test(url)) return url;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null; // any other scheme
    return url;
  }

  function navigate(url) {
    const safeUrl = resolveUrl(url);
    if (!safeUrl) return;
    if (window.navigateTo) window.navigateTo(safeUrl);
    else window.location.href = safeUrl;
  }

  function handleCta(action, fallbackUrl) {
    // 'STREAM:amritvela' starts playback rather than navigating — the most
    // common campaign CTA for a Gurbani app.
    if (typeof action === 'string' && action.indexOf('STREAM:') === 0) {
      const stream = action.slice('STREAM:'.length);
      if (window.AnhadAudio && stream) {
        window.AnhadAudio.play(stream);
        return;
      }
    }
    navigate(fallbackUrl || action);
  }

  function clear() {
    const mount = getMount();
    if (!mount) return;
    mount.innerHTML = '';
    mount.hidden = true;
    document.documentElement.removeAttribute('data-anhad-campaign');
    // Remove any theme tokens a previous campaign injected, so an expired
    // campaign leaves no visual trace.
    const root = document.documentElement;
    ['--campaign-accent-glow', '--campaign-badge-bg', '--campaign-accent'].forEach(t => {
      root.style.removeProperty(t);
    });
  }

  function applyThemeTokens(tokens) {
    if (!tokens || typeof tokens !== 'object') return;
    const root = document.documentElement;
    if (typeof tokens.accentGlow === 'string') root.style.setProperty('--campaign-accent-glow', tokens.accentGlow);
    if (typeof tokens.badgeBackground === 'string') root.style.setProperty('--campaign-badge-bg', tokens.badgeBackground);
    if (typeof tokens.accentColor === 'string') root.style.setProperty('--campaign-accent', tokens.accentColor);
  }

  function render(campaign) {
    const mount = getMount();
    if (!mount) return; // page has no campaign slot — nothing to do, no error

    if (!campaign || !campaign.id) { clear(); return; }
    if (readDismissed()[campaign.id]) { clear(); return; }

    const content = campaign.content || {};
    const banner = content.banner || {};
    const announcement = content.announcement || {};

    applyThemeTokens(content.themeTokens);
    if (banner.accentColor) {
      document.documentElement.style.setProperty('--campaign-accent', banner.accentColor);
    }

    // Built with DOM APIs, not innerHTML: campaign copy is authored remotely,
    // and this app has no HTML sanitiser (540 innerHTML sites, escape helpers
    // in only 10 files). textContent makes injection structurally impossible.
    const frag = document.createDocumentFragment();

    const card = document.createElement('section');
    card.className = 'campaign-card';
    card.setAttribute('aria-label', campaign.title || 'Campaign');

    if (content.badgeText) {
      const badge = document.createElement('span');
      badge.className = 'campaign-card__badge';
      badge.textContent = content.badgeText;
      card.appendChild(badge);
    }

    const title = document.createElement('h2');
    title.className = 'campaign-card__title';
    title.textContent = content.heroTitle || campaign.title || '';
    if (title.textContent) card.appendChild(title);

    const subtitle = content.heroSubtitle || campaign.subtitle;
    if (subtitle) {
      const sub = document.createElement('p');
      sub.className = 'campaign-card__subtitle';
      sub.textContent = subtitle;
      card.appendChild(sub);
    }

    const cd = countdownText(campaign);
    if (cd) {
      const cdEl = document.createElement('p');
      cdEl.className = 'campaign-card__countdown';
      cdEl.textContent = cd;
      card.appendChild(cdEl);
    }

    if (announcement.message) {
      const note = document.createElement('p');
      note.className = 'campaign-card__message';
      note.textContent = (announcement.icon ? announcement.icon + ' ' : '') + announcement.message;
      card.appendChild(note);
    }

    const actions = document.createElement('div');
    actions.className = 'campaign-card__actions';

    if (content.ctaText) {
      const cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'campaign-card__cta';
      cta.textContent = content.ctaText;
      cta.addEventListener('click', () => handleCta(content.ctaAction, banner.link));
      actions.appendChild(cta);
    }

    if (announcement.actionLabel && announcement.actionUrl) {
      const secondary = document.createElement('button');
      secondary.type = 'button';
      secondary.className = 'campaign-card__secondary';
      secondary.textContent = announcement.actionLabel;
      secondary.addEventListener('click', () => navigate(announcement.actionUrl));
      actions.appendChild(secondary);
    }

    if (actions.childNodes.length) card.appendChild(actions);

    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'campaign-card__dismiss';
    dismiss.setAttribute('aria-label', 'Dismiss');
    dismiss.textContent = '×';
    dismiss.addEventListener('click', () => {
      markDismissed(campaign.id);
      clear();
    });
    card.appendChild(dismiss);

    frag.appendChild(card);

    mount.innerHTML = '';
    mount.appendChild(frag);
    mount.hidden = false;
    document.documentElement.setAttribute('data-anhad-campaign', campaign.id);
  }

  function update() {
    if (!isHome()) { safe('clear', clear); return; }
    safe('render', () => {
      const api = window.AnhadCampaigns;
      if (!api || typeof api.getActiveCampaign !== 'function') {
        // Resolver missing or failed to construct — the app must still work.
        clear();
        return;
      }
      if (api.isFeatureEnabled && !api.isFeatureEnabled('enableCampaignHeroTakeover', true)) {
        clear();
        return;
      }
      render(api.getActiveCampaign());
    });
  }

  // Re-render whenever the resolver reports a change (admin toggle, schedule
  // boundary crossed, network recovery) and on every SPA arrival.
  window.addEventListener('anhadCampaignUpdated', update);
  window.addEventListener('anhad_page_changed', update);

  // A campaign can also start or end while the app simply sits open, with no
  // config change at all — re-evaluate the schedule window periodically so the
  // UI switches over on its own.
  setInterval(() => { if (!document.hidden) update(); }, 60000);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', update);
  } else {
    update();
  }

  window.AnhadCampaignRenderer = { update, clear };
})();
