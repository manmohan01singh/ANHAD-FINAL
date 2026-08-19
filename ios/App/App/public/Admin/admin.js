/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAMPAIGN ADMIN — the write half of the remote campaign engine.
 *
 * Talks to /api/config/admin/* behind the X-Admin-Token header (the same
 * requireAdminToken middleware that guards the Sadhsangat admin routes:
 * timing-safe compare, fails closed with 503 when the server has no token set).
 *
 * The token lives in localStorage on this device only. That is a deliberate
 * trade-off for a single-operator tool: it is never sent anywhere but the
 * config API, never logged, and never rendered back into the DOM after saving.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  const TOKEN_KEY = 'anhad_admin_token';

  // Same base resolution as lib/remote-config.js, so the admin screen always
  // targets whichever backend the app itself is reading from.
  const API_BASE = (() => {
    try {
      if (window.Capacitor && window.Capacitor.isNative) return 'https://anhad-final.onrender.com';
      const port = window.location.port;
      const host = window.location.hostname;
      if (port === '3000' || port === '3001' || host === 'localhost' || host === '127.0.0.1') {
        return `${window.location.protocol}//${host}${port ? `:${port}` : ''}`;
      }
    } catch (e) {}
    return 'https://anhad-final.onrender.com';
  })();

  const $ = (id) => document.getElementById(id);

  let token = '';
  let config = null;      // full config as last read from the server
  let selectedId = null;

  // ─── Toast ──────────────────────────────────────────────────────────────
  let toastTimer = null;
  function toast(msg, ms = 2400) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  function setStatus(id, msg, kind) {
    const el = $(id);
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'admin-status' + (kind ? ' admin-status--' + kind : '');
  }

  // ─── API ────────────────────────────────────────────────────────────────
  async function api(path, opts = {}) {
    const resp = await fetch(API_BASE + path, {
      ...opts,
      headers: {
        'X-Admin-Token': token,
        'Content-Type': 'application/json',
        ...(opts.headers || {})
      }
    });
    if (resp.status === 401) throw new Error('Unauthorized — wrong admin token.');
    if (resp.status === 503) throw new Error('Admin API is not configured on the server (ADMIN_API_TOKEN unset).');
    if (!resp.ok) {
      let detail = '';
      try { detail = (await resp.json()).error || ''; } catch (e) {}
      throw new Error(detail || `Request failed (HTTP ${resp.status})`);
    }
    return resp.status === 304 ? null : resp.json();
  }

  // ─── Date helpers ───────────────────────────────────────────────────────
  // Campaign dates are ISO-8601 UTC; <input type="datetime-local"> is local
  // wall-clock with no zone. Convert explicitly in both directions and show the
  // resolved UTC window, so scheduling a 40-day window can't be silently off by
  // the operator's timezone offset.
  function isoToLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function localInputToIso(value) {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  function refreshUtcPreview() {
    const s = localInputToIso($('fStart').value);
    const e = localInputToIso($('fEnd').value);
    if (!s && !e) { setStatus('utcPreview', ''); return; }
    setStatus('utcPreview', `UTC window: ${s || '—'} → ${e || '—'}`);
  }

  function windowLabel(c) {
    const now = Date.now();
    const s = c.startDate ? new Date(c.startDate).getTime() : null;
    const e = c.endDate ? new Date(c.endDate).getTime() : null;
    if (!c.active) return 'Off';
    if (s && now < s) return 'Scheduled — starts ' + new Date(s).toLocaleDateString();
    if (e && now > e) return 'Expired';
    return 'LIVE now';
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  function renderStore(store) {
    const el = $('storeInfo');
    if (!el || !store) return;
    if (store.durable) {
      el.className = 'admin-store';
      el.textContent = 'Storage: Cloudflare KV — changes are durable.';
    } else {
      el.className = 'admin-store admin-store--warn';
      el.textContent = 'Storage: local file — changes will be LOST when the server restarts. ' +
        'Set CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID and CF_API_TOKEN on the backend for durable storage.';
    }
  }

  function renderList() {
    const list = $('campaignList');
    list.innerHTML = '';
    const campaigns = (config && config.campaigns) || [];
    if (!campaigns.length) {
      const empty = document.createElement('p');
      empty.className = 'admin-hint';
      empty.textContent = 'No campaigns configured.';
      list.appendChild(empty);
      return;
    }

    campaigns.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'admin-item';

      const main = document.createElement('div');
      main.className = 'admin-item__main';
      const name = document.createElement('div');
      name.className = 'admin-item__name';
      name.textContent = c.title || c.id;
      const meta = document.createElement('div');
      const label = windowLabel(c);
      meta.className = 'admin-item__meta' + (label === 'LIVE now' ? ' admin-item__meta--live' : '');
      meta.textContent = label + ' · priority ' + (c.priority ?? 0);
      main.appendChild(name);
      main.appendChild(meta);
      main.addEventListener('click', () => selectCampaign(c.id));

      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'toggle' + (c.active ? ' active' : '');
      sw.setAttribute('role', 'switch');
      sw.setAttribute('aria-checked', String(!!c.active));
      sw.setAttribute('aria-label', 'Enable ' + (c.title || c.id));
      sw.addEventListener('click', () => toggleCampaign(c.id, !c.active, sw));

      row.appendChild(main);
      row.appendChild(sw);
      list.appendChild(row);
    });
  }

  function selectCampaign(id) {
    const c = (config.campaigns || []).find(x => x.id === id);
    if (!c) return;
    selectedId = id;
    const content = c.content || {};
    const ann = content.announcement || {};

    $('detailTitle').textContent = 'Edit — ' + (c.title || c.id);
    $('fTitle').value = c.title || '';
    $('fBadge').value = content.badgeText || '';
    $('fHeroTitle').value = content.heroTitle || '';
    $('fHeroSub').value = content.heroSubtitle || '';
    $('fCtaText').value = content.ctaText || '';
    $('fCtaAction').value = content.ctaAction || '';
    $('fMessage').value = ann.message || '';
    $('fStart').value = isoToLocalInput(c.startDate);
    $('fEnd').value = isoToLocalInput(c.endDate);
    $('fPriority').value = c.priority ?? 0;

    $('detailCard').hidden = false;
    refreshUtcPreview();
    setStatus('editStatus', '');
    $('detailCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Draft = the stored campaign with the form's edits applied on top. */
  function buildDraftConfig() {
    const next = JSON.parse(JSON.stringify(config));
    const c = (next.campaigns || []).find(x => x.id === selectedId);
    if (!c) return next;

    c.title = $('fTitle').value.trim();
    c.priority = parseInt($('fPriority').value, 10) || 0;
    const s = localInputToIso($('fStart').value);
    const e = localInputToIso($('fEnd').value);
    if (s) c.startDate = s; else delete c.startDate;
    if (e) c.endDate = e; else delete c.endDate;

    c.content = c.content || {};
    c.content.badgeText = $('fBadge').value.trim();
    c.content.heroTitle = $('fHeroTitle').value.trim();
    c.content.heroSubtitle = $('fHeroSub').value.trim();
    c.content.ctaText = $('fCtaText').value.trim();
    c.content.ctaAction = $('fCtaAction').value.trim();
    c.content.announcement = c.content.announcement || {};
    c.content.announcement.message = $('fMessage').value.trim();
    return next;
  }

  // ─── Actions ────────────────────────────────────────────────────────────
  async function load() {
    const data = await api('/api/config/admin/campaigns');
    config = data.config;
    renderStore(data.store);
    renderList();
  }

  async function toggleCampaign(id, active, swEl) {
    swEl.disabled = true;
    try {
      const res = await api(`/api/config/admin/campaigns/${encodeURIComponent(id)}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ active })
      });
      config = res.config;
      renderList();
      toast(active ? 'Campaign published — live within ~15s' : 'Campaign turned off');
    } catch (e) {
      toast(e.message);
      renderList();
    } finally {
      swEl.disabled = false;
    }
  }

  async function preview() {
    const draft = buildDraftConfig();
    try {
      await api('/api/config/admin/preview', {
        method: 'POST',
        body: JSON.stringify({ config: draft })
      });
    } catch (e) {
      setStatus('editStatus', e.message, 'error');
      return;
    }

    // Render through the REAL renderer so preview == what ships, rather than a
    // lookalike that could drift. renderPreview() bypasses the isHome() gate and
    // the schedule window, which is exactly what a preview needs.
    const c = (draft.campaigns || []).find(x => x.id === selectedId);
    $('previewCard').hidden = false;
    if (window.AnhadCampaignRenderer && window.AnhadCampaignRenderer.renderPreview) {
      window.AnhadCampaignRenderer.renderPreview(c);
    } else {
      setStatus('editStatus', 'Renderer unavailable — cannot preview.', 'error');
      return;
    }
    setStatus('editStatus', 'Preview rendered below. Nothing has been published yet.', 'ok');
    $('previewCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function publish() {
    const draft = buildDraftConfig();
    $('publishBtn').disabled = true;
    try {
      const res = await api('/api/config/admin/campaigns', {
        method: 'PUT',
        body: JSON.stringify({ config: draft })
      });
      config = res.config;
      renderStore(res.store);
      renderList();
      setStatus('editStatus', `Published. Version ${res.config.version}.`, 'ok');
      toast('Published — live on open devices within ~15s');
    } catch (e) {
      setStatus('editStatus', e.message, 'error');
    } finally {
      $('publishBtn').disabled = false;
    }
  }

  async function unlock(candidate) {
    token = candidate;
    setStatus('gateStatus', 'Checking…');
    try {
      await load();
      try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
      // Clear the field immediately — the token is never displayed again.
      $('tokenInput').value = '';
      $('gateCard').hidden = true;
      $('editor').hidden = false;
      $('forgetBtn').hidden = false;
      setStatus('gateStatus', '');
    } catch (e) {
      token = '';
      setStatus('gateStatus', e.message, 'error');
    }
  }

  function forget() {
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
    token = '';
    config = null;
    selectedId = null;
    $('editor').hidden = true;
    $('gateCard').hidden = false;
    $('forgetBtn').hidden = true;
    $('tokenInput').value = '';
    setStatus('gateStatus', 'Token removed from this device.');
    toast('Token forgotten');
  }

  // ─── Wire up ────────────────────────────────────────────────────────────
  function init() {
    $('unlockBtn').addEventListener('click', () => {
      const v = $('tokenInput').value.trim();
      if (!v) { setStatus('gateStatus', 'Enter a token first.', 'error'); return; }
      unlock(v);
    });
    $('tokenInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') $('unlockBtn').click();
    });
    $('forgetBtn').addEventListener('click', forget);
    $('previewBtn').addEventListener('click', preview);
    $('publishBtn').addEventListener('click', publish);
    $('fStart').addEventListener('change', refreshUtcPreview);
    $('fEnd').addEventListener('change', refreshUtcPreview);

    let saved = '';
    try { saved = localStorage.getItem(TOKEN_KEY) || ''; } catch (e) {}
    if (saved) {
      $('forgetBtn').hidden = false;
      unlock(saved);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
