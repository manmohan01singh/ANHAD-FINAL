// pwa-register.js - Complete rewrite
class PWAManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.updateDismissKey = 'pwaUpdateDismissedAt';
    this.updateDismissTtlMs = 6 * 60 * 60 * 1000;
    this.init();
  }

  async init() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './'
      });

      console.log('SW registered:', this.registration.scope);

      // Check if there's already an update waiting
      if (this.registration.waiting) {
        this.showUpdateNotification();
      }

      // Check for updates periodically (every 60 minutes)
      this.checkForUpdates();
      setInterval(() => this.checkForUpdates(), 60 * 60 * 1000);

      // Listen for new service worker
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available - DON'T auto-refresh
            this.showUpdateNotification();
          }
        });
      });

      // Handle controller change (only when user explicitly updates)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (this.userInitiatedUpdate) {
          window.location.reload();
        }
      });

    } catch (error) {
      console.error('SW registration failed:', error);
    }
  }

  checkForUpdates() {
    if (this.registration) {
      this.registration.update().catch(console.error);
    }
  }

  showUpdateNotification() {
    // Don't show if already showing
    if (document.querySelector('.pwa-update-banner')) return;

    try {
      const dismissedAt = Number(localStorage.getItem(this.updateDismissKey) || '0');
      if (dismissedAt && (Date.now() - dismissedAt) < this.updateDismissTtlMs) {
        return;
      }
    } catch (e) {}

    this.updateAvailable = true;

    const banner = document.createElement('div');
    banner.className = 'pwa-update-banner';
    banner.innerHTML = `
      <div class="update-content">
        <span class="update-icon">✨</span>
        <span class="update-text">Update available</span>
      </div>
      <div class="update-actions">
        <button class="btn-update-now" id="pwaUpdateBtn">Update</button>
        <button class="btn-update-later" id="pwaLaterBtn">Later</button>
      </div>
    `;

    document.body.appendChild(banner);

    // Animate in
    requestAnimationFrame(() => {
      banner.classList.add('visible');
    });

    document.getElementById('pwaUpdateBtn').addEventListener('click', () => {
      try {
        localStorage.removeItem(this.updateDismissKey);
      } catch (e) {}
      this.applyUpdate();
    });

    document.getElementById('pwaLaterBtn').addEventListener('click', () => {
      try {
        localStorage.setItem(this.updateDismissKey, String(Date.now()));
      } catch (e) {}
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 300);
    });
  }

  applyUpdate() {
    this.userInitiatedUpdate = true;

    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}

// Initialize on load - NOT on DOMContentLoaded to avoid race conditions
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PWAManager());
} else {
  new PWAManager();
}
