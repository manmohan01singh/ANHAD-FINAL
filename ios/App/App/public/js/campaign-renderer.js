/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD CAMPAIGN RENDERER — in-greeting rotating announcement
 *
 * The consumption half of the remote campaign engine. lib/remote-config.js
 * already resolved everything — schedule window, platform targeting, priority
 * across overlapping campaigns, and the remote -> cache -> built-in fallback
 * chain — and exposed it as window.AnhadCampaigns. This file turns that
 * resolved config into UI.
 *
 * WHAT THIS IS, since it changed shape:
 *   A campaign is no longer a dismissible CARD in its own slot. It is a second
 *   STATE of the existing Guru-portrait presentation. The announcement fades in
 *   over the portraits inside #guruSlider — a box whose height is already fixed
 *   at 172px by CSS — holds briefly, and fades back. It therefore occupies no
 *   new space and cannot shift a single pixel of Home. There is deliberately no
 *   close button: the rotation IS the dismissal.
 *
 * Design rules, in priority order:
 *   1. ADDITIVE ONLY. With no active campaign this renders nothing, starts no
 *      timer, and the normal ANHAD experience is exactly what it was.
 *   2. TOTAL FAILURE TOLERANCE. Every entry point is wrapped; malformed or
 *      partial content degrades to "show less", never to an exception.
 *   3. AUTOMATIC BOTH WAYS. Activation and deactivation are driven by the
 *      resolver, so a campaign ending restores the normal UI with no release.
 *   4. QUIET. ANHAD is a Gurbani product, not a marketing surface.
 *   5. EXACTLY ONE TIMER PER REALM, however many times Home is mounted.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // This file is in SHELL_SCRIPTS (smooth-navigation.js:266) and is also
  // re-entered on SPA navigation; bind listeners once per JS realm.
  if (window.__anhadCampaignRendererInit) return;
  window.__anhadCampaignRendererInit = true;

  // -- One-time purge of the retired permanent-dismissal flag ----------------
  // v1 shipped an X that wrote a never-expiring suppression record. Dismissal
  // is gone entirely now, but anyone who tapped that X would otherwise stay
  // suppressed forever. Nothing writes this key again, so no versioning needed.
  try { localStorage.removeItem('anhad_campaign_dismissed_v1'); } catch (e) {}

  const MOUNT_ID = 'campaignMount';

  // Rotation cadence, in ticks: 3 ticks of Guru artwork (12s) then 2 of the
  // announcement (8s), so the full cycle is 20s and the announcement comes
  // round roughly three times a minute. Long enough to read comfortably,
  // short enough that a user who glances at Home actually sees it.
  const TICK_MS = 4000;
  const TICK_MS_REDUCED = 20000;
  const A_TICKS = 3;
  const B_TICKS = 2;
  const REDUCED_MAX_B_VISITS = 1;

  let tick = 0;
  let bVisits = 0;

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

  // Always re-queried, never cached in a closure: #app is replaced wholesale on
  // every SPA arrival, so a captured node would be detached within one nav.
  function slider() { return document.getElementById('guruSlider'); }
  function artPane() { return document.getElementById('greetingAnnounce'); }
  function textPane() { return document.getElementById('greetingAnnounceText'); }

  function prefersReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  // -- Content ---------------------------------------------------------------
  // Clamped hard. Both panes are absolutely positioned, so they are not clipped
  // by their parent and .greeting is overflow:visible — an over-long remote
  // string would spill across the portrait and the progress bar below it.
  function clampText(s, n) {
    if (typeof s !== 'string') return '';
    const t = s.trim();
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  }

  function announceCopy(campaign) {
    const c = (campaign && campaign.content) || {};
    const an = c.announce || {};
    const legacy = c.announcement || {};
    return {
      badge: clampText(an.badge || c.badgeText || '', 22),
      title: clampText(an.title || c.heroTitle || (campaign && campaign.title) || '', 24),
      line: clampText(an.line || (c.banner && c.banner.text) || '', 40),
      sub: clampText(an.sub || c.heroSubtitle || legacy.message || (campaign && campaign.subtitle) || '', 80),
      // Caption riding the bottom edge of the disc, e.g. a live-samagam line.
      pill: clampText(an.pill || '', 28),
      // Optional artwork override. Only same-origin relative paths and https
      // are honoured — campaign content is authored remotely, so a javascript:
      // or data: src must never reach an <img>.
      image: (function () {
        var u = an.image;
        if (typeof u !== 'string' || !u) return '';
        if (/^https:\/\//i.test(u)) return u;
        if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '';
        return u;
      })()
    };
  }

  function signature(campaign) {
    const t = announceCopy(campaign);
    return [campaign.id, t.badge, t.title, t.line, t.sub, t.pill, t.image].join('|');
  }

  function applyThemeTokens(tokens) {
    if (!tokens || typeof tokens !== 'object') return;
    const root = document.documentElement;
    if (typeof tokens.accentGlow === 'string') root.style.setProperty('--campaign-accent-glow', tokens.accentGlow);
    if (typeof tokens.badgeBackground === 'string') root.style.setProperty('--campaign-badge-bg', tokens.badgeBackground);
    if (typeof tokens.accentColor === 'string') root.style.setProperty('--campaign-accent', tokens.accentColor);
  }

  function clear() {
    const mount = getMount();
    if (mount) {
      mount.innerHTML = '';
      mount.hidden = true;
    }
    document.documentElement.removeAttribute('data-anhad-campaign');
    // Remove any theme tokens a previous campaign injected, so an expired
    // campaign leaves no visual trace.
    const root = document.documentElement;
    ['--campaign-accent-glow', '--campaign-badge-bg', '--campaign-accent'].forEach(t => {
      root.style.removeProperty(t);
    });
  }

  // -- State -----------------------------------------------------------------
  // The controller's ENTIRE DOM authority is one attribute on one node. That is
  // what makes "never fights PortraitSlider" provable rather than hopeful:
  // PortraitSlider owns the .greeting__slide--* classes on descendants and the
  // three greeting text nodes; this owns data-campaign-state on the ancestor.
  // The two sets are disjoint, so neither can strand the other mid-transition.
  function setState(s) {
    const el = slider();
    if (!el) return;
    // MODIFIED: Never set state to 'b' — keep portraits always visible (state 'a')
    // Only toggle the text pane
    el.setAttribute('data-campaign-state', 'a');
    const showing = s === 'b' ? 'false' : 'true';
    const art = artPane();
    const txt = textPane();
    // Art pane (campaign disc) stays hidden always
    if (art) art.setAttribute('aria-hidden', 'true');
    // Text pane toggles normally to show campaign message
    if (txt) txt.setAttribute('aria-hidden', showing);
  }

  function currentState() {
    const el = slider();
    return el ? (el.getAttribute('data-campaign-state') || 'a') : 'a';
  }

  /**
   * Write the announcement copy into the two panes. textContent only — campaign
   * copy is authored remotely and this app has no HTML sanitiser, so injection
   * is made structurally impossible rather than filtered.
   *
   * Refuses to write while State B is on screen, deferring to the next return
   * to State A. Without that, the 60s re-evaluation tick and the 15s
   * remote-config poll could swap the words under the user's eyes mid-display.
   */
  function paint(campaign) {
    const art = artPane();
    const txt = textPane();
    if (!art || !txt) return false; // not Home, or Home without the greeting box

    if (currentState() === 'b') return true; // already armed; re-paint later

    const copy = announceCopy(campaign);
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = value;
      el.hidden = !value;
    };
    set('greetingAnnounceBadge', copy.badge);
    set('greetingAnnounceTitle', copy.title);
    set('greetingAnnounceLine', copy.line);
    set('greetingAnnounceSub', copy.sub);
    set('greetingAnnouncePill', copy.pill);

    // Artwork: only swap when the config actually supplies one, so the shipped
    // Amritvela photograph stays as the default rather than being blanked.
    if (copy.image) {
      const img = document.getElementById('greetingAnnounceImg');
      if (img && img.getAttribute('src') !== copy.image) img.setAttribute('src', copy.image);
    }

    art.hidden = false;
    txt.hidden = false;
    applyThemeTokens((campaign.content || {}).themeTokens);
    document.documentElement.setAttribute('data-anhad-campaign', campaign.id);
    return true;
  }

  function stopRotation() {
    if (window.__anhadCampaignRotationTimer) {
      clearInterval(window.__anhadCampaignRotationTimer);
      window.__anhadCampaignRotationTimer = null;
    }
    window.__anhadCampaignRotationSig = null;
    tick = 0;
    bVisits = 0;
    // Disarm synchronously and without animation on purpose. Fading out would
    // need a setTimeout, and a pending orphan timeout is exactly what this
    // controller is not allowed to leave behind.
    setState('a');
    const art = artPane();
    const txt = textPane();
    if (art) art.hidden = true;
    if (txt) txt.hidden = true;
  }

  function onTick(reduce) {
    if (document.hidden) return;
    if (!artPane()) { stopRotation(); return; }  // greeting box went away
    // Do not swap the artwork out from under someone interacting with it.
    const el = slider();
    if (el && document.activeElement && el.contains(document.activeElement)) return;

    tick++;
    const period = A_TICKS + (reduce ? 1 : B_TICKS);
    const wantB = (tick % period) >= A_TICKS;
    setState(wantB ? 'b' : 'a');

    if (wantB) {
      bVisits++;
      if (reduce && bVisits >= REDUCED_MAX_B_VISITS) {
        // Reduced motion: show it once, then stop entirely. The user gets the
        // message and there is afterwards literally no ongoing motion, because
        // the timer no longer exists.
        clearInterval(window.__anhadCampaignRotationTimer);
        window.__anhadCampaignRotationTimer = null;
      }
    }
  }

  function startRotation(campaign) {
    const sig = signature(campaign);
    const art = artPane();
    // Already armed with identical content for this arrival — a redundant start
    // (60s tick, config poll, second mount) must be a pure no-op, not a restart.
    if (window.__anhadCampaignRotationTimer &&
        window.__anhadCampaignRotationSig === sig &&
        art && !art.hidden) {
      return;
    }

    if (!paint(campaign)) return;

    const reduce = prefersReducedMotion();
    const el = slider();
    if (el) el.setAttribute('data-campaign-motion', reduce ? 'reduce' : 'full');

    // House timer convention: clear-then-set on a window key, so a second mount
    // can always see and retire the previous mount's interval.
    if (window.__anhadCampaignRotationTimer) clearInterval(window.__anhadCampaignRotationTimer);
    tick = 0;
    bVisits = 0;
    window.__anhadCampaignRotationSig = sig;
    window.__anhadCampaignRotationTimer = setInterval(
      () => safe('tick', () => onTick(reduce)),
      reduce ? TICK_MS_REDUCED : TICK_MS
    );
  }

  // -- Resolution and precedence ---------------------------------------------
  /**
   * The one thing that must not be got wrong: "remote unreachable" is NOT the
   * same as "nothing is active".
   *
   * remote-config.js always has a config — remote, then localStorage cache,
   * then the baked-in SAFE_BUILTIN_CONFIG — so a null here is a real answer,
   * not a missing one. If this device has ever heard from the server, its
   * answer is authoritative INCLUDING "nothing is active", and the built-in
   * must not resurrect a campaign the owner deliberately switched off.
   */
  function resolveCampaign() {
    const api = window.AnhadCampaigns;
    if (!api || typeof api.getActiveCampaign !== 'function') return null;
    if (api.isFeatureEnabled && !api.isFeatureEnabled('enableCampaignHeroTakeover', true)) return null;

    const active = api.getActiveCampaign();
    const src = (typeof api.getSource === 'function') ? api.getSource() : 'remote';

    // 'remote' / 'cache' — the server has spoken on this device. Trust it.
    if (src === 'remote' || src === 'cache') return active;

    // 'builtin' — never reached the API and no cached response. Only here does
    // the baked-in campaign govern, and getActiveCampaign() has already applied
    // its active flag, schedule window and platform targeting.
    return active;
  }

  function update() {
    if (!isHome()) {
      safe('stop', stopRotation);
      safe('clear', clear);
      return;
    }
    safe('update', () => {
      // The standalone card slot is retired; keep it empty and hidden so the
      // shell handling in smooth-navigation.js stays undisturbed.
      clear();
      const campaign = resolveCampaign();
      if (!campaign || !campaign.id) { stopRotation(); return; }
      startRotation(campaign);
    });
  }

  // -- Wiring ----------------------------------------------------------------
  window.addEventListener('anhadCampaignUpdated', update);
  window.addEventListener('anhad_page_changed', update);

  // A campaign can start or end while the app simply sits open, with no config
  // change at all — re-evaluate the schedule window periodically.
  setInterval(() => { if (!document.hidden) update(); }, 60000);

  // Tapping the artwork snaps back to the Guru portraits and restarts the
  // dwell. This is the replacement for the removed X: it dismisses the current
  // presentation, stores nothing, and satisfies WCAG 2.2.2 for an
  // auto-updating region without adding a control.
  document.addEventListener('pointerdown', (e) => {
    if (!window.__anhadCampaignRotationTimer) return;
    if (!e.target || !e.target.closest || !e.target.closest('#guruSlider')) return;
    tick = 0;
    setState('a');
  }, true);

  // An OS-level motion preference change mid-session must take effect now, not
  // on the next cold start.
  if (!window.__anhadCampaignMotionBound && window.matchMedia) {
    window.__anhadCampaignMotionBound = true;
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = () => { stopRotation(); update(); };
      if (mql.addEventListener) mql.addEventListener('change', onChange);
      else if (mql.addListener) mql.addListener(onChange);
    } catch (e) {}
  }

  // Teardown. Compose rather than overwrite, matching the __anhadPageInit idiom
  // in trendora-app.js; runPageCleanup() de-dupes by function identity, so
  // registering all four Home keys still yields exactly one call.
  window.__anhadPageCleanup = window.__anhadPageCleanup || {};
  ['/', '/index.html', '/frontend/', '/frontend/index.html'].forEach(p => {
    const existing = window.__anhadPageCleanup[p];
    window.__anhadPageCleanup[p] = (existing && existing !== stopRotation)
      ? () => {
          try { existing(); } catch (e) { console.warn('[Campaign] chained cleanup failed', e); }
          stopRotation();
        }
      : stopRotation;
  });

  // NOT { once: true }: pagehide also fires when a mobile PWA is backgrounded,
  // so a one-shot listener would disarm cleanup for the rest of the session.
  // The matching pageshow is what re-arms after that same backgrounding.
  window.addEventListener('pagehide', stopRotation);
  window.addEventListener('pageshow', update);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', update);
  } else {
    update();
  }

  /**
   * Render a specific campaign into the admin Preview, regardless of page or
   * schedule window. Builds the SAME State-B presentation users get — a
   * portrait-sized disc plus the announcement lines — rather than a lookalike
   * that could drift from it. Never called by the app itself; update() remains
   * the only path that honours isHome() and the resolver.
   */
  function renderPreview(campaign) {
    safe('preview', () => {
      const mount = getMount();
      if (!mount) return;
      mount.innerHTML = '';
      if (!campaign || !campaign.id) { mount.hidden = true; return; }

      applyThemeTokens((campaign.content || {}).themeTokens);
      const copy = announceCopy(campaign);

      const box = document.createElement('div');
      box.className = 'greeting__portrait-slider';
      box.setAttribute('data-campaign-state', 'b');

      const art = document.createElement('div');
      art.className = 'greeting__announce';
      const disc = document.createElement('div');
      disc.className = 'greeting__announce-disc';
      const ik = document.createElement('span');
      ik.className = 'greeting__announce-ik';
      ik.setAttribute('aria-hidden', 'true');
      ik.textContent = 'ੴ';
      disc.appendChild(ik);
      if (copy.badge) {
        const badge = document.createElement('span');
        badge.className = 'greeting__announce-badge';
        badge.textContent = copy.badge;
        disc.appendChild(badge);
      }
      art.appendChild(disc);
      box.appendChild(art);

      const txt = document.createElement('div');
      txt.className = 'greeting__announce-text greeting__announce-text--preview';
      [
        ['greeting__announce-title', copy.title],
        ['greeting__announce-line', copy.line],
        ['greeting__announce-sub', copy.sub]
      ].forEach(([cls, value]) => {
        if (!value) return;
        const el = document.createElement('div');
        el.className = cls;
        el.textContent = value;
        txt.appendChild(el);
      });

      mount.appendChild(box);
      mount.appendChild(txt);
      mount.hidden = false;
    });
  }

  window.AnhadCampaignRenderer = { update, clear, stopRotation, renderPreview };
})();
