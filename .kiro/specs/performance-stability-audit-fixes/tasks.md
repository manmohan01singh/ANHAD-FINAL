# Implementation Plan: Performance and Stability Audit Fixes

## Overview
This implementation plan addresses 27 systemic performance and stability defects across 6 categories: scroll performance (GPU thrashing), card visibility (IntersectionObserver issues), bundle size (400KB+ CSS), memory leaks (uncleared intervals/observers), mobile compatibility (localStorage quota, audio suspension), and API optimization (sequential waterfalls). The plan follows a 6-phase approach with exploration tests before fixes, preservation tests, and comprehensive validation.

---

## Phase 1: Exploration Tests (BEFORE Fixes)

- [x] 1. Write bug condition exploration tests for all 6 categories
  - **Property 1: Bug Condition** - Performance and Stability Defects
  - **CRITICAL**: These tests MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior - they will validate the fixes when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bugs exist across all 6 categories
  - **Scoped PBT Approach**: For deterministic bugs, scope properties to concrete failing cases to ensure reproducibility
  - Test implementation details from Bug Condition specifications in design
  - The test assertions should match the Expected Behavior Properties from design
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct - it proves the bugs exist)
  - Document counterexamples found to understand root causes
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1-1.27_


  - [x] 1.1 Scroll Performance Exploration Test
    - Create `frontend/test-scroll-performance.html`
    - Use Performance API to measure frame rate during scroll with glass elements
    - Test: Scroll through homepage with 15 glass cards
    - Assert: Frame rate >= 60fps (will FAIL - expect ~28fps on unfixed code)
    - Measure: Blur radius values in computed styles (expect 80px)
    - Measure: CSS property update frequency (expect <50ms intervals)
    - Verify: Missing will-change and contain properties
    - Verify: Non-passive scroll listeners blocking compositor
    - Document counterexamples: Frame drops, GPU thrashing, main thread blocking
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Card Visibility Exploration Test
    - Create `frontend/test-card-visibility.html`
    - Programmatically trigger momentum scroll through bento grid
    - Monitor card visibility using getBoundingClientRect and IntersectionObserver
    - Test: Cards remain in DOM during momentum scroll
    - Assert: All cards visible throughout scroll (will FAIL - cards disappear)
    - Measure: IntersectionObserver threshold values (expect 0.3)
    - Verify: DOM removal during animation pausing
    - Verify: Missing parent existence checks
    - Document counterexamples: Cards disappearing at 70% visibility, runtime errors
    - _Requirements: 1.6, 1.7, 1.8, 1.9_

  - [x] 1.3 Bundle Size Exploration Test
    - Create `frontend/test-bundle-size.html`
    - Use Performance API to measure resource sizes
    - Test: Total CSS payload size across all files
    - Assert: Total CSS < 200KB (will FAIL - expect 412KB)
    - Count: CSS file count (expect 43 files)
    - Verify: Duplicate shadow definitions across files
    - Verify: Blocking font imports without font-display: swap
    - Document counterexamples: 400KB+ CSS, 60% content overlap, 2.8s parse time
    - _Requirements: 1.10, 1.11, 1.12, 1.13_

  - [x] 1.4 Memory Leak Exploration Test
    - Create `frontend/test-memory-leaks.html`
    - Use performance.memory API to monitor memory growth
    - Test: Navigate between pages 20 times over 1 hour
    - Assert: Memory growth < 50MB (will FAIL - expect 120MB growth)
    - Verify: Intervals not cleared (listener count, cycling placeholder)
    - Verify: MutationObserver not disconnected
    - Verify: IntersectionObservers accumulating
    - Verify: Navigation timers not cleared
    - Verify: Audio event listeners accumulating
    - Document counterexamples: 960 interval callbacks, 15+ observers, 100+ listeners
    - _Requirements: 1.14, 1.15, 1.16, 1.17, 1.18_

  - [x] 1.5 Mobile/Capacitor Exploration Test
    - Create `frontend/test-mobile-compatibility.html`
    - Test localStorage quota on Android WebView
    - Test: Write 6MB data to localStorage
    - Assert: No QuotaExceededError (will FAIL - quota exceeded at 5.2MB)
    - Test: Initialize Web Audio API without user gesture
    - Assert: Audio context state === 'running' (will FAIL - state === 'suspended')
    - Verify: Web Notification API used instead of Capacitor plugin
    - Verify: Missing hardware back button handler
    - Measure: Touch target sizes (expect 7px instead of 44px)
    - Document counterexamples: QuotaExceededError, suspended audio, notification failures
    - _Requirements: 1.19, 1.20, 1.21, 1.22, 1.23_

  - [x] 1.6 API Optimization Exploration Test
    - Create `frontend/test-api-optimization.html`
    - Use Performance API to measure initialization timing
    - Test: Application initialization with sequential API calls
    - Assert: Initialization < 1s (will FAIL - expect 3.2s)
    - Verify: Sequential blocking calls instead of parallelization
    - Verify: Duplicate requests without deduplication
    - Verify: Cached data not used (no stale-while-revalidate)
    - Verify: Heartbeat requests continue when tab hidden
    - Document counterexamples: 3.2s waterfall, redundant requests, wasted resources
    - _Requirements: 1.24, 1.25, 1.26, 1.27_

---

## Phase 2: Preservation Tests (BEFORE Fixes)

- [x] 2. Write preservation property tests (BEFORE implementing fixes)
  - **Property 2: Preservation** - Visual Design and Functionality Integrity
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1-3.15_


  - [x] 2.1 Visual Design Preservation Test
    - Create `frontend/test-visual-preservation.html`
    - Observe: Glass effects on unfixed code (basic, premium, extreme variants)
    - Observe: Animation effects (aurora, orbs, particles, divine rays)
    - Observe: Liquid glass design system appearance
    - Write property-based test: For all glass elements, visual appearance matches baseline
    - Capture screenshots of all glass variants
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test PASSES (confirms baseline visual design)
    - Store baseline screenshots for comparison after fixes
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.2 Functionality Preservation Test
    - Create `frontend/test-functionality-preservation.html`
    - Observe: User interactions on unfixed code (magnetic search, voice search, worm pills)
    - Observe: Hero tilt, favorites, hukamnama flip
    - Observe: IntersectionObserver lazy loading behavior
    - Observe: Data persistence patterns (localStorage access)
    - Write property-based test: For all user interactions, behavior matches baseline
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test PASSES (confirms baseline functionality)
    - Document all interaction patterns for comparison after fixes
    - _Requirements: 3.4, 3.5, 3.6_

  - [x] 2.3 Mobile Feature Preservation Test
    - Create `frontend/test-mobile-preservation.html`
    - Observe: Web fallbacks when Capacitor unavailable
    - Observe: Layout with original touch targets
    - Observe: Autoplay behavior after initial user interaction
    - Write property-based test: For all mobile features, behavior matches baseline
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test PASSES (confirms baseline mobile features)
    - Document fallback patterns for comparison after fixes
    - _Requirements: 3.7, 3.8, 3.9_

  - [x] 2.4 API Behavior Preservation Test
    - Create `frontend/test-api-preservation.html`
    - Observe: Error handling for API calls on unfixed code
    - Observe: Cache-busting scenarios
    - Observe: UI updates when fresh data arrives
    - Write property-based test: For all API scenarios, behavior matches baseline
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test PASSES (confirms baseline API behavior)
    - Document error recovery and data freshness patterns
    - _Requirements: 3.10, 3.11, 3.12_

  - [x] 2.5 Performance Baseline Preservation Test
    - Create `frontend/test-performance-baseline.html`
    - Observe: Initial load time on 3G network simulation
    - Observe: Feature availability without code splitting errors
    - Observe: Performance over 8+ hour session
    - Write property-based test: For all performance metrics, baseline is maintained
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test PASSES (confirms baseline performance)
    - Document baseline metrics: <3s load time, no splitting errors, stable 8hr sessions
    - _Requirements: 3.13, 3.14, 3.15_

---

## Phase 3: Critical Performance Fixes (Week 1)

- [x] 3. Fix scroll performance issues

  - [x] 3.1 Reduce backdrop-filter blur radius
    - Open `frontend/css/liquid-glass-system.css`
    - Change `--lg-blur-heavy: 80px;` to `--lg-blur-heavy: 20px;`
    - Change `--lg-blur-medium: 40px;` to `--lg-blur-medium: 16px;`
    - Change `--lg-blur-light: 20px;` to `--lg-blur-light: 12px;`
    - Verify visual appearance remains acceptable
    - _Bug_Condition: input.type == 'scroll' AND blur > 20px_
    - _Expected_Behavior: blur <= 20px for GPU optimization_
    - _Preservation: Visual design system appearance (Req 3.1)_
    - _Requirements: 1.1, 2.1_

  - [x] 3.2 Add GPU layer promotion to glass elements
    - Open `frontend/css/liquid-glass-system.css`
    - Add to `.lg-glass`, `.lg-glass-premium`, `.lg-glass-extreme`:
      ```css
      will-change: transform;
      contain: layout style paint;
      ```
    - Verify no visual regression
    - _Bug_Condition: NOT hasWillChange(input.element)_
    - _Expected_Behavior: GPU layer promotion for smooth scroll_
    - _Preservation: Visual appearance unchanged (Req 3.1)_
    - _Requirements: 1.4, 2.1_

  - [x] 3.3 Consolidate box-shadow definitions
    - Open `frontend/css/liquid-glass-system.css`
    - Create CSS custom properties in :root:
      ```css
      --lg-shadow-glass: 0 8px 32px rgba(0,0,0,0.25);
      --lg-shadow-card: 0 4px 16px rgba(0,0,0,0.2);
      --lg-shadow-elevated: 0 16px 48px rgba(0,0,0,0.3);
      ```
    - Replace all multi-layer shadow definitions with single custom property references
    - Search for duplicate shadows across all CSS files
    - _Bug_Condition: hasMultiLayerShadows(input.element)_
    - _Expected_Behavior: Single-layer shadows for better scroll performance_
    - _Preservation: Visual shadow appearance (Req 3.3)_
    - _Requirements: 1.2, 2.2_

  - [x] 3.4 Throttle liquid glass CSS property updates
    - Open `frontend/js/performance-optimizer.js`
    - Change `const LIQUID_UPDATE_INTERVAL = 50;` to `const LIQUID_UPDATE_INTERVAL = 100;`
    - Verify liquid glass effects still appear smooth
    - _Bug_Condition: cssPropertyUpdateRate < 100ms_
    - _Expected_Behavior: Throttled to 100ms using requestAnimationFrame_
    - _Preservation: Liquid glass visual effects (Req 3.1)_
    - _Requirements: 1.3, 2.3_

  - [x] 3.5 Add passive event listeners to scroll handlers
    - Open `frontend/js/performance-optimizer.js`
    - Verify all `addEventListener('scroll', ...)` calls include `{ passive: true }`
    - Open `frontend/js/interactions.js`
    - Add `{ passive: true }` to all mousemove and scroll listeners
    - _Bug_Condition: NOT isPassiveListener(input.listener)_
    - _Expected_Behavior: Passive listeners allow compositor optimization_
    - _Preservation: All scroll interactions work identically (Req 3.5)_
    - _Requirements: 1.5, 2.5_

  - [x] 3.6 Verify scroll performance exploration test now passes
    - **Property 1: Expected Behavior** - 60fps Scroll Performance
    - **IMPORTANT**: Re-run the SAME test from task 1.1 - do NOT write a new test
    - Run `frontend/test-scroll-performance.html`
    - **EXPECTED OUTCOME**: Test PASSES (frame rate >= 60fps)
    - Verify: Blur radius <= 20px
    - Verify: CSS updates throttled to >= 100ms
    - Verify: will-change and contain properties applied
    - Verify: Passive listeners enabled
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

---

## Phase 4: UI Stability Fixes (Week 1)

- [x] 4. Fix card visibility issues

  - [x] 4.1 Adjust IntersectionObserver thresholds
    - Open `frontend/js/interactions.js`
    - Find all IntersectionObserver instantiations
    - Change `{ threshold: 0.3 }` to `{ threshold: 0, rootMargin: '50px' }`
    - Change `{ threshold: 0.1 }` to `{ threshold: 0, rootMargin: '50px' }`
    - Change `{ threshold: 0.5 }` to `{ threshold: 0, rootMargin: '50px' }`
    - Change `{ threshold: 0.3 }` to `{ threshold: 0, rootMargin: '50px' }`
    - _Bug_Condition: threshold > 0 AND isMomentumScroll_
    - _Expected_Behavior: threshold: 0 with rootMargin prevents premature unmounting_
    - _Preservation: Lazy loading triggers correctly (Req 3.4)_
    - _Requirements: 1.6, 2.6_

  - [x] 4.2 Replace DOM removal with animation-play-state
    - Open `frontend/js/interactions.js`
    - Find `_bentoEntrance()` and other animation functions
    - Replace element removal logic with:
      ```javascript
      element.style.animationPlayState = 'paused';
      ```
    - Replace element addition logic with:
      ```javascript
      element.style.animationPlayState = 'running';
      ```
    - _Bug_Condition: removesFromRenderTree_
    - _Expected_Behavior: Use animation-play-state instead of DOM removal_
    - _Preservation: Animations resume after scroll (Req 3.2)_
    - _Requirements: 1.7, 2.7_

  - [x] 4.3 Add parent existence checks before DOM mutations
    - Open `frontend/js/interactions.js`
    - Find all `parent.appendChild(element)` and `parent.removeChild(element)` calls
    - Add before each:
      ```javascript
      if (!parent || !parent.isConnected) return;
      ```
    - _Bug_Condition: NOT hasParentCheck_
    - _Expected_Behavior: Verify parent exists before mutations_
    - _Preservation: All DOM operations work correctly (Req 3.5)_
    - _Requirements: 1.8, 2.8_

  - [x] 4.4 Debounce IntersectionObserver callbacks
    - Open `frontend/js/performance-optimizer.js`
    - Find `initIntersectionPausing()` function
    - Wrap callback logic with 150ms debounce:
      ```javascript
      const debouncedCallback = debounce((entries) => {
        // existing callback logic
      }, 150);
      ```
    - _Bug_Condition: NOT hasDebouncedCallback_
    - _Expected_Behavior: 150ms debounce prevents rapid state changes_
    - _Preservation: Visibility callbacks trigger correctly (Req 3.4)_
    - _Requirements: 1.9, 2.9_

  - [x] 4.5 Verify card visibility exploration test now passes
    - **Property 1: Expected Behavior** - Stable Card Visibility
    - **IMPORTANT**: Re-run the SAME test from task 1.2 - do NOT write a new test
    - Run `frontend/test-card-visibility.html`
    - **EXPECTED OUTCOME**: Test PASSES (cards remain visible)
    - Verify: IntersectionObserver threshold === 0
    - Verify: rootMargin === '50px'
    - Verify: animation-play-state used instead of DOM removal
    - Verify: Parent checks prevent runtime errors
    - _Requirements: 2.6, 2.7, 2.8, 2.9_

---

## Phase 5: Memory Management Fixes (Week 2)

- [x] 5. Fix memory leaks


  - [x] 5.1 Clear intervals on pagehide
    - Open `frontend/js/interactions.js`
    - Find `_listenerCount()` function
    - Store interval ID: `this._listenerCountInterval = setInterval(...)`
    - Add cleanup handler:
      ```javascript
      window.addEventListener('pagehide', () => {
        if (this._listenerCountInterval) {
          clearInterval(this._listenerCountInterval);
          this._listenerCountInterval = null;
        }
      }, { once: true });
      ```
    - Find `_cyclingPlaceholder()` function
    - Store interval ID: `this._placeholderInterval = setInterval(...)`
    - Add cleanup handler for placeholder interval
    - _Bug_Condition: input.type == 'interval' AND NOT hasCleanupHandler_
    - _Expected_Behavior: Store interval IDs and clear on pagehide_
    - _Preservation: All features work identically (Req 3.5)_
    - _Requirements: 1.14, 2.14_

  - [x] 5.2 Disconnect MutationObserver on pagehide
    - Open `frontend/lib/optimized-image-loader.js`
    - Find `observeNewImages()` function
    - Store observer reference: `this.mutationObserver = new MutationObserver(...)`
    - Add cleanup handler:
      ```javascript
      window.addEventListener('pagehide', () => {
        if (this.mutationObserver) {
          this.mutationObserver.disconnect();
          this.mutationObserver = null;
        }
      }, { once: true });
      ```
    - _Bug_Condition: input.type == 'mutationObserver' AND NOT hasDisconnect_
    - _Expected_Behavior: Call disconnect() on pagehide_
    - _Preservation: Image loading works identically (Req 3.5)_
    - _Requirements: 1.15, 2.15_

  - [x] 5.3 Disconnect all IntersectionObservers on pagehide
    - Open `frontend/js/interactions.js`
    - Create array to store observers: `this.intersectionObservers = []`
    - Push each observer to array when created
    - Add cleanup handler:
      ```javascript
      window.addEventListener('pagehide', () => {
        this.intersectionObservers.forEach(obs => obs.disconnect());
        this.intersectionObservers = [];
      }, { once: true });
      ```
    - Repeat for `frontend/js/performance-optimizer.js`
    - Repeat for `frontend/js/trendora-app.js`
    - _Bug_Condition: input.type == 'intersectionObserver' AND NOT hasDisconnect_
    - _Expected_Behavior: Disconnect all observers on pagehide_
    - _Preservation: Lazy loading and visibility callbacks work (Req 3.4)_
    - _Requirements: 1.16, 2.16_

  - [x] 5.4 Clear navigation timers on pagehide
    - Open `frontend/js/trendora-app.js`
    - Find Navigation class
    - Add cleanup handler:
      ```javascript
      window.addEventListener('pagehide', () => {
        if (this._exitTimer) {
          clearTimeout(this._exitTimer);
          this._exitTimer = null;
        }
        if (this._safetyTimer) {
          clearTimeout(this._safetyTimer);
          this._safetyTimer = null;
        }
      }, { once: true });
      ```
    - _Bug_Condition: input.type == 'navigationTimer' AND NOT hasClearTimeout_
    - _Expected_Behavior: Clear all timers on pagehide_
    - _Preservation: Navigation works identically (Req 3.5)_
    - _Requirements: 1.17, 2.17_

  - [x] 5.5 Use AbortController for audio event listeners
    - Open `frontend/script.js`
    - Find AudioEngine class
    - Add to constructor: `this.abortController = new AbortController();`
    - Update all `addEventListener` calls to include:
      ```javascript
      { signal: this.abortController.signal }
      ```
    - Add cleanup method:
      ```javascript
      cleanup() {
        this.abortController.abort();
        this.abortController = new AbortController();
      }
      ```
    - Call cleanup on track change and pagehide
    - _Bug_Condition: input.type == 'audioEvent' AND NOT hasAbortController_
    - _Expected_Behavior: Use AbortController to remove all listeners_
    - _Preservation: Audio playback works identically (Req 3.5)_
    - _Requirements: 1.18, 2.18_

  - [x] 5.6 Verify memory leak exploration test now passes
    - **Property 1: Expected Behavior** - Zero Memory Leaks
    - **IMPORTANT**: Re-run the SAME test from task 1.4 - do NOT write a new test
    - Run `frontend/test-memory-leaks.html`
    - **EXPECTED OUTCOME**: Test PASSES (memory growth < 50MB)
    - Verify: Intervals cleared on pagehide
    - Verify: MutationObserver disconnected
    - Verify: IntersectionObservers disconnected
    - Verify: Navigation timers cleared
    - Verify: Audio listeners removed via AbortController
    - _Requirements: 2.14, 2.15, 2.16, 2.17, 2.18_

---

## Phase 6: Bundle Size Optimization (Week 2-3)

- [x] 6. Optimize bundle size

  - [x] 6.1 Consolidate glass CSS files
    - Create `frontend/css/unified-glass-system.css`
    - Merge content from:
      - `frontend/css/ios-glass.css`
      - `frontend/css/liquid-glass-system.css`
      - `frontend/css/anhad-glass.css`
      - `frontend/css/ios-liquid-glass.css`
    - Remove duplicate definitions
    - Extract common shadows to CSS custom properties (already done in task 3.3)
    - Update all HTML files to import only `unified-glass-system.css`
    - Delete original separate files
    - _Bug_Condition: cssSize > 200KB AND hasDuplicateDefinitions_
    - _Expected_Behavior: Consolidated CSS with single source of truth_
    - _Preservation: Visual design unchanged (Req 3.3)_
    - _Requirements: 1.10, 1.12, 2.10, 2.12_

  - [x] 6.2 Consolidate animation CSS files
    - Create `frontend/css/animations-consolidated.css`
    - Merge content from:
      - `frontend/css/animations.css`
      - `frontend/css/divine-animations.css`
      - `frontend/css/smooth-card-animations.css`
      - `frontend/css/ultra-welcome-animations.css`
    - Remove duplicate keyframe definitions
    - Update all HTML files to import only `animations-consolidated.css`
    - Delete original separate files
    - _Bug_Condition: fileCount > 15 AND hasOverlap_
    - _Expected_Behavior: Merged animation files reducing count_
    - _Preservation: All animations work identically (Req 3.2)_
    - _Requirements: 1.13, 2.13_

  - [x] 6.3 Consolidate component CSS files
    - Create `frontend/css/components-unified.css`
    - Merge content from:
      - `frontend/css/anhad-components.css`
      - `frontend/css/components.css`
      - `frontend/css/anhad-cards.css`
    - Remove duplicate definitions
    - Update all HTML files to import only `components-unified.css`
    - Delete original separate files
    - _Bug_Condition: cssFileCount > 15_
    - _Expected_Behavior: Consolidated component styles_
    - _Preservation: All component styles unchanged (Req 3.3)_
    - _Requirements: 1.13, 2.13_

  - [x] 6.4 Add font preloading
    - Open `frontend/index.html` and all other HTML files
    - Add before CSS imports:
      ```html
      <link rel="preload" href="assets/fonts/OptimusPrinceps.ttf" as="font" type="font/ttf" crossorigin>
      <link rel="preload" href="assets/fonts/OptimusPrincepsSemiBold.ttf" as="font" type="font/ttf" crossorigin>
      <link rel="preload" href="assets/fonts/TrajanPro-Regular.ttf" as="font" type="font/ttf" crossorigin>
      ```
    - _Bug_Condition: blocksRender_
    - _Expected_Behavior: Preload critical fonts to prevent render blocking_
    - _Preservation: Font loading behavior (Req 3.13)_
    - _Requirements: 1.11, 2.11_

  - [x] 6.5 Add font-display: swap to @font-face rules
    - Open all CSS files with @font-face declarations
    - Add `font-display: swap;` to each @font-face rule
    - Verify fonts load without blocking render
    - _Bug_Condition: blocksRender_
    - _Expected_Behavior: font-display: swap prevents FOIT_
    - _Preservation: Font appearance unchanged (Req 3.3)_
    - _Requirements: 1.11, 2.11_

  - [x] 6.6 Verify bundle size exploration test now passes
    - **Property 1: Expected Behavior** - Optimized Bundle Size
    - **IMPORTANT**: Re-run the SAME test from task 1.3 - do NOT write a new test
    - Run `frontend/test-bundle-size.html`
    - **EXPECTED OUTCOME**: Test PASSES (CSS < 200KB)
    - Verify: CSS file count < 15
    - Verify: No duplicate shadow definitions
    - Verify: Font preload links present
    - Verify: font-display: swap in all @font-face rules
    - _Requirements: 2.10, 2.11, 2.12, 2.13_

---

## Phase 7: Mobile Compatibility Fixes (Week 3)

- [x] 7. Fix mobile/Capacitor issues

  - [x] 7.1 Create storage manager with quota monitoring
    - Create `frontend/lib/storage-manager.js`
    - Implement StorageManager class:
      ```javascript
      class StorageManager {
        async getQuota() {
          if (navigator.storage && navigator.storage.estimate) {
            return await navigator.storage.estimate();
          }
          return { usage: 0, quota: 5 * 1024 * 1024 }; // 5MB default
        }
        
        async set(key, value) {
          const size = new Blob([JSON.stringify(value)]).size;
          const quota = await this.getQuota();
          
          // Use IndexedDB if approaching quota (80% threshold)
          if (quota.usage + size > quota.quota * 0.8) {
            return this.setIndexedDB(key, value);
          }
          
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (e) {
            if (e.name === 'QuotaExceededError') {
              return this.setIndexedDB(key, value);
            }
            throw e;
          }
        }
        
        async setIndexedDB(key, value) {
          // IndexedDB implementation
        }
        
        async get(key) {
          // Try localStorage first, fallback to IndexedDB
        }
      }
      ```
    - _Bug_Condition: size > 5MB_
    - _Expected_Behavior: Quota monitoring with IndexedDB fallback_
    - _Preservation: Data persistence patterns (Req 3.6)_
    - _Requirements: 1.19, 2.19_

  - [x] 7.2 Resume audio context after user gesture
    - Open `frontend/script.js`
    - Find AudioEngine class `initialize()` method
    - Don't create AudioContext immediately
    - Add user gesture detection:
      ```javascript
      const resumeAudio = async () => {
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
      };
      document.addEventListener('click', resumeAudio, { once: true });
      document.addEventListener('touchstart', resumeAudio, { once: true });
      ```
    - _Bug_Condition: NOT hasUserGesture_
    - _Expected_Behavior: Resume audio context only after user gesture_
    - _Preservation: Autoplay after initial interaction (Req 3.9)_
    - _Requirements: 1.20, 2.20_

  - [x] 7.3 Create Capacitor notification wrapper
    - Create `frontend/lib/capacitor-notifications.js`
    - Implement notification wrapper:
      ```javascript
      async function scheduleNotification(options) {
        if (window.Capacitor?.Plugins?.LocalNotifications) {
          return Capacitor.Plugins.LocalNotifications.schedule({
            notifications: [options]
          });
        }
        // Web fallback for browser testing
        if ('Notification' in window && Notification.permission === 'granted') {
          return new Notification(options.title, options);
        }
        console.warn('Notifications not available');
      }
      
      async function requestPermission() {
        if (window.Capacitor?.Plugins?.LocalNotifications) {
          return Capacitor.Plugins.LocalNotifications.requestPermissions();
        }
        if ('Notification' in window) {
          return Notification.requestPermission();
        }
      }
      ```
    - Update all notification code to use this wrapper
    - _Bug_Condition: usesWebAPI_
    - _Expected_Behavior: Use Capacitor plugin with web fallback_
    - _Preservation: Web fallbacks for browser testing (Req 3.7)_
    - _Requirements: 1.21, 2.21_

  - [x] 7.4 Add hardware back button handler
    - Create `frontend/js/capacitor-init.js`
    - Implement back button handler:
      ```javascript
      if (window.Capacitor?.Plugins?.App) {
        Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // On root page, minimize app instead of exit
            Capacitor.Plugins.App.minimizeApp();
          }
        });
      }
      ```
    - Import in all HTML files
    - _Bug_Condition: NOT hasHandler_
    - _Expected_Behavior: Navigate on back button, minimize on root_
    - _Preservation: Navigation works identically (Req 3.5)_
    - _Requirements: 1.22, 2.22_

  - [x] 7.5 Enforce minimum touch target sizes
    - Create `frontend/css/mobile-accessibility.css`
    - Add touch target rules:
      ```css
      @media (pointer: coarse) {
        button, a, .interactive, .clickable {
          min-width: 44px;
          min-height: 44px;
          padding: 12px;
        }
        
        /* Ensure icon buttons meet minimum */
        .icon-button {
          min-width: 44px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      }
      ```
    - Import in all HTML files
    - _Bug_Condition: size < 44px_
    - _Expected_Behavior: Enforce 44px × 44px minimum per WCAG 2.5.5_
    - _Preservation: Visual layout and spacing (Req 3.8)_
    - _Requirements: 1.23, 2.23_

  - [x] 7.6 Verify mobile/Capacitor exploration test now passes
    - **Property 1: Expected Behavior** - Mobile Compatibility
    - **IMPORTANT**: Re-run the SAME test from task 1.5 - do NOT write a new test
    - Run `frontend/test-mobile-compatibility.html` on Android device
    - **EXPECTED OUTCOME**: Test PASSES (no quota errors, audio works, notifications work)
    - Verify: IndexedDB used when localStorage quota exceeded
    - Verify: Audio context resumes after user gesture
    - Verify: Capacitor LocalNotifications plugin used
    - Verify: Hardware back button navigates correctly
    - Verify: Touch targets >= 44px
    - _Requirements: 2.19, 2.20, 2.21, 2.22, 2.23_

---

## Phase 8: API Optimization (Week 3-4)

- [x] 8. Optimize API patterns


  - [x] 8.1 Create API manager with request deduplication
    - Create `frontend/js/api-manager.js`
    - Implement APIManager class:
      ```javascript
      class APIManager {
        constructor() {
          this.pendingRequests = new Map();
          this.cache = new Map();
          this.cacheTimestamps = new Map();
        }
        
        async fetch(url, options = {}) {
          const key = url + JSON.stringify(options);
          
          // Return pending request if exists (deduplication)
          if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key);
          }
          
          // Stale-while-revalidate: return cached data immediately
          if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            // Fetch fresh data in background
            this.fetchFresh(url, options, key);
            return cached;
          }
          
          const promise = this.fetchFresh(url, options, key);
          this.pendingRequests.set(key, promise);
          return promise;
        }
        
        async fetchFresh(url, options, key) {
          try {
            const response = await fetch(url, options);
            const data = await response.json();
            this.cache.set(key, data);
            this.cacheTimestamps.set(key, Date.now());
            this.pendingRequests.delete(key);
            return data;
          } catch (error) {
            this.pendingRequests.delete(key);
            throw error;
          }
        }
        
        clearCache() {
          this.cache.clear();
          this.cacheTimestamps.clear();
        }
      }
      
      export const apiManager = new APIManager();
      ```
    - _Bug_Condition: isDuplicate AND NOT hasDedupe_
    - _Expected_Behavior: Request deduplication with Map-based cache_
    - _Preservation: Fresh data for cache-busting (Req 3.11)_
    - _Requirements: 1.25, 2.25_

  - [x] 8.2 Parallelize independent API calls
    - Open `frontend/script.js`
    - Find VirtualLiveManager class initialization
    - Replace sequential await calls with Promise.all:
      ```javascript
      // Before:
      // const liveData = await fetch('/api/radio/live');
      // const trackData = await fetch('/api/radio/tracks');
      // const statsData = await fetch('/api/radio/stats');
      
      // After:
      const [liveData, trackData, statsData] = await Promise.all([
        apiManager.fetch('/api/radio/live'),
        apiManager.fetch('/api/radio/tracks'),
        apiManager.fetch('/api/radio/stats')
      ]);
      ```
    - Find other sequential API calls in initialization
    - Parallelize all independent calls
    - _Bug_Condition: isSequential AND canParallelize_
    - _Expected_Behavior: Parallelize using Promise.all()_
    - _Preservation: Independent error handling (Req 3.10)_
    - _Requirements: 1.24, 2.24_

  - [x] 8.3 Implement stale-while-revalidate pattern
    - Already implemented in APIManager.fetch() (task 8.1)
    - Update all API calls to use apiManager.fetch() instead of native fetch()
    - Verify cached data returned immediately
    - Verify UI updates when fresh data arrives
    - _Bug_Condition: hasCachedData AND NOT usesStaleWhileRevalidate_
    - _Expected_Behavior: Return cached data immediately, fetch fresh in background_
    - _Preservation: UI updates when fresh data arrives (Req 3.12)_
    - _Requirements: 1.26, 2.26_

  - [x] 8.4 Pause heartbeat requests when tab hidden
    - Open `frontend/script.js`
    - Find VirtualLiveManager class `startHeartbeat()` method
    - Add visibilitychange listener:
      ```javascript
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stopHeartbeat();
        } else {
          this.startHeartbeat();
        }
      });
      ```
    - Verify heartbeat stops when tab hidden
    - Verify heartbeat resumes when tab visible
    - _Bug_Condition: isHeartbeat AND tabHidden_
    - _Expected_Behavior: Pause heartbeat on visibilitychange_
    - _Preservation: Heartbeat works when tab visible (Req 3.10)_
    - _Requirements: 1.27, 2.27_

  - [x] 8.5 Verify API optimization exploration test now passes
    - **Property 1: Expected Behavior** - Optimized API Performance
    - **IMPORTANT**: Re-run the SAME test from task 1.6 - do NOT write a new test
    - Run `frontend/test-api-optimization.html`
    - **EXPECTED OUTCOME**: Test PASSES (initialization < 1s)
    - Verify: Independent API calls parallelized
    - Verify: Duplicate requests deduplicated
    - Verify: Cached data returned immediately
    - Verify: Heartbeat paused when tab hidden
    - _Requirements: 2.24, 2.25, 2.26, 2.27_

---

## Phase 9: Preservation Verification (Week 4)

- [ ] 9. Verify all preservation tests still pass

  - [ ] 9.1 Re-run visual design preservation test
    - **Property 2: Preservation** - Visual Design Integrity
    - **IMPORTANT**: Re-run the SAME test from task 2.1 - do NOT write a new test
    - Run `frontend/test-visual-preservation.html`
    - **EXPECTED OUTCOME**: Test PASSES (visual appearance unchanged)
    - Compare screenshots with baseline from task 2.1
    - Verify pixel difference < 1%
    - Verify all glass effects appear identical
    - Verify all animations work correctly
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 9.2 Re-run functionality preservation test
    - **Property 2: Preservation** - Functionality Integrity
    - **IMPORTANT**: Re-run the SAME test from task 2.2 - do NOT write a new test
    - Run `frontend/test-functionality-preservation.html`
    - **EXPECTED OUTCOME**: Test PASSES (all features work identically)
    - Verify magnetic search, voice search, worm pills work
    - Verify hero tilt, favorites, hukamnama flip work
    - Verify lazy loading triggers correctly
    - Verify data persistence works identically
    - _Requirements: 3.4, 3.5, 3.6_

  - [ ] 9.3 Re-run mobile feature preservation test
    - **Property 2: Preservation** - Mobile Feature Integrity
    - **IMPORTANT**: Re-run the SAME test from task 2.3 - do NOT write a new test
    - Run `frontend/test-mobile-preservation.html`
    - **EXPECTED OUTCOME**: Test PASSES (mobile features work identically)
    - Verify web fallbacks work when Capacitor unavailable
    - Verify layout maintained with enlarged touch targets
    - Verify autoplay works after initial interaction
    - _Requirements: 3.7, 3.8, 3.9_

  - [ ] 9.4 Re-run API behavior preservation test
    - **Property 2: Preservation** - API Behavior Integrity
    - **IMPORTANT**: Re-run the SAME test from task 2.4 - do NOT write a new test
    - Run `frontend/test-api-preservation.html`
    - **EXPECTED OUTCOME**: Test PASSES (API behavior unchanged)
    - Verify error handling works independently
    - Verify cache-busting returns fresh data
    - Verify UI updates when fresh data arrives
    - _Requirements: 3.10, 3.11, 3.12_

  - [ ] 9.5 Re-run performance baseline preservation test
    - **Property 2: Preservation** - Performance Baseline
    - **IMPORTANT**: Re-run the SAME test from task 2.5 - do NOT write a new test
    - Run `frontend/test-performance-baseline.html`
    - **EXPECTED OUTCOME**: Test PASSES (baseline maintained)
    - Verify initial load time < 3s on 3G
    - Verify all features work without code splitting errors
    - Verify stable performance over 8+ hour session
    - _Requirements: 3.13, 3.14, 3.15_

---

## Phase 10: Integration Testing (Week 4)

- [ ] 10. Run comprehensive integration tests

  - [ ] 10.1 Full application flow test
    - Create `frontend/test-full-application-flow.html`
    - Test complete user journey: Homepage → Nitnem Tracker → Gurbani Radio → Dashboard
    - Measure frame rate throughout journey (assert >= 60fps)
    - Monitor card visibility during navigation (assert no disappearance)
    - Monitor memory usage (assert < 100MB growth)
    - Verify all mobile features work correctly
    - Verify API calls optimized throughout flow
    - _Requirements: All requirements 2.1-2.27_

  - [ ] 10.2 Long session test
    - Create `frontend/test-long-session.html`
    - Run 8-hour continuous session with periodic navigation
    - Monitor memory usage every 30 minutes
    - Assert memory growth < 50MB over 8 hours
    - Verify no performance degradation
    - Verify all cleanup handlers execute correctly
    - _Requirements: 2.14, 2.15, 2.16, 2.17, 2.18, 3.15_

  - [ ] 10.3 Mobile device test
    - Test on Android device with Capacitor
    - Verify localStorage quota monitoring works
    - Verify audio playback after user gesture
    - Verify notifications use Capacitor plugin
    - Verify hardware back button navigation
    - Verify touch targets are accessible (44px minimum)
    - _Requirements: 2.19, 2.20, 2.21, 2.22, 2.23_

  - [ ] 10.4 Performance regression test
    - Create `frontend/test-performance-regression.html`
    - Measure and compare metrics:
      - Frame rate: Baseline 28fps → Target 60fps
      - CSS size: Baseline 412KB → Target <200KB
      - Memory growth: Baseline 120MB/hour → Target <50MB/hour
      - API init time: Baseline 3.2s → Target <1s
      - Touch target size: Baseline 7px → Target 44px
    - Assert all improvements achieved
    - _Requirements: All requirements 2.1-2.27_

  - [ ] 10.5 Visual regression test
    - Create `frontend/test-visual-regression.html`
    - Capture screenshots of all pages
    - Compare with baseline screenshots from task 2.1
    - Use image diff tools (e.g., pixelmatch)
    - Assert pixel difference < 1% for all pages
    - Manually verify glass effects, animations, and styling
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 10.6 Cross-browser test
    - Test on Chrome, Firefox, Safari, Edge
    - Test on iOS Safari, Android Chrome
    - Verify all fixes work across browsers
    - Verify web fallbacks work when Capacitor unavailable
    - Document any browser-specific issues
    - _Requirements: All requirements 2.1-2.27, 3.1-3.15_

  - [ ] 10.7 Stress test
    - Create `frontend/test-stress.html`
    - Rapid scroll for 5 minutes continuous
    - Navigate between pages 100 times
    - Store and retrieve 1000 localStorage items
    - Make 1000 API calls with various patterns
    - Verify system remains stable and performant
    - _Requirements: All requirements 2.1-2.27_

---

## Phase 11: Final Checkpoint

- [ ] 11. Final verification and deployment preparation
  - Ensure all exploration tests pass (tasks 3.6, 4.5, 5.6, 6.6, 7.6, 8.5)
  - Ensure all preservation tests pass (tasks 9.1-9.5)
  - Ensure all integration tests pass (tasks 10.1-10.7)
  - Review all code changes for quality and consistency
  - Update documentation with performance improvements
  - Prepare deployment checklist
  - Ask user if any questions or issues arise

---

## Summary

This implementation plan addresses 27 performance and stability defects across 6 categories:

1. **Scroll Performance** (5 defects): Reduced blur radius, added GPU layer promotion, consolidated shadows, throttled CSS updates, added passive listeners
2. **Card Visibility** (4 defects): Adjusted IntersectionObserver thresholds, replaced DOM removal with animation-play-state, added parent checks, debounced callbacks
3. **Bundle Size** (4 defects): Consolidated CSS files (43 → <15), added font preloading, added font-display: swap, extracted shadow definitions
4. **Memory Leaks** (5 defects): Cleared intervals, disconnected observers, cleared timers, used AbortController for events
5. **Mobile/Capacitor** (5 defects): Implemented storage quota monitoring, resumed audio after gesture, used Capacitor plugins, added back button handler, enforced touch target sizes
6. **API Optimization** (4 defects): Parallelized API calls, implemented request deduplication, added stale-while-revalidate, paused heartbeat when hidden

**Expected Improvements:**
- Frame rate: 28fps → 60fps
- CSS size: 412KB → <200KB
- Memory growth: 120MB/hour → <50MB/hour
- API init time: 3.2s → <1s
- Touch target size: 7px → 44px

**Testing Strategy:**
- Exploration tests BEFORE fixes (confirm bugs exist)
- Preservation tests BEFORE fixes (capture baseline behavior)
- Fix verification tests AFTER each phase
- Integration tests for full application flow
- Visual regression tests for design preservation
- Cross-browser and stress tests for robustness
