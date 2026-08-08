/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD FESTIVAL MODE CONFIGURATION
 * Centralized system for Gurpurab and Sikh calendar celebration activations
 * 
 * Design Philosophy:
 * - Single source of truth for all festival decorations
 * - Easy to enable/disable specific events without touching multiple files
 * - Modular and maintainable
 * - Zero performance impact when inactive
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function(window) {
  'use strict';

  /**
   * Festival Mode Configuration
   * 
   * Each entry controls celebration mode for a specific event type.
   * Set `enabled: false` to disable decorations for that event type.
   */
  const FestivalConfig = {
    // Parkash Gurpurabs (Birth Celebrations)
    prakashGurpurabs: {
      enabled: true,
      celebrationLevel: 'full', // 'full' | 'moderate' | 'subtle'
      features: {
        goldenGlow: true,
        logoBreathing: true,
        festivalBanner: true,
        highlightedBadge: true,
        floatingPetals: true,
        goldenHalo: true,
        welcomePopup: true
      }
    },

    // Gurgaddi Divas (Succession/Enthronement)
    gurgaddiDivas: {
      enabled: true,
      celebrationLevel: 'full',
      features: {
        goldenGlow: true,
        logoBreathing: true,
        festivalBanner: true,
        highlightedBadge: true,
        floatingPetals: true,
        goldenHalo: true,
        welcomePopup: true
      }
    },

    // Vaisakhi & Khalsa Foundation
    vaisakhi: {
      enabled: true,
      celebrationLevel: 'full',
      features: {
        goldenGlow: true,
        logoBreathing: true,
        festivalBanner: true,
        highlightedBadge: true,
        floatingPetals: true,
        goldenHalo: true,
        welcomePopup: true
      }
    },

    // Bandi Chhor Divas
    bandiChhorDivas: {
      enabled: true,
      celebrationLevel: 'full',
      features: {
        goldenGlow: true,
        logoBreathing: true,
        festivalBanner: true,
        highlightedBadge: true,
        floatingPetals: true,
        goldenHalo: true,
        welcomePopup: true
      }
    },

    // Shaheedi Gurpurabs (Martyrdom Days) - Respectful, no celebration mode
    shaheedGurpurabs: {
      enabled: false, // Disabled by default - no festive decorations
      celebrationLevel: 'none', // 'none' for respectful remembrance
      features: {
        goldenGlow: false,
        logoBreathing: false,
        festivalBanner: false,
        highlightedBadge: false,
        floatingPetals: false,
        goldenHalo: false,
        welcomePopup: false
      }
    },

    // Jyoti Jot Divas (Merging with Divine Light) - Respectful remembrance
    jyotiJot: {
      enabled: false, // Disabled by default - respectful remembrance only
      celebrationLevel: 'none',
      features: {
        goldenGlow: false,
        logoBreathing: false,
        festivalBanner: false,
        highlightedBadge: false,
        floatingPetals: false,
        goldenHalo: false,
        welcomePopup: false
      }
    },

    // Historical Events (non-Guru specific)
    historicalEvents: {
      enabled: false, // Disabled by default
      celebrationLevel: 'subtle',
      features: {
        goldenGlow: false,
        logoBreathing: false,
        festivalBanner: false,
        highlightedBadge: true,
        floatingPetals: false,
        goldenHalo: false,
        welcomePopup: false
      }
    }
  };

  /**
   * Event Type Classifier
   * Maps event IDs and types to festival configuration keys
   */
  const EventClassifier = {
    /**
     * Classify event and return applicable festival config
     * @param {Object} event - Event object with id, type, name_en properties
     * @returns {Object|null} - Festival config or null if no config applies
     */
    classify(event) {
      if (!event) return null;

      const eventId = (event.id || '').toLowerCase();
      const eventType = (event.type || '').toLowerCase();
      const eventName = (event.name_en || '').toLowerCase();

      // Prakash Gurpurabs (Birth celebrations)
      if (eventType === 'prakash' || 
          eventName.includes('prakash') || 
          eventName.includes('janam') ||
          eventName.includes('birthday')) {
        return FestivalConfig.prakashGurpurabs;
      }

      // Gurgaddi Divas (Succession)
      if (eventType === 'gurgaddi' || 
          eventName.includes('gurgaddi') ||
          eventName.includes('guruship')) {
        return FestivalConfig.gurgaddiDivas;
      }

      // Vaisakhi
      if (eventType === 'vaisakhi' || 
          eventId.includes('vaisakhi') ||
          eventName.includes('vaisakhi') ||
          eventName.includes('khalsa')) {
        return FestivalConfig.vaisakhi;
      }

      // Bandi Chhor Divas
      if (eventId.includes('bandi-chhor') ||
          eventName.includes('bandi chhor') ||
          eventName.includes('diwali')) {
        return FestivalConfig.bandiChhorDivas;
      }

      // Shaheedi (Martyrdom)
      if (eventType === 'shaheedi' || 
          eventName.includes('shaheedi') ||
          eventName.includes('martyrdom')) {
        return FestivalConfig.shaheedGurpurabs;
      }

      // Jyoti Jot (Merging with Divine Light)
      if (eventType === 'jyoti-jot' || 
          eventType === 'joti-jot' ||
          eventName.includes('jyoti jot') ||
          eventName.includes('joti jot')) {
        return FestivalConfig.jyotiJot;
      }

      // Historical events
      if (eventType === 'historical') {
        return FestivalConfig.historicalEvents;
      }

      // Default: no festival mode
      return null;
    }
  };

  /**
   * Festival Mode Manager
   * Handles activation, deactivation, and state management
   */
  const FestivalMode = {
    _isActive: false,
    _currentConfig: null,
    _currentEvent: null,
    _popupShownToday: false,

    /**
     * Check if festival mode should activate for given event
     * @param {Object} event - Event data
     * @returns {boolean}
     */
    shouldActivate(event) {
      const config = EventClassifier.classify(event);
      return config && config.enabled && config.celebrationLevel !== 'none';
    },

    /**
     * Activate festival mode
     * @param {Object} event - Event data
     */
    activate(event) {
      if (!event) return;

      const config = EventClassifier.classify(event);
      if (!config || !config.enabled || config.celebrationLevel === 'none') {
        this.deactivate();
        return;
      }

      this._isActive = true;
      this._currentConfig = config;
      this._currentEvent = event;

      // Add celebration class to document
      document.documentElement.classList.add('gurpurab-active');

      // Apply feature classes based on configuration
      this._applyFeatures(config.features);

      // Show welcome popup if configured and not shown today
      if (config.features.welcomePopup && !this._hasShownPopupToday()) {
        this._showWelcomePopup();
      }

      // Initialize visibility change handler for animation pausing
      this._initVisibilityHandler();

      console.log('[Festival Mode] Activated for:', event.name_en || event.id);
    },

    /**
     * Deactivate festival mode
     */
    deactivate() {
      if (!this._isActive) return;

      this._isActive = false;
      this._currentConfig = null;
      this._currentEvent = null;

      document.documentElement.classList.remove('gurpurab-active', 'gurpurab-paused', 'gurpurab-scrolled');
      
      // Hide sparkles and petals
      const sparkles = document.querySelector('.gurpurab-sparkles-top');
      const petals = document.querySelector('.gurpurab-petals');
      if (sparkles) sparkles.style.display = 'none';
      if (petals) petals.style.display = 'none';

      console.log('[Festival Mode] Deactivated');
    },

    /**
     * Apply feature-specific classes and elements
     * @private
     */
    _applyFeatures(features) {
      // Sparkles at top (fade on scroll)
      if (features.topSparkles || features.festivalBanner) {
        this._createSparkles();
      }

      // Floating petals
      if (features.floatingPetals) {
        this._createPetals();
      }
      
      // Initialize scroll listener for sparkle fade
      this._initScrollListener();
    },

    /**
     * Create subtle sparkles at top that fade on scroll
     * @private
     */
    _createSparkles() {
      let sparklesContainer = document.querySelector('.gurpurab-sparkles-top');
      
      if (!sparklesContainer) {
        sparklesContainer = document.createElement('div');
        sparklesContainer.className = 'gurpurab-sparkles-top';
        
        // Create 5 subtle golden sparkles (✦ Unicode star)
        for (let i = 1; i <= 5; i++) {
          const sparkle = document.createElement('div');
          sparkle.className = 'gurpurab-sparkle-top';
          sparkle.textContent = '✦';
          sparklesContainer.appendChild(sparkle);
        }
        
        document.body.appendChild(sparklesContainer);
      }
      
      sparklesContainer.style.display = 'block';
    },
    
    /**
     * Initialize scroll listener to fade sparkles on scroll
     * @private
     */
    _initScrollListener() {
      if (this._scrollListenerAdded) return;
      
      window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
          document.documentElement.classList.add('gurpurab-scrolled');
        } else {
          document.documentElement.classList.remove('gurpurab-scrolled');
        }
      }, { passive: true });
      
      this._scrollListenerAdded = true;
    },

    /**
     * Create floating petals container
     * @private
     */
    _createPetals() {
      let petalsContainer = document.querySelector('.gurpurab-petals');
      
      if (!petalsContainer) {
        petalsContainer = document.createElement('div');
        petalsContainer.className = 'gurpurab-petals';
        
        // Create exactly 5 petals (performance requirement)
        for (let i = 1; i <= 5; i++) {
          const petal = document.createElement('div');
          petal.className = 'gurpurab-petal';
          petalsContainer.appendChild(petal);
        }
        
        document.body.appendChild(petalsContainer);
      }
      
      petalsContainer.style.display = 'block';
    },

    /**
     * Check if popup was shown today
     * @private
     * @returns {boolean}
     */
    _hasShownPopupToday() {
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const lastShown = localStorage.getItem('gurpurab_popup_shown');
      return lastShown === today;
    },

    /**
     * Mark popup as shown today
     * @private
     */
    _markPopupShown() {
      const today = new Date().toLocaleDateString('en-CA');
      localStorage.setItem('gurpurab_popup_shown', today);
      this._popupShownToday = true;
    },

    /**
     * Show welcome popup
     * @private
     */
    _showWelcomePopup() {
      const event = this._currentEvent;
      const eventName = event.name_en || event.name_pa || 'Gurpurab';
      
      const popup = document.createElement('div');
      popup.className = 'gurpurab-welcome-popup';
      popup.innerHTML = `
        <div class="gurpurab-welcome-content">
          <div class="gurpurab-welcome-icon">🙏</div>
          <div class="gurpurab-welcome-title">Waheguru Ji Ka Khalsa<br>Waheguru Ji Ki Fateh</div>
          <div class="gurpurab-welcome-message">
            Today is ${eventName}.<br><br>May this sacred day inspire humility, seva, compassion, and remembrance of Waheguru.
          </div>
          <div class="gurpurab-welcome-actions">
            <button class="gurpurab-welcome-btn gurpurab-welcome-btn-primary" onclick="FestivalMode.closePopup(true)">
              Continue
            </button>
            <button class="gurpurab-welcome-btn gurpurab-welcome-btn-secondary" onclick="FestivalMode.closePopup(false)">
              Don't show again today
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(popup);
      
      // Trigger reflow for animation
      popup.offsetHeight;
      popup.classList.add('visible');
    },

    /**
     * Close welcome popup
     * @param {boolean} showAgainTomorrow - If false, marks as shown for today
     */
    closePopup(showAgainTomorrow) {
      const popup = document.querySelector('.gurpurab-welcome-popup');
      if (!popup) return;
      
      popup.classList.remove('visible');
      
      setTimeout(() => {
        popup.remove();
      }, 300);
      
      if (!showAgainTomorrow) {
        this._markPopupShown();
      }
    },

    /**
     * Initialize Page Visibility API handler
     * Pauses animations when tab/app is hidden (battery optimization)
     * @private
     */
    _initVisibilityHandler() {
      if (this._visibilityHandlerAdded) return;
      
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          document.documentElement.classList.add('gurpurab-paused');
        } else {
          document.documentElement.classList.remove('gurpurab-paused');
        }
      });
      
      this._visibilityHandlerAdded = true;
    },

    /**
     * Get current festival configuration
     * @returns {Object|null}
     */
    getCurrentConfig() {
      return this._currentConfig;
    },

    /**
     * Check if festival mode is currently active
     * @returns {boolean}
     */
    isActive() {
      return this._isActive;
    }
  };

  // Expose FestivalMode to window
  window.FestivalMode = FestivalMode;
  window.FestivalConfig = FestivalConfig;
  window.EventClassifier = EventClassifier;

  console.log('[Festival Mode] Configuration system loaded');

})(window);
