/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD — Royal Daily Hukamnama Sahib Shareable Art Card Generator
 * ═══════════════════════════════════════════════════════════════════════════════
 * Renders high-DPI (1080x1920 Story / 1080x1080 Square) devotional art cards
 * from live Sri Darbar Sahib Daily Hukamnama up to Pauri 1 / Rahaao.
 */

(function(window) {
  'use strict';

  const HukamnamaCardGenerator = {
    isOpen: false,
    isLoading: false,
    currentTheme: 'gold', // 'gold', 'white', 'dark'
    currentFormat: 'story', // 'story' (9:16) or 'square' (1:1)
    hukamData: null,

    init() {
      this._injectDOM();
      this._bindEvents();
    },

    _injectDOM() {
      if (document.getElementById('hukamnamaShareModal')) return;

      const modal = document.createElement('div');
      modal.id = 'hukamnamaShareModal';
      modal.className = 'hukam-share-modal';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="hukam-share-modal__backdrop" id="hukamShareBackdrop"></div>
        <div class="hukam-share-modal__sheet">
          <div class="hukam-share-modal__header">
            <div class="hukam-share-modal__drag-handle"></div>
            <div class="hukam-share-modal__header-content">
              <div class="hukam-share-modal__title-box">
                <span class="hukam-share-modal__eyebrow">✦ GURBANI ART CARD</span>
                <h2 class="hukam-share-modal__title">Daily Hukamnama Sahib</h2>
              </div>
              <button class="hukam-share-modal__close-btn" id="hukamShareCloseBtn" aria-label="Close Share Dialog">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div class="hukam-share-modal__body">
            <!-- Format & Theme Selectors -->
            <div class="hukam-controls-row">
              <div class="hukam-theme-selector">
                <button class="hukam-theme-pill active" data-theme="gold">✨ Royal Gold</button>
                <button class="hukam-theme-pill" data-theme="white">🕊️ Marble White</button>
                <button class="hukam-theme-pill" data-theme="dark">🌌 Velvet Obsidian</button>
              </div>
              <div class="hukam-format-selector">
                <button class="hukam-format-pill active" data-format="story">📱 Story (9:16)</button>
                <button class="hukam-format-pill" data-format="square">🖼️ Square (1:1)</button>
              </div>
            </div>

            <!-- Live Canvas Preview Container with Loader -->
            <div class="hukam-preview-wrapper" id="hukamPreviewWrapper">
              <div class="hukam-loader" id="hukamCardLoader" style="display:none;">
                <div class="hukam-spinner"></div>
                <span>Fetching Today's Sacred Hukamnama...</span>
              </div>
              <canvas id="hukamCanvas" class="hukam-canvas"></canvas>
            </div>

            <!-- Action Buttons -->
            <div class="hukam-share-actions">
              <button class="hukam-action-btn hukam-action-btn--primary" id="hukamDownloadBtn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Save HD Image</span>
              </button>
              <button class="hukam-action-btn" id="hukamWebShareBtn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <span>Share Story</span>
              </button>
              <button class="hukam-action-btn hukam-action-btn--copy" id="hukamCopyBtn" title="Copy Gurmukhi">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    },

    _bindEvents() {
      const backdrop = document.getElementById('hukamShareBackdrop');
      const closeBtn = document.getElementById('hukamShareCloseBtn');
      const downloadBtn = document.getElementById('hukamDownloadBtn');
      const shareBtn = document.getElementById('hukamWebShareBtn');
      const copyBtn = document.getElementById('hukamCopyBtn');

      if (backdrop) backdrop.addEventListener('click', () => this.close());
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      // Theme toggle
      const themePills = document.querySelectorAll('.hukam-theme-pill');
      themePills.forEach(pill => {
        pill.addEventListener('click', () => {
          this.currentTheme = pill.getAttribute('data-theme');
          themePills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.renderCard();
        });
      });

      // Format toggle
      const formatPills = document.querySelectorAll('.hukam-format-pill');
      formatPills.forEach(pill => {
        pill.addEventListener('click', () => {
          this.currentFormat = pill.getAttribute('data-format');
          formatPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.renderCard();
        });
      });

      if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadCard());
      if (shareBtn) shareBtn.addEventListener('click', () => this.shareCard());
      if (copyBtn) copyBtn.addEventListener('click', () => this.copyGurmukhi());
    },

    async open(initialData = null) {
      const modal = document.getElementById('hukamnamaShareModal');
      if (!modal) return;
      this.isOpen = true;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      if (initialData && initialData.verses && initialData.verses.length > 0) {
        this.hukamData = this._formatPassedData(initialData);
        this.renderCard();
      } else {
        await this.fetchLiveHukamnama();
      }
    },

    close() {
      const modal = document.getElementById('hukamnamaShareModal');
      if (!modal) return;
      this.isOpen = false;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    },

    async fetchLiveHukamnama() {
      const loader = document.getElementById('hukamCardLoader');
      if (loader) loader.style.display = 'flex';

      try {
        // Check localStorage cache first for instant rendering
        const cached = localStorage.getItem('anhad_today_hukam_full');
        const todayStr = new Date().toISOString().slice(0, 10);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.dateCacheKey === todayStr) {
              this.hukamData = parsed;
              this.renderCard();
              if (loader) loader.style.display = 'none';
              return;
            }
          } catch(e) {}
        }

        // Fetch live from BaniDB
        const response = await fetch('https://api.banidb.com/v2/hukamnamas/today');
        if (!response.ok) throw new Error('BaniDB network error');
        const data = await response.json();

        if (data && data.shabads && data.shabads.length > 0) {
          this.hukamData = this._processBaniDB(data);
          this.hukamData.dateCacheKey = todayStr;
          localStorage.setItem('anhad_today_hukam_full', JSON.stringify(this.hukamData));
        } else {
          this.hukamData = this._getFallbackData();
        }
      } catch (err) {
        console.warn('[HukamnamaCardGenerator] Fetch failed, using local extraction:', err);
        this.hukamData = this._extractFromPage() || this._getFallbackData();
      } finally {
        if (loader) loader.style.display = 'none';
        this.renderCard();
      }
    },

    _processBaniDB(data) {
      const shabad = data.shabads[0];
      const info = shabad.shabadInfo || {};
      const verses = shabad.verses || [];

      // Extract opening title / raag
      let title = '';
      if (verses[0] && verses[0].verse) {
        const firstV = verses[0].verse.unicode || verses[0].verse.gurmukhi || '';
        if (firstV.includes('ਮਹਲਾ') || firstV.includes('ੴ') || firstV.includes('ਸਲੋਕ') || firstV.includes('ਛੰਤ')) {
          title = firstV;
        }
      }
      if (!title && info.raag) {
        title = `${info.raag.unicode || info.raag.english || 'ਰਾਗੁ ਧਨਾਸਰੀ'} • ${info.writer?.english || 'Guru Raam Daas Ji'}`;
      }

      // Collect verses up to Pauri 1 end (॥੧॥) or Rahaao (॥ ਰਹਾਉ ॥)
      const pauriLines = [];
      const englishLines = [];
      let foundEnding = false;

      for (let i = 0; i < verses.length; i++) {
        const v = verses[i];
        const gText = (v.verse?.unicode || v.verse?.gurmukhi || '').trim();
        if (!gText) continue;

        // Skip the standalone Manglacharan if it's separate, but include pauri lines
        if (gText === 'ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ॥' && i === 1) {
          // Keep title clean
        }

        // Get English translation
        let enText = '';
        if (typeof v.translation?.en === 'string') {
          enText = v.translation.en;
        } else if (v.translation?.en) {
          enText = v.translation.en.bdb || v.translation.en.ms || v.translation.en.ssk || Object.values(v.translation.en)[0] || '';
        }

        // Clean out raw @{...} tags if present
        if (enText && typeof enText === 'string') {
          enText = enText.replace(/^@\{.*=\s*/, '').replace(/\}$/, '').trim();
        }

        // Only add non-header verses to the main body
        if (i > 0 || (!gText.includes('ਮਹਲਾ') && !gText.includes('ਘਰੁ'))) {
          pauriLines.push(gText);
          if (enText) englishLines.push(enText);
        }

        // Check if we reached Rahaao or Pauri 1 end (॥੧॥ or ॥ ਰਹਾਉ ॥)
        if (gText.includes('॥੧॥') || gText.includes('॥ ਰਹਾਉ ॥') || gText.includes('॥੧॥ ਰਹਾਉ ॥')) {
          foundEnding = true;
          break;
        }

        // Limit to max 6 lines for visual perfection on art card
        if (pauriLines.length >= 6) break;
      }

      return {
        title: title || 'ਸ੍ਰੀ ਮੁਖਵਾਕ • ਸ੍ਰੀ ਦਰਬਾਰ ਸਾਹਿਬ',
        writer: info.writer?.english || 'Sri Guru Granth Sahib Ji',
        ang: `Ang ${info.pageNo || 690} • Sri Darbar Sahib`,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        gurmukhiLines: pauriLines.length > 0 ? pauriLines : [verses[0]?.verse?.unicode || 'ਹਰਿ ਜੀਉ ਕ੍ਰਿਪਾ ਕਰੇ ਤਾ ਨਾਮੁ ਧਿਆਈਐ ਜੀਉ ॥੧॥'],
        englishTranslation: englishLines.slice(0, 3).join(' ') || 'When the Dear Lord grants His Grace, one meditates on the Naam, the Name of the Lord.'
      };
    },

    _formatPassedData(data) {
      const verses = data.verses || [];
      const pauriLines = [];
      const englishLines = [];

      for (let i = 0; i < verses.length; i++) {
        const v = verses[i];
        const gText = (v.gurmukhi || '').trim();
        const enText = (v.english || '').trim();

        if (gText) pauriLines.push(gText);
        if (enText) englishLines.push(enText);

        if (gText.includes('॥੧॥') || gText.includes('॥ ਰਹਾਉ ॥') || pauriLines.length >= 6) {
          break;
        }
      }

      return {
        title: data.title || data.raag || 'ਸ੍ਰੀ ਮੁਖਵਾਕ',
        writer: data.writer || 'Sri Guru Granth Sahib Ji',
        ang: data.ang ? (data.ang.startsWith('Ang') ? data.ang : `Ang ${data.ang} • Sri Darbar Sahib`) : 'Ang 690 • Sri Darbar Sahib',
        date: data.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        gurmukhiLines: pauriLines,
        englishTranslation: englishLines.slice(0, 3).join(' ')
      };
    },

    _extractFromPage() {
      const versesOnPage = document.querySelectorAll('.verse-gurmukhi, .verse-text, .daily-hukamnama__verse');
      if (versesOnPage.length === 0) return null;

      const lines = [];
      versesOnPage.forEach((el, idx) => {
        if (idx < 6) lines.push(el.textContent.trim());
      });

      return {
        title: document.getElementById('metaRaag')?.textContent || 'ਸ੍ਰੀ ਮੁਖਵਾਕ',
        writer: document.getElementById('metaWriter')?.textContent || 'Sri Guru Granth Sahib Ji',
        ang: document.getElementById('metaAng') ? `Ang ${document.getElementById('metaAng').textContent} • Sri Darbar Sahib` : 'Ang 690 • Sri Darbar Sahib',
        date: document.getElementById('metaDate')?.textContent || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        gurmukhiLines: lines,
        englishTranslation: document.querySelector('.verse-english')?.textContent || ''
      };
    },

    _getFallbackData() {
      return {
        title: 'ਧਨਾਸਰੀ ਛੰਤ ਮਹਲਾ ੪ ਘਰੁ ੧',
        writer: 'Guru Raam Daas Ji',
        ang: 'Ang 690 • Sri Darbar Sahib',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        gurmukhiLines: [
          'ਹਰਿ ਜੀਉ ਕ੍ਰਿਪਾ ਕਰੇ ਤਾ ਨਾਮੁ ਧਿਆਈਐ ਜੀਉ ॥',
          'ਸਤਿਗੁਰੁ ਮਿਲੈ ਸੁਭਾਇ ਸਹਜਿ ਗੁਣ ਗਾਈਐ ਜੀਉ ॥',
          'ਗੁਣ ਗਾਇ ਵਿਗਸੈ ਸਦਾ ਅਨਦਿਨੁ ਜਾ ਆਪਿ ਸਾਚੇ ਭਾਵਏ ॥',
          'ਅਹੰਕਾਰੁ ਹਉਮੈ ਤਜੈ ਮਾਇਆ ਸਹਜਿ ਨਾਮਿ ਸਮਾਵਏ ॥',
          'ਆਪਿ ਕਰਤਾ ਕਰੇ ਸੋਈ ਆਪਿ ਦੇਇ ਤ ਪਾਈਐ ॥',
          'ਹਰਿ ਜੀਉ ਕ੍ਰਿਪਾ ਕਰੇ ਤਾ ਨਾਮੁ ਧਿਆਈਐ ਜੀਉ ॥੧॥'
        ],
        englishTranslation: 'When the Dear Lord grants His Grace, one meditates on the Naam, the Name of the Lord. Meeting the True Guru, through loving faith and devotion, one intuitively sings the Glorious Praises of the Lord.'
      };
    },

    renderCard() {
      const canvas = document.getElementById('hukamCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const isStory = this.currentFormat === 'story';
      const width = 1080;
      const height = isStory ? 1920 : 1080;
      canvas.width = width;
      canvas.height = height;

      const data = this.hukamData || this._getFallbackData();
      const theme = this.currentTheme;

      // -- 1. PALETTE DEFINITIONS --
      let bgGrad, borderColor, borderInnerColor, ikColor, eyebrowColor, dateColor, titleColor, gurmukhiColor, engColor, brandColor;

      if (theme === 'gold') {
        // Royal Sandhya Gold
        bgGrad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width * 0.9);
        bgGrad.addColorStop(0, '#FFFDF5');
        bgGrad.addColorStop(0.45, '#FFF2D6');
        bgGrad.addColorStop(1, '#F7D99A');

        borderColor = 'rgba(184, 120, 30, 0.6)';
        borderInnerColor = 'rgba(184, 120, 30, 0.3)';
        ikColor = '#BD6E09';
        eyebrowColor = '#9E5B06';
        dateColor = '#7A5025';
        titleColor = '#8A4700';
        gurmukhiColor = '#1A1410';
        engColor = '#4A3B2C';
        brandColor = '#9A5A05';
      } else if (theme === 'white') {
        // Darbar Sahib Marble Ivory
        bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#FFFFFF');
        bgGrad.addColorStop(0.5, '#FAF8F5');
        bgGrad.addColorStop(1, '#EDE7DF');

        borderColor = 'rgba(196, 142, 60, 0.55)';
        borderInnerColor = 'rgba(196, 142, 60, 0.25)';
        ikColor = '#C47510';
        eyebrowColor = '#8C5818';
        dateColor = '#6A5A4A';
        titleColor = '#523412';
        gurmukhiColor = '#1E1D22';
        engColor = '#45424D';
        brandColor = '#7A5025';
      } else {
        // Velvet Obsidian 24K Gold
        bgGrad = ctx.createRadialGradient(width / 2, height * 0.4, 50, width / 2, height / 2, width * 0.9);
        bgGrad.addColorStop(0, '#221E2C');
        bgGrad.addColorStop(0.5, '#131118');
        bgGrad.addColorStop(1, '#08070B');

        borderColor = 'rgba(230, 149, 38, 0.7)';
        borderInnerColor = 'rgba(230, 149, 38, 0.35)';
        ikColor = '#F7C634';
        eyebrowColor = '#F5C542';
        dateColor = 'rgba(255, 255, 255, 0.7)';
        titleColor = '#FFE8A3';
        gurmukhiColor = '#FFFFFF';
        engColor = 'rgba(255, 255, 255, 0.85)';
        brandColor = '#F7C634';
      }

      // Draw Background
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // -- 2. ROYAL MULTI-STOP GOLD BORDERS --
      const m = isStory ? 54 : 40;
      ctx.lineWidth = 3;
      ctx.strokeStyle = borderColor;
      ctx.strokeRect(m, m, width - (m * 2), height - (m * 2));

      ctx.lineWidth = 1;
      ctx.strokeStyle = borderInnerColor;
      ctx.strokeRect(m + 10, m + 10, width - (m * 2) - 20, height - (m * 2) - 20);

      // Decorative Corner Medallions
      const corners = [[m, m], [width - m, m], [m, height - m], [width - m, height - m]];
      corners.forEach(([cx, cy]) => {
        ctx.fillStyle = ikColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.stroke();
      });

      // -- 3. SACRED IK ONKAR EMBLEM --
      ctx.textAlign = 'center';
      const ikY = isStory ? 175 : 125;
      ctx.fillStyle = ikColor;
      ctx.font = isStory ? 'bold 64px "Noto Sans Gurmukhi", serif' : 'bold 50px "Noto Sans Gurmukhi", serif';
      ctx.fillText('ੴ', width / 2, ikY);

      // -- 4. HEADER TAGS --
      const eyebrowY = isStory ? 235 : 170;
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.letterSpacing = '3.5px';
      ctx.fillStyle = eyebrowColor;
      ctx.fillText('✦ DAILY HUKAMNAMA SAHIB ✦', width / 2, eyebrowY);

      // Date & Ang
      const dateY = isStory ? 280 : 205;
      ctx.font = '600 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.letterSpacing = '0.5px';
      ctx.fillStyle = dateColor;
      ctx.fillText(`${data.date}  •  ${data.ang}`, width / 2, dateY);

      // Divider Line
      const divY = isStory ? 315 : 230;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 160, divY);
      ctx.lineTo(width / 2 + 160, divY);
      ctx.stroke();

      // -- 5. TITLE / RAAG HEADING --
      const titleY = isStory ? 385 : 285;
      ctx.fillStyle = titleColor;
      ctx.font = isStory ? 'bold 36px "Noto Sans Gurmukhi", sans-serif' : 'bold 30px "Noto Sans Gurmukhi", sans-serif';
      ctx.letterSpacing = '0px';
      ctx.fillText(data.title, width / 2, titleY);

      // -- 6. SACRED GURMUKHI VERSES (UP TO PAURI 1 / RAHAAO) --
      ctx.fillStyle = gurmukhiColor;
      const gFontSize = isStory ? (data.gurmukhiLines.length > 4 ? 36 : 42) : (data.gurmukhiLines.length > 4 ? 26 : 30);
      const gLineHeight = isStory ? (data.gurmukhiLines.length > 4 ? 58 : 68) : (data.gurmukhiLines.length > 4 ? 42 : 48);
      ctx.font = `bold ${gFontSize}px "Noto Sans Gurmukhi", "RiyastiHastlikhat", serif`;

      let currentY = isStory ? 470 : 345;
      const maxTextW = width - (m * 2) - 100;

      data.gurmukhiLines.forEach(line => {
        const wrapped = this._wrapText(ctx, line, maxTextW);
        wrapped.forEach(wLine => {
          ctx.fillText(wLine, width / 2, currentY);
          currentY += gLineHeight;
        });
      });

      // -- 7. SEPARATOR ORNAMENT --
      currentY += isStory ? 20 : 10;
      ctx.fillStyle = ikColor;
      ctx.font = '22px sans-serif';
      ctx.fillText('❖  ੴ  ❖', width / 2, currentY);
      currentY += isStory ? 45 : 30;

      // -- 8. ENGLISH TRANSLATION SUMMARY --
      ctx.fillStyle = engColor;
      const engFontSize = isStory ? 26 : 20;
      const engLineHeight = isStory ? 38 : 28;
      ctx.font = `italic ${engFontSize}px Georgia, "Times New Roman", serif`;

      const engLines = this._wrapText(ctx, data.englishTranslation, maxTextW - 40);
      const maxEngLines = isStory ? 4 : 2;
      engLines.slice(0, maxEngLines).forEach(eLine => {
        ctx.fillText(eLine, width / 2, currentY);
        currentY += engLineHeight;
      });

      // -- 9. FOOTER BRANDING --
      const footY = height - (isStory ? 95 : 65);
      ctx.strokeStyle = borderInnerColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 120, footY - 26);
      ctx.lineTo(width / 2 + 120, footY - 26);
      ctx.stroke();

      ctx.fillStyle = brandColor;
      ctx.font = 'bold 24px sans-serif';
      ctx.letterSpacing = '1.5px';
      ctx.fillText('ANHAD • ਅਨਹਦ', width / 2, footY);

      if (isStory) {
        ctx.font = '500 18px sans-serif';
        ctx.letterSpacing = '0.5px';
        ctx.fillStyle = dateColor;
        ctx.fillText('Gurbani Audio, Nitnem & Meditation', width / 2, footY + 28);
      }
    },

    _wrapText(ctx, text, maxWidth) {
      if (!text) return [];
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + ' ' + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width < maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    },

    downloadCard() {
      const canvas = document.getElementById('hukamCanvas');
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `ANHAD_Hukamnama_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png', 0.95);
      link.click();
      this._showToast('✨ HD Art Card saved to your photos');
    },

    async shareCard() {
      const canvas = document.getElementById('hukamCanvas');
      if (!canvas) return;

      try {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], 'ANHAD_Daily_Hukamnama.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Daily Hukamnama Sahib — ANHAD',
              text: "Today's Sacred Hukamnama Sahib from Sri Darbar Sahib (ANHAD Gurbani)",
              files: [file]
            });
          } else {
            this.downloadCard();
          }
        }, 'image/png', 0.95);
      } catch (e) {
        this.downloadCard();
      }
    },

    async copyGurmukhi() {
      if (!this.hukamData) return;
      const gurmukhiText = `${this.hukamData.title}\n\n${this.hukamData.gurmukhiLines.join('\n')}\n\n${this.hukamData.englishTranslation}\n\n— ${this.hukamData.ang} (${this.hukamData.date})\nShared via ANHAD App`;

      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(gurmukhiText);
          this._showToast('📋 Hukamnama copied to clipboard');
        }
      } catch (e) {
        this._showToast('📋 Copied');
      }
    },

    _showToast(msg) {
      const existing = document.querySelector('.anhad-hukam-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.className = 'anhad-hukam-toast';
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('visible'), 20);
      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
      }, 2500);
    }
  };

  window.AnhadHukamnamaCardGenerator = HukamnamaCardGenerator;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HukamnamaCardGenerator.init());
  } else {
    HukamnamaCardGenerator.init();
  }
})(window);
