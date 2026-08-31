/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD — Divine Daily Hukamnama Shareable Art Card Generator
 * ═══════════════════════════════════════════════════════════════════════════════
 * High-DPI HTML5 Canvas rendering engine for creating aesthetic 9:16 story
 * and 1:1 square devotional image cards for WhatsApp, Instagram & reflection.
 */

(function(window) {
  'use strict';

  const HukamnamaCardGenerator = {
    isOpen: false,
    currentTheme: 'gold', // 'gold', 'white', 'dark'
    currentFormat: 'story', // 'story' (9:16), 'square' (1:1)

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
                <h2 class="hukam-share-modal__title">Share Hukamnama</h2>
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
                <button class="hukam-theme-pill active" data-theme="gold">✨ Sandhya Gold</button>
                <button class="hukam-theme-pill" data-theme="white">🕊️ Ivory Marble</button>
                <button class="hukam-theme-pill" data-theme="dark">🌌 Velvet Night</button>
              </div>
            </div>

            <!-- Live Canvas Preview Container -->
            <div class="hukam-preview-wrapper">
              <canvas id="hukamCanvas" class="hukam-canvas"></canvas>
            </div>

            <!-- Action Buttons -->
            <div class="hukam-share-actions">
              <button class="hukam-action-btn hukam-action-btn--primary" id="hukamDownloadBtn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Save Card (HD)</span>
              </button>
              <button class="hukam-action-btn" id="hukamWebShareBtn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <span>Share Story</span>
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    },

    _bindEvents() {
      const modal = document.getElementById('hukamnamaShareModal');
      const backdrop = document.getElementById('hukamShareBackdrop');
      const closeBtn = document.getElementById('hukamShareCloseBtn');
      const downloadBtn = document.getElementById('hukamDownloadBtn');
      const shareBtn = document.getElementById('hukamWebShareBtn');

      if (backdrop) backdrop.addEventListener('click', () => this.close());
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      const themePills = document.querySelectorAll('.hukam-theme-pill');
      themePills.forEach(pill => {
        pill.addEventListener('click', () => {
          this.currentTheme = pill.getAttribute('data-theme');
          themePills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.renderCard();
        });
      });

      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => this.downloadCard());
      }

      if (shareBtn) {
        shareBtn.addEventListener('click', () => this.shareCard());
      }
    },

    open(hukamData = null) {
      this.hukamData = hukamData || this._extractCurrentHukam();
      const modal = document.getElementById('hukamnamaShareModal');
      if (!modal) return;
      this.isOpen = true;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(() => this.renderCard(), 60);
    },

    close() {
      const modal = document.getElementById('hukamnamaShareModal');
      if (!modal) return;
      this.isOpen = false;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    },

    _extractCurrentHukam() {
      // Extract from DOM if on Hukamnama page or fallback to inspiring divine shabad
      const titleEl = document.querySelector('.hukamnama-title, #hukamTitle, .daily-hukamnama__title');
      const gurmukhiEl = document.querySelector('.hukamnama-gurmukhi, #hukamGurmukhi, .daily-hukamnama__gurmukhi');
      const englishEl = document.querySelector('.hukamnama-english, #hukamEnglish, .daily-hukamnama__english');
      const angEl = document.querySelector('.hukamnama-ang, #hukamAng');

      return {
        title: titleEl ? titleEl.textContent.trim() : 'ਸੋਰਠਿ ਮਹਲਾ ੫ ॥',
        gurmukhi: gurmukhiEl ? gurmukhiEl.textContent.trim() : 'ਗੁਰ ਪੂਰੇ ਚਰਨੀ ਲਾਇਆ ॥ ਹਰਿ ਸੰਗਿ ਸਹਾਈ ਪਾਇਆ ॥\nਜਹ ਜਾਈਐ ਤਹਾ ਸੁਹੇਲੇ ॥ ਕਰਿ ਕਿਰਪਾ ਪ੍ਰਭਿ ਮੇਲੇ ॥੧॥',
        english: englishEl ? englishEl.textContent.trim() : 'The Perfect Guru has attached me to His feet. The Lord has become my companion and helper.',
        ang: angEl ? angEl.textContent.trim() : 'Ang 621 • Sri Darbar Sahib',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      };
    },

    renderCard() {
      const canvas = document.getElementById('hukamCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // High-resolution Canvas (1080x1920 for Story 9:16)
      const width = 1080;
      const height = 1920;
      canvas.width = width;
      canvas.height = height;

      const data = this.hukamData || this._extractCurrentHukam();

      // 1. Draw Background
      if (this.currentTheme === 'gold') {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#FFFBF0');
        bgGrad.addColorStop(0.35, '#FFF2D6');
        bgGrad.addColorStop(1, '#FDE3B2');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (this.currentTheme === 'white') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#FFFFFF');
        bgGrad.addColorStop(1, '#F4EFEA');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Dark velvet obsidian
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#1C1924');
        bgGrad.addColorStop(0.5, '#121018');
        bgGrad.addColorStop(1, '#0A080E');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Decorative Double Gold Border
      const margin = 60;
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.currentTheme === 'dark' ? 'rgba(212, 148, 58, 0.6)' : 'rgba(184, 120, 30, 0.45)';
      ctx.strokeRect(margin, margin, width - (margin * 2), height - (margin * 2));

      ctx.lineWidth = 1;
      ctx.strokeStyle = this.currentTheme === 'dark' ? 'rgba(212, 148, 58, 0.3)' : 'rgba(184, 120, 30, 0.25)';
      ctx.strokeRect(margin + 12, margin + 12, width - (margin * 2) - 24, height - (margin * 2) - 24);

      // Corner Accents
      const cornerSize = 40;
      ctx.fillStyle = this.currentTheme === 'dark' ? '#F7C634' : '#C47510';
      [[margin, margin], [width - margin, margin], [margin, height - margin], [width - margin, height - margin]].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Ik Onkar Header Watermark
      ctx.textAlign = 'center';
      ctx.fillStyle = this.currentTheme === 'dark' ? '#F7C634' : '#C47510';
      ctx.font = 'bold 74px serif';
      ctx.fillText('ੴ', width / 2, 220);

      // 4. Header Tag
      ctx.font = 'bold 30px sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillStyle = this.currentTheme === 'dark' ? 'rgba(247, 198, 52, 0.85)' : '#9A5A05';
      ctx.fillText('✦ DAILY HUKAMNAMA SAHIB ✦', width / 2, 300);

      // 5. Date & Ang Pill
      ctx.font = '600 28px sans-serif';
      ctx.fillStyle = this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#6D5338';
      ctx.fillText(`${data.date}  •  ${data.ang}`, width / 2, 360);

      // Center Divider line
      ctx.strokeStyle = this.currentTheme === 'dark' ? 'rgba(212, 148, 58, 0.4)' : 'rgba(184, 120, 30, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 140, 410);
      ctx.lineTo(width / 2 + 140, 410);
      ctx.stroke();

      // 6. Title / Raag
      ctx.fillStyle = this.currentTheme === 'dark' ? '#FDE6A6' : '#8A4700';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(data.title, width / 2, 500);

      // 7. Gurmukhi Sacred Text (Multi-line wrap)
      ctx.fillStyle = this.currentTheme === 'dark' ? '#FFFFFF' : '#1A171D';
      ctx.font = 'bold 50px serif';
      const gurmukhiLines = this._wrapText(ctx, data.gurmukhi, width - 220);
      let currentY = 600;
      gurmukhiLines.forEach(line => {
        ctx.fillText(line, width / 2, currentY);
        currentY += 76;
      });

      // Decorative center motif
      currentY += 40;
      ctx.fillStyle = this.currentTheme === 'dark' ? '#F7C634' : '#C47510';
      ctx.font = '28px sans-serif';
      ctx.fillText('❖  ❖  ❖', width / 2, currentY);
      currentY += 80;

      // 8. English Translation
      ctx.fillStyle = this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : '#4A3B2C';
      ctx.font = 'italic 34px Georgia, serif';
      const englishLines = this._wrapText(ctx, data.english, width - 260);
      englishLines.forEach(line => {
        ctx.fillText(line, width / 2, currentY);
        currentY += 52;
      });

      // 9. Footer: ANHAD Signature Branding
      const footerY = height - 160;
      ctx.strokeStyle = this.currentTheme === 'dark' ? 'rgba(212, 148, 58, 0.3)' : 'rgba(184, 120, 30, 0.2)';
      ctx.beginPath();
      ctx.moveTo(width / 2 - 100, footerY - 40);
      ctx.lineTo(width / 2 + 100, footerY - 40);
      ctx.stroke();

      ctx.fillStyle = this.currentTheme === 'dark' ? '#F7C634' : '#9A5A05';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('ANHAD • ਅਨਹਦ', width / 2, footerY);

      ctx.font = '500 24px sans-serif';
      ctx.fillStyle = this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)';
      ctx.fillText('Gurbani Audio, Nitnem & Meditation', width / 2, footerY + 40);
    },

    _wrapText(ctx, text, maxWidth) {
      const paragraphs = text.split('\n');
      const lines = [];

      paragraphs.forEach(para => {
        const words = para.split(' ');
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const width = ctx.measureText(currentLine + ' ' + word).width;
          if (width < maxWidth) {
            currentLine += ' ' + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);
      });

      return lines;
    },

    downloadCard() {
      const canvas = document.getElementById('hukamCanvas');
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `ANHAD_Hukamnama_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png', 0.95);
      link.click();
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
              text: 'Today\'s Sacred Hukamnama Sahib from ANHAD Gurbani',
              files: [file]
            });
          } else {
            this.downloadCard();
          }
        }, 'image/png', 0.95);
      } catch (e) {
        this.downloadCard();
      }
    }
  };

  window.AnhadHukamnamaCardGenerator = HukamnamaCardGenerator;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HukamnamaCardGenerator.init());
  } else {
    HukamnamaCardGenerator.init();
  }
})(window);
