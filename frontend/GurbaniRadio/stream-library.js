/**
 * ANHAD Gurbani Radio — Stream Library Manager
 * ════════════════════════════════════════════════
 * • Opens a bottom-sheet with all 20+ gurbanisewa.org streams
 * • Each card: play button + 3-dot "Replace slot" menu
 * • Darbar Sahib is a fixed slot (slot 0 — cannot be removed)
 * • Up to 5 total tab-slots; icon-only labels when > 3 active
 * • Persists custom slots in localStorage: 'gr_custom_slots'
 */
(function () {
  'use strict';

  // ─── ALL AVAILABLE STREAMS ───────────────────────────────────────
  var ALL_STREAMS = [
    // ── Core 3 (always built-in) ─
    { id: 'darbar',    name: 'Darbar Sahib Live',          sub: 'Sri Harmandir Sahib Ji',        emoji: '🎙️', url: null,   fixed: true  },
    { id: 'amritvela', name: 'Amritvela Kirtan',           sub: 'Daily recitals',                emoji: '🌅', url: null,   fixed: true  },
    { id: 'simran',    name: 'Waheguru Simran',             sub: 'Waheguru Naam Jaap',            emoji: '📿', url: null,   fixed: true  },

    // ── GurbaniSewa streams ─
    { id: 'gs_akhand',      name: 'Akhand Paath',                   sub: 'Non-stop Paath',              emoji: '📖', url: 'http://radio.gurbanisewa.org:8000/stream' },
    { id: 'gs_simran_gm',   name: 'Simran — Gur Mantar',            sub: 'Gur Mantar Simran',           emoji: '🕉️',  url: 'http://radio.gurbanisewa.org:8003/stream' },
    { id: 'gs_simran_mm',   name: 'Simran — Mool Mantar',           sub: 'Mool Mantar Simran',          emoji: '🙏', url: 'http://radio.gurbanisewa.org:8002/stream', offline: true },
    { id: 'gs_kirtan',      name: 'Kirtan — Gurbani',               sub: 'Gurbani Kirtan',              emoji: '🎵', url: 'http://radio.gurbanisewa.org:8001/stream' },
    { id: 'gs_darbar_sgpc', name: 'Kirtan — Darbar Sahib (SGPC)',   sub: 'SGPC Live Stream',            emoji: '🎙️', url: 'http://sgpc.net:8000/listen.ols'           },
    { id: 'gs_puratan',     name: 'Kirtan — Puratan',               sub: 'Classical Kirtan',            emoji: '🎶', url: 'http://radio.gurbanisewa.org:8008/stream', offline: true },
    { id: 'gs_raag',        name: 'Kirtan — Raag',                  sub: 'Raag Kirtan',                 emoji: '🎻', url: 'http://radio.gurbanisewa.org:8009/stream' },
    { id: 'gs_katha_g',     name: 'Katha — Gurbani',                sub: 'Gurbani Katha',               emoji: '📚', url: 'http://radio.gurbanisewa.org:8013/stream' },
    { id: 'gs_katha_sggs',  name: 'Katha — Sri Guru Granth Sahib',  sub: 'SGGS Katha',                  emoji: '📜', url: 'http://radio.gurbanisewa.org:8011/stream' },
    { id: 'gs_katha_sdgs',  name: 'Katha — Sri Dasam Granth',       sub: 'Dasam Granth Katha',          emoji: '🗡️',  url: 'http://radio.gurbanisewa.org:8014/stream', offline: true },
    { id: 'gs_katha_itihaas', name: 'Katha — Itihaas',             sub: 'Sikh History Katha',          emoji: '⚔️',  url: 'http://radio.gurbanisewa.org:8012/stream', offline: true },
    { id: 'gs_katha_sawal',  name: 'Katha — Gurmat Sawal Jawab',    sub: 'Q&A Katha',                   emoji: '💬', url: 'http://radio.gurbanisewa.org:8015/stream', offline: true },
    { id: 'gs_audiobooks',  name: 'Audio Books',                    sub: 'Sikh Literature',             emoji: '🎧', url: 'http://radio.gurbanisewa.org:8005/stream' },
    { id: 'gs_kavishri',    name: 'Kavishri / Dhadi',               sub: 'Kavishri & Dhadi Vaaran',     emoji: '🥁', url: 'http://radio.gurbanisewa.org:8007/stream' },
    { id: 'gs_sarabrog',    name: 'Sarab Rog Ka Aukhad Naam',        sub: 'Healing Naam',                emoji: '✨', url: 'http://radio.gurbanisewa.org:8004/stream', offline: true },
    { id: 'gs_sahibzadey',  name: 'Sahibzadey Sewa Dal',            sub: 'Sewa Dal Kirtan',             emoji: '🏹', url: 'http://radio.gurbanisewa.org:8016/stream' },
    { id: 'gs_paath_sdgs',  name: 'Paath — Sri Dasam Granth',       sub: 'Dasam Granth Paath',          emoji: '📖', url: 'http://radio.gurbanisewa.org:8017/stream' },
    { id: 'gs_sukhmani',    name: 'Paath — Sukhmani Sahib',         sub: 'Sukhmani Sahib Paath',        emoji: '🌸', url: 'http://radio.gurbanisewa.org:8017/stream' },

    // ── SikhNet gurdwaras ─
    { id: 'sn_bangla',      name: 'Gurdwara Bangla Sahib',          sub: 'SikhNet Radio',               emoji: '🕌', url: 'https://play.sikhnet.com/radio/banglasahib' },
    { id: 'sn_hazur',       name: 'Takhat Sri Hazur Sahib',         sub: 'SikhNet Radio',               emoji: '⚔️',  url: 'https://www.sikhnet.com/s/sikhnetradio' },
    { id: 'sn_dukh',        name: 'Gurdwara Dukh Niwaran Sahib',   sub: 'SikhNet Radio (Ludhiana)',    emoji: '🛕', url: 'https://www.sikhnet.com/s/sikhnetradio' },
  ];

  // Default slot layout saved in localStorage key 'gr_custom_slots'
  // Format: ['darbar', 'amritvela', 'simran']  — streamIds
  var STORAGE_KEY = 'gr_custom_slots';
  var MAX_SLOTS = 5;
  var FIXED_SLOT = 'darbar'; // first slot is always Darbar Sahib

  // ─── Helpers ────────────────────────────────────────────────────
  function getSlots() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          // Always ensure darbar is slot 0
          if (arr[0] !== FIXED_SLOT) arr.unshift(FIXED_SLOT);
          return arr.slice(0, MAX_SLOTS);
        }
      }
    } catch (e) {}
    return ['darbar', 'amritvela', 'simran'];
  }

  function saveSlots(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function getStreamById(id) {
    return ALL_STREAMS.find(function (s) { return s.id === id; }) || null;
  }

  // ─── Tab renderer (called after slot changes) ────────────────────
  function rebuildTabs(slots) {
    var tabsEl = document.querySelector('.gr-tabs');
    if (!tabsEl) return;

    var iconOnly = slots.length > 3;

    // Remove dynamically added tabs (keep slider)
    var slider = tabsEl.querySelector('.gr-tabs-slider');
    tabsEl.innerHTML = '';
    if (slider) tabsEl.appendChild(slider);

    // Rebuild slider width based on slot count
    var sliderEl = tabsEl.querySelector('.gr-tabs-slider');
    if (sliderEl) {
      sliderEl.style.width = 'calc((100% - 8px) / ' + slots.length + ')';
    }

    // Rebuild data-active CSS for each slot position
    // Remove old dynamic style rules
    var oldStyle = document.getElementById('gr-tabs-dynamic-style');
    if (oldStyle) oldStyle.remove();
    var dynStyle = document.createElement('style');
    dynStyle.id = 'gr-tabs-dynamic-style';
    var css = '';
    for (var i = 0; i < slots.length; i++) {
      css += '.gr-tabs[data-active="' + i + '"] .gr-tabs-slider { transform: translateX(' + (i * 100) + '%); }\n';
    }
    dynStyle.textContent = css;
    document.head.appendChild(dynStyle);

    // Create tab buttons
    var audio = window.AnhadAudio;
    var currentStream = audio ? audio.getState().currentStream : 'darbar';

    slots.forEach(function (streamId, idx) {
      var meta = getStreamById(streamId);
      if (!meta) return;

      var btn = document.createElement('button');
      btn.className = 'gr-tab' + (streamId === currentStream ? ' active' : '');
      btn.setAttribute('data-stream', streamId);
      btn.setAttribute('data-slot-index', idx);
      btn.setAttribute('aria-label', meta.name);

      var isActive = streamId === currentStream;
      if (iconOnly) {
        // Icon-only — show gold Khanda image
        btn.innerHTML =
          '<img src="../assets/khanda-gold.png" class="gr-tab-khanda-img" title="' + meta.name + '" style="width:22px;height:22px;object-fit:contain;filter:' + (isActive ? 'drop-shadow(0 0 4px rgba(200,168,75,0.8)) brightness(1.15)' : 'brightness(0.55) saturate(0.5)') + ';transition:filter 0.25s;">';
        btn.classList.add('icon-only');
      } else {
        // Full label — with small gold Khanda icon
        btn.innerHTML =
          '<img src="../assets/khanda-gold.png" class="gr-tab-khanda-img" style="width:16px;height:16px;object-fit:contain;margin-right:6px;filter:' + (isActive ? 'drop-shadow(0 0 3px rgba(200,168,75,0.7)) brightness(1.15)' : 'brightness(0.6) saturate(0.4)') + ';transition:filter 0.25s;">' + meta.name.split(' — ')[0].split(' (')[0];
      }

      btn.addEventListener('click', function () {
        hapticLight();
        switchToStream(streamId, idx, slots);
      });

      tabsEl.appendChild(btn);
    });
  }

  function getTabIconSVG(meta) {
    // Return relevant SVG path for common built-in streams; emoji fallback for custom
    if (meta.id === 'darbar' || meta.id === 'gs_darbar_sgpc' || meta.id === 'sn_bangla' || meta.id === 'sn_hazur' || meta.id === 'sn_dukh') {
      return '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>';
    }
    if (meta.id === 'amritvela' || meta.id === 'gs_kirtan' || meta.id === 'gs_puratan' || meta.id === 'gs_raag') {
      return '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>';
    }
    if (meta.id === 'simran' || meta.id === 'gs_simran_gm' || meta.id === 'gs_simran_mm') {
      return '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>';
    }
    // Katha / books
    return '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>';
  }

  function switchToStream(streamId, slotIdx, slots) {
    var tabsEl = document.querySelector('.gr-tabs');
    if (tabsEl) tabsEl.setAttribute('data-active', slotIdx);

    document.querySelectorAll('.gr-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-stream') === streamId);
    });

    var audio = window.AnhadAudio;
    if (!audio) return;

    var streamMeta = getStreamById(streamId);
    if (!streamMeta) return;

    // Direct delegation to Audio Singleton
    audio.play(streamId);
  }

  // ─── Haptics ─────────────────────────────────────────────────────
  function hapticLight() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' }).catch(function () {});
      } else if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    } catch (e) {}
  }

  // ─── Toast ───────────────────────────────────────────────────────
  function showLibToast(msg) {
    var el = document.getElementById('grToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 3000);
  }

  // ─── Bottom Sheet HTML ───────────────────────────────────────────
  function createSheet() {
    var overlay = document.createElement('div');
    overlay.id = 'streamLibSheet';
    overlay.className = 'sl-overlay';
    overlay.style.display = 'none';

    overlay.innerHTML = [
      '<div class="sl-backdrop" id="slBackdrop"></div>',
      '<div class="sl-sheet" role="dialog" aria-label="Stream Library">',
      '  <div class="sl-handle"></div>',
      '  <div class="sl-header">',
      '    <h2 class="sl-title">ਗੁਰਬਾਣੀ ਰੇਡੀਓ</h2>',
      '    <p class="sl-subtitle">All Streams — tap ⋯ to add to player</p>',
      '  </div>',
      '  <div class="sl-slots-label"><span>Your tabs (' + getSlots().length + '/' + MAX_SLOTS + ')</span><span class="sl-slots-hint">Darbar Sahib is always fixed</span></div>',
      '  <div class="sl-search-bar"><input type="search" id="slSearchInput" placeholder="Search streams…" autocomplete="off"></div>',
      '  <div class="sl-stream-list" id="slStreamList"></div>',
      '</div>',
      '<div class="sl-replace-popup" id="slReplacePopup" style="display:none">',
      '  <div class="sl-rp-title">Replace which slot?</div>',
      '  <div class="sl-rp-slots" id="slRpSlots"></div>',
      '  <button class="sl-rp-cancel" id="slRpCancel">Cancel</button>',
      '</div>'
    ].join('');

    document.body.appendChild(overlay);
    return overlay;
  }

  function renderStreamList(filter) {
    var listEl = document.getElementById('slStreamList');
    if (!listEl) return;
    listEl.innerHTML = '';

    var slots = getSlots();
    var query = (filter || '').toLowerCase();

    var categories = [
      { label: '⭐ Your Active Streams', ids: slots },
      { label: '📡 All Available Streams', ids: null }
    ];

    categories.forEach(function (cat) {
      var streams = cat.ids
        ? cat.ids.map(function (id) { return getStreamById(id); }).filter(Boolean)
        : ALL_STREAMS.filter(function (s) { return !slots.includes(s.id); });

      if (query) {
        streams = streams.filter(function (s) {
          return s.name.toLowerCase().includes(query) || s.sub.toLowerCase().includes(query);
        });
      }

      if (streams.length === 0) return;

      var section = document.createElement('div');
      section.className = 'sl-section';

      var labelEl = document.createElement('div');
      labelEl.className = 'sl-section-label';
      labelEl.textContent = cat.label;
      section.appendChild(labelEl);

      streams.forEach(function (s) {
        var isInSlot = slots.includes(s.id);
        var isFixed  = s.id === FIXED_SLOT;
        var isOffline = !!s.offline;
        var isPlaying = window.AnhadAudio && window.AnhadAudio.getState().currentStream === s.id;
        var isCustomPlaying = window._anhadCustomStream && window._anhadCustomStream.id === s.id;

        var card = document.createElement('div');
        card.className = 'sl-card' + (isInSlot ? ' sl-card--active' : '') + (isFixed ? ' sl-card--fixed' : '') + (isOffline ? ' sl-card--offline' : '');

        card.innerHTML = [
          '<div class="sl-card-left">',
          '  <div class="sl-card-emoji" style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#C8842A,#E8A83A);flex-shrink:0;' + (isOffline ? 'opacity:0.45;' : '') + '"><img src="../assets/khanda-gold.png" style="width:26px;height:26px;object-fit:contain;"></div>',
          '  <div class="sl-card-info">',
          '    <div class="sl-card-name">' + s.name + (isFixed ? ' <span class="sl-fixed-badge">Fixed</span>' : '') + (isOffline ? ' <span class="sl-offline-badge">Offline</span>' : '') + '</div>',
          '    <div class="sl-card-sub">' + s.sub + '</div>',
          '  </div>',
          '</div>',
          '<div class="sl-card-right">',
          (isOffline ? '<span class="sl-offline-icon" title="Stream currently unavailable">📡</span>' :
            '  <button class="sl-card-play" data-stream-id="' + s.id + '" aria-label="Play ' + s.name + '">    <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>  </button>'),
          (!isFixed && !isOffline ? '<button class="sl-card-dots" data-stream-id="' + s.id + '" aria-label="Options">⋯</button>' : ''),
          '</div>'
        ].join('');

        // Play button
        card.querySelector('.sl-card-play').addEventListener('click', function (e) {
          e.stopPropagation();
          hapticLight();
          var sid = this.getAttribute('data-stream-id');
          var meta = getStreamById(sid);
          if (!meta) return;
          var slts = getSlots();
          var slotIdx = slts.indexOf(sid);
          if (slotIdx === -1) slotIdx = 0;
          switchToStream(sid, slotIdx, slts);
          closeSheet();
        });

        // 3-dot menu
        var dotsBtn = card.querySelector('.sl-card-dots');
        if (dotsBtn) {
          dotsBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            hapticLight();
            openReplacePopup(this.getAttribute('data-stream-id'));
          });
        }

        section.appendChild(card);
      });

      listEl.appendChild(section);
    });

    // Update slots count label
    var lbl = document.querySelector('.sl-slots-label span:first-child');
    if (lbl) lbl.textContent = 'Your tabs (' + slots.length + '/' + MAX_SLOTS + ')';
  }

  // ─── Replace Popup ───────────────────────────────────────────────
  var _pendingStreamId = null;

  function openReplacePopup(streamId) {
    _pendingStreamId = streamId;
    var popup = document.getElementById('slReplacePopup');
    if (!popup) return;

    var slots = getSlots();
    var slotsEl = document.getElementById('slRpSlots');
    if (!slotsEl) return;
    slotsEl.innerHTML = '';

    var meta = getStreamById(streamId);
    var streamName = meta ? meta.name : streamId;

    var popupTitle = popup.querySelector('.sl-rp-title');
    if (popupTitle) {
      var alreadyInSlot = slots.includes(streamId);
      if (alreadyInSlot) {
        popupTitle.textContent = 'Remove "' + streamName.split(' — ')[0] + '" from tabs?';
      } else if (slots.length < MAX_SLOTS) {
        popupTitle.textContent = 'Add "' + streamName.split(' — ')[0] + '" to tabs?';
      } else {
        popupTitle.textContent = 'Replace which tab with "' + streamName.split(' — ')[0] + '"?';
      }
    }

    // If already in slot — show "Remove" button
    if (slots.includes(streamId)) {
      var removeBtn = document.createElement('button');
      removeBtn.className = 'sl-rp-slot sl-rp-slot--remove';
      removeBtn.textContent = '🗑️ Remove from tabs';
      removeBtn.addEventListener('click', function () {
        var newSlots = slots.filter(function (id) { return id !== streamId; });
        saveSlots(newSlots);
        rebuildTabs(newSlots);
        closeReplacePopup();
        renderStreamList();
        showLibToast('✅ Removed from tabs');
      });
      slotsEl.appendChild(removeBtn);
    } else if (slots.length < MAX_SLOTS) {
      // Free slot — just add
      var addBtn = document.createElement('button');
      addBtn.className = 'sl-rp-slot sl-rp-slot--add';
      addBtn.textContent = '➕ Add to tabs';
      addBtn.addEventListener('click', function () {
        var newSlots = slots.concat([streamId]);
        saveSlots(newSlots);
        rebuildTabs(newSlots);
        closeReplacePopup();
        renderStreamList();
        showLibToast('✅ Added: ' + streamName);
      });
      slotsEl.appendChild(addBtn);
    } else {
      // Full — show replaceable slots (all except fixed darbar)
      slots.forEach(function (slotId, idx) {
        if (slotId === FIXED_SLOT) return; // can't replace darbar
        var slotMeta = getStreamById(slotId);
        var btn = document.createElement('button');
        btn.className = 'sl-rp-slot';
        btn.innerHTML = '<img src="../assets/khanda.png" style="width:20px;height:20px;object-fit:contain;margin-right:8px;">' +
                        '<span>' + (slotMeta ? slotMeta.name.split(' — ')[0].split(' (')[0] : slotId) + '</span>';
        btn.addEventListener('click', function () {
          var newSlots = slots.slice();
          newSlots[idx] = streamId;
          saveSlots(newSlots);
          rebuildTabs(newSlots);
          closeReplacePopup();
          renderStreamList();
          showLibToast('✅ Replaced with: ' + streamName);
        });
        slotsEl.appendChild(btn);
      });
    }

    popup.style.display = 'flex';
    popup.classList.add('sl-rp-enter');
    setTimeout(function () { popup.classList.remove('sl-rp-enter'); }, 300);
  }

  function closeReplacePopup() {
    var popup = document.getElementById('slReplacePopup');
    if (popup) popup.style.display = 'none';
    _pendingStreamId = null;
  }

  // ─── Sheet open / close ──────────────────────────────────────────
  function openSheet() {
    var overlay = document.getElementById('streamLibSheet');
    if (!overlay) return;
    overlay.style.display = 'flex';
    setTimeout(function () { overlay.classList.add('sl-open'); }, 10);
    renderStreamList();

    var searchEl = document.getElementById('slSearchInput');
    if (searchEl) {
      searchEl.value = '';
      searchEl.addEventListener('input', function () {
        renderStreamList(this.value);
      });
    }
  }

  function closeSheet() {
    var overlay = document.getElementById('streamLibSheet');
    if (!overlay) return;
    overlay.classList.remove('sl-open');
    closeReplacePopup();
    setTimeout(function () { overlay.style.display = 'none'; }, 350);
  }

  // ─── CSS injection ───────────────────────────────────────────────
  function injectCSS() {
    var style = document.createElement('style');
    style.id = 'stream-library-css';
    style.textContent = [
      /* Overlay */
      '.sl-overlay { position:fixed; inset:0; z-index:9000; display:none; flex-direction:column; justify-content:flex-end; align-items:stretch; }',
      '.sl-backdrop { position:absolute; inset:0; background:rgba(0,0,0,0); transition:background 0.35s ease; cursor:pointer; }',
      '.sl-overlay.sl-open .sl-backdrop { background:rgba(0,0,0,0.55); }',

      /* Sheet */
      '.sl-sheet { position:relative; z-index:1; background:var(--bg-card,#fff); border-radius:28px 28px 0 0; max-height:88dvh; display:flex; flex-direction:column; transform:translateY(100%); transition:transform 0.38s cubic-bezier(0.22,1,0.36,1); padding-bottom:env(safe-area-inset-bottom,0px); }',
      '.sl-overlay.sl-open .sl-sheet { transform:translateY(0); }',
      '[data-theme="dark"] .sl-sheet, .dark-mode .sl-sheet { background:var(--bg-card,#1C1C1E); }',

      /* Handle */
      '.sl-handle { width:40px; height:4px; border-radius:2px; background:rgba(128,128,128,0.35); margin:12px auto 0; flex-shrink:0; }',

      /* Header */
      '.sl-header { padding:16px 20px 0; flex-shrink:0; }',
      '.sl-title { font-size:22px; font-weight:800; color:var(--text-prime,#1C1C1E); margin:0 0 2px; letter-spacing:-0.3px; }',
      '[data-theme="dark"] .sl-title,.dark-mode .sl-title { color:#F5F5F7; }',
      '.sl-subtitle { font-size:13px; color:var(--text-sec,#6E6E73); margin:0; }',

      /* Slots label */
      '.sl-slots-label { display:flex; justify-content:space-between; align-items:center; padding:12px 20px 4px; font-size:12px; flex-shrink:0; }',
      '.sl-slots-label span:first-child { font-weight:700; color:var(--accent-gold,#D4943A); }',
      '.sl-slots-hint { font-size:11px; color:var(--text-sec,#6E6E73); }',

      /* Search */
      '.sl-search-bar { padding:8px 16px 8px; flex-shrink:0; }',
      '.sl-search-bar input { width:100%; box-sizing:border-box; padding:10px 16px; border-radius:14px; border:1px solid var(--border-color,rgba(0,0,0,0.1)); background:var(--bg-secondary,#F2F2F7); color:var(--text-prime,#1C1C1E); font-family:inherit; font-size:15px; outline:none; transition:border-color 0.2s; }',
      '[data-theme="dark"] .sl-search-bar input,.dark-mode .sl-search-bar input { background:rgba(255,255,255,0.08); color:#F5F5F7; border-color:rgba(255,255,255,0.1); }',
      '.sl-search-bar input:focus { border-color:var(--accent-gold,#D4943A); }',

      /* Stream List */
      '.sl-stream-list { overflow-y:auto; -webkit-overflow-scrolling:touch; flex:1; padding:4px 16px 24px; display:flex; flex-direction:column; gap:0; }',

      /* Section */
      '.sl-section { margin-bottom:16px; }',
      '.sl-section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:var(--text-sec,#6E6E73); padding:8px 4px 6px; }',

      /* Cards */
      '.sl-card { display:flex; align-items:center; justify-content:space-between; padding:14px 12px; border-radius:16px; margin-bottom:8px; background:var(--bg-secondary,#F2F2F7); border:1.5px solid transparent; transition:border-color 0.2s,background 0.2s,transform 0.15s; cursor:pointer; gap:10px; }',
      '[data-theme="dark"] .sl-card,.dark-mode .sl-card { background:rgba(255,255,255,0.06); }',
      '.sl-card--active { border-color:rgba(212,148,58,0.4)!important; background:rgba(212,148,58,0.08)!important; }',
      '.sl-card--fixed { opacity:1; }',
      '.sl-card:active { transform:scale(0.98); }',

      '.sl-card-left { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }',
      '.sl-card-emoji { font-size:26px; width:36px; text-align:center; flex-shrink:0; }',
      '.sl-card-info { min-width:0; flex:1; }',
      '.sl-card-name { font-size:14px; font-weight:700; color:var(--text-prime,#1C1C1E); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
      '[data-theme="dark"] .sl-card-name,.dark-mode .sl-card-name { color:#F5F5F7; }',
      '.sl-card-sub { font-size:12px; color:var(--text-sec,#6E6E73); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }',
      '.sl-fixed-badge { font-size:10px; font-weight:600; background:rgba(212,148,58,0.18); color:var(--accent-gold,#D4943A); border-radius:4px; padding:1px 5px; margin-left:5px; vertical-align:middle; }',
      '.sl-offline-badge { font-size:10px; font-weight:600; background:rgba(255,80,80,0.14); color:#E04040; border-radius:4px; padding:1px 5px; margin-left:5px; vertical-align:middle; }',
      '.sl-card--offline { opacity:0.6; pointer-events:none; }',
      '.sl-offline-icon { font-size:20px; opacity:0.5; padding:0 6px; }',

      '.sl-card-right { display:flex; align-items:center; gap:4px; flex-shrink:0; }',
      '.sl-card-play { width:36px; height:36px; border-radius:50%; border:none; background:var(--accent-gold,#D4943A); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform 0.2s,opacity 0.2s; }',
      '.sl-card-play svg { width:14px; height:14px; fill:#fff; margin-left:2px; }',
      '.sl-card-play:active { transform:scale(0.88); opacity:0.85; }',
      '.sl-card-dots { width:36px; height:36px; border-radius:50%; border:1.5px solid var(--border-color,rgba(0,0,0,0.1)); background:transparent; color:var(--text-prime,#1C1C1E); cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; letter-spacing:-2px; transition:background 0.2s; }',
      '[data-theme="dark"] .sl-card-dots,.dark-mode .sl-card-dots { border-color:rgba(255,255,255,0.12); color:#F5F5F7; }',
      '.sl-card-dots:active { background:rgba(128,128,128,0.12); }',

      /* Tab icon-only mode */
      '.gr-tab.icon-only { padding:0 4px; }',
      '.gr-tab-emoji { font-size:18px; line-height:1; }',

      /* Replace Popup */
      '.sl-replace-popup { position:fixed; bottom:0; left:0; right:0; z-index:10000; background:var(--bg-card,#fff); border-radius:24px 24px 0 0; padding:20px 20px calc(env(safe-area-inset-bottom,0px)+20px); box-shadow:0 -8px 40px rgba(0,0,0,0.2); display:none; flex-direction:column; gap:10px; transform:translateY(0); animation:none; }',
      '[data-theme="dark"] .sl-replace-popup,.dark-mode .sl-replace-popup { background:var(--bg-card,#2C2C2E); }',
      '.sl-replace-popup.sl-rp-enter { animation:rpEnter 0.3s cubic-bezier(0.22,1,0.36,1) both; }',
      '@keyframes rpEnter { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }',
      '.sl-rp-title { font-size:15px; font-weight:700; color:var(--text-prime,#1C1C1E); margin-bottom:4px; text-align:center; }',
      '[data-theme="dark"] .sl-rp-title,.dark-mode .sl-rp-title { color:#F5F5F7; }',
      '.sl-rp-slots { display:flex; flex-direction:column; gap:8px; }',
      '.sl-rp-slot { display:flex; align-items:center; gap:10px; padding:14px 18px; border-radius:14px; border:1.5px solid var(--border-color,rgba(0,0,0,0.08)); background:var(--bg-secondary,#F2F2F7); color:var(--text-prime,#1C1C1E); font-size:15px; font-weight:600; cursor:pointer; text-align:left; font-family:inherit; transition:background 0.2s,transform 0.15s; }',
      '[data-theme="dark"] .sl-rp-slot,.dark-mode .sl-rp-slot { background:rgba(255,255,255,0.08); color:#F5F5F7; border-color:rgba(255,255,255,0.1); }',
      '.sl-rp-slot:active { transform:scale(0.97); background:rgba(212,148,58,0.12); }',
      '.sl-rp-slot--add { border-color:rgba(212,148,58,0.4); background:rgba(212,148,58,0.08); color:var(--accent-gold,#D4943A); }',
      '.sl-rp-slot--remove { border-color:rgba(220,60,60,0.3); background:rgba(220,60,60,0.06); color:#E24C4C; }',
      '.sl-rp-emoji { font-size:20px; }',
      '.sl-rp-cancel { margin-top:4px; padding:14px; border-radius:14px; border:none; background:rgba(128,128,128,0.1); color:var(--text-sec,#6E6E73); font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; transition:background 0.2s; }',
      '.sl-rp-cancel:active { background:rgba(128,128,128,0.18); }',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ─── Patch settings button ───────────────────────────────────────
  function patchSettingsButton() {
    var btn = document.getElementById('grSettingsBtn');
    if (!btn) return;

    // Swap icon to a "library" / grid icon
    btn.innerHTML = [
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '  <rect x="3" y="3" width="7" height="7" rx="1.5"/>',
      '  <rect x="14" y="3" width="7" height="7" rx="1.5"/>',
      '  <rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      '  <rect x="3" y="14" width="7" height="7" rx="1.5"/>',
      '</svg>'
    ].join('');
    btn.setAttribute('aria-label', 'Stream Library');

    // Replace click handler
    btn.replaceWith(btn.cloneNode(true)); // remove old listeners
    var newBtn = document.getElementById('grSettingsBtn');
    newBtn.addEventListener('click', function () {
      hapticLight();
      openSheet();
    });
  }

  // ─── Init ────────────────────────────────────────────────────────
  function init() {
    injectCSS();
    createSheet();

    // Register all custom streams in the Audio Singleton
    var audio = window.AnhadAudio;
    if (audio && typeof audio.registerStream === 'function') {
      ALL_STREAMS.forEach(function (s) {
        if (s.url) {
          audio.registerStream(s.id, {
            name: s.name,
            subtitle: s.sub,
            url: s.url,
            type: 'live' // All custom streams are live Shoutcast/Icecast broadcasts
          });
        }
      });
    }

    // Bind backdrop click
    var backdrop = document.getElementById('slBackdrop');
    if (backdrop) backdrop.addEventListener('click', closeSheet);

    // Cancel button in replace popup
    var cancelBtn = document.getElementById('slRpCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeReplacePopup);

    // Patch settings button to open library
    patchSettingsButton();

    // Load custom slots and rebuild tabs
    var slots = getSlots();
    rebuildTabs(slots);

    // Expose public API for gurbani-radio.js
    window.GurbaniStreamLib = {
      open: openSheet,
      close: closeSheet,
      getSlots: getSlots,
      rebuildTabs: rebuildTabs
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

})();
