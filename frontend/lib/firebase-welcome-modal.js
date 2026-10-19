/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD FIREBASE AUTH & WELCOME MODAL
 * ═══════════════════════════════════════════════════════════════════════════════
 * Displays an elegant, Apple-grade frosted glass authentication modal on app open:
 * - Direct Google Firebase Sign-In to protect Nitnem streaks & Sehaj Paath
 * - Frictionless "Continue as Guest" fallback
 * - Automatic cloud backup detection & 1-tap restoration
 */

(function(window) {
  'use strict';

  if (window.AnhadAuthModal) return;

  const GUEST_DISMISSED_KEY = 'anhad_auth_guest_dismissed';

  function injectStyles() {
    if (document.getElementById('anhad-auth-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'anhad-auth-modal-styles';
    style.textContent = `
      .anhad-auth-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      .anhad-auth-modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }
      .anhad-auth-card {
        background: rgba(28, 28, 30, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15);
        border-radius: 28px;
        width: 100%;
        max-width: 420px;
        padding: 32px 28px 24px;
        text-align: center;
        color: #F5F5F7;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        transform: scale(0.95) translateY(10px);
        transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
      }
      [data-theme="light"] .anhad-auth-card {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(0, 0, 0, 0.08);
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.8);
        color: #1C1C1E;
      }
      .anhad-auth-modal-overlay.active .anhad-auth-card {
        transform: scale(1) translateY(0);
      }
      .anhad-auth-glow {
        position: absolute;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        width: 180px;
        height: 180px;
        background: radial-gradient(circle, rgba(212, 148, 58, 0.4) 0%, rgba(212, 148, 58, 0) 70%);
        pointer-events: none;
      }
      .anhad-auth-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 16px;
        background: linear-gradient(135deg, #FFD60A, #D4943A);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        box-shadow: 0 8px 24px rgba(212, 148, 58, 0.35);
      }
      .anhad-auth-title {
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-bottom: 8px;
        line-height: 1.25;
      }
      .anhad-auth-subtitle {
        font-size: 14px;
        color: #8E8E93;
        line-height: 1.5;
        margin-bottom: 24px;
        padding: 0 8px;
      }
      [data-theme="light"] .anhad-auth-subtitle {
        color: #636366;
      }
      .anhad-auth-benefits {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 14px 16px;
        margin-bottom: 24px;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      [data-theme="light"] .anhad-auth-benefits {
        background: rgba(0, 0, 0, 0.03);
        border: 1px solid rgba(0, 0, 0, 0.06);
      }
      .anhad-auth-benefit-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 13px;
        font-weight: 500;
      }
      .anhad-auth-benefit-icon {
        font-size: 16px;
        width: 20px;
        text-align: center;
      }
      .anhad-btn-google {
        width: 100%;
        padding: 15px;
        border-radius: 16px;
        border: none;
        background: #FFFFFF;
        color: #1F1F1F;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .anhad-btn-google:active {
        transform: scale(0.98);
      }
      .anhad-btn-guest {
        width: 100%;
        padding: 14px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: transparent;
        color: #AEAEB2;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 10px;
        transition: background 0.15s ease, color 0.15s ease;
      }
      [data-theme="light"] .anhad-btn-guest {
        border-color: rgba(0, 0, 0, 0.1);
        color: #636366;
      }
      .anhad-btn-guest:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #F5F5F7;
      }
      .anhad-auth-footnote {
        font-size: 11px;
        color: #636366;
        margin-top: 16px;
      }
    `;
    document.head.appendChild(style);
  }

  function createModal() {
    injectStyles();

    let overlay = document.getElementById('anhadAuthWelcomeOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'anhadAuthWelcomeOverlay';
    overlay.className = 'anhad-auth-modal-overlay';

    overlay.innerHTML = `
      <div class="anhad-auth-card" role="dialog" aria-modal="true">
        <div class="anhad-auth-glow"></div>
        <div class="anhad-auth-icon">ੴ</div>
        <h2 class="anhad-auth-title">Protect Your Devotions</h2>
        <p class="anhad-auth-subtitle">
          Connect your Google account to automatically back up your Nitnem streaks & Sehaj Paath in the cloud.
        </p>

        <div class="anhad-auth-benefits">
          <div class="anhad-auth-benefit-item">
            <span class="anhad-auth-benefit-icon">☁️</span>
            <span>Automatic Firebase Cloud Sync & Safe Backups</span>
          </div>
          <div class="anhad-auth-benefit-item">
            <span class="anhad-auth-benefit-icon">🔥</span>
            <span>Never lose your Nitnem streaks if you change phones</span>
          </div>
          <div class="anhad-auth-benefit-item">
            <span class="anhad-auth-benefit-icon">📖</span>
            <span>Sync Sehaj Paath & Naam Abhyas across devices</span>
          </div>
        </div>

        <button class="anhad-btn-google" id="anhadModalGoogleBtn">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span id="anhadModalGoogleBtnText">Sign in with Google</span>
        </button>

        <button class="anhad-btn-guest" id="anhadModalGuestBtn">
          Continue as Guest
        </button>

        <div style="margin-top: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <button class="anhad-btn-transfer" id="anhadModalTransferBtn" style="background: none; border: none; color: #D4943A; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 4px 8px;">
            🔑 Have a Transfer Code? Restore on this Phone
          </button>
        </div>

        <div class="anhad-auth-footnote">
          🔒 Private & secure. You can connect anytime later from Settings.
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const googleBtn = document.getElementById('anhadModalGoogleBtn');
    const guestBtn = document.getElementById('anhadModalGuestBtn');
    const transferBtn = document.getElementById('anhadModalTransferBtn');

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        const textSpan = document.getElementById('anhadModalGoogleBtnText');
        if (textSpan) textSpan.textContent = 'Connecting...';
        googleBtn.disabled = true;

        try {
          let res = null;
          if (window.AnhadAuth && typeof window.AnhadAuth.signInWithGoogle === 'function') {
            res = await window.AnhadAuth.signInWithGoogle();
          } else if (window.AnhadFirebase && typeof window.AnhadFirebase.signInWithGoogle === 'function') {
            res = await window.AnhadFirebase.signInWithGoogle();
          }

          if (res && res.pendingRedirect) {
            return;
          }

          // Automatic fallback to redirect if popup is blocked
          if (res && res.canUseRedirect) {
            if (window.AnhadFirebase && typeof window.AnhadFirebase.signInWithGoogleRedirect === 'function') {
              showToast('Redirecting to Google Sign-In...');
              await window.AnhadFirebase.signInWithGoogleRedirect();
              return;
            }
          }

          if (res && res.ok) {
            closeModal();
            // Trigger cloud restore or backup
            if (window.AnhadCloudSync && typeof window.AnhadCloudSync.restoreFromCloud === 'function') {
              const restoreRes = await window.AnhadCloudSync.restoreFromCloud();
              if (restoreRes && restoreRes.ok) {
                showToast(`🎉 Restored ${restoreRes.summary?.currentStreak || 0}-day streak! 🙏`);
              } else {
                window.AnhadCloudSync.backupNow();
                showToast('✅ Account connected & backed up to Cloud! 🙏');
              }
            }
          } else {
            const err = (res && res.error) || 'Sign-in could not be completed';
            showToast('⚠️ ' + err);
            if (textSpan) textSpan.textContent = 'Sign in with Google';
            googleBtn.disabled = false;
          }
        } catch (e) {
          showToast('⚠️ Error: ' + e.message);
          if (textSpan) textSpan.textContent = 'Sign in with Google';
          googleBtn.disabled = false;
        }
      });
    }

    if (guestBtn) {
      guestBtn.addEventListener('click', () => {
        localStorage.setItem(GUEST_DISMISSED_KEY, 'true');
        if (window.AnhadAuth && typeof window.AnhadAuth.getProfile === 'function') {
          window.AnhadAuth.getProfile();
        }
        if (window.AnhadCloudSync) {
          window.AnhadCloudSync.backupNow();
        }
        closeModal();
        showToast('Continuing as Guest. Your progress is auto-saved. 🙏');
      });
    }

    if (transferBtn) {
      transferBtn.addEventListener('click', async () => {
        const code = prompt('Enter your 8-character Transfer Sync Code (e.g. ANHAD-A7K9) from your previous device:');
        if (!code || !code.trim()) return;
        transferBtn.textContent = 'Restoring...';
        transferBtn.disabled = true;
        try {
          if (!window.AnhadCloudSync) throw new Error('Cloud Sync engine loading');
          const res = await window.AnhadCloudSync.restoreByCode(code.trim());
          if (res && res.ok) {
            localStorage.setItem(GUEST_DISMISSED_KEY, 'true');
            closeModal();
            showToast(`🎉 Restored ${res.summary?.currentStreak || 0}-day streak & Sehaj Paath! 🙏`);
            setTimeout(() => window.location.reload(), 1200);
          } else {
            alert('Restore failed: ' + (res?.error || 'Invalid or expired transfer code.'));
            transferBtn.textContent = '🔑 Have a Transfer Code? Restore on this Phone';
            transferBtn.disabled = false;
          }
        } catch(e) {
          alert('Restore error: ' + e.message);
          transferBtn.textContent = '🔑 Have a Transfer Code? Restore on this Phone';
          transferBtn.disabled = false;
        }
      });
    }

    return overlay;
  }

  function openModal(force = false) {
    // If not forced, check if user is already authenticated or dismissed
    if (!force) {
      const storedProfile = (function() {
        try { return JSON.parse(localStorage.getItem('anhad_user_profile')); } catch(e) { return null; }
      })();
      if (storedProfile && !storedProfile.isAnonymous && !storedProfile.isGuest && storedProfile.uid) {
        return;
      }
      if (window.AnhadAuth && typeof window.AnhadAuth.isAuthenticated === 'function' && window.AnhadAuth.isAuthenticated()) {
        return;
      }
      if (localStorage.getItem(GUEST_DISMISSED_KEY) === 'true') {
        return;
      }
    }

    const overlay = createModal();
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }

  function closeModal() {
    const overlay = document.getElementById('anhadAuthWelcomeOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
      }, 350);
    }
  }

  function showToast(msg) {
    const existing = document.getElementById('anhadGlobalAuthToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'anhadGlobalAuthToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 84px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(28, 28, 30, 0.94);
      color: #FFFFFF;
      padding: 12px 20px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 600;
      z-index: 1000000;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.15);
      animation: anhadToastIn 0.3s cubic-bezier(0.16,1,0.3,1);
      text-align: center;
      max-width: 90vw;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 4000);
  }

  // Auto-prompt on load after slight delay (1.2s) if user hasn't made a choice
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => openModal(false), 1200);
    });
  } else {
    setTimeout(() => openModal(false), 1200);
  }

  window.AnhadAuthModal = {
    open: (force) => openModal(force),
    close: closeModal,
    showToast
  };

})(typeof window !== 'undefined' ? window : globalThis);
