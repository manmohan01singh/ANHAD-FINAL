// components/SehajPaathReader.js

import { fetchAng } from '../lib/banidb.js';
import {
  loadProgress,
  updateCurrentAng,
  updateSettings,
  addBookmark,
  removeBookmark,
  getStatistics,
  getTodaysProgress,
} from '../lib/sehajPaathProgress.js';
import { requestNotificationPermission, scheduleDailyReminder } from '../lib/notifications.js';

class SehajPaathReader {
  constructor() {
    this.currentAng = 1;
    this.angData = null;
    this.loading = true;
    this.error = null;
    this.showSettings = false;
    this.settings = null;
    this.progress = null;
    this.isAutoScrolling = false;
    this.autoScrollRef = null;
    this.contentRef = null;
    this.focusedLineKey = null;
    this.init();
  }

  syncThemeToDOM() {
    const theme = this.settings?.theme;
    if (!theme) return;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

    const isDark = theme === 'dark' || theme === 'night';
    document.body.classList.toggle('dark-mode', isDark);
    // Also set a CSS variable fallback for components that use --app-bg directly
    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--app-bg', '#ffffff');
      root.style.setProperty('--text-color', '#1a1a1a');
    } else if (theme === 'sepia') {
      root.style.setProperty('--app-bg', '#fdf6e3');
      root.style.setProperty('--text-color', '#5d4037');
    } else {
      root.style.removeProperty('--app-bg');
      root.style.removeProperty('--text-color');
    }
  }

  getLineKey(line, index) {
    return String(line?.lineId ?? line?.lineNo ?? index);
  }

  getLineGurbaniUnicode(line) {
    return (
      line?.verse?.unicode ||
      line?.verse?.gurmukhi ||
      line?.gurmukhi ||
      line?.unicode ||
      ''
    );
  }

  getLineLarivaarUnicode(line) {
    return (
      line?.larivaar?.unicode ||
      line?.larivaar?.gurmukhi ||
      ''
    );
  }

  getLineTransliteration(line) {
    return (
      line?.transliteration?.en ||
      line?.transliteration?.english ||
      line?.transliteration?.ipa ||
      line?.transliteration ||
      ''
    );
  }

  getLineTranslation(line) {
    // BaniDB returns translation.en.bdb/ssk/ms etc.
    const en = line?.translation?.en;
    if (en && typeof en === 'object') {
      return en.bdb || en.ssk || en.ms || '';
    }

    // Fallbacks for other shapes
    return (
      line?.translation?.english ||
      line?.translation ||
      ''
    );
  }

  async init() {
    this.progress = loadProgress();
    this.settings = this.progress.settings;
    this.currentAng = this.progress.currentAng;

    // Make theme explicit before the first render, otherwise light mode can flash/lock wrong colors.
    this.syncThemeToDOM();

    await requestNotificationPermission();

    if (this.settings?.reminderEnabled) {
      scheduleDailyReminder(this.settings.reminderTime, this.currentAng);
    }

    await this.fetchAngData();
    this.setupEventListeners();
    this.setupWakeLock();
    this.render();
  }

  handleRandomHukam() {
    const randomAng = Math.floor(Math.random() * 1430) + 1;
    this.goToAng(randomAng);
    this.showToast(`Hukam: Ang ${randomAng}`);
  }

  async fetchAngData() {
    if (this.currentAng < 1 || this.currentAng > 1430) return;

    this.loading = true;
    this.error = null;
    this.render();

    try {
      this.angData = await fetchAng(this.currentAng);
      this.loading = false;
      updateCurrentAng(this.currentAng);
      window.currentAng = this.currentAng;
    } catch (e) {
      this.error = 'Failed to load Ang. Please try again.';
      this.loading = false;
    }

    this.render();
  }

  setupEventListeners() {
    let startX = 0;
    let startY = 0;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) this.goToPrevAng();
        else this.goToNextAng();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') this.goToNextAng();
      if (e.key === 'ArrowLeft') this.goToPrevAng();
      if (e.key === 'Escape') window.history.back();
    });

    document.addEventListener('click', (e) => {
      const lineEl = e.target?.closest?.('.gurbani-line');
      if (!lineEl) return;
      if (!this.settings?.focusMode) return;

      const key = lineEl.getAttribute('data-line-key');
      if (!key) return;

      this.focusedLineKey = this.focusedLineKey === key ? null : key;
      this.render();
    });
  }

  setupWakeLock() {
    if (this.settings?.screenAwake && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(() => {});
    }
  }

  goToNextAng() {
    if (this.currentAng < 1430) {
      this.currentAng += 1;
      this.contentRef?.scrollTo(0, 0);
      this.haptic('light');
      this.fetchAngData();
    }
  }

  goToPrevAng() {
    if (this.currentAng > 1) {
      this.currentAng -= 1;
      this.contentRef?.scrollTo(0, 0);
      this.haptic('light');
      this.fetchAngData();
    }
  }

  goToAng(angNumber) {
    const ang = Number(angNumber);
    if (Number.isFinite(ang) && ang >= 1 && ang <= 1430) {
      this.currentAng = ang;
      this.contentRef?.scrollTo(0, 0);
      this.fetchAngData();
    }
  }

  haptic(style = 'light') {
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: 20, heavy: 30 };
      navigator.vibrate(patterns[style] || patterns.light);
    }
  }

  handleSettingsChange(key, value) {
    if (!this.settings) return;
    this.settings[key] = value;
    updateSettings(this.settings);

    if (key === 'theme') {
      this.syncThemeToDOM();
    }

    if (key === 'reminderEnabled' || key === 'reminderTime') {
      if (this.settings.reminderEnabled) {
        scheduleDailyReminder(this.settings.reminderTime, this.currentAng);
      }
    }

    this.render();
  }

  handleAddBookmark() {
    const progress = loadProgress();
    const bookmarks = progress.bookmarks || [];
    const existing = bookmarks.find((b) => b.angNumber === this.currentAng);

    if (existing?.id) {
      removeBookmark(existing.id);
      this.haptic('light');
      this.showToast('Bookmark removed');
    } else {
      const name = `Ang ${this.currentAng}`;
      addBookmark(this.currentAng, name);
      this.haptic('medium');
      this.showToast('Bookmark added');
    }

    this.render();
  }

  toggleAutoScroll() {
    this.isAutoScrolling = !this.isAutoScrolling;
    if (this.isAutoScrolling) this.startAutoScroll();
    else this.stopAutoScroll();
    this.render();
  }

  startAutoScroll() {
    if (!this.contentRef || !this.settings) return;
    const scrollSpeed = (this.settings.autoScrollSpeed || 5) * 0.5;

    const scroll = () => {
      if (this.contentRef && this.isAutoScrolling) {
        this.contentRef.scrollTop += scrollSpeed;
        if (
          this.contentRef.scrollTop >=
          this.contentRef.scrollHeight - this.contentRef.clientHeight
        ) {
          this.isAutoScrolling = false;
          if (this.currentAng < 1430) this.goToNextAng();
        } else {
          this.autoScrollRef = requestAnimationFrame(scroll);
        }
      }
    };

    this.autoScrollRef = requestAnimationFrame(scroll);
  }

  stopAutoScroll() {
    if (this.autoScrollRef) {
      cancelAnimationFrame(this.autoScrollRef);
      this.autoScrollRef = null;
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      z-index: 1000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  getThemeStyles() {
    if (!this.settings) return {};

    const themes = {
      light: {
        '--app-bg': 'linear-gradient(180deg, #F7F8FF 0%, #FFFFFF 35%, #F2F4FF 100%)',
        '--bg-color': '#FFFFFF',
        '--text-color': '#111114',
        '--secondary-text': 'rgba(17, 17, 20, 0.64)',
        '--border-color': 'rgba(17, 17, 20, 0.10)',
        '--chrome-bg': 'rgba(255,255,255,0.78)',
        '--chrome-bg-strong': 'rgba(255,255,255,0.92)',
        '--chrome-border': 'rgba(0,0,0,0.08)',
        '--settings-bg': 'rgba(255,255,255,0.86)',
        '--settings-border': 'rgba(0,0,0,0.08)',
        '--surface-bg': 'rgba(255,255,255,0.72)',
        '--surface-border': 'rgba(0,0,0,0.08)',
        '--backdrop-bg': 'rgba(0,0,0,0.25)',
        '--hover-bg': 'rgba(0,0,0,0.04)',
      },
      dark: {
        '--app-bg': '#000000',
        '--bg-color': '#000000',
        '--text-color': '#FFFFFF',
        '--secondary-text': 'rgba(255, 255, 255, 0.6)',
        '--border-color': 'rgba(255, 255, 255, 0.1)',
        '--chrome-bg': 'rgba(0,0,0,0.55)',
        '--chrome-bg-strong': 'rgba(0,0,0,0.82)',
        '--chrome-border': 'rgba(255,255,255,0.10)',
        '--settings-bg': 'rgba(24,24,28,0.92)',
        '--settings-border': 'rgba(255,255,255,0.10)',
        '--surface-bg': 'rgba(255,255,255,0.08)',
        '--surface-border': 'rgba(255,255,255,0.12)',
        '--backdrop-bg': 'rgba(0,0,0,0.50)',
        '--hover-bg': 'rgba(255,255,255,0.04)',
      },
      sepia: {
        '--app-bg': 'linear-gradient(180deg, #F9F1DF 0%, #F4ECD8 45%, #EFE4CA 100%)',
        '--bg-color': '#F4ECD8',
        '--text-color': '#5C4B37',
        '--secondary-text': '#8B7355',
        '--border-color': 'rgba(92, 75, 55, 0.2)',
        '--chrome-bg': 'rgba(244,236,216,0.72)',
        '--chrome-bg-strong': 'rgba(244,236,216,0.90)',
        '--chrome-border': 'rgba(92,75,55,0.14)',
        '--settings-bg': 'rgba(244,236,216,0.88)',
        '--settings-border': 'rgba(92,75,55,0.14)',
        '--surface-bg': 'rgba(255,255,255,0.46)',
        '--surface-border': 'rgba(92,75,55,0.14)',
        '--backdrop-bg': 'rgba(0,0,0,0.25)',
        '--hover-bg': 'rgba(92,75,55,0.08)',
      },
      night: {
        '--app-bg': 'linear-gradient(180deg, #0A0A18 0%, #10102A 55%, #0B0B18 100%)',
        '--bg-color': '#1A1A2E',
        '--text-color': '#E8E8E8',
        '--secondary-text': 'rgba(232, 232, 232, 0.6)',
        '--border-color': 'rgba(255, 255, 255, 0.1)',
        '--chrome-bg': 'rgba(12,12,22,0.62)',
        '--chrome-bg-strong': 'rgba(12,12,22,0.86)',
        '--chrome-border': 'rgba(255,255,255,0.10)',
        '--settings-bg': 'rgba(12,12,22,0.88)',
        '--settings-border': 'rgba(255,255,255,0.10)',
        '--surface-bg': 'rgba(255,255,255,0.08)',
        '--surface-border': 'rgba(255,255,255,0.12)',
        '--backdrop-bg': 'rgba(0,0,0,0.55)',
        '--hover-bg': 'rgba(255,255,255,0.04)',
      },
    };

    return themes[this.settings.theme] || themes.light;
  }

  getGurmukhiFontCss() {
    const key = this.settings?.gurmukhiFont || 'noto-sans';
    const map = {
      'noto-sans': "'Noto Sans Gurmukhi', system-ui, sans-serif",
      'noto-serif': "'Noto Serif Gurmukhi', system-ui, serif",
      'baloo': "'Baloo Paaji 2', system-ui, sans-serif",
      'anek': "'Anek Gurmukhi', system-ui, sans-serif",
      'tiro': "'Tiro Gurmukhi', system-ui, serif",
    };
    return map[key] || map['noto-sans'];
  }

  renderLine(line, index) {
    if (!this.settings) return '';

    const normal = this.getLineGurbaniUnicode(line);
    const larivaar = this.getLineLarivaarUnicode(line);
    const translitValue = this.getLineTransliteration(line);
    const translationValue = this.getLineTranslation(line);

    let gurmukhiText = this.settings.larivaar && larivaar ? larivaar : normal;
    if (this.settings.larivaar && this.settings.larivaarAssist && normal) {
      // Assist by alternating word tint based on normal spaced text.
      gurmukhiText = normal
        .split(' ')
        .filter(Boolean)
        .map(
          (word, i) =>
            `<span class="larivaar-word" style="color: ${
              i % 2 === 0 ? 'inherit' : 'var(--secondary-text)'
            }">${word}</span>`
        )
        .join('');
    }

    const translit =
      this.settings.script === 'roman' || this.settings.script === 'both'
        ? `<p class="transliteration">${translitValue}</p>`
        : '';

    const translation = this.settings.showTranslation
      ? `<p class="translation">${translationValue}</p>`
      : '';

    return `
      <div class="gurbani-line ${
        this.focusedLineKey && this.focusedLineKey === this.getLineKey(line, index)
          ? 'is-focused'
          : ''
      }" data-line-key="${this.getLineKey(line, index)}" style="animation-delay: ${index * 0.02}s">
        <p class="gurmukhi" style="font-size: ${this.settings.fontSize}px; font-family: ${this.getGurmukhiFontCss()}; font-weight: ${this.settings.gurmukhiWeight || 400};">
          ${gurmukhiText}
        </p>
        ${translit}
        ${translation}
      </div>
    `;
  }

  render() {
    const themeStyles = this.getThemeStyles();
    const stats = getStatistics();
    const today = getTodaysProgress();

    const fresh = loadProgress();
    const isBookmarked = (fresh.bookmarks || []).some(
      (b) => b.angNumber === this.currentAng
    );

    const styleStr = Object.entries(themeStyles)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');

    const contentHtml = this.error
      ? `<div class="error"><p>${this.error}</p><button class="retry-button" onclick="reader.fetchAngData()">Try Again</button></div>`
      : this.loading && !this.angData
      ? `<div class="loading"></div>`
      : (this.angData?.page || []).map((l, i) => this.renderLine(l, i)).join('');

    const html = `
      <div class="sehaj-paath-reader ${
        this.settings?.focusMode ? 'focus-mode' : ''
      } ${this.focusedLineKey ? 'focus-active' : ''}" style="${styleStr}">
        <header class="reader-header">
          <button class="back-button" onclick="window.history.back()">
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
              <path d="M10 2L2 10L10 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Back</span>
          </button>
          <div class="header-center">
            <h1 class="title">ਅੰਗ ${this.currentAng}</h1>
            <p class="subtitle">Sri Guru Granth Sahib Ji</p>
          </div>
          <div class="header-right">
            <button class="bookmark-btn ${isBookmarked ? 'active bookmarked' : ''}" onclick="reader.handleAddBookmark()">
              <svg class="bookmark-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <button class="icon-button" onclick="reader.handleRandomHukam()" title="Random Hukam">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 8h.01M12 12h.01M16 16h.01M16 8h.01M8 16h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="icon-button" onclick="reader.showSettings = true; reader.render();">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M19.4 15a7.8 7.8 0 0 0 .1-1 7.8 7.8 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7.2 7.2 0 0 0-1.7-1L15 4h-6l-.3 2.5c-.6.3-1.2.6-1.7 1l-2.4-1-2 3.5 2 1.5a7.8 7.8 0 0 0-.1 1 7.8 7.8 0 0 0 .1 1l-2 1.5 2 3.5 2.4-1c.5.4 1.1.7 1.7 1L9 20h6l.3-2.5c.6-.3 1.2-.6 1.7-1l2.4 1 2-3.5-2-1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </header>

        ${this.settings?.showProgressPill
          ? `
        <div class="progress-pill">
          <div class="progress-info">
            <span class="progress-text">${this.currentAng} / 1430</span>
            <span class="progress-percent">${((this.currentAng / 1430) * 100).toFixed(1)}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${
            (this.currentAng / 1430) * 100
          }%"></div></div>
        </div>
        `
          : ''}

        <div class="content">${contentHtml}</div>

        <nav class="bottom-nav">
          <button class="nav-button" onclick="reader.goToPrevAng()" ${
            this.currentAng <= 1 ? 'disabled' : ''
          }>
            <span class="nav-arrow">←</span>
            <span>Ang ${this.currentAng - 1}</span>
          </button>

          <button class="auto-scroll-button ${
            this.isAutoScrolling ? 'active' : ''
          }" onclick="reader.toggleAutoScroll()">
            ${this.isAutoScrolling ? 'Pause' : 'Auto'}
          </button>

          <button class="nav-button" onclick="reader.goToNextAng()" ${
            this.currentAng >= 1430 ? 'disabled' : ''
          }>
            <span>Ang ${this.currentAng + 1}</span>
            <span class="nav-arrow">→</span>
          </button>
        </nav>

        ${this.showSettings ? this.renderSettingsSheet(stats, today) : ''}
      </div>
    `;

    document.body.innerHTML = html;
    this.contentRef = document.querySelector('.content');
  }

  renderSettingsSheet(stats, today) {
    const fresh = loadProgress();
    const bookmarks = fresh.bookmarks || [];

    const fontSize = this.settings?.fontSize ?? 24;
    const dailyGoal = this.settings?.dailyGoal ?? 5;
    const autoScroll = !!this.settings?.autoScroll;
    const autoScrollSpeed = this.settings?.autoScrollSpeed ?? 5;
    const reminderEnabled = !!this.settings?.reminderEnabled;
    const reminderTime = this.settings?.reminderTime ?? '05:00';
    const theme = this.settings?.theme ?? 'light';
    const larivaar = !!this.settings?.larivaar;
    const larivaarAssist = !!this.settings?.larivaarAssist;
    const screenAwake = !!this.settings?.screenAwake;
    const vishraam = !!this.settings?.vishraam;
    const showTranslation = !!this.settings?.showTranslation;
    const gurmukhiFont = this.settings?.gurmukhiFont ?? 'noto-sans';
    const gurmukhiWeight = this.settings?.gurmukhiWeight ?? 400;
    const showProgressPill = !!this.settings?.showProgressPill;
    const focusMode = !!this.settings?.focusMode;

    const bookmarksHtml = bookmarks.length
      ? `<div class="settings-card">${bookmarks
          .slice()
          .reverse()
          .slice(0, 10)
          .map(
            (b) => `
              <div class="settings-item settings-item--clickable" onclick="reader.goToAng(${b.angNumber}); reader.showSettings=false; reader.render();">
                <div>
                  <span class="settings-label">${b.name || `Ang ${b.angNumber}`}</span>
                  <span class="settings-description">Ang ${b.angNumber}</span>
                </div>
                <span class="chevron">›</span>
              </div>
            `
          )
          .join('')}</div>`
      : `<div class="settings-card"><div class="settings-item"><span class="settings-label">No bookmarks yet</span></div></div>`;

    return `
      <div class="backdrop" onclick="reader.showSettings = false; reader.render();"></div>
      <div class="settings-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-header">
          <button class="sheet-close" onclick="reader.showSettings = false; reader.render();">Done</button>
          <h2 class="sheet-title">Settings</h2>
          <div style="width: 50px"></div>
        </div>

        <div class="sheet-content">
          <div class="settings-group">
            <h3 class="group-title">Navigation</h3>
            <div class="settings-card">
              <div class="settings-item">
                <span class="settings-label">Jump to Ang</span>
                <div class="jump-input">
                  <input type="number" min="1" max="1430" value="${this.currentAng}" class="ang-input" id="jumpInput" />
                  <button class="go-button" onclick="reader.goToAng(parseInt(document.getElementById('jumpInput').value, 10)); reader.showSettings = false; reader.render();">Go</button>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-group">
            <h3 class="group-title">Theme</h3>
            <div class="settings-card">
              <div class="settings-item">
                <span class="settings-label">Appearance</span>
                <div class="segmented-control">
                  ${['light', 'dark', 'sepia', 'night']
                    .map(
                      (t) => `
                        <button class="segment ${theme === t ? 'active' : ''}" onclick="reader.handleSettingsChange('theme','${t}')">${t}</button>
                      `
                    )
                    .join('')}
                </div>
              </div>
            </div>
          </div>

          <div class="settings-group">
            <h3 class="group-title">Display</h3>
            <div class="settings-card">
              <div class="settings-item">
                <span class="settings-label">Gurmukhi Font</span>
                <select class="select" onchange="reader.handleSettingsChange('gurmukhiFont', this.value)">
                  <option value="noto-sans" ${gurmukhiFont === 'noto-sans' ? 'selected' : ''}>Noto Sans</option>
                  <option value="noto-serif" ${gurmukhiFont === 'noto-serif' ? 'selected' : ''}>Noto Serif</option>
                  <option value="baloo" ${gurmukhiFont === 'baloo' ? 'selected' : ''}>Baloo Paaji 2</option>
                  <option value="anek" ${gurmukhiFont === 'anek' ? 'selected' : ''}>Anek Gurmukhi</option>
                  <option value="tiro" ${gurmukhiFont === 'tiro' ? 'selected' : ''}>Tiro Gurmukhi</option>
                </select>
              </div>

              <div class="settings-item">
                <span class="settings-label">Bani Weight</span>
                <select class="select" onchange="reader.handleSettingsChange('gurmukhiWeight', parseInt(this.value,10))">
                  <option value="300" ${gurmukhiWeight === 300 ? 'selected' : ''}>Light</option>
                  <option value="400" ${gurmukhiWeight === 400 ? 'selected' : ''}>Regular</option>
                  <option value="600" ${gurmukhiWeight === 600 ? 'selected' : ''}>Semibold</option>
                  <option value="700" ${gurmukhiWeight === 700 ? 'selected' : ''}>Bold</option>
                </select>
              </div>

              <div class="settings-item">
                <span class="settings-label">Font Size</span>
                <div class="font-size-control">
                  <button class="font-button" onclick="reader.handleSettingsChange('fontSize', Math.max(16, ${fontSize} - 2))">A-</button>
                  <span class="font-size-value">${fontSize}px</span>
                  <button class="font-button" onclick="reader.handleSettingsChange('fontSize', Math.min(40, ${fontSize} + 2))">A+</button>
                </div>
              </div>
              <div class="settings-item">
                <div>
                  <span class="settings-label">Show Translation</span>
                </div>
                <div class="toggle ${showTranslation ? 'active' : ''}" onclick="reader.handleSettingsChange('showTranslation', !${showTranslation})"></div>
              </div>

              <div class="settings-item">
                <div>
                  <span class="settings-label">Vishraam</span>
                  <span class="settings-description">Pause markers (if available)</span>
                </div>
                <div class="toggle ${vishraam ? 'active' : ''}" onclick="reader.handleSettingsChange('vishraam', !${vishraam})"></div>
              </div>

              <div class="settings-item">
                <div>
                  <span class="settings-label">Larivaar</span>
                  <span class="settings-description">Continuous text</span>
                </div>
                <div class="toggle ${larivaar ? 'active' : ''}" onclick="reader.handleSettingsChange('larivaar', !${larivaar})"></div>
              </div>

              ${larivaar
                ? `
              <div class="settings-item">
                <div>
                  <span class="settings-label">Larivaar Assist</span>
                  <span class="settings-description">Alternate tinting</span>
                </div>
                <div class="toggle ${larivaarAssist ? 'active' : ''}" onclick="reader.handleSettingsChange('larivaarAssist', !${larivaarAssist})"></div>
              </div>
              `
                : ''}

              <div class="settings-item">
                <div>
                  <span class="settings-label">Progress Pill</span>
                  <span class="settings-description">Show progress at top while reading</span>
                </div>
                <div class="toggle ${showProgressPill ? 'active' : ''}" onclick="reader.handleSettingsChange('showProgressPill', !${showProgressPill})"></div>
              </div>

              <div class="settings-item">
                <div>
                  <span class="settings-label">Focus Mode</span>
                  <span class="settings-description">Tap a line to spotlight it</span>
                </div>
                <div class="toggle ${focusMode ? 'active' : ''}" onclick="reader.handleSettingsChange('focusMode', !${focusMode}); reader.focusedLineKey = null;"></div>
              </div>
            </div>
          </div>

          <div class="settings-group">
            <h3 class="group-title">Reading</h3>
            <div class="settings-card">
              <div class="settings-item">
                <div>
                  <span class="settings-label">Auto Scroll</span>
                  <span class="settings-description">Smooth hands-free reading</span>
                </div>
                <div class="toggle ${autoScroll ? 'active' : ''}" onclick="reader.handleSettingsChange('autoScroll', !${autoScroll})"></div>
              </div>

              ${autoScroll
                ? `
              <div class="settings-item">
                <div>
                  <span class="settings-label">Scroll Speed</span>
                  <span class="settings-description">${autoScrollSpeed}</span>
                </div>
              </div>
              <div class="settings-item" style="padding-top:0">
                <input class="slider" type="range" min="1" max="10" value="${autoScrollSpeed}" oninput="reader.handleSettingsChange('autoScrollSpeed', parseInt(this.value,10))" />
              </div>
              `
                : ''}

              <div class="settings-item">
                <div>
                  <span class="settings-label">Keep Screen Awake</span>
                </div>
                <div class="toggle ${screenAwake ? 'active' : ''}" onclick="reader.handleSettingsChange('screenAwake', !${screenAwake})"></div>
              </div>

              <div class="settings-item">
                <span class="settings-label">Daily Goal (Angs)</span>
                <div class="stepper-control">
                  <button class="stepper-button" onclick="reader.handleSettingsChange('dailyGoal', Math.max(1, ${dailyGoal} - 1))">−</button>
                  <span class="stepper-value">${dailyGoal}</span>
                  <button class="stepper-button" onclick="reader.handleSettingsChange('dailyGoal', Math.min(50, ${dailyGoal} + 1))">+</button>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-group">
            <h3 class="group-title">Reminders</h3>
            <div class="settings-card">
              <div class="settings-item">
                <div>
                  <span class="settings-label">Daily Reminder</span>
                </div>
                <div class="toggle ${reminderEnabled ? 'active' : ''}" onclick="reader.handleSettingsChange('reminderEnabled', !${reminderEnabled})"></div>
              </div>
              ${reminderEnabled
                ? `
              <div class="settings-item">
                <span class="settings-label">Reminder Time</span>
                <input class="time-input" type="time" value="${reminderTime}" onchange="reader.handleSettingsChange('reminderTime', this.value)" />
              </div>
              `
                : ''}
            </div>
          </div>

          <div class="settings-group">
            <h3 class="group-title">Bookmarks</h3>
            ${bookmarksHtml}
          </div>

          <div class="settings-group">
            <h3 class="group-title">Progress</h3>
            <div class="stats-grid">
              <div class="stat-card"><span class="stat-value">${stats.completedAngs}</span><span class="stat-label">Angs Read</span></div>
              <div class="stat-card"><span class="stat-value">${stats.percentComplete}%</span><span class="stat-label">Complete</span></div>
              <div class="stat-card"><span class="stat-value">${stats.currentStreak}</span><span class="stat-label">Day Streak</span></div>
              <div class="stat-card"><span class="stat-value">${today.angsRead}/${today.goal}</span><span class="stat-label">Today</span></div>
            </div>
            <div class="estimated-completion"><p>Estimated Completion: <strong>${stats.estimatedCompletionDate}</strong></p></div>
          </div>
        </div>
      </div>
    `;
  }
}

let reader;
document.addEventListener('DOMContentLoaded', () => {
  reader = new SehajPaathReader();
  window.reader = reader;
});
