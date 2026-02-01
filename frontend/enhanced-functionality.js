/**
 * GURBANI LIVE RADIO - ENHANCED FUNCTIONALITY
 * iOS 26+ Liquid Glass Edition with Full Feature Support
 */

class GurbaniRadioEnhancements {
  constructor() {
    this.sehajProgress = {
      currentPage: 1,
      totalPages: 1430, // Total pages in Sri Guru Granth Sahib Ji
      dailyTarget: 48, // Pages per day for 30-day completion
      completedPages: 0,
      startDate: null,
      notes: []
    };

    this.reminders = {
      amritvela: { enabled: true, time: '03:00', sound: 'bell' },
      rehras: { enabled: true, time: '18:00', sound: 'bell' },
      sohila: { enabled: true, time: '21:00', sound: 'bell' },
      custom: []
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSavedData();
    this.initSehajProgress();
    this.initReminders();
    console.log('🙏 Gurbani Radio Enhancements Ready');
  }

  setupEventListeners() {
    // IMPORTANT:
    // `frontend/script.js` already owns core app controls (play/prev/next/volume/share/schedule/notes/shabad).
    // This file only wires the NEW feature cards (Sehaj / Reminders / Tracker / Settings).
    const sehajPaathCard = document.getElementById('sehajPaathCard');
    const remindersCard = document.getElementById('remindersCard');
    const nitnemTrackerCard = document.getElementById('nitnemTrackerCard');
    const settingsBtn = document.getElementById('settingsBtn');

    if (sehajPaathCard) {
      sehajPaathCard.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.href = './SehajPaath/sehaj-paath.html';
      });
    }

    if (remindersCard) {
      remindersCard.addEventListener('click', () => this.openReminders());
    }

    if (nitnemTrackerCard) {
      nitnemTrackerCard.addEventListener('click', () => this.openNitnemTracker());
    }

    // Naam Abhyas Card
    const naamAbhyasCard = document.getElementById('naamAbhyasCard');
    if (naamAbhyasCard) {
      naamAbhyasCard.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.href = 'NaamAbhyas/naam-abhyas.html';
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettings());
    }

    // Dialog close (delegated) for elements with [data-close-modal]
    // This is safe alongside script.js and also enables close for dynamically created dialogs.
    document.addEventListener('click', (e) => {
      const closeEl = e.target.closest('[data-close-modal]');
      if (!closeEl) return;
      const dialog = closeEl.closest('dialog');
      if (dialog && typeof dialog.close === 'function') dialog.close();
    });
  }

  // Main Controls Functions
  togglePlayPause() {
    this.isPlaying = !this.isPlaying;
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');

    if (this.isPlaying) {
      playBtn.classList.add('playing');
      playBtn.setAttribute('aria-pressed', 'true');
      playIcon.className = 'fas fa-pause';
      this.showNotification('▶️ Playing Gurbani Kirtan', 'success');
    } else {
      playBtn.classList.remove('playing');
      playBtn.setAttribute('aria-pressed', 'false');
      playIcon.className = 'fas fa-play';
      this.showNotification('⏸️ Paused', 'info');
    }

    this.updatePlayerUI();
  }

  previousStation() {
    this.showNotification('⏮ Previous Station', 'info');
    console.log('Previous station');
  }

  nextStation() {
    this.showNotification('⏭ Next Station', 'info');
    console.log('Next station');
  }

  // Volume Control Functions
  toggleVolumePopup() {
    const volumePopup = document.getElementById('volumePopup');
    const isVisible = volumePopup.dataset.visible === 'true';

    if (isVisible) {
      this.closeVolumePopup();
    } else {
      this.openVolumePopup();
    }
  }

  openVolumePopup() {
    const volumePopup = document.getElementById('volumePopup');
    if (!volumePopup) return;
    volumePopup.dataset.visible = 'true';
  }

  closeVolumePopup() {
    const volumePopup = document.getElementById('volumePopup');
    if (!volumePopup) return;
    volumePopup.dataset.visible = 'false';
  }

  updateVolume(value) {
    this.volume = value;
    const volumeValue = document.getElementById('volumeValue');
    const volumeFill = document.getElementById('volumeFill');
    const volumeIcon = document.getElementById('volumeIcon');

    volumeValue.textContent = `${value}%`;
    volumeFill.style.width = `${value}%`;

    // Update volume icon
    if (value === 0) {
      volumeIcon.className = 'fas fa-volume-xmark';
    } else if (value < 33) {
      volumeIcon.className = 'fas fa-volume-low';
    } else if (value < 66) {
      volumeIcon.className = 'fas fa-volume-down';
    } else {
      volumeIcon.className = 'fas fa-volume-high';
    }

    console.log(`Volume set to ${value}%`);
  }

  // Favorite Functions
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
    const favoriteBtn = document.getElementById('favoriteBtn');
    const filledIcon = favoriteBtn.querySelector('.fas.fa-heart');
    const emptyIcon = favoriteBtn.querySelector('.far.fa-heart');

    if (this.isFavorite) {
      filledIcon.style.display = 'inline';
      emptyIcon.style.display = 'none';
      this.showNotification('❤️ Added to Favorites', 'success');
    } else {
      filledIcon.style.display = 'none';
      emptyIcon.style.display = 'inline';
      this.showNotification('💔 Removed from Favorites', 'info');
    }

    this.updateFavoriteUI();
  }

  updateFavoriteUI() {
    // Add haptic feedback simulation
    const favoriteBtn = document.getElementById('favoriteBtn');
    favoriteBtn.classList.add('ios-haptic');
    setTimeout(() => favoriteBtn.classList.remove('ios-haptic'), 200);
  }

  // Share Functions
  openShareModal() {
    const modal = document.getElementById('shareModal');
    modal.showModal();
  }

  openScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    modal.showModal();
  }

  // Bento Grid Functions
  openDailyHukamnama() {
    this.showNotification('📖 Opening Daily Hukamnama', 'info');
    console.log('Daily Hukamnama opened');
  }

  openNitnemPaath() {
    window.location.href = '../nitnem/indexbani.html';
  }

  openNotes() {
    const overlay = document.getElementById('notesOverlay');
    if (!overlay) return;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.loadNotes();
  }

  closeNotes() {
    const overlay = document.getElementById('notesOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  async getRandomShabad() {
    const shabadOverlay = document.getElementById('shabadOverlay');
    const shabadModal = document.getElementById('shabadModal');
    const loadingElement = document.getElementById('shabadLoading');
    const errorElement = document.getElementById('shabadError');
    const contentElement = document.getElementById('shabadContent');

    // Show overlay + loading state
    if (shabadOverlay) {
      shabadOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    if (loadingElement) loadingElement.style.display = 'flex';
    if (errorElement) errorElement.style.display = 'none';
    if (contentElement) contentElement.style.display = 'none';

    try {
      // Simulate API call to get random shabad
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock shabad data
      const mockShabads = [
        {
          gurmukhi: 'ਏਹਤਾਮੁ ਕਰਤਾ ਪੁਰਖੁ ਨਿਰਭਉ ਨਿਰਵੈਰੁ ਅਕਾਲ ਮੂਰਤਿ',
          transliteration: 'Ik onkar satgur parsaan, adik sach, nanak hosi, sochai sochai.',
          translation: 'There is one God, all truth is His name, He is the Creator.',
          source: 'Japji Sahib, Ang 1, Page 1',
          ang: 1
        },
        {
          gurmukhi: 'ਸਭਿ ਸਤਿਗੁਰ ਹਰਮਾ ਏਣੀਦਾ ਰਹਰਮਾਂ ਵਾਹੁ ਇਕੁ ਓਅੰਾਂ',
          transliteration: 'Sabad sochai, sabad sochai, sabad sochai.',
          translation: 'Meditate on the True Lord, meditate on the True Lord.',
          source: 'Anand Sahib, Ang 474, Page 1',
          ang: 474
        }
      ];

      const randomShabad = mockShabads[Math.floor(Math.random() * mockShabads.length)];
      this.currentShabad = randomShabad;

      const shabadAngNumber = document.getElementById('shabadAngNumber');
      const shabadGurmukhi = document.getElementById('shabadGurmukhi');
      const shabadTransliteration = document.getElementById('shabadTransliteration');
      const shabadTranslation = document.getElementById('shabadTranslation');
      const shabadSource = document.getElementById('shabadSource');

      if (shabadAngNumber) shabadAngNumber.textContent = `${randomShabad.ang}`;
      if (shabadGurmukhi) shabadGurmukhi.textContent = randomShabad.gurmukhi;
      if (shabadTransliteration) shabadTransliteration.textContent = randomShabad.transliteration;
      if (shabadTranslation) shabadTranslation.textContent = randomShabad.translation;
      if (shabadSource) shabadSource.innerHTML = `<span><i class="fas fa-book-open"></i></span><span>${randomShabad.source}</span>`;

      if (loadingElement) loadingElement.style.display = 'none';
      if (contentElement) contentElement.style.display = 'block';

      this.showNotification('📜 Divine Message Received', 'success');

    } catch (error) {
      console.error('Error fetching shabad:', error);
      if (loadingElement) loadingElement.style.display = 'none';
      if (errorElement) errorElement.style.display = 'block';
      this.showNotification('❌ Unable to fetch Shabad', 'error');
    }
  }

  closeShabad() {
    const shabadOverlay = document.getElementById('shabadOverlay');
    if (!shabadOverlay) return;
    shabadOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  copyShabad() {
    if (this.currentShabad) {
      navigator.clipboard.writeText(this.currentShabad.gurmukhi);
      this.showNotification('📋 Shabad copied to clipboard', 'success');
    }
  }

  shareShabad() {
    if (this.currentShabad) {
      if (navigator.share) {
        navigator.share({
          title: 'Divine Shabad',
          text: `${this.currentShabad.gurmukhi}\n\n${this.currentShabad.transliteration}\n\n${this.currentShabad.translation}`
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        this.showNotification('📤 Sharing not supported on this device', 'info');
      }
    }
  }

  bookmarkShabad() {
    if (this.currentShabad) {
      // Save to localStorage
      const bookmarks = JSON.parse(localStorage.getItem('shabadBookmarks') || '[]');
      bookmarks.push(this.currentShabad);
      localStorage.setItem('shabadBookmarks', JSON.stringify(bookmarks));
      this.showNotification('🔖 Shabad bookmarked', 'success');
    }
  }

  openCalendar() {
    this.showNotification('📅 Opening Gurpurab Calendar', 'info');
    console.log('Calendar opened');
  }

  openSehajPaath() {
    this.showSehajModal();
  }

  openReminders() {
    window.location.href = './reminders/smart-reminders.html';
  }

  openNitnemTracker() {
    window.location.href = './NitnemTracker/nitnem-tracker.html';
  }

  openSettings() {
    this.showSettingsModal();
  }

  // Sehaj Paath System
  initSehajProgress() {
    const saved = localStorage.getItem('sehajProgress');
    if (saved) {
      this.sehajProgress = { ...this.sehajProgress, ...JSON.parse(saved) };
    }
  }

  saveSehajProgress() {
    localStorage.setItem('sehajProgress', JSON.stringify(this.sehajProgress));
  }

  updateSehajProgress(pagesRead) {
    this.sehajProgress.completedPages += pagesRead;
    this.sehajProgress.currentPage += pagesRead;
    this.saveSehajProgress();
    this.showSehajProgress();
  }

  showSehajProgress() {
    const progress = (this.sehajProgress.completedPages / this.sehajProgress.totalPages) * 100;
    console.log(`Sehaj Progress: ${progress.toFixed(1)}% (${this.sehajProgress.completedPages}/${this.sehajProgress.totalPages} pages)`);
  }

  // Intelligent Reminders System
  initReminders() {
    const saved = localStorage.getItem('reminders');
    if (saved) {
      this.reminders = { ...this.reminders, ...JSON.parse(saved) };
    }
    this.scheduleReminders();
  }

  saveReminders() {
    localStorage.setItem('reminders', JSON.stringify(this.reminders));
  }

  scheduleReminders() {
    // Schedule reminder notifications
    this.reminders.amritvela.enabled && this.scheduleReminder('amritvela', this.reminders.amritvela.time);
    this.reminders.rehras.enabled && this.scheduleReminder('rehras', this.reminders.rehras.time);
    this.reminders.sohila.enabled && this.scheduleReminder('sohila', this.reminders.sohila.time);
  }

  scheduleReminder(type, time) {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours);
    reminderTime.setMinutes(minutes);
    reminderTime.setSeconds(0);

    // If time has passed today, schedule for tomorrow
    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime - now;
    const hoursUntil = Math.floor(timeUntilReminder / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeUntilReminder % (1000 * 60 * 60)) / (1000 * 60));

    console.log(`${type} reminder scheduled for ${hoursUntil}h ${minutesUntil}m from now`);
  }

  // Notes System
  loadNotes() {
    const saved = localStorage.getItem('userNotes');
    const textarea = document.getElementById('notesTextarea');
    const charCount = document.getElementById('notesCharCount');

    if (saved) {
      textarea.value = saved;
      charCount.textContent = `${saved.length} / 5000`;
    }
  }

  saveNotes() {
    const textarea = document.getElementById('notesTextarea');
    const notes = textarea.value;
    localStorage.setItem('userNotes', notes);
    this.showNotesToast('Notes saved successfully');
  }

  showNotesToast(message) {
    const toast = document.getElementById('notesToast');
    const messageElement = document.getElementById('notesToastMessage');
    messageElement.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // Settings Modal
  showSettingsModal() {
    // Create settings modal if it doesn't exist
    let settingsModal = document.getElementById('settingsModal');
    if (!settingsModal) {
      settingsModal = this.createSettingsModal();
      document.body.appendChild(settingsModal);
    }
    if (typeof settingsModal.showModal === 'function') settingsModal.showModal();
  }

  createSettingsModal() {
    const modal = document.createElement('dialog');
    modal.className = 'modal modal--settings';
    modal.id = 'settingsModal';

    // Load saved settings
    const savedAutoplay = localStorage.getItem('autoplayEnabled') === 'true';
    const savedNotifications = localStorage.getItem('notificationsEnabled') !== 'false';
    const currentTheme = localStorage.getItem('selectedTheme') || 'dark';

    modal.innerHTML = `
      <div class="modal__backdrop" data-close-modal></div>
      <div class="modal__container">
        <div class="modal__glass"></div>
        <header class="modal__header">
          <div class="modal__icon"><i class="fas fa-gear"></i></div>
          <h2 class="modal__title">Settings</h2>
          <button class="modal__close" data-close-modal aria-label="Close modal" type="button">
            <i class="fas fa-xmark"></i>
          </button>
        </header>
        <div class="modal__body">
          <div class="settings-section">
            <h3>Gurdwara Themes</h3>
            <p class="settings-desc">Beautiful backgrounds from sacred Gurdwaras</p>
            <div class="theme-options">
              <button class="theme-btn ${currentTheme === 'dark' || currentTheme === 'darbar-sahib' ? 'active' : ''}" type="button" data-theme="dark">
                <span class="theme-btn__emoji" aria-hidden="true">🪷</span>
                <span class="theme-btn__label">Darbar Sahib</span>
              </button>
              <button class="theme-btn ${currentTheme === 'light' || currentTheme === 'ios' ? 'active' : ''}" type="button" data-theme="light">
                <span class="theme-btn__emoji" aria-hidden="true">☀️</span>
                <span class="theme-btn__label">iOS Light</span>
              </button>
              <button class="theme-btn ${currentTheme === 'bangla-sahib' ? 'active' : ''}" type="button" data-theme="bangla-sahib">
                <span class="theme-btn__emoji" aria-hidden="true">🌙</span>
                <span class="theme-btn__label">Bangla Sahib</span>
              </button>
              <button class="theme-btn ${currentTheme === 'hazur-sahib' || currentTheme === 'blue' ? 'active' : ''}" type="button" data-theme="hazur-sahib">
                <span class="theme-btn__emoji" aria-hidden="true">💠</span>
                <span class="theme-btn__label">Hazur Sahib</span>
              </button>
              <button class="theme-btn ${currentTheme === 'patna-sahib' || currentTheme === 'pink' ? 'active' : ''}" type="button" data-theme="patna-sahib">
                <span class="theme-btn__emoji" aria-hidden="true">🌸</span>
                <span class="theme-btn__label">Patna Sahib</span>
              </button>
              <button class="theme-btn ${currentTheme === 'purple' ? 'active' : ''}" type="button" data-theme="purple">
                <span class="theme-btn__emoji" aria-hidden="true">🟣</span>
                <span class="theme-btn__label">Purple</span>
              </button>
            </div>
          </div>

          <div class="settings-section">
            <h3>Audio</h3>
            <div class="settings-list">
              <label class="settings-row" for="autoplay">
                <span class="settings-row__label">Auto-play on load</span>
                <input type="checkbox" id="autoplay" ${savedAutoplay ? 'checked' : ''}>
              </label>
              <label class="settings-row" for="notifications">
                <span class="settings-row__label">Enable notifications</span>
                <input type="checkbox" id="notifications" ${savedNotifications ? 'checked' : ''}>
              </label>
            </div>
          </div>

          <div class="settings-section">
            <h3>Reminders</h3>
            <div class="settings-list">
              <div class="reminder-row">
                <div class="reminder-row__left">
                  <span class="reminder-row__label">Amritvela</span>
                  <input type="time" id="amritvelaTime" value="${this.reminders.amritvela.time}">
                </div>
                <button type="button" class="reminder-toggle ${this.reminders.amritvela.enabled ? 'is-on' : ''}" data-reminder="amritvela" aria-pressed="${this.reminders.amritvela.enabled ? 'true' : 'false'}">
                  ${this.reminders.amritvela.enabled ? 'On' : 'Off'}
                </button>
              </div>

              <div class="reminder-row">
                <div class="reminder-row__left">
                  <span class="reminder-row__label">Rehras</span>
                  <input type="time" id="rehrasTime" value="${this.reminders.rehras.time}">
                </div>
                <button type="button" class="reminder-toggle ${this.reminders.rehras.enabled ? 'is-on' : ''}" data-reminder="rehras" aria-pressed="${this.reminders.rehras.enabled ? 'true' : 'false'}">
                  ${this.reminders.rehras.enabled ? 'On' : 'Off'}
                </button>
              </div>

              <div class="reminder-row">
                <div class="reminder-row__left">
                  <span class="reminder-row__label">Sohila</span>
                  <input type="time" id="sohilaTime" value="${this.reminders.sohila.time}">
                </div>
                <button type="button" class="reminder-toggle ${this.reminders.sohila.enabled ? 'is-on' : ''}" data-reminder="sohila" aria-pressed="${this.reminders.sohila.enabled ? 'true' : 'false'}">
                  ${this.reminders.sohila.enabled ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.querySelectorAll('.theme-btn[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        this.setTheme(theme);
      });
    });

    modal.querySelector('#autoplay')?.addEventListener('change', () => this.saveAudioSettings());
    modal.querySelector('#notifications')?.addEventListener('change', () => this.saveAudioSettings());

    modal.querySelector('#amritvelaTime')?.addEventListener('change', (e) => this.updateReminderTime('amritvela', e.target.value));
    modal.querySelector('#rehrasTime')?.addEventListener('change', (e) => this.updateReminderTime('rehras', e.target.value));
    modal.querySelector('#sohilaTime')?.addEventListener('change', (e) => this.updateReminderTime('sohila', e.target.value));

    modal.querySelectorAll('.reminder-toggle[data-reminder]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-reminder');
        this.toggleReminder(type);
      });
    });

    return modal;
  }

  // Save audio settings
  saveAudioSettings() {
    const autoplayCheckbox = document.getElementById('autoplay');
    const notificationsCheckbox = document.getElementById('notifications');

    if (autoplayCheckbox) {
      localStorage.setItem('autoplayEnabled', autoplayCheckbox.checked);
      if (autoplayCheckbox.checked && window.gurbaniRadio?.audioEngine) {
        // If autoplay just enabled and not playing, start
        if (!window.gurbaniRadio.audioEngine.isPlaying) {
          window.gurbaniRadio.audioEngine.play();
        }
      }
    }

    if (notificationsCheckbox) {
      localStorage.setItem('notificationsEnabled', notificationsCheckbox.checked);
      if (notificationsCheckbox.checked) {
        // Request notification permission if enabled
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    }

    this.showNotification('✅ Settings saved', 'success');
  }

  // Update reminder time
  updateReminderTime(type, time) {
    if (this.reminders[type]) {
      this.reminders[type].time = time;
      this.saveReminders();
      this.scheduleReminders();
      this.showNotification(`⏰ ${type} time updated`, 'success');
    }
  }

  showSehajModal() {
    let modal = document.getElementById('sehajModal');
    if (!modal) {
      modal = document.createElement('dialog');
      modal.className = 'modal modal--large';
      modal.id = 'sehajModal';
      modal.innerHTML = `
        <div class="modal__backdrop" data-close-modal></div>
        <div class="modal__container" role="document">
          <div class="modal__glass"></div>
          <header class="modal__header">
            <div class="modal__icon"><i class="fas fa-book-reader"></i></div>
            <h2 class="modal__title">Sehaj Paath</h2>
            <button class="modal__close" data-close-modal aria-label="Close modal" type="button"><i class="fas fa-xmark"></i></button>
          </header>
          <div class="modal__body">
            <div class="settings-section">
              <h3>Progress</h3>
              <p style="color: rgba(255,255,255,0.7); margin: 0 0 12px;">Page <b id="sehajCurrentPage">${this.sehajProgress.currentPage}</b> of <b>${this.sehajProgress.totalPages}</b></p>
              <div style="display:flex; gap:10px;">
                <button class="theme-btn" id="sehajPlus1" type="button">+1 Page</button>
                <button class="theme-btn" id="sehajPlus5" type="button">+5 Pages</button>
              </div>
            </div>
            <div class="settings-section">
              <h3>Plan</h3>
              <div class="theme-options">
                <button class="theme-btn" id="sehaj30" type="button">30 Days</button>
                <button class="theme-btn" id="sehaj60" type="button">60 Days</button>
                <button class="theme-btn" id="sehaj90" type="button">90 Days</button>
                <button class="theme-btn" id="sehajReset" type="button">Reset</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const bind = (id, fn) => {
        const el = modal.querySelector(`#${id}`);
        if (el) el.addEventListener('click', fn);
      };

      const update = () => {
        const el = modal.querySelector('#sehajCurrentPage');
        if (el) el.textContent = `${this.sehajProgress.currentPage}`;
      };

      bind('sehajPlus1', () => { this.updateSehajProgress(1); update(); });
      bind('sehajPlus5', () => { this.updateSehajProgress(5); update(); });
      bind('sehaj30', () => { this.sehajProgress.dailyTarget = Math.ceil(this.sehajProgress.totalPages / 30); this.saveSehajProgress(); this.showNotification('✅ 30-day plan set', 'success'); });
      bind('sehaj60', () => { this.sehajProgress.dailyTarget = Math.ceil(this.sehajProgress.totalPages / 60); this.saveSehajProgress(); this.showNotification('✅ 60-day plan set', 'success'); });
      bind('sehaj90', () => { this.sehajProgress.dailyTarget = Math.ceil(this.sehajProgress.totalPages / 90); this.saveSehajProgress(); this.showNotification('✅ 90-day plan set', 'success'); });
      bind('sehajReset', () => { this.sehajProgress.currentPage = 1; this.sehajProgress.completedPages = 0; this.saveSehajProgress(); update(); this.showNotification('♻️ Sehaj Paath reset', 'info'); });
    }

    if (typeof modal.showModal === 'function') modal.showModal();
  }

  showRemindersModal() {
    window.location.href = '../reminders/smart-reminders.html';
  }

  showNitnemTrackerModal() {
    let modal = document.getElementById('nitnemTrackerModal');
    if (!modal) {
      modal = document.createElement('dialog');
      modal.className = 'modal modal--large';
      modal.id = 'nitnemTrackerModal';
      modal.innerHTML = `
        <div class="modal__backdrop" data-close-modal></div>
        <div class="modal__container" role="document">
          <div class="modal__glass"></div>
          <header class="modal__header">
            <div class="modal__icon"><i class="fas fa-chart-line"></i></div>
            <h2 class="modal__title">Nitnem Tracker</h2>
            <button class="modal__close" data-close-modal aria-label="Close modal" type="button"><i class="fas fa-xmark"></i></button>
          </header>
          <div class="modal__body">
            <div class="settings-section">
              <h3>Today</h3>
              <div style="display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px;">
                <label class="theme-btn" style="display:flex; gap:10px; align-items:center; justify-content:flex-start;">
                  <input type="checkbox" id="ntJapji"> Japji Sahib
                </label>
                <label class="theme-btn" style="display:flex; gap:10px; align-items:center; justify-content:flex-start;">
                  <input type="checkbox" id="ntJaap"> Jaap Sahib
                </label>
                <label class="theme-btn" style="display:flex; gap:10px; align-items:center; justify-content:flex-start;">
                  <input type="checkbox" id="ntTav"> Tav Prasad Savaiye
                </label>
                <label class="theme-btn" style="display:flex; gap:10px; align-items:center; justify-content:flex-start;">
                  <input type="checkbox" id="ntChaupai"> Chaupai Sahib
                </label>
                <label class="theme-btn" style="display:flex; gap:10px; align-items:center; justify-content:flex-start;">
                  <input type="checkbox" id="ntAnand"> Anand Sahib
                </label>
                <label class="theme-btn" style="display:flex; gap:10px; align-items:center; justify-content:flex-start;">
                  <input type="checkbox" id="ntRehras"> Rehras Sahib
                </label>
                <label class="theme-btn" style="display:flex; gap:10px; align-items:center; justify-content:flex-start;">
                  <input type="checkbox" id="ntSohila"> Sohila Sahib
                </label>
              </div>
              <div style="margin-top: 12px; display:flex; gap:10px;">
                <button class="theme-btn" id="ntSave" type="button">Save</button>
                <button class="theme-btn" id="ntReset" type="button">Reset</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const key = 'nitnemTrackerToday';
      const load = () => {
        const saved = JSON.parse(localStorage.getItem(key) || '{}');
        ['Japji', 'Jaap', 'Tav', 'Chaupai', 'Anand', 'Rehras', 'Sohila'].forEach((n) => {
          const el = modal.querySelector(`#nt${n}`);
          if (el) el.checked = !!saved[n];
        });
      };

      const save = () => {
        const data = {};
        ['Japji', 'Jaap', 'Tav', 'Chaupai', 'Anand', 'Rehras', 'Sohila'].forEach((n) => {
          const el = modal.querySelector(`#nt${n}`);
          data[n] = !!el?.checked;
        });
        localStorage.setItem(key, JSON.stringify(data));
        this.showNotification('✅ Nitnem saved', 'success');
      };

      modal.querySelector('#ntSave')?.addEventListener('click', save);
      modal.querySelector('#ntReset')?.addEventListener('click', () => {
        localStorage.setItem(key, JSON.stringify({}));
        load();
        this.showNotification('♻️ Reset', 'info');
      });

      load();
    }

    if (typeof modal.showModal === 'function') modal.showModal();
  }

  copyStationLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.showNotification('🔗 Link copied', 'success');
    }).catch(() => {
      this.showNotification('❌ Unable to copy link', 'error');
    });
  }

  shareTo(platform) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Listen to Gurbani Live Radio');

    const targets = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    };

    const target = targets[platform];
    if (!target) return;
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  requestClearNotes() {
    const overlay = document.getElementById('notesConfirmOverlay');
    if (!overlay) return;
    overlay.classList.add('show');
  }

  clearNotes(skipConfirm = false) {
    const textarea = document.getElementById('notesTextarea');
    if (!textarea) return;
    textarea.value = '';
    localStorage.setItem('userNotes', '');
    const charCount = document.getElementById('notesCharCount');
    if (charCount) charCount.textContent = '0 / 5000';
    if (!skipConfirm) this.showNotesToast('Notes cleared');
  }

  downloadNotes() {
    const textarea = document.getElementById('notesTextarea');
    const notes = textarea ? textarea.value : '';
    const blob = new Blob([notes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gurbani-notes.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    this.showNotesToast('Downloaded');
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('selectedTheme', theme);

    // Update page background image based on theme
    const pageBackground = document.querySelector('.page-background');
    if (pageBackground) {
      const themeBackgrounds = {
        'dark': 'assets/darbar-sahib-evening.jpg',
        'darbar-sahib': 'assets/darbar-sahib-evening.jpg',
        'bangla-sahib': 'assets/bangla-sahib.jpg',
        'hazur-sahib': 'assets/hazur-sahib.jpg',
        'blue': 'assets/hazur-sahib.jpg',
        'patna-sahib': 'assets/patna-sahib.jpg',
        'pink': 'assets/patna-sahib.jpg',
        'light': '', // No image for iOS light theme
        'ios': '',
        'purple': '' // Purple uses gradient, no image
      };

      const bgImage = themeBackgrounds[theme];
      if (bgImage) {
        pageBackground.style.backgroundImage = `url('${bgImage}')`;
      } else {
        pageBackground.style.backgroundImage = 'none';
      }
    }

    // Update settings modal button states if it exists
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      settingsModal.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeBtn = settingsModal.querySelector(`.theme-btn[data-theme="${theme}"]`);
      if (activeBtn) activeBtn.classList.add('active');
    }

    // Friendly theme names for notification
    const themeNames = {
      'dark': 'Darbar Sahib',
      'darbar-sahib': 'Darbar Sahib',
      'light': 'iOS Light',
      'ios': 'iOS Light',
      'bangla-sahib': 'Bangla Sahib',
      'hazur-sahib': 'Hazur Sahib',
      'blue': 'Hazur Sahib',
      'patna-sahib': 'Patna Sahib',
      'pink': 'Patna Sahib',
      'purple': 'Purple'
    };

    this.showNotification(`🕌 Theme: ${themeNames[theme] || theme}`, 'success');
  }

  toggleReminder(type) {
    this.reminders[type].enabled = !this.reminders[type].enabled;
    this.saveReminders();
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      const btn = settingsModal.querySelector(`.reminder-toggle[data-reminder="${type}"]`);
      if (btn) {
        const enabled = !!this.reminders[type].enabled;
        btn.classList.toggle('is-on', enabled);
        btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        btn.textContent = enabled ? 'On' : 'Off';
      }
    }
    this.showNotification(`${type} reminder ${this.reminders[type].enabled ? 'enabled' : 'disabled'}`, 'info');
  }

  // Notification System
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
      <div class="notification__content">
        <div class="notification__icon">${this.getNotificationIcon(type)}</div>
        <div class="notification__message">${message}</div>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    return icons[type] || icons.info;
  }

  // UI Update Functions
  updatePlayerUI() {
    const albumArt = document.getElementById('albumArt');
    if (albumArt) {
      if (this.isPlaying) {
        albumArt.classList.add('playing');
      } else {
        albumArt.classList.remove('playing');
      }
    }
  }

  // Data Persistence
  loadSavedData() {
    // Load saved theme and apply with background
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);

    // Apply background image for theme
    const pageBackground = document.querySelector('.page-background');
    if (pageBackground) {
      const themeBackgrounds = {
        'dark': 'assets/darbar-sahib-evening.jpg',
        'darbar-sahib': 'assets/darbar-sahib-evening.jpg',
        'bangla-sahib': 'assets/bangla-sahib.jpg',
        'hazur-sahib': 'assets/hazur-sahib.jpg',
        'blue': 'assets/hazur-sahib.jpg',
        'patna-sahib': 'assets/patna-sahib.jpg',
        'pink': 'assets/patna-sahib.jpg',
        'light': '',
        'ios': '',
        'purple': ''
      };

      const bgImage = themeBackgrounds[savedTheme];
      if (bgImage) {
        pageBackground.style.backgroundImage = `url('${bgImage}')`;
      } else {
        pageBackground.style.backgroundImage = 'none';
      }
    }

    // Load favorite status
    const savedFavorite = localStorage.getItem('isFavorite');
    if (savedFavorite === 'true') {
      this.isFavorite = true;
      this.updateFavoriteUI();
    }

    // Handle autoplay setting
    const autoplayEnabled = localStorage.getItem('autoplayEnabled') === 'true';
    if (autoplayEnabled) {
      // Wait for audio engine to be ready, then start playing
      setTimeout(() => {
        if (window.gurbaniRadio?.audioEngine && !window.gurbaniRadio.audioEngine.isPlaying) {
          window.gurbaniRadio.audioEngine.play();
          console.log('[Autoplay] Starting playback based on saved setting');
        }
      }, 1500); // Wait for audio engine initialization
    }

    // Request notification permission if enabled
    const notificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      // Don't immediately request - wait for user interaction
      document.addEventListener('click', function requestNotificationPermission() {
        Notification.requestPermission();
        document.removeEventListener('click', requestNotificationPermission);
      }, { once: true });
    }
  }

  // Keyboard Shortcuts
  handleKeyboard(e) {
    switch (e.key) {
      case ' ':
        this.togglePlayPause();
        break;
      case 'ArrowLeft':
        this.previousStation();
        break;
      case 'ArrowRight':
        this.nextStation();
        break;
      case 'f':
        this.toggleFavorite();
        break;
      case 's':
        this.openShareModal();
        break;
      case 'Escape':
        this.closeAllModals();
        break;
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      if (modal.close) modal.close();
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.gurbaniEnhancements = new GurbaniRadioEnhancements();
});
