// components/SehajPaathReader.ts

// Import required functions
import { fetchAng, type AngResponse, type GurbaniLine } from '../lib/banidb';
import { 
  loadProgress, 
  updateCurrentAng, 
  updateSettings, 
  addBookmark,
  getStatistics,
  getTodaysProgress,
  type SehajPaathProgress,
  type ReaderSettings
} from '../lib/sehajPaathProgress';
import { 
  requestNotificationPermission,
  scheduleDailyReminder
} from '../lib/notifications';

class SehajPaathReader {
  private currentAng: number = 1;
  private angData: AngResponse | null = null;
  private loading: boolean = true;
  private error: string | null = null;
  private showSettings: boolean = false;
  private settings: ReaderSettings | null = null;
  private progress: SehajPaathProgress | null = null;
  private isAutoScrolling: boolean = false;
  private autoScrollRef: number | null = null;
  private contentRef: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    // Load saved progress
    this.progress = loadProgress();
    this.settings = this.progress.settings;
    this.currentAng = this.progress.currentAng;

    // Request notification permission
    await requestNotificationPermission();

    // Schedule reminders if enabled
    if (this.settings?.reminderEnabled) {
      scheduleDailyReminder(this.settings.reminderTime, this.currentAng);
    }

    // Fetch initial Ang data
    await this.fetchAngData();

    // Setup event listeners
    this.setupEventListeners();

    // Keep screen awake if enabled
    this.setupWakeLock();

    // Render the reader
    this.render();
  }

  async fetchAngData(): Promise<void> {
    if (this.currentAng < 1 || this.currentAng > 1430) return;
    
    this.loading = true;
    this.error = null;
    this.render();
    
    try {
      this.angData = await fetchAng(this.currentAng);
      this.loading = false;
      updateCurrentAng(this.currentAng);
    } catch (err) {
      this.error = 'Failed to load Ang. Please try again.';
      this.loading = false;
    }
    this.render();
  }

  setupEventListeners() {
    // Swipe gestures
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
      
      // Only handle horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          this.goToPrevAng();
        } else {
          this.goToNextAng();
        }
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') this.goToNextAng();
      if (e.key === 'ArrowLeft') this.goToPrevAng();
    });
  }

  setupWakeLock() {
    if (this.settings?.screenAwake && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(() => {
        console.log('Wake Lock not supported');
      });
    }
  }

  goToNextAng() {
    if (this.currentAng < 1430) {
      this.currentAng++;
      this.contentRef?.scrollTo(0, 0);
      this.haptic('light');
      this.fetchAngData();
    }
  }

  goToPrevAng() {
    if (this.currentAng > 1) {
      this.currentAng--;
      this.contentRef?.scrollTo(0, 0);
      this.haptic('light');
      this.fetchAngData();
    }
  }

  goToAng(angNumber: number) {
    if (angNumber >= 1 && angNumber <= 1430) {
      this.currentAng = angNumber;
      this.contentRef?.scrollTo(0, 0);
      this.fetchAngData();
    }
  }

  haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: 20, heavy: 30 };
      navigator.vibrate(patterns[style]);
    }
  }

  handleSettingsChange(key: keyof ReaderSettings, value: any) {
    if (!this.settings) return;
    
    (this.settings as any)[key] = value;
    updateSettings({ [key]: value } as Partial<ReaderSettings>);
    
    // Handle reminder scheduling
    if (key === 'reminderEnabled' || key === 'reminderTime') {
      if (this.settings.reminderEnabled) {
        scheduleDailyReminder(this.settings.reminderTime, this.currentAng);
      }
    }
    
    this.render();
  }

  handleAddBookmark() {
    const name = `Ang ${this.currentAng}`;
    addBookmark(this.currentAng, name);
    this.haptic('medium');
    this.showToast('Bookmark added');
  }

  toggleAutoScroll() {
    this.isAutoScrolling = !this.isAutoScrolling;
    
    if (this.isAutoScrolling) {
      this.startAutoScroll();
    } else {
      this.stopAutoScroll();
    }
    
    this.render();
  }

  startAutoScroll() {
    if (!this.contentRef || !this.settings) return;
    
    const scrollSpeed = this.settings.autoScrollSpeed * 0.5;
    
    const scroll = () => {
      if (this.contentRef && this.isAutoScrolling) {
        this.contentRef.scrollTop += scrollSpeed;
        
        if (this.contentRef.scrollTop >= 
            this.contentRef.scrollHeight - this.contentRef.clientHeight) {
          this.isAutoScrolling = false;
          if (this.currentAng < 1430) {
            this.goToNextAng();
          }
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

  showToast(message: string) {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      z-index: 1000;
      animation: toastSlide 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }

  getThemeStyles() {
    if (!this.settings) return {};
    
    const themes = {
      light: {
        '--bg-color': '#FFFFFF',
        '--text-color': '#1A1A1A',
        '--secondary-text': '#666666',
        '--border-color': 'rgba(0, 0, 0, 0.1)',
      },
      dark: {
        '--bg-color': '#000000',
        '--text-color': '#FFFFFF',
        '--secondary-text': 'rgba(255, 255, 255, 0.6)',
        '--border-color': 'rgba(255, 255, 255, 0.1)',
      },
      sepia: {
        '--bg-color': '#F4ECD8',
        '--text-color': '#5C4B37',
        '--secondary-text': '#8B7355',
        '--border-color': 'rgba(92, 75, 55, 0.2)',
      },
      night: {
        '--bg-color': '#1A1A2E',
        '--text-color': '#E8E8E8',
        '--secondary-text': 'rgba(232, 232, 232, 0.6)',
        '--border-color': 'rgba(255, 255, 255, 0.1)',
      },
    };
    
    return themes[this.settings.theme] || themes.dark;
  }

  renderLine(line: GurbaniLine, index: number) {
    if (!this.settings) return '';
    
    let gurmukhiText = line.gurmukhi;
    
    // Apply Larivaar
    if (this.settings.larivaar) {
      gurmukhiText = gurmukhiText.replace(/\s+/g, '');
      
      if (this.settings.larivaarAssist) {
        gurmukhiText = line.gurmukhi.split(' ').map((word: string, i: number) => 
          `<span class="larivaar-word" style="color: ${i % 2 === 0 ? 'inherit' : 'var(--secondary-text)'}">${word}</span>`
        ).join('');
      }
    }
    
    return `
      <div class="gurbani-line" style="animation-delay: ${index * 0.02}s">
        <p class="gurmukhi" style="font-size: ${this.settings.fontSize}px">
          ${this.settings.larivaar && this.settings.larivaarAssist ? gurmukhiText : gurmukhiText}
        </p>
        ${this.settings.script === 'roman' || this.settings.script === 'both' ? 
          `<p class="transliteration">${line.transliteration}</p>` : ''}
        ${this.settings.showTranslation ? 
          `<p class="translation">${line.translation[this.settings.translationLang] || line.translation.english}</p>` : ''}
        ${this.settings.vishraam && line.vishraam?.length ? '<div class="vishraam-indicator"></div>' : ''}
      </div>
    `;
  }

  render() {
    const themeStyles = this.getThemeStyles();
    const stats = getStatistics();
    const today = getTodaysProgress();
    
    const html = `
      <div class="sehaj-paath-reader" style="${Object.entries(themeStyles).map(([k, v]) => `${k}: ${v}`).join('; ')}">
        <!-- Header -->
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
            <button class="icon-button" onclick="reader.handleAddBookmark()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="icon-button" onclick="reader.showSettings = true; reader.render();">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </button>
          </div>
        </header>
        
        <!-- Progress Pill -->
        <div class="progress-pill">
          <div class="progress-info">
            <span class="progress-text">${this.currentAng} / 1430</span>
            <span class="progress-percent">${((this.currentAng / 1430) * 100).toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(this.currentAng / 1430) * 100}%"></div>
          </div>
        </div>
        
        <!-- Content -->
        <div class="content" ref="contentRef">
          ${this.error ? `
            <div class="error">
              <p>${this.error}</p>
              <button class="retry-button" onclick="reader.fetchAngData()">Try Again</button>
            </div>
          ` : (this.loading && !this.angData) ? `
            <div class="loading">
              ${[...Array(10)].map((_, i) => `
                <div class="skeleton-line">
                  <div class="skeleton" style="width: 100%; height: 28px"></div>
                  <div class="skeleton" style="width: 80%; height: 18px"></div>
                </div>
              `).join('')}
            </div>
          ` : this.angData?.page.map((line, index) => this.renderLine(line, index)).join('') || ''}
          
          ${!this.loading && this.angData ? `
            <div class="ang-end">
              <div class="ang-end-line"></div>
              <span>॥ ਅੰਗ ${this.currentAng} ਸਮਾਪਤ ॥</span>
              <div class="ang-end-line"></div>
            </div>
            <div class="swipe-hint">
              <span>← Swipe to navigate →</span>
            </div>
          ` : ''}
        </div>
        
        <!-- Bottom Navigation -->
        <nav class="bottom-nav">
          <button class="nav-button" onclick="reader.goToPrevAng()" ${this.currentAng <= 1 ? 'disabled' : ''}>
            <span class="nav-arrow">←</span>
            <span>Ang ${this.currentAng - 1}</span>
          </button>
          
          <button class="auto-scroll-button ${this.isAutoScrolling ? 'active' : ''}" onclick="reader.toggleAutoScroll()">
            ${this.isAutoScrolling ? 'Pause' : 'Auto'}
          </button>
          
          <button class="nav-button" onclick="reader.goToNextAng()" ${this.currentAng >= 1430 ? 'disabled' : ''}>
            <span>Ang ${this.currentAng + 1}</span>
            <span class="nav-arrow">→</span>
          </button>
        </nav>
        
        ${this.showSettings ? this.renderSettingsSheet(stats, today) : ''}
      </div>
    `;
    
    document.body.innerHTML = html;
    this.contentRef = document.querySelector('.content');
    
    // Add CSS
    if (!document.querySelector('#sehaj-paath-styles')) {
      const link = document.createElement('link');
      link.id = 'sehaj-paath-styles';
      link.rel = 'stylesheet';
      link.href = '/components/SehajPaathReader.css';
      document.head.appendChild(link);
    }
  }

  renderSettingsSheet(stats: ReturnType<typeof getStatistics>, today: ReturnType<typeof getTodaysProgress>) {
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
          <!-- Navigation -->
          <div class="settings-group">
            <h3 class="group-title">Navigation</h3>
            <div class="settings-card">
              <div class="settings-item">
                <span class="settings-label">Jump to Ang</span>
                <div class="jump-input">
                  <input type="number" min="1" max="1430" value="${this.currentAng}" class="ang-input" id="jumpInput">
                  <button class="go-button" onclick="reader.goToAng(parseInt(document.getElementById('jumpInput').value)); reader.showSettings = false; reader.render();">Go</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Display Settings -->
          <div class="settings-group">
            <h3 class="group-title">Display</h3>
            <div class="settings-card">
              <div class="settings-item">
                <span class="settings-label">Theme</span>
                <div class="segmented-control">
                  ${['light', 'dark', 'sepia', 'night'].map(theme => `
                    <button class="segment ${this.settings?.theme === theme ? 'active' : ''}" 
                            onclick="reader.handleSettingsChange('theme', '${theme}')">${theme.charAt(0).toUpperCase() + theme.slice(1)}</button>
                  `).join('')}
                </div>
              </div>
              
              <div class="settings-item">
                <span class="settings-label">Font Size</span>
                <div class="font-size-control">
                  <button class="font-button" onclick="reader.handleSettingsChange('fontSize', Math.max(16, ${this.settings?.fontSize ?? 24} - 2))">A-</button>
                  <span class="font-size-value">${this.settings?.fontSize ?? 24}px</span>
                  <button class="font-button" onclick="reader.handleSettingsChange('fontSize', Math.min(40, ${this.settings?.fontSize ?? 24} + 2))">A+</button>
                </div>
              </div>
              
              <div class="settings-item">
                <div>
                  <span class="settings-label">Larivaar</span>
                  <span class="settings-description">Continuous text without spaces</span>
                </div>
                <div class="toggle ${this.settings?.larivaar ? 'active' : ''}" onclick="reader.handleSettingsChange('larivaar', !${this.settings?.larivaar})"></div>
              </div>
              
              ${this.settings?.larivaar ? `
                <div class="settings-item">
                  <div>
                    <span class="settings-label">Larivaar Assist</span>
                    <span class="settings-description">Alternate word colors</span>
                  </div>
                  <div class="toggle ${this.settings?.larivaarAssist ? 'active' : ''}" onclick="reader.handleSettingsChange('larivaarAssist', !${this.settings?.larivaarAssist})"></div>
                </div>
              ` : ''}
              
              <div class="settings-item">
                <div>
                  <span class="settings-label">Show Translation</span>
                </div>
                <div class="toggle ${this.settings?.showTranslation ? 'active' : ''}" onclick="reader.handleSettingsChange('showTranslation', !${this.settings?.showTranslation})"></div>
              </div>
              
              <div class="settings-item">
                <div>
                  <span class="settings-label">Vishraam Marks</span>
                  <span class="settings-description">Show pause indicators</span>
                </div>
                <div class="toggle ${this.settings?.vishraam ? 'active' : ''}" onclick="reader.handleSettingsChange('vishraam', !${this.settings?.vishraam})"></div>
              </div>
            </div>
          </div>
          
          <!-- Reading Settings -->
          <div class="settings-group">
            <h3 class="group-title">Reading</h3>
            <div class="settings-card">
              <div class="settings-item">
                <div>
                  <span class="settings-label">Auto Scroll</span>
                </div>
                <div class="toggle ${this.settings?.autoScroll ? 'active' : ''}" onclick="reader.handleSettingsChange('autoScroll', !${this.settings?.autoScroll})"></div>
              </div>
              
              ${this.settings?.autoScroll ? `
                <div class="settings-item">
                  <span class="settings-label">Scroll Speed</span>
                  <input type="range" min="1" max="10" value="${this.settings?.autoScrollSpeed ?? 5}" 
                         class="slider" onchange="reader.handleSettingsChange('autoScrollSpeed', parseInt(this.value))">
                </div>
              ` : ''}
              
              <div class="settings-item">
                <div>
                  <span class="settings-label">Keep Screen Awake</span>
                </div>
                <div class="toggle ${this.settings?.screenAwake ? 'active' : ''}" onclick="reader.handleSettingsChange('screenAwake', !${this.settings?.screenAwake})"></div>
              </div>
              
              <div class="settings-item">
                <span class="settings-label">Daily Goal (Angs)</span>
                <div class="stepper-control">
                  <button class="stepper-button" onclick="reader.handleSettingsChange('dailyGoal', Math.max(1, ${this.settings?.dailyGoal ?? 5} - 1))">−</button>
                  <span class="stepper-value">${this.settings?.dailyGoal ?? 5}</span>
                  <button class="stepper-button" onclick="reader.handleSettingsChange('dailyGoal', Math.min(50, ${this.settings?.dailyGoal ?? 5} + 1))">+</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Reminders -->
          <div class="settings-group">
            <h3 class="group-title">Reminders</h3>
            <div class="settings-card">
              <div class="settings-item">
                <div>
                  <span class="settings-label">Daily Reminder</span>
                </div>
                <div class="toggle ${this.settings?.reminderEnabled ? 'active' : ''}" onclick="reader.handleSettingsChange('reminderEnabled', !${this.settings?.reminderEnabled})"></div>
              </div>
              
              ${this.settings?.reminderEnabled ? `
                <div class="settings-item">
                  <span class="settings-label">Reminder Time</span>
                  <input type="time" value="${this.settings?.reminderTime ?? '05:00'}" 
                         class="time-input" onchange="reader.handleSettingsChange('reminderTime', this.value)">
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Statistics -->
          <div class="settings-group">
            <h3 class="group-title">Progress</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-value">${stats.completedAngs}</span>
                <span class="stat-label">Angs Read</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">${stats.percentComplete}%</span>
                <span class="stat-label">Complete</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">${stats.currentStreak}</span>
                <span class="stat-label">Day Streak</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">${today.angsRead}/${today.goal}</span>
                <span class="stat-label">Today</span>
              </div>
            </div>
            
            <div class="estimated-completion">
              <p>Estimated Completion: <strong>${stats.estimatedCompletionDate}</strong></p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

}

// Initialize reader when page loads
let reader;
document.addEventListener('DOMContentLoaded', () => {
  reader = new SehajPaathReader();
});
