/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI RADIO — Phase 11 Complete Rebuild
 * Server-synced live broadcast player.
 * All devices hear the same track at the same moment.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  // ─── CONFIG ───────────────────────────────────────────────────────────────
  const BACKEND = (() => {
    try {
      const port = window.location.port;
      const host = window.location.hostname;
      if (port === '3000' || port === '3001') return 'http://localhost:3000';
      if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
      if (host.match(/^[0-9]+(\.[0-9]+){3}$/)) return `http://${host}:3000`;
    } catch (e) {}
    return 'https://anhad-final.onrender.com';
  })();
  const AUDIO_BASE = BACKEND + '/audio';
  const POLL_MS   = 5000;   // poll /api/radio/live every 5s
  const HB_MS     = 30000;  // heartbeat every 30s
  const RETRY_MS  = 10000;  // auto-retry on error every 10s
  const DRIFT_MAX = 5;      // seconds — re-sync if drifted beyond this

  // ─── STATE ────────────────────────────────────────────────────────────────
  let audio         = null;
  let isPlaying     = false;
  let currentIndex  = 0;
  let currentDur    = 3600;
  let pollTimer     = null;
  let hbTimer       = null;
  let retryTimer    = null;
  let listenerId    = getListenerId();
  let lastLiveData  = null;

  // ─── DOM CACHE ────────────────────────────────────────────────────────────
  const $   = id => document.getElementById(id);
  const dom = {};

  function cacheDOM() {
    dom.loading       = $('grLoading');
    dom.error         = $('grError');
    dom.retryBtn      = $('grRetryBtn');
    dom.toast         = $('grToast');
    dom.art           = $('grArt');
    dom.artImg        = $('grArtImg');
    dom.bgImg         = $('grBgImg');
    dom.trackTitle    = $('grTrackTitle');
    dom.elapsed       = $('grElapsed');
    dom.remaining     = $('grRemaining');
    dom.progressFill  = $('grProgressFill');
    dom.progressThumb = $('grProgressThumb');
    dom.playBtn       = $('grPlayBtn');
    dom.playIcon      = $('grPlayIcon');
    dom.prevBtn       = $('grPrevBtn');
    dom.nextBtn       = $('grNextBtn');
    dom.shareBtn      = $('grShareBtn');
    dom.volumeBtn     = $('grVolumeBtn');
    dom.volumeSlider  = $('grVolumeSlider');
    dom.volumeInput   = $('grVolumeInput');
    dom.listeners     = $('grListeners');
    dom.playlistBody  = $('grPlaylistBody');
    dom.playlistInfo  = $('grPlaylistInfo');
    dom.backBtn       = $('grBackBtn');
    dom.themeBtn      = $('grThemeBtn');
    dom.themeIcon     = $('grThemeIcon');
  }

  // ─── LISTENER ID ──────────────────────────────────────────────────────────
  function getListenerId() {
    try {
      let id = localStorage.getItem('gr_listener_id');
      if (!id) {
        id = 'l_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        localStorage.setItem('gr_listener_id', id);
      }
      return id;
    } catch (e) { return 'l_' + Math.random().toString(36).slice(2); }
  }

  // ─── API ──────────────────────────────────────────────────────────────────
  async function fetchLive() {
    const t0 = Date.now();
    const resp = await fetch(BACKEND + '/api/radio/live', { cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    // compensate for latency
    const latency = (Date.now() - t0) / 2000;
    data._adjustedPosition = Math.min(
      (data.trackPosition || 0) + latency,
      (data.trackDuration || 3600) - 1
    );
    return data;
  }

  async function sendHeartbeat() {
    try {
      const resp = await fetch(BACKEND + '/api/radio/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listenerId })
      });
      if (resp.ok) {
        const data = await resp.json();
        updateListeners(data.listenersCount || 0);
        // drift correction
        if (audio && isPlaying && data.trackIndex === currentIndex) {
          const drift = Math.abs(audio.currentTime - data.trackPosition);
          if (drift > DRIFT_MAX) {
            console.log('[GR] Drift ' + drift.toFixed(1) + 's → correcting');
            audio.currentTime = data.trackPosition;
          }
        } else if (data.trackIndex !== currentIndex) {
          goLive();
        }
      }
    } catch (e) { /* non-critical */ }
  }

  async function reportDuration(idx, dur) {
    try {
      fetch(BACKEND + '/api/radio/durations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackIndex: idx, duration: dur })
      });
    } catch (e) { /* non-critical */ }
  }

  // ─── PLAYBACK ─────────────────────────────────────────────────────────────
  async function goLive() {
    showLoading(true);
    showError(false);
    clearRetry();

    try {
      const data = await fetchLive();
      lastLiveData = data;

      currentIndex = data.trackIndex;
      currentDur   = data.trackDuration || 3600;

      const url = AUDIO_BASE + '/day-' + (currentIndex + 1) + '.webm';
      await loadAndPlay(url, data._adjustedPosition, data);

      updateTrackInfo(data);
      updateListeners(data.listenersCount || 0);

      showLoading(false);
      startPoll();
      startHeartbeat();

      // Persist for global mini-player
      saveGlobalState();

    } catch (err) {
      console.error('[GR] goLive error:', err);
      showLoading(false);
      showError(true);
      scheduleRetry();
    }
  }

  function loadAndPlay(url, seekTo, liveData) {
    return new Promise((resolve, reject) => {
      if (!audio) return reject(new Error('No audio element'));

      const isSame = audio.src && audio.src.includes('day-' + (currentIndex + 1) + '.webm');

      const doPlay = async () => {
        try {
          const dur = isFinite(audio.duration) ? audio.duration : (liveData?.trackDuration || 3600);
          const safeSeek = Math.min(Math.max(0, seekTo), dur - 2);
          if (Math.abs(audio.currentTime - safeSeek) > 2) {
            audio.currentTime = safeSeek;
          }
          await audio.play();
          isPlaying = true;
          updatePlayButton();
          resolve();
        } catch (e) {
          reject(e);
        }
      };

      if (isSame && audio.readyState >= 2) {
        doPlay();
        return;
      }

      const onMeta = () => {
        audio.removeEventListener('loadedmetadata', onMeta);
        audio.removeEventListener('error', onErr);
        // Report actual duration for global accuracy
        if (isFinite(audio.duration)) reportDuration(currentIndex, audio.duration);
        doPlay();
      };
      const onErr = (e) => {
        audio.removeEventListener('loadedmetadata', onMeta);
        audio.removeEventListener('error', onErr);
        const errCode = audio.error ? audio.error.code : 'unknown';
        const errMsg = audio.error ? audio.error.message : 'no details';
        console.error('[GR] Audio load error: code=' + errCode + ', msg=' + errMsg + ', src=' + url);
        reject(new Error('Audio load failed: code=' + errCode + ' for ' + url));
      };

      audio.addEventListener('loadedmetadata', onMeta);
      audio.addEventListener('error', onErr);
      audio.src = url;
      audio.load();
    });
  }

  function togglePlay() {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      if (!audio.src || audio.src === window.location.href) {
        goLive();
      } else {
        audio.play().catch(() => goLive());
      }
    }
  }

  // ─── POLL ─────────────────────────────────────────────────────────────────
  function startPoll() {
    clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      if (!isPlaying) return;
      try {
        const data = await fetchLive();
        if (data.trackIndex !== currentIndex) {
          console.log('[GR] Track changed on server → re-syncing');
          lastLiveData = data;
          currentIndex = data.trackIndex;
          currentDur   = data.trackDuration || 3600;
          await loadAndPlay(
            AUDIO_BASE + '/day-' + (currentIndex + 1) + '.webm',
            data._adjustedPosition,
            data
          );
          updateTrackInfo(data);
          updatePlaylist(data.trackIndex);
          saveGlobalState();
        }
        updateListeners(data.listenersCount || 0);
      } catch (e) { /* keep playing with what we have */ }
    }, POLL_MS);
  }

  function startHeartbeat() {
    clearInterval(hbTimer);
    sendHeartbeat();
    hbTimer = setInterval(sendHeartbeat, HB_MS);
  }

  function scheduleRetry() {
    clearRetry();
    retryTimer = setTimeout(() => { goLive(); }, RETRY_MS);
  }

  function clearRetry() {
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  }

  // ─── UI UPDATES ───────────────────────────────────────────────────────────
  function updatePlayButton() {
    if (!dom.playIcon) return;
    dom.playIcon.innerHTML = isPlaying
      ? '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'
      : '<path d="M8 5v14l11-7z"/>';
    dom.art?.classList.toggle('playing', isPlaying);
    dom.art?.classList.toggle('paused', !isPlaying);
  }

  function updateTrackInfo(data) {
    if (dom.trackTitle && data.trackTitle) {
      dom.trackTitle.textContent = data.trackTitle;
    }
    updatePlaylist(data.trackIndex);
  }

  function updateListeners(count) {
    if (!dom.listeners) return;
    if (count > 0) {
      dom.listeners.textContent = '\uD83D\uDC65 ' + count + ' listening';
      dom.listeners.style.display = '';
    } else {
      dom.listeners.style.display = 'none';
    }
  }

  function showLoading(on) {
    dom.loading?.classList.toggle('active', !!on);
  }

  function showError(on) {
    dom.error?.classList.toggle('active', !!on);
  }

  function showToast(msg) {
    // Use claymorphism toast system
    if (window.AnhadPopup) {
      AnhadPopup.toast(msg, { type: 'info', duration: 3000 });
    } else {
      // Fallback: use inline toast if popup system not loaded
      if (!dom.toast) return;
      dom.toast.textContent = msg;
      dom.toast.classList.add('visible');
      clearTimeout(dom.toast._t);
      dom.toast._t = setTimeout(() => dom.toast.classList.remove('visible'), 3000);
    }
  }

  // ─── PROGRESS ─────────────────────────────────────────────────────────────
  function updateProgress() {
    if (!audio || !isFinite(audio.duration) || audio.duration <= 0) {
      if (dom.elapsed)   dom.elapsed.textContent   = 'LIVE';
      if (dom.remaining) dom.remaining.textContent = '';
      return;
    }
    const cur  = audio.currentTime;
    const dur  = audio.duration;
    const pct  = Math.min(100, (cur / dur) * 100);

    if (dom.progressFill)  dom.progressFill.style.width  = pct + '%';
    if (dom.progressThumb) dom.progressThumb.style.left  = pct + '%';
    if (dom.elapsed)       dom.elapsed.textContent       = formatTime(cur);
    if (dom.remaining)     dom.remaining.textContent     = '-' + formatTime(dur - cur);
  }

  function formatTime(s) {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + String(sec).padStart(2, '0');
  }

  // ─── PLAYLIST ─────────────────────────────────────────────────────────────
  function buildPlaylist(activeIndex) {
    if (!dom.playlistBody) return;
    dom.playlistBody.innerHTML = '';

    // Show next 5 tracks in queue (wrapping around 40-track playlist)
    for (let i = 0; i < 5; i++) {
      const idx    = (activeIndex + i) % 40;
      const num    = idx + 1;
      const isActive = i === 0;

      const row = document.createElement('div');
      row.className = 'gr-playlist__track' + (isActive ? ' active' : '');
      row.dataset.idx = idx;
      row.innerHTML = `
        <div class="gr-playlist__num">${num}</div>
        <div class="gr-playlist__info">
          <div class="gr-playlist__track-title">Day ${num} \u2014 \u0A17\u0A41\u0A30\u0A2C\u0A3E\u0A23\u0A40 \u0A15\u0A40\u0A30\u0A24\u0A28</div>
        </div>
        <div class="gr-playlist__dur">\u2248 1h</div>
      `;
      row.addEventListener('click', () => jumpToTrack(idx));
      dom.playlistBody.appendChild(row);
    }

    if (dom.playlistInfo) {
      dom.playlistInfo.textContent = 'Day ' + (activeIndex + 1) + ' of 40';
    }
  }

  function updatePlaylist(activeIndex) {
    buildPlaylist(activeIndex);
  }

  async function jumpToTrack(idx) {
    showToast('Jumping to Day ' + (idx + 1) + '...');
    currentIndex = idx;
    currentDur   = lastLiveData?.trackDurations?.[idx] || 3600;
    try {
      await loadAndPlay(AUDIO_BASE + '/day-' + (idx + 1) + '.webm', 0, {});
      updatePlaylist(idx);
      saveGlobalState();
    } catch (e) {
      showToast('Failed to load track');
    }
  }

  // ─── GLOBAL STATE PERSISTENCE ─────────────────────────────────────────────
  function saveGlobalState() {
    try {
      localStorage.setItem('anhad_global_audio', JSON.stringify({
        isPlaying,
        stream: 'amritvela',
        trackIndex: currentIndex,
        volume: audio ? audio.volume : 0.8,
        currentTime: audio ? audio.currentTime : 0,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  // ─── THEME ────────────────────────────────────────────────────────────────
  function initTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    updateThemeIcon(current);

    dom.themeBtn?.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      if (next === 'dark') document.documentElement.classList.add('dark-mode');
      else document.documentElement.classList.remove('dark-mode');
      try { localStorage.setItem('anhad_theme', next); } catch (e) {}
      updateThemeIcon(next);
    });
  }

  function updateThemeIcon(theme) {
    if (!dom.themeIcon) return;
    if (theme === 'dark') {
      dom.themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    } else {
      dom.themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    }
  }

  // ─── MEDIA SESSION ────────────────────────────────────────────────────────
  function updateMediaSession(title) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Amritvela Kirtan',
      artist: 'ANHAD Gurbani Radio',
      album: 'Live Broadcast',
      artwork: [{ src: '../assets/Darbar-sahib-AMRITVELA.webp', sizes: '512x512', type: 'image/webp' }]
    });
    navigator.mediaSession.setActionHandler('play',  () => { audio?.play(); });
    navigator.mediaSession.setActionHandler('pause', () => { audio?.pause(); });
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────
  function init() {
    cacheDOM();
    initTheme();

    // Setup audio element
    audio = $('grAudio');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'grAudio';
      audio.preload = 'auto';
      document.body.appendChild(audio);
    }
    // Always ensure crossOrigin is set for CORS proxy
    audio.crossOrigin = 'anonymous';
    audio.volume = parseFloat(localStorage.getItem('gr_volume') || '0.8');
    if (dom.volumeInput) dom.volumeInput.value = audio.volume * 100;

    // Audio events
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play',  () => { isPlaying = true;  updatePlayButton(); saveGlobalState(); });
    audio.addEventListener('pause', () => { isPlaying = false; updatePlayButton(); saveGlobalState(); });
    audio.addEventListener('ended', () => {
      console.log('[GR] Track ended → re-syncing');
      goLive();
    });
    audio.addEventListener('error', () => {
      const errCode = audio.error ? audio.error.code : '?';
      const errMsg = audio.error ? audio.error.message : 'unknown';
      console.warn('[GR] Audio playback error: code=' + errCode + ', msg=' + errMsg + ', src=' + (audio.src || 'none'));
      isPlaying = false;
      updatePlayButton();
      showToast('Reconnecting...');
      setTimeout(goLive, 3000);
    });
    audio.addEventListener('loadedmetadata', () => {
      if (isFinite(audio.duration)) {
        reportDuration(currentIndex, audio.duration);
        updateMediaSession(dom.trackTitle?.textContent);
      }
    });

    // Buttons
    dom.playBtn?.addEventListener('click', togglePlay);
    dom.prevBtn?.addEventListener('click', () => { showToast('Jumping to live...'); goLive(); });
    dom.nextBtn?.addEventListener('click', () => { showToast('Jumping to live...'); goLive(); });
    dom.retryBtn?.addEventListener('click', () => { showError(false); goLive(); });

    dom.volumeBtn?.addEventListener('click', () => {
      dom.volumeSlider?.classList.toggle('visible');
    });

    dom.volumeInput?.addEventListener('input', (e) => {
      const vol = e.target.value / 100;
      if (audio) audio.volume = vol;
      // Sync volume fill UI
      const fillEl = document.getElementById('grVolumeFill');
      if (fillEl) fillEl.style.width = e.target.value + '%';
      try { localStorage.setItem('gr_volume', vol); } catch (e) {}
    });

    dom.shareBtn?.addEventListener('click', async () => {
      const shareData = {
        title: 'ANHAD Gurbani Radio',
        text: 'Listening to live Gurbani Kirtan',
        url: window.location.href
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(window.location.href);
          showToast('Link copied!');
        }
      } catch (e) {}
    });

    dom.backBtn?.addEventListener('click', () => window.history.back());

    // Visibility change → re-sync
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && isPlaying) {
        sendHeartbeat();
      }
    });

    // Save before unload
    window.addEventListener('pagehide', () => {
      saveGlobalState();
      clearInterval(pollTimer);
      clearInterval(hbTimer);
    });
    window.addEventListener('beforeunload', () => {
      saveGlobalState();
    });

    // Build initial playlist skeleton
    buildPlaylist(0);

    // Start
    goLive();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
