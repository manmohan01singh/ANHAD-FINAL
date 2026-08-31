/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD DESKTOP UI FIXES - Critical UX Improvements
 * Fixes for event countdown, Nitnem button labels, and other UI issues
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  // Run-once guard
  if (window.__anhadDesktopUIFixesInit) return;
  window.__anhadDesktopUIFixesInit = true;

  console.log('[Desktop UI Fixes] Initializing...');

  /**
   * Fix #1: Event Countdown Validation
   * Prevents "-- days left" by validating dates before rendering
   */
  const EventCountdownFix = {
    validateEventDate(event) {
      if (!event || !event.date) {
        return { valid: false, reason: 'No event or date' };
      }

      // Parse date safely
      let eventDate;
      try {
        if (typeof event.date === 'string') {
          const [y, m, d] = event.date.split('-').map(Number);
          if (!y || !m || !d) {
            return { valid: false, reason: 'Invalid date format' };
          }
          eventDate = new Date(y, m - 1, d); // Calendar date, not timestamp
        } else if (event.date instanceof Date) {
          eventDate = event.date;
        } else {
          return { valid: false, reason: 'Unknown date type' };
        }

        // Validate date is valid
        if (isNaN(eventDate.getTime())) {
          return { valid: false, reason: 'Invalid Date object' };
        }

        // Validate date is not in distant past (> 1 year ago)
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        if (eventDate < oneYearAgo) {
          return { valid: false, reason: 'Event more than 1 year in past' };
        }

        return { valid: true, date: eventDate };

      } catch (error) {
        console.error('[EventCountdownFix] Date parsing error:', error);
        return { valid: false, reason: error.message };
      }
    },

    calculateDaysLeft(eventDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const event = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      
      const diffTime = event - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    },

    getCountdownText(daysLeft) {
      if (daysLeft === null || isNaN(daysLeft)) {
        return 'Coming Soon';
      }

      if (daysLeft === 0) return 'Today';
      if (daysLeft === 1) return '1 day left';
      if (daysLeft < 0) return 'Past Event';
      
      return `${daysLeft} days left`;
    },

    applyFix() {
      // Find all countdown elements
      const countdownElements = document.querySelectorAll('[data-countdown], .countdown-text, .event-countdown');
      
      countdownElements.forEach(el => {
        const text = el.textContent || el.innerText;
        
        // If showing invalid state, fix it
        if (text.includes('-- days') || text.includes('undefined') || text.includes('NaN')) {
          console.warn('[EventCountdownFix] Found invalid countdown, fixing:', text);
          el.textContent = 'Coming Soon';
          el.classList.add('countdown-fallback');
        }
      });
    }
  };

  /**
   * Fix #2: Nitnem Button Label (Start vs Continue)
   * Shows "Start" when 0/X, "Continue" when progress exists
   */
  const NitnemButtonFix = {
    updateButtonLabel(progress, total) {
      const completed = progress || 0;
      const label = (completed === 0) ? 'Start' : 'Continue';
      
      return {
        label: label,
        fullText: `${label} morning Nitnem`,
        progress: `${completed}/${total}`,
        isStarted: completed > 0
      };
    },

    applyFix() {
      // Find Nitnem card button
      const nitnemButtons = document.querySelectorAll('[data-nitnem-action], .nitnem-cta, #nitnemPractice .practice-card__cta');
      
      nitnemButtons.forEach(btn => {
        const text = btn.textContent || btn.innerText;
        const progressEl = btn.closest('.practice-card')?.querySelector('.practice-card__subtitle');
        
        if (text.includes('Continue') && progressEl) {
          const progressText = progressEl.textContent || '';
          // Check if showing 0/X
          if (progressText.match(/^0\s*\/\s*\d+/)) {
            console.log('[NitnemButtonFix] Fixing button: Continue -> Start for 0 progress');
            btn.textContent = text.replace('Continue', 'Start');
          }
        }
      });
    }
  };

  /**
   * Fix #3: Hukamnama Content Visibility
   * Ensures Hukam content is visible, not hidden by CSS
   */
  const HukamnamaVisibilityFix = {
    applyFix() {
      const hukamCards = document.querySelectorAll('[data-hukam], .hukam-card, #hukamPractice');
      
      hukamCards.forEach(card => {
        const content = card.querySelector('.hukam-content, .hukam-text');
        if (content) {
          // Remove any display:none or visibility:hidden
          content.style.display = '';
          content.style.visibility = '';
          content.style.opacity = '';
          
          // If still empty, show loading state
          if (!content.textContent.trim() || content.textContent.includes('Loading')) {
            content.innerHTML = '<div class="hukam-loading">Loading today\'s Hukamnama...</div>';
          }
        }
      });
    }
  };

  /**
   * Fix #4: Desktop Card Width Constraints
   * Let CSS Grid manage card sizing properly
   */
  const CardWidthFix = {
    applyFix() {
      // Event card optimal width constraint
      const eventCard = document.getElementById('eventCard');
      if (eventCard && window.innerWidth >= 1024) {
        eventCard.style.maxWidth = '640px';
        eventCard.style.marginLeft = 'auto';
        eventCard.style.marginRight = 'auto';
      }
    }
  };

  /**
   * Fix #5: Install Banner Z-Index
   * Ensures install banner doesn't overlap mini-player
   */
  const ZIndexFix = {
    applyFix() {
      const installBanner = document.querySelector('.install-banner, #installBanner');
      const miniPlayer = document.querySelector('.mini-player');
      
      if (installBanner) {
        // Ensure install banner is below mini-player
        const bannerZ = parseInt(window.getComputedStyle(installBanner).zIndex) || 0;
        const playerZ = miniPlayer ? (parseInt(window.getComputedStyle(miniPlayer).zIndex) || 0) : 750;
        
        if (bannerZ >= playerZ) {
          console.log('[ZIndexFix] Fixing install banner z-index:', bannerZ, '->', playerZ - 50);
          installBanner.style.zIndex = playerZ - 50;
        }
      }
    }
  };

  /**
   * Fix #6: Theme Transition Smoothness
   * Prevents animation freeze during theme switches
   */
  const ThemeTransitionFix = {
    _switching: false,

    startSwitch() {
      if (this._switching) return;
      this._switching = true;
      
      document.documentElement.classList.add('theme-switching');
      
      // Remove after 1 frame (allow compositor to process)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('theme-switching');
          this._switching = false;
        });
      });
    },

    init() {
      // Hook into theme changes
      const themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            this.startSwitch();
          }
        });
      });

      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }
  };

  /**
   * Fix #7: Orphaned Foreign Overlays Cleanup
   * Cleans up any leaked panels (Voice search, Live Kirtan Tracker, Raag, Offline Sync)
   * if they were appended to document.body outside #app.
   */
  const OrphanOverlayCleanup = {
    applyFix() {
      const isHome = !window.location.pathname.includes('/GurbaniKhoj/') &&
                     !window.location.pathname.includes('/Hukamnama/') &&
                     !window.location.pathname.includes('/Insights/') &&
                     !window.location.pathname.includes('/nitnem/') &&
                     !window.location.pathname.includes('/Settings/');
      if (isHome) {
        const orphanSelectors = [
          '#voicePanel',
          '#liveKirtanOverlay',
          '#raagOverlay',
          '#offlineProgressSheet',
          '#offlineProgressBackdrop',
          '#rareSuggestionsOverlay',
          '#historyOverlay',
          '.voice-panel',
          '.hanging-lantern',
          '.live-kirtan-overlay',
          '.raag-fullscreen',
          '.offline-progress-sheet'
        ];
        orphanSelectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => {
            if (el.parentElement === document.body || !el.closest('#app')) {
              console.log('[OrphanOverlayCleanup] Removing leaked overlay:', sel);
              el.remove();
            }
          });
        });
      }
    }
  };

  /**
   * Master Fix Application
   * Runs all fixes in sequence
   */
  function applyAllFixes() {
    console.log('[Desktop UI Fixes] Applying all fixes...');

    try {
      EventCountdownFix.applyFix();
    } catch (e) {
      console.error('[Desktop UI Fixes] EventCountdownFix failed:', e);
    }

    try {
      NitnemButtonFix.applyFix();
    } catch (e) {
      console.error('[Desktop UI Fixes] NitnemButtonFix failed:', e);
    }

    try {
      HukamnamaVisibilityFix.applyFix();
    } catch (e) {
      console.error('[Desktop UI Fixes] HukamnamaVisibilityFix failed:', e);
    }

    try {
      CardWidthFix.applyFix();
    } catch (e) {
      console.error('[Desktop UI Fixes] CardWidthFix failed:', e);
    }

    try {
      ZIndexFix.applyFix();
    } catch (e) {
      console.error('[Desktop UI Fixes] ZIndexFix failed:', e);
    }

    try {
      OrphanOverlayCleanup.applyFix();
    } catch (e) {
      console.error('[Desktop UI Fixes] OrphanOverlayCleanup failed:', e);
    }

    console.log('[Desktop UI Fixes] All fixes applied');
  }

  /**
   * Initialize
   */
  function init() {
    // Initialize theme transition fix
    ThemeTransitionFix.init();

    // Apply fixes on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyAllFixes);
    } else {
      applyAllFixes();
    }
    window.addEventListener('load', applyAllFixes);
    window.addEventListener('pageshow', applyAllFixes);

    // Staggered retries to catch late async data hydration
    setTimeout(applyAllFixes, 200);
    setTimeout(applyAllFixes, 800);
    setTimeout(applyAllFixes, 2000);

    // Re-apply on custom ANHAD events
    ['anhad_page_changed', 'anhad_data_loaded', 'anhad_events_ready', 'anhad_theme_changed'].forEach(evt => {
      window.addEventListener(evt, () => {
        setTimeout(applyAllFixes, 50);
      });
    });

    // Re-apply on window resize (for responsive fixes)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        CardWidthFix.applyFix();
      }, 250);
    });

    // Expose to window for debugging
    window.AnhadDesktopUIFixes = {
      EventCountdownFix,
      NitnemButtonFix,
      HukamnamaVisibilityFix,
      CardWidthFix,
      ZIndexFix,
      ThemeTransitionFix,
      applyAllFixes
    };
  }

  init();

  console.log('[Desktop UI Fixes] Initialized successfully');

})();
