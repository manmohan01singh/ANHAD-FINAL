/* PERF FIX: Lightweight drift banner for virtual-live radio streams. */
(function () {
  'use strict';

  if (window.LiveDriftBanner) return;

  const STYLE_ID = 'live-drift-banner-style';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .live-drift-banner {
        display: none;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
        margin: 8px 0 10px;
        padding: 10px 12px;
        border-radius: 16px;
        color: #2b1600;
        background: linear-gradient(135deg, #ffd166 0%, #ff9f1c 100%);
        box-shadow: 0 12px 32px rgba(255, 159, 28, 0.28);
        transform: translateY(8px);
        opacity: 0;
        transition: transform 180ms ease, opacity 180ms ease;
        will-change: transform, opacity;
      }
      .live-drift-banner.is-visible {
        display: flex;
        transform: translateY(0);
        opacity: 1;
      }
      .live-drift-banner__text {
        min-width: 0;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0;
        white-space: nowrap;
      }
      .live-drift-banner__actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .live-drift-banner__jump,
      .live-drift-banner__dismiss {
        border: 0;
        touch-action: manipulation;
        cursor: pointer;
      }
      .live-drift-banner__jump {
        border-radius: 999px;
        padding: 8px 10px;
        background: rgba(43, 22, 0, 0.88);
        color: #fff8e6;
        font-size: 12px;
        font-weight: 800;
      }
      .live-drift-banner__dismiss {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.45);
        color: #2b1600;
        font-size: 18px;
        line-height: 1;
      }
    `;
    document.head.appendChild(style);
  }

  function formatSeconds(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    if (total < 60) return `${total}s`;
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  function mount(container) {
    ensureStyle();
    const parent = container || document.getElementById('player') || document.body;
    if (!parent) return null;

    let banner = document.getElementById('liveDriftBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'liveDriftBanner';
      banner.className = 'live-drift-banner';
      banner.innerHTML = `
        <div class="live-drift-banner__text" id="liveDriftBannerText">You're behind live</div>
        <div class="live-drift-banner__actions">
          <button class="live-drift-banner__jump" id="liveDriftJumpBtn" type="button">Jump to Live</button>
          <button class="live-drift-banner__dismiss" id="liveDriftDismissBtn" type="button" aria-label="Dismiss">×</button>
        </div>
      `;
      const controls = parent.querySelector('.controls');
      if (controls) parent.insertBefore(banner, controls);
      else parent.appendChild(banner);
    }

    let dismissed = false;
    const text = banner.querySelector('#liveDriftBannerText');
    const jump = banner.querySelector('#liveDriftJumpBtn');
    const dismiss = banner.querySelector('#liveDriftDismissBtn');

    function setVisible(show, seconds) {
      if (show && !dismissed) {
        if (text) text.textContent = `You're ${formatSeconds(seconds)} behind live`;
        banner.classList.add('is-visible');
      } else {
        banner.classList.remove('is-visible');
      }
    }

    jump?.addEventListener('click', async () => {
      dismissed = false;
      await window.AnhadAudio?.jumpToLive?.();
      setVisible(false, 0);
    });

    dismiss?.addEventListener('click', () => {
      dismissed = true;
      setVisible(false, 0);
    });

    window.addEventListener('anhadLiveDrift', (event) => {
      const detail = event.detail || {};
      if (detail.isLive) dismissed = false;
      setVisible(detail.driftSeconds > 10, detail.driftSeconds);
    });

    return { banner, setVisible };
  }

  window.LiveDriftBanner = { mount };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mount(), { once: true });
  } else {
    mount();
  }
})();
