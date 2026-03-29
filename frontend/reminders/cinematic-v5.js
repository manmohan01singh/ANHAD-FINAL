/* ════════════════════════════════════════════════════════════════════
   CINEMATIC ALARM v5  –  ANHAD
   Drag RIGHT → time advances (sun sets, moon rises)
   Drag LEFT  → time rewinds  (moon sets, sun rises)
   Haptic tick every 30-minute boundary crossed
   Zero canvas · Minimal rAF · 60fps guaranteed
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── CONSTANTS ──────────────────────────────────────────────────── */
  const DRAG_SCALE   = 1.8;     /* minutes per pixel of drag          */
  const MOM_DECAY    = 0.87;    /* momentum friction coefficient       */
  const MOM_THRESH   = 0.25;    /* min velocity to start momentum      */
  const HAPTIC_SHORT = [4];     /* vibration pattern for minor ticks   */
  const HAPTIC_LONG  = [8, 30, 8]; /* on-the-hour tick                */
  const STORAGE_KEY  = 'anhad_cine_v5';

  /* ─── AUDIO LIBRARY ──────────────────────────────────────────────── */
  const SOUNDS = [
    { id:'a1', file:'../Audio/audio1.mp3',  name:'Waheguru Simran', desc:'Soft melodic simran',    icon:'🕉️' },
    { id:'a2', file:'../Audio/audio2.mp3',  name:'Amritvela Dhun',  desc:'Peaceful morning raga', icon:'🌅' },
    { id:'a3', file:'../Audio/audio3.mpeg', name:'Rehras Sahib',    desc:'Evening prayer melody', icon:'🙏' },
    { id:'a4', file:'../Audio/audio4.mpeg', name:'Kirtan Sohila',   desc:'Night prayer harmony',  icon:'🌙' },
    { id:'a5', file:'../Audio/audio5.mpeg', name:'Asa Di Var',      desc:'Morning congregation',  icon:'☀️' },
    { id:'a6', file:'../Audio/audio6.mpeg', name:'Anand Sahib',     desc:'Blissful melody',       icon:'✨' },
  ];

  /* ─── SKY PALETTE TABLE ──────────────────────────────────────────────
     t = minutes (0–1440)
     sk0..sk4 = 5 gradient stops top→horizon (RGB arrays)
     s  = star opacity   mo = moon opacity   sun = sun opacity
     fi = fire opacity   bi = birds opacity  vh  = van headlight opacity
     mx = mountain color tints [far, mid, near, front] (hex strings)
  ─────────────────────────────────────────────────────────────────────── */
  const SKY_TBL = [
    /* 00:00 deep night */
    { t:   0, sk0:[2,0,10],   sk1:[8,5,24],    sk2:[10,7,30],   sk3:[7,4,20],   sk4:[4,2,12],
      s:1.00, mo:0.92, sun:0.00, fi:0.92, bi:0.00, vh:0.40,
      mx:['#100825','#0e0620','#0a0418','#060210'] },

    /* 02:30 – still night */
    { t: 150, sk0:[2,0,10],   sk1:[8,5,24],    sk2:[10,7,30],   sk3:[7,4,20],   sk4:[4,2,12],
      s:1.00, mo:0.90, sun:0.00, fi:0.90, bi:0.00, vh:0.40,
      mx:['#100825','#0e0620','#0a0418','#060210'] },

    /* 04:30 – pre-dawn dark */
    { t: 270, sk0:[4,2,14],   sk1:[12,7,32],   sk2:[15,9,38],   sk3:[10,6,24],  sk4:[6,3,16],
      s:0.85, mo:0.80, sun:0.00, fi:0.80, bi:0.00, vh:0.32,
      mx:['#120a28','#10071e','#0c0516','#08030e'] },

    /* 05:15 – first light (deep orange-purple) */
    { t: 315, sk0:[18,8,46],  sk1:[42,15,92],  sk2:[100,28,56], sk3:[198,72,30],sk4:[238,118,42],
      s:0.45, mo:0.50, sun:0.05, fi:0.52, bi:0.00, vh:0.12,
      mx:['#1a0d3a','#160a2a','#100620','#0a0318'] },

    /* 06:00 – golden sunrise */
    { t: 360, sk0:[25,14,60], sk1:[58,24,105], sk2:[135,40,58], sk3:[208,92,38],sk4:[245,182,46],
      s:0.10, mo:0.20, sun:0.72, fi:0.22, bi:0.08, vh:0.00,
      mx:['#20102e','#1a0c26','#12081a','#0c0410'] },

    /* 07:00 – clear morning blue */
    { t: 420, sk0:[25,58,92], sk1:[40,92,142], sk2:[68,132,174],sk3:[118,180,208],sk4:[165,212,232],
      s:0.00, mo:0.00, sun:0.95, fi:0.00, bi:0.55, vh:0.00,
      mx:['#2a3e2e','#223226','#1a281e','#121c14'] },

    /* 09:00 – full daylight */
    { t: 540, sk0:[25,80,115],sk1:[38,125,182],sk2:[80,150,198],sk3:[120,185,216],sk4:[165,212,232],
      s:0.00, mo:0.00, sun:1.00, fi:0.00, bi:0.75, vh:0.00,
      mx:['#2e4230','#263828','#1e2e20','#141e16'] },

    /* 12:00 – noon peak */
    { t: 720, sk0:[22,76,112],sk1:[35,122,178],sk2:[76,148,196],sk3:[118,182,214],sk4:[162,210,230],
      s:0.00, mo:0.00, sun:1.00, fi:0.00, bi:0.65, vh:0.00,
      mx:['#2e4230','#263828','#1e2e20','#141e16'] },

    /* 15:00 – afternoon */
    { t: 900, sk0:[22,72,108],sk1:[34,116,172],sk2:[72,142,192],sk3:[114,178,210],sk4:[158,206,226],
      s:0.00, mo:0.00, sun:0.95, fi:0.00, bi:0.55, vh:0.00,
      mx:['#2a3c2c','#22302a','#1c2820','#121a14'] },

    /* 17:30 – golden hour begins */
    { t:1050, sk0:[28,6,58],  sk1:[62,18,98],  sk2:[140,34,30], sk3:[215,58,12],sk4:[242,136,24],
      s:0.08, mo:0.08, sun:0.85, fi:0.08, bi:0.25, vh:0.00,
      mx:['#1c1030','#160c26','#10081c','#0a0412'] },

    /* 18:00 – cinematic dusk (matches reference image) */
    { t:1080, sk0:[26,5,56],  sk1:[45,13,110], sk2:[108,30,62], sk3:[202,74,42],sk4:[246,200,66],
      s:0.18, mo:0.28, sun:0.62, fi:0.28, bi:0.08, vh:0.02,
      mx:['#180c2e','#140a24','#0e061a','#080310'] },

    /* 18:30 – deep sunset purple */
    { t:1110, sk0:[20,2,46],  sk1:[38,9,88],   sk2:[76,18,36],  sk3:[186,54,30],sk4:[234,110,22],
      s:0.38, mo:0.52, sun:0.28, fi:0.52, bi:0.00, vh:0.14,
      mx:['#150a28','#100820','#0c0618','#06020e'] },

    /* 19:30 – dusk into night */
    { t:1170, sk0:[10,1,28],  sk1:[22,5,56],   sk2:[28,8,34],   sk3:[50,14,16], sk4:[88,22,12],
      s:0.68, mo:0.74, sun:0.00, fi:0.76, bi:0.00, vh:0.28,
      mx:['#100822','#0e061a','#0a0414','#06020c'] },

    /* 20:30 – full night */
    { t:1230, sk0:[4,1,14],   sk1:[10,5,26],   sk2:[13,7,32],   sk3:[9,4,20],   sk4:[5,2,13],
      s:0.92, mo:0.88, sun:0.00, fi:0.88, bi:0.00, vh:0.38,
      mx:['#100824','#0e0620','#0a0418','#06020e'] },

    /* 24:00 – back to deep night */
    { t:1440, sk0:[2,0,10],   sk1:[8,5,24],    sk2:[10,7,30],   sk3:[7,4,20],   sk4:[4,2,12],
      s:1.00, mo:0.92, sun:0.00, fi:0.92, bi:0.00, vh:0.40,
      mx:['#100825','#0e0620','#0a0418','#060210'] },
  ];

  /* ─── SUN ARC ────────────────────────────────────────────────────── */
  /* rises at 06:00 (360 min), sets at 18:30 (1110 min) */
  const SUN_RISE = 360, SUN_SET = 1110;
  function getSunPos(min) {
    const m = wrapMin(min);
    if (m < SUN_RISE || m > SUN_SET) return { x: 50, y: 115 };
    const p = (m - SUN_RISE) / (SUN_SET - SUN_RISE);   /* 0→1 left→right */
    const arc = Math.sin(p * Math.PI);                   /* 0 at horizon, peaks at noon */
    const x = lerp(8, 92, p);                            /* left edge → right edge       */
    const y = lerp(82, 4, arc);                          /* horizon % → sky peak %        */
    return { x, y };
  }

  /* ─── MOON ARC ───────────────────────────────────────────────────── */
  /* rises ~18:00 (1080), sets ~05:30 (330) the next day */
  const MOON_RISE = 1080, MOON_SET = 330;
  function getMoonPos(min) {
    const m = wrapMin(min);
    let vis = false, p = 0;
    const span = (1440 - MOON_RISE) + MOON_SET;
    if (m >= MOON_RISE) { vis = true; p = (m - MOON_RISE) / span; }
    else if (m <= MOON_SET) { vis = true; p = (m + 1440 - MOON_RISE) / span; }
    if (!vis) return { x: 80, y: 105 };
    const arc = Math.sin(p * Math.PI);
    const x = lerp(90, 12, p);
    const y = lerp(80, 6, arc);
    return { x, y };
  }

  /* ─── STORAGE ────────────────────────────────────────────────────── */
  function loadAlarms() {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
    return [
      { id: uid(), label: 'Amritvela Simran', min:  240, on: true, days: [0,1,2,3,4,5,6], sound: 'a1' },
      { id: uid(), label: 'Rehras Sahib',     min: 1110, on: true, days: [0,1,2,3,4,5,6], sound: 'a3' },
      { id: uid(), label: 'Sohila Sahib',     min: 1290, on: true, days: [0,1,2,3,4,5,6], sound: 'a4' },
    ];
  }
  function saveAlarms() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms)); } catch {} }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ─── STATE ──────────────────────────────────────────────────────── */
  let alarms        = loadAlarms();
  let currentMin    = 780;        /* start at 1:00 PM */
  let selectedSound = 'a1';
  let previewAudio  = null;

  /* drag state */
  let dragging    = false;
  let dragStartX  = 0;
  let dragStartMin= 0;
  let lastPtrX    = 0;
  let lastPtrT    = 0;
  let velX        = 0;          /* px/frame */
  let momRaf      = null;

  /* haptic state */
  let lastHaptic30 = -1;        /* last 30-min boundary we fired haptic on */

  /* display update */
  let updateRaf = null;
  let hintDone  = false;

  /* ─── MATH HELPERS ───────────────────────────────────────────────── */
  const lerp   = (a, b, t) => a + (b - a) * t;
  const lerpRGB= (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
  const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const wrapMin= m => ((m % 1440) + 1440) % 1440;

  /* ─── SKY INTERPOLATION ──────────────────────────────────────────── */
  function getSkyAt(rawMin) {
    const m = wrapMin(rawMin);
    const T = SKY_TBL;
    for (let i = 0; i < T.length - 1; i++) {
      if (m >= T[i].t && m <= T[i + 1].t) {
        const t = (m - T[i].t) / (T[i + 1].t - T[i].t);
        const a = T[i], b = T[i + 1];
        return {
          sk0: lerpRGB(a.sk0, b.sk0, t),
          sk1: lerpRGB(a.sk1, b.sk1, t),
          sk2: lerpRGB(a.sk2, b.sk2, t),
          sk3: lerpRGB(a.sk3, b.sk3, t),
          sk4: lerpRGB(a.sk4, b.sk4, t),
          s  : lerp(a.s,   b.s,   t),
          mo : lerp(a.mo,  b.mo,  t),
          sun: lerp(a.sun, b.sun, t),
          fi : lerp(a.fi,  b.fi,  t),
          bi : lerp(a.bi,  b.bi,  t),
          vh : lerp(a.vh,  b.vh,  t),
          mx : a.mx,   /* color tints: just snap to nearest stop */
        };
      }
    }
    return T[0];
  }

  /* ─── APPLY SKY TO DOM ───────────────────────────────────────────── */
  const RS = document.documentElement.style;
  function applySky(rawMin) {
    const sk  = getSkyAt(rawMin);
    const sun = getSunPos(rawMin);
    const moon= getMoonPos(rawMin);
    RS.setProperty('--sk0', `rgb(${sk.sk0})`);
    RS.setProperty('--sk1', `rgb(${sk.sk1})`);
    RS.setProperty('--sk2', `rgb(${sk.sk2})`);
    RS.setProperty('--sk3', `rgb(${sk.sk3})`);
    RS.setProperty('--sk4', `rgb(${sk.sk4})`);
    RS.setProperty('--stars-op', sk.s.toFixed(3));
    RS.setProperty('--moon-op',  sk.mo.toFixed(3));
    RS.setProperty('--sun-op',   sk.sun.toFixed(3));
    RS.setProperty('--fire-op',  sk.fi.toFixed(3));
    RS.setProperty('--birds-op', sk.bi.toFixed(3));
    RS.setProperty('--van-beam', sk.vh.toFixed(3));
    RS.setProperty('--day-haze', (sk.bi * 0.8).toFixed(3));
    /* sun position */
    RS.setProperty('--sun-x', sun.x.toFixed(1) + '%');
    RS.setProperty('--sun-y', sun.y.toFixed(1) + '%');
    /* moon position */
    RS.setProperty('--moon-x', moon.x.toFixed(1) + '%');
    RS.setProperty('--moon-y', moon.y.toFixed(1) + '%');
    /* mountain tints */
    RS.setProperty('--m4-fill', sk.mx[0]);
    RS.setProperty('--m3-fill', sk.mx[1]);
    RS.setProperty('--m2-fill', sk.mx[2]);
    RS.setProperty('--m1-fill', sk.mx[3]);
  }

  /* ─── FORMAT TIME ────────────────────────────────────────────────── */
  function fmtTime(rawMin) {
    const m  = wrapMin(rawMin);
    const h  = Math.floor(m / 60) % 12 || 12;
    const mm = String(Math.floor(m % 60)).padStart(2, '0');
    return { digits: `${h}:${mm}`, period: m < 720 ? 'AM' : 'PM' };
  }

  /* ─── HAPTIC ─────────────────────────────────────────────────────── */
  function haptic(pattern) {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }
  function checkHapticTick(rawMin) {
    const m  = wrapMin(rawMin);
    const b30 = Math.floor(m / 30);    /* which 30-min block we're in */
    if (b30 !== lastHaptic30) {
      lastHaptic30 = b30;
      const isHour = (m % 60) < 30;
      haptic(isHour ? HAPTIC_LONG : HAPTIC_SHORT);
    }
  }

  /* ─── DOM CACHE ──────────────────────────────────────────────────── */
  let E = {};
  function cacheDOM() {
    const $ = id => document.getElementById(id);
    E = {
      loadScreen   : $('loadScreen'),
      timeDigits   : $('timeDigits'),
      timePeriod   : $('timePeriod'),
      dragHint     : $('dragHint'),
      badgeText    : $('badgeText'),
      backBtn      : $('backBtn'),
      alarmsBtn    : $('alarmsBtn'),
      soundBtn     : $('soundBtn'),
      repeatBtn    : $('repeatBtn'),
      addAlarmBtn  : $('addAlarmBtn'),
      alarmSheet   : $('alarmSheet'),
      sheetBackdrop: $('sheetBackdrop'),
      closeSheet   : $('closeSheet'),
      sheetBody    : $('sheetBody'),
      soundSheet   : $('soundSheet'),
      soundBackdrop: $('soundBackdrop'),
      closeSoundSheet: $('closeSoundSheet'),
      soundSheetBody : $('soundSheetBody'),
      toast        : $('toast'),
    };
  }

  /* ─── DISPLAY UPDATE ─────────────────────────────────────────────── */
  function updateDisplay(rawMin) {
    const { digits, period } = fmtTime(rawMin);
    E.timeDigits.textContent = digits;
    E.timePeriod.textContent = period;
  }

  function scheduleFrame(rawMin) {
    if (updateRaf) cancelAnimationFrame(updateRaf);
    updateRaf = requestAnimationFrame(() => {
      updateDisplay(rawMin);
      applySky(rawMin);
      checkHapticTick(rawMin);
      updateRaf = null;
    });
  }

  /* ─── POINTER / DRAG ─────────────────────────────────────────────── */
  function onPointerDown(e) {
    /* ignore taps on interactive elements */
    if (e.target.closest('button, label, input, .bottom-sheet, .sheet-backdrop')) return;
    dragging     = true;
    dragStartX   = e.clientX;
    dragStartMin = currentMin;
    lastPtrX     = e.clientX;
    lastPtrT     = performance.now();
    velX         = 0;
    if (momRaf) { cancelAnimationFrame(momRaf); momRaf = null; }
    /* hide hint on first drag */
    if (!hintDone) {
      hintDone = true;
      E.dragHint.classList.add('hidden');
    }
    lastHaptic30 = Math.floor(wrapMin(currentMin) / 30);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const now = performance.now();
    const dt  = Math.max(1, now - lastPtrT);
    /* velocity in px/frame (16ms frame) */
    velX   = ((e.clientX - lastPtrX) / dt) * 16;
    lastPtrX = e.clientX;
    lastPtrT = now;
    /* RIGHT = time increases (sun sets), LEFT = time decreases (sun rises) */
    const dx = e.clientX - dragStartX;
    currentMin = dragStartMin + dx * DRAG_SCALE;
    scheduleFrame(currentMin);
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging  = false;
    currentMin = Math.round(currentMin);   /* snap to whole minute */
    if (Math.abs(velX) > MOM_THRESH) startMomentum();
  }

  function startMomentum() {
    if (momRaf) cancelAnimationFrame(momRaf);
    function step() {
      if (Math.abs(velX) < MOM_THRESH) { velX = 0; return; }
      currentMin += velX * DRAG_SCALE;
      velX *= MOM_DECAY;
      scheduleFrame(currentMin);
      momRaf = requestAnimationFrame(step);
    }
    momRaf = requestAnimationFrame(step);
  }

  /* ─── SHEET HELPERS (with history state for mobile back button) ─── */
  let activeSheet = null;
  let activeBackdrop = null;

  function openSheet(sheet, bd) {
    sheet.classList.add('open');
    bd.classList.add('open');
    activeSheet = sheet;
    activeBackdrop = bd;
    // Push history state so mobile back button closes sheet instead of navigating
    try { history.pushState({ sheet: true }, ''); } catch(e) {}
  }
  function closeSheet(sheet, bd) {
    sheet.classList.remove('open');
    bd.classList.remove('open');
    if (activeSheet === sheet) {
      activeSheet = null;
      activeBackdrop = null;
    }
  }
  function closeAllSheets() {
    document.querySelectorAll('.bottom-sheet.open').forEach(s => s.classList.remove('open'));
    document.querySelectorAll('.sheet-backdrop.open').forEach(b => b.classList.remove('open'));
    activeSheet = null;
    activeBackdrop = null;
  }
  // Handle mobile back button / gesture — close sheet instead of navigating away
  window.addEventListener('popstate', (e) => {
    if (activeSheet) {
      closeAllSheets();
      // Don't let the navigation continue
    }
  });

  /* ─── ALARM SHEET ────────────────────────────────────────────────── */
  function renderAlarmSheet() {
    const active = alarms.filter(a => a.on).length;
    E.badgeText.textContent = `${active} active`;

    E.sheetBody.innerHTML = alarms.length === 0
      ? `<div style="text-align:center;padding:40px 20px;color:rgba(255,255,255,0.35);font-size:14px;">
           No alarms yet.<br>Drag the sky and tap + Add Alarm.
         </div>`
      : alarms.map(a => {
          const { digits, period } = fmtTime(a.min);
          return `
            <div class="alarm-item" data-id="${a.id}">
              <div class="alarm-item-left">
                <div class="alarm-time-txt">
                  ${digits}<span class="alarm-period-sm">${period}</span>
                </div>
                <div class="alarm-label-txt">${a.label}</div>
              </div>
              <div class="alarm-item-right">
                <label class="ios-toggle">
                  <input type="checkbox" data-toggle="${a.id}" ${a.on ? 'checked' : ''}>
                  <div class="toggle-track"></div>
                  <div class="toggle-thumb"></div>
                </label>
                <button class="alarm-del-btn" data-del="${a.id}">Delete</button>
              </div>
            </div>`;
        }).join('');

    /* wire up toggles */
    E.sheetBody.querySelectorAll('[data-toggle]').forEach(el => {
      el.addEventListener('change', () => {
        const a = alarms.find(x => x.id === el.dataset.toggle);
        if (a) { a.on = el.checked; saveAlarms(); renderAlarmSheet(); haptic(HAPTIC_SHORT); }
      });
    });
    /* wire up delete */
    E.sheetBody.querySelectorAll('[data-del]').forEach(el => {
      el.addEventListener('click', ev => {
        ev.stopPropagation();
        alarms = alarms.filter(x => x.id !== el.dataset.del);
        saveAlarms(); renderAlarmSheet();
        showToast('Alarm removed');
        haptic(HAPTIC_SHORT);
      });
    });
    /* tap item → jump to that time */
    E.sheetBody.querySelectorAll('.alarm-item').forEach(el => {
      el.addEventListener('click', ev => {
        if (ev.target.closest('[data-del],[data-toggle],label')) return;
        const a = alarms.find(x => x.id === el.dataset.id);
        if (!a) return;
        currentMin = a.min;
        scheduleFrame(currentMin);
        closeSheet(E.alarmSheet, E.sheetBackdrop);
        showToast(`Jumped to ${fmtTime(a.min).digits} ${fmtTime(a.min).period}`);
        haptic(HAPTIC_SHORT);
      });
    });
  }

  /* ─── SOUND SHEET ────────────────────────────────────────────────── */
  function renderSoundSheet() {
    E.soundSheetBody.innerHTML = SOUNDS.map(s => `
      <div class="sound-item ${s.id === selectedSound ? 'active' : ''}" data-sound="${s.id}">
        <span class="sound-icon-em">${s.icon}</span>
        <div class="sound-info">
          <div class="sound-name">${s.name}</div>
          <div class="sound-desc-txt">${s.desc}</div>
        </div>
        <div class="sound-check"><div class="sound-check-icon"></div></div>
      </div>`).join('');

    E.soundSheetBody.querySelectorAll('[data-sound]').forEach(el => {
      el.addEventListener('click', () => {
        selectedSound = el.dataset.sound;
        const snd = SOUNDS.find(s => s.id === selectedSound);
        /* preview clip */
        if (previewAudio) { previewAudio.pause(); previewAudio = null; }
        previewAudio = new Audio(snd.file);
        previewAudio.volume = 0.38;
        previewAudio.play().catch(() => {});
        setTimeout(() => { if (previewAudio) { previewAudio.pause(); previewAudio = null; } }, 3500);
        renderSoundSheet();
        showToast(`🔔 ${snd.name}`);
        haptic(HAPTIC_SHORT);
      });
    });
  }

  /* ─── ADD ALARM ──────────────────────────────────────────────────── */
  const LABELS = ['Amritvela','Nitnem','Hukamnama','Simran','Meditation','Rehras Sahib','Sohila Sahib','Asa Di Var','Kirtan'];
  function addAlarm() {
    const m = wrapMin(Math.round(currentMin));
    const { digits, period } = fmtTime(m);
    const newAlarm = {
      id   : uid(),
      label: LABELS[Math.floor(Math.random() * LABELS.length)],
      min  : m,
      on   : true,
      days : [0,1,2,3,4,5,6],
      sound: selectedSound,
    };
    alarms.push(newAlarm);
    saveAlarms();
    renderAlarmSheet();
    openSheet(E.alarmSheet, E.sheetBackdrop);
    showToast(`✓ Alarm set for ${digits} ${period}`);
    haptic(HAPTIC_LONG);
    /* bump animation on time digits */
    E.timeDigits.classList.remove('bump');
    void E.timeDigits.offsetWidth;           /* reflow to reset animation */
    E.timeDigits.classList.add('bump');
  }

  /* ─── TOAST ──────────────────────────────────────────────────────── */
  let toastTimer = null;
  function showToast(msg) {
    E.toast.textContent = msg;
    E.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => E.toast.classList.remove('show'), 2600);
  }

  /* ─── INIT ───────────────────────────────────────────────────────── */
  function init() {
    cacheDOM();

    /* set time to actual current time */
    const now = new Date();
    currentMin   = now.getHours() * 60 + now.getMinutes();
    lastHaptic30 = Math.floor(wrapMin(currentMin) / 30);

    /* initial render */
    updateDisplay(currentMin);
    applySky(currentMin);

    /* ── Pointer events (single codepath for mouse + touch) ── */
    document.addEventListener('pointerdown',  onPointerDown, { passive: true });
    document.addEventListener('pointermove',  onPointerMove, { passive: true });
    document.addEventListener('pointerup',    onPointerUp);
    document.addEventListener('pointercancel',onPointerUp);

    /* ── Back button ── */
    E.backBtn.addEventListener('click', () => {
      if (previewAudio) { previewAudio.pause(); previewAudio = null; }
      if (typeof handleBack === 'function') handleBack();
      else if (window.history.length > 1) window.history.back();
      else window.location.href = '../index.html';
    });

    /* ── Alarms sheet ── */
    E.alarmsBtn.addEventListener('click', () => {
      renderAlarmSheet();
      openSheet(E.alarmSheet, E.sheetBackdrop);
      haptic(HAPTIC_SHORT);
    });
    E.sheetBackdrop.addEventListener('click', () => closeSheet(E.alarmSheet, E.sheetBackdrop));
    E.closeSheet.addEventListener('click',    () => closeSheet(E.alarmSheet, E.sheetBackdrop));

    /* ── Sound sheet ── */
    E.soundBtn.addEventListener('click', () => {
      renderSoundSheet();
      openSheet(E.soundSheet, E.soundBackdrop);
      haptic(HAPTIC_SHORT);
    });
    E.soundBackdrop.addEventListener('click',    () => closeSheet(E.soundSheet, E.soundBackdrop));
    E.closeSoundSheet.addEventListener('click',  () => closeSheet(E.soundSheet, E.soundBackdrop));

    /* ── Repeat (placeholder) ── */
    E.repeatBtn.addEventListener('click', () => {
      showToast('ਦੁਹਰਾਓ · Repeat — coming soon');
      haptic(HAPTIC_SHORT);
    });

    /* ── Add alarm ── */
    E.addAlarmBtn.addEventListener('click', addAlarm);

    /* ── Dismiss loading screen ── */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (E.loadScreen) E.loadScreen.classList.add('done');
      });
    });

    /* ── Live clock tick (updates display every minute, not sky) ── */
    setInterval(() => {
      if (!dragging && !momRaf) updateDisplay(currentMin);
    }, 60_000);
  }

  /* boot */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
