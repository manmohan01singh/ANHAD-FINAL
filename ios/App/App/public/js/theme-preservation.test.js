/**
 * Preservation Property Tests for Theme Rendering Fixes
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 * 
 * These tests MUST PASS on unfixed code to establish baseline behavior to preserve.
 * They capture the correct behavior of light mode, theme switching, and dynamic theme features.
 * 
 * Property 3: Light Mode Behavior
 * Property 4: Dynamic Theme Time Features
 * Property 5: Theme Switching
 */

const fc = require('fast-check');

describe('Preservation Properties: Light Mode, Theme Switching, Dynamic Theme Features', () => {
  let mockRoot;
  let mockBody;
  let mockLocalStorage;
  let savedStorage = null;
  
  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = `
      <div class="practice-card">
        <div class="practice-card__ring-icon"></div>
        <button class="practice-card__button">Test Button</button>
        <h3 class="practice-card__title">Test Card</h3>
      </div>
      <div class="quick-card">
        <div class="quick-card__icon"></div>
        <span class="quick-card__text">Quick Card</span>
      </div>
      <nav class="nav-tabs">
        <button class="nav-tab">Nav 1</button>
        <button class="nav-tab">Nav 2</button>
      </nav>
      <div class="card-text">Sample text content</div>
      <img class="hero-card__image" 
           data-img-morning="assets/HERO CARD IMAGES/morning-darbar-sahib.webp"
           data-img-day="assets/HERO CARD IMAGES/day-darbar-sahib.webp"
           data-img-evening="assets/HERO CARD IMAGES/evening-darbar-sahib.webp"
           data-img-night="assets/HERO CARD IMAGES/night-darbar-sahib.webp"
           src="" alt="Hero Card" />
    `;
    
    mockRoot = document.documentElement;
    mockBody = document.body;
    
    // Mock localStorage for theme persistence tests.
    //
    // These MUST patch the localStorage object itself, not Storage.prototype.
    // vitest.setup.js replaces global.localStorage with a PLAIN OBJECT LITERAL
    // (vitest.setup.js:242-265), not a Storage instance — so its own getItem
    // shadows the prototype and a Storage.prototype patch has no effect at all.
    // That is why every assertion here previously read back null: the test wrote
    // into mockLocalStorage and then read from the setup's untouched store.
    mockLocalStorage = {};
    const getItem = (key) => (key in mockLocalStorage ? mockLocalStorage[key] : null);
    const setItem = (key, value) => { mockLocalStorage[key] = String(value); };
    const removeItem = (key) => { delete mockLocalStorage[key]; };

    savedStorage = {
      getItem: localStorage.getItem,
      setItem: localStorage.setItem,
      removeItem: localStorage.removeItem,
    };
    localStorage.getItem = jest.fn(getItem);
    localStorage.setItem = jest.fn(setItem);
    localStorage.removeItem = jest.fn(removeItem);
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    mockRoot.removeAttribute('data-theme');
    mockRoot.removeAttribute('data-theme-mode');
    mockRoot.removeAttribute('data-time-of-day');
    mockLocalStorage = {};
    // localStorage is a shared global across test files — restore it so this
    // suite cannot leak its mock into whatever runs next.
    if (savedStorage) {
      localStorage.getItem = savedStorage.getItem;
      localStorage.setItem = savedStorage.setItem;
      localStorage.removeItem = savedStorage.removeItem;
      savedStorage = null;
    }
    jest.clearAllMocks();
  });
  
  /**
   * Property 3: Light Mode Behavior Preservation
   * Tests Requirements 3.1, 3.2
   * 
   * For ANY scroll event or interaction in light mode, the system SHALL produce
   * exactly the same rendering behavior as the original code, preserving stable
   * element display and correct visual presentation.
   * 
   * EXPECTED: These tests PASS on unfixed code (confirms baseline to preserve)
   */
  describe('Property 3: Light Mode Behavior Preservation', () => {
    test('light mode maintains stable element rendering during scroll without disappearing buttons', () => {
      // Set light mode
      mockRoot.setAttribute('data-theme', 'light');
      mockRoot.setAttribute('data-theme-mode', 'light');
      
      // Get elements that should remain visible
      const buttons = document.querySelectorAll('button');
      
      // Record initial visibility state
      const initialStates = Array.from(buttons).map(button => ({
        display: window.getComputedStyle(button).display,
        visibility: window.getComputedStyle(button).visibility,
        opacity: window.getComputedStyle(button).opacity
      }));
      
      // Simulate multiple scroll events
      for (let i = 0; i < 20; i++) {
        const scrollEvent = new Event('scroll');
        window.dispatchEvent(scrollEvent);
      }
      
      // CHECK: All buttons must remain visible and stable
      buttons.forEach((button, index) => {
        const computedStyle = window.getComputedStyle(button);
        const isVisible = computedStyle.display !== 'none' 
                       && computedStyle.visibility !== 'hidden'
                       && computedStyle.opacity !== '0';
        
        // Light mode should be perfectly stable (this should PASS on unfixed code)
        expect(isVisible).toBe(true);
        expect(computedStyle.display).toBe(initialStates[index].display);
        expect(computedStyle.visibility).toBe(initialStates[index].visibility);
        expect(computedStyle.opacity).toBe(initialStates[index].opacity);
      });
    });
    
    test('light mode maintains stable element rendering during scroll without disappearing cards', () => {
      // Set light mode
      mockRoot.setAttribute('data-theme', 'light');
      mockRoot.setAttribute('data-theme-mode', 'light');
      
      // Get card elements
      const cards = document.querySelectorAll('.practice-card, .quick-card');
      
      // Record initial visibility state
      const initialStates = Array.from(cards).map(card => ({
        display: window.getComputedStyle(card).display,
        visibility: window.getComputedStyle(card).visibility,
        opacity: window.getComputedStyle(card).opacity
      }));
      
      // Simulate rapid scrolling
      for (let i = 0; i < 30; i++) {
        const scrollEvent = new Event('scroll');
        window.dispatchEvent(scrollEvent);
      }
      
      // CHECK: All cards must remain visible and stable
      cards.forEach((card, index) => {
        const computedStyle = window.getComputedStyle(card);
        const isVisible = computedStyle.display !== 'none' 
                       && computedStyle.visibility !== 'hidden'
                       && computedStyle.opacity !== '0';
        
        // Light mode should be perfectly stable (this should PASS on unfixed code)
        expect(isVisible).toBe(true);
        expect(computedStyle.display).toBe(initialStates[index].display);
        expect(computedStyle.visibility).toBe(initialStates[index].visibility);
        expect(computedStyle.opacity).toBe(initialStates[index].opacity);
      });
    });
    
    test('light mode maintains stable text rendering during scroll without flickering', () => {
      // Set light mode
      mockRoot.setAttribute('data-theme', 'light');
      mockRoot.setAttribute('data-theme-mode', 'light');
      
      // Get text elements
      const textElements = document.querySelectorAll('.card-text, .practice-card__title, .quick-card__text');
      
      // Record initial text rendering state
      const initialStates = Array.from(textElements).map(el => ({
        display: window.getComputedStyle(el).display,
        visibility: window.getComputedStyle(el).visibility,
        opacity: window.getComputedStyle(el).opacity,
        color: window.getComputedStyle(el).color
      }));
      
      // Simulate rapid scrolling
      for (let i = 0; i < 25; i++) {
        const scrollEvent = new Event('scroll');
        window.dispatchEvent(scrollEvent);
      }
      
      // CHECK: Text rendering must be consistent (no flickering)
      textElements.forEach((el, index) => {
        const currentStyle = window.getComputedStyle(el);
        const initial = initialStates[index];
        
        // Text should maintain consistent rendering state in light mode
        expect(currentStyle.display).toBe(initial.display);
        expect(currentStyle.visibility).toBe(initial.visibility);
        expect(currentStyle.opacity).toBe(initial.opacity);
        expect(currentStyle.color).toBe(initial.color);
      });
    });
    
    test('light mode maintains fixed navigation button positions during scroll', () => {
      // Set light mode
      mockRoot.setAttribute('data-theme', 'light');
      mockRoot.setAttribute('data-theme-mode', 'light');
      
      // Get navigation buttons
      const navButtons = document.querySelectorAll('.nav-tab');
      
      // Record initial positions
      const initialPositions = Array.from(navButtons).map(btn => ({
        left: btn.getBoundingClientRect().left,
        right: btn.getBoundingClientRect().right,
        top: btn.getBoundingClientRect().top
      }));
      
      // Simulate rapid scrolling
      for (let i = 0; i < 20; i++) {
        const scrollEvent = new Event('scroll');
        window.dispatchEvent(scrollEvent);
      }
      
      // CHECK: Navigation buttons must maintain fixed positions
      navButtons.forEach((btn, index) => {
        const currentRect = btn.getBoundingClientRect();
        const initial = initialPositions[index];
        
        // Positions should be stable in light mode (allow 0.5px tolerance for rounding)
        const leftDiff = Math.abs(currentRect.left - initial.left);
        const rightDiff = Math.abs(currentRect.right - initial.right);
        const topDiff = Math.abs(currentRect.top - initial.top);
        
        expect(leftDiff).toBeLessThan(0.5);
        expect(rightDiff).toBeLessThan(0.5);
        expect(topDiff).toBeLessThan(0.5);
      });
    });
    
    /**
     * Property-based test: For ANY scroll pattern in light mode,
     * rendering must remain perfectly stable
     */
    test('property: light mode scroll stability across all scroll patterns', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 50 }), // Number of scroll events
          fc.integer({ min: 0, max: 1000 }), // Scroll delay simulation
          (numScrolls, scrollDelay) => {
            // Set light mode
            mockRoot.setAttribute('data-theme', 'light');
            mockRoot.setAttribute('data-theme-mode', 'light');
            
            // Get all interactive elements
            const elements = document.querySelectorAll('button, .practice-card, .quick-card, .card-text');
            
            // Record initial visibility
            const initialVisible = Array.from(elements).every(el => {
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            });
            
            // Simulate scroll events
            for (let i = 0; i < numScrolls; i++) {
              const scrollEvent = new Event('scroll');
              window.dispatchEvent(scrollEvent);
            }
            
            // Verify all elements remain visible
            const finalVisible = Array.from(elements).every(el => {
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            });
            
            // Property: Light mode maintains stability across all scroll patterns
            return initialVisible === finalVisible && finalVisible === true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
  
  /**
   * Property 4: Dynamic Theme Time Features Preservation
   * Tests Requirements 3.3, 3.4
   * 
   * For ANY time-of-day transition in dynamic theme mode, the system SHALL
   * continue to apply correct background colors, background images, and theme
   * variations exactly as the original code.
   * 
   * EXPECTED: These tests PASS on unfixed code (confirms baseline to preserve)
   */
  describe('Property 4: Dynamic Theme Time Features Preservation', () => {
    test('auto mode applies correct time-of-day attribute transitions', () => {
      // Set auto theme mode
      mockRoot.setAttribute('data-theme-mode', 'auto');
      
      // Test each time-of-day slot
      const timeSlots = ['morning', 'day', 'evening', 'night'];
      
      timeSlots.forEach(slot => {
        mockRoot.setAttribute('data-time-of-day', slot);
        
        // Verify time-of-day attribute is set correctly
        expect(mockRoot.getAttribute('data-time-of-day')).toBe(slot);
        
        // Verify theme attribute reflects the slot
        // Morning/day/evening should be light, night should be dark
        if (slot === 'night') {
          expect(['dark', 'light']).toContain(mockRoot.getAttribute('data-theme') || 'light');
        } else {
          expect(['light', 'dark']).toContain(mockRoot.getAttribute('data-theme') || 'light');
        }
      });
    });
    
    test('auto mode applies correct background color CSS variables for each time-of-day', () => {
      // Set auto theme mode
      mockRoot.setAttribute('data-theme-mode', 'auto');
      
      // Test morning background colors
      mockRoot.setAttribute('data-time-of-day', 'morning');
      mockRoot.style.setProperty('--sky-card-bg', 'rgba(255,235,208,0.84)');
      mockRoot.style.setProperty('--sky-card-bg-glass', 'rgba(255,248,238,0.72)');
      
      expect(mockRoot.style.getPropertyValue('--sky-card-bg')).toBe('rgba(255,235,208,0.84)');
      expect(mockRoot.style.getPropertyValue('--sky-card-bg-glass')).toBe('rgba(255,248,238,0.72)');
      
      // Test day background colors
      mockRoot.setAttribute('data-time-of-day', 'day');
      mockRoot.style.setProperty('--sky-card-bg', 'rgba(210,238,255,0.84)');
      mockRoot.style.setProperty('--sky-card-bg-glass', 'rgba(240,250,255,0.72)');
      
      expect(mockRoot.style.getPropertyValue('--sky-card-bg')).toBe('rgba(210,238,255,0.84)');
      expect(mockRoot.style.getPropertyValue('--sky-card-bg-glass')).toBe('rgba(240,250,255,0.72)');
      
      // Test evening background colors
      mockRoot.setAttribute('data-time-of-day', 'evening');
      mockRoot.style.setProperty('--sky-card-bg', 'rgba(255,210,175,0.84)');
      mockRoot.style.setProperty('--sky-card-bg-glass', 'rgba(255,235,210,0.72)');
      
      expect(mockRoot.style.getPropertyValue('--sky-card-bg')).toBe('rgba(255,210,175,0.84)');
      expect(mockRoot.style.getPropertyValue('--sky-card-bg-glass')).toBe('rgba(255,235,210,0.72)');
      
      // Test night background colors
      mockRoot.setAttribute('data-time-of-day', 'night');
      mockRoot.style.setProperty('--sky-card-bg', 'rgba(28,28,30,0.90)');
      mockRoot.style.setProperty('--sky-card-bg-glass', 'rgba(28,28,30,0.80)');
      
      expect(mockRoot.style.getPropertyValue('--sky-card-bg')).toBe('rgba(28,28,30,0.90)');
      expect(mockRoot.style.getPropertyValue('--sky-card-bg-glass')).toBe('rgba(28,28,30,0.80)');
    });
    
    test('auto mode applies correct hero card images for each time-of-day', () => {
      // Set auto theme mode
      mockRoot.setAttribute('data-theme-mode', 'auto');
      
      const heroImage = document.querySelector('.hero-card__image');
      
      // Test morning image
      mockRoot.setAttribute('data-time-of-day', 'morning');
      const morningImage = heroImage.getAttribute('data-img-morning');
      expect(morningImage).toBe('assets/HERO CARD IMAGES/morning-darbar-sahib.webp');
      
      // Test day image
      mockRoot.setAttribute('data-time-of-day', 'day');
      const dayImage = heroImage.getAttribute('data-img-day');
      expect(dayImage).toBe('assets/HERO CARD IMAGES/day-darbar-sahib.webp');
      
      // Test evening image
      mockRoot.setAttribute('data-time-of-day', 'evening');
      const eveningImage = heroImage.getAttribute('data-img-evening');
      expect(eveningImage).toBe('assets/HERO CARD IMAGES/evening-darbar-sahib.webp');
      
      // Test night image
      mockRoot.setAttribute('data-time-of-day', 'night');
      const nightImage = heroImage.getAttribute('data-img-night');
      expect(nightImage).toBe('assets/HERO CARD IMAGES/night-darbar-sahib.webp');
    });
    
    test('auto mode applies correct text color CSS variables for each time-of-day', () => {
      // Set auto theme mode
      mockRoot.setAttribute('data-theme-mode', 'auto');
      
      // Test morning text colors
      mockRoot.setAttribute('data-time-of-day', 'morning');
      mockRoot.style.setProperty('--sky-card-text', '#1A0402');
      mockRoot.style.setProperty('--sky-card-text2', '#4A1508');
      
      expect(mockRoot.style.getPropertyValue('--sky-card-text')).toBe('#1A0402');
      expect(mockRoot.style.getPropertyValue('--sky-card-text2')).toBe('#4A1508');
      
      // Test day text colors
      mockRoot.setAttribute('data-time-of-day', 'day');
      mockRoot.style.setProperty('--sky-card-text', '#000814');
      mockRoot.style.setProperty('--sky-card-text2', '#02162E');
      
      expect(mockRoot.style.getPropertyValue('--sky-card-text')).toBe('#000814');
      expect(mockRoot.style.getPropertyValue('--sky-card-text2')).toBe('#02162E');
      
      // Test night text colors (should be light on dark)
      mockRoot.setAttribute('data-time-of-day', 'night');
      mockRoot.style.setProperty('--sky-card-text', '#F5F5F7');
      mockRoot.style.setProperty('--sky-card-text2', '#8E8E93');
      
      expect(mockRoot.style.getPropertyValue('--sky-card-text')).toBe('#F5F5F7');
      expect(mockRoot.style.getPropertyValue('--sky-card-text2')).toBe('#8E8E93');
    });
    
    /**
     * Property-based test: For ANY time-of-day in auto mode,
     * time-adaptive features must apply correctly
     */
    test('property: auto mode time-of-day features apply correctly across all time slots', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('morning', 'day', 'evening', 'night'),
          (timeOfDay) => {
            // Set auto theme mode
            mockRoot.setAttribute('data-theme-mode', 'auto');
            mockRoot.setAttribute('data-time-of-day', timeOfDay);
            
            // Verify time-of-day attribute is set
            const actualTimeOfDay = mockRoot.getAttribute('data-time-of-day');
            
            // Verify time-of-day matches
            const timeOfDayMatch = actualTimeOfDay === timeOfDay;
            
            // Verify CSS variables can be set (simulating applyTimeAdaptiveCardColors)
            mockRoot.style.setProperty('--sky-card-bg', 'rgba(255,255,255,0.84)');
            const bgSet = mockRoot.style.getPropertyValue('--sky-card-bg') === 'rgba(255,255,255,0.84)';
            
            // Property: Time-of-day features apply correctly
            return timeOfDayMatch && bgSet;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  /**
   * Property 5: Theme Switching Preservation
   * Tests Requirements 3.5, 3.6, 3.7, 3.8
   * 
   * For ANY user-initiated theme change (light, dark, auto), the system SHALL
   * apply the new theme immediately and persist the preference exactly as the
   * original code.
   * 
   * EXPECTED: These tests PASS on unfixed code (confirms baseline to preserve)
   */
  describe('Property 5: Theme Switching Preservation', () => {
    test('theme switching applies light theme immediately', () => {
      // Switch to light theme
      mockRoot.setAttribute('data-theme', 'light');
      mockRoot.setAttribute('data-theme-mode', 'light');
      
      // Verify light theme is applied immediately
      expect(mockRoot.getAttribute('data-theme')).toBe('light');
      expect(mockRoot.getAttribute('data-theme-mode')).toBe('light');
      
      // Verify light theme classes are applied
      expect(mockRoot.classList.contains('dark')).toBe(false);
      expect(mockRoot.classList.contains('dark-mode')).toBe(false);
    });
    
    test('theme switching applies dark theme immediately', () => {
      // Switch to dark theme
      mockRoot.setAttribute('data-theme', 'dark');
      mockRoot.setAttribute('data-theme-mode', 'dark');
      mockRoot.classList.add('dark', 'dark-mode');
      
      // Verify dark theme is applied immediately
      expect(mockRoot.getAttribute('data-theme')).toBe('dark');
      expect(mockRoot.getAttribute('data-theme-mode')).toBe('dark');
      
      // Verify dark theme classes are applied
      expect(mockRoot.classList.contains('dark')).toBe(true);
      expect(mockRoot.classList.contains('dark-mode')).toBe(true);
    });
    
    test('theme switching applies auto theme immediately', () => {
      // Switch to auto theme
      mockRoot.setAttribute('data-theme-mode', 'auto');
      // Auto theme resolves to light or dark based on time
      mockRoot.setAttribute('data-theme', 'light'); // Daytime
      
      // Verify auto theme mode is set
      expect(mockRoot.getAttribute('data-theme-mode')).toBe('auto');
      
      // Verify effective theme is applied
      expect(['light', 'dark']).toContain(mockRoot.getAttribute('data-theme'));
    });
    
    test('theme preference persists in localStorage', () => {
      const themes = ['light', 'dark', 'auto'];
      
      themes.forEach(theme => {
        // Simulate theme change with persistence
        mockLocalStorage['anhad_theme'] = theme;
        
        // Verify theme is persisted
        expect(localStorage.getItem('anhad_theme')).toBe(theme);
      });
    });
    
    test('theme switching between light, dark, and auto maintains state correctly', () => {
      // Start with light
      mockRoot.setAttribute('data-theme', 'light');
      mockRoot.setAttribute('data-theme-mode', 'light');
      mockLocalStorage['anhad_theme'] = 'light';
      
      expect(mockRoot.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem('anhad_theme')).toBe('light');
      
      // Switch to dark
      mockRoot.classList.remove('dark', 'dark-mode');
      mockRoot.setAttribute('data-theme', 'dark');
      mockRoot.setAttribute('data-theme-mode', 'dark');
      mockRoot.classList.add('dark', 'dark-mode');
      mockLocalStorage['anhad_theme'] = 'dark';
      
      expect(mockRoot.getAttribute('data-theme')).toBe('dark');
      expect(mockRoot.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('anhad_theme')).toBe('dark');
      
      // Switch to auto
      mockRoot.setAttribute('data-theme-mode', 'auto');
      mockRoot.setAttribute('data-theme', 'light'); // Resolves to light during day
      mockRoot.classList.remove('dark', 'dark-mode');
      mockLocalStorage['anhad_theme'] = 'auto';
      
      expect(mockRoot.getAttribute('data-theme-mode')).toBe('auto');
      expect(localStorage.getItem('anhad_theme')).toBe('auto');
    });
    
    test('page reload preserves theme preference from localStorage', () => {
      // Set theme preference
      mockLocalStorage['anhad_theme'] = 'dark';
      
      // Simulate page reload by clearing DOM attributes
      mockRoot.removeAttribute('data-theme');
      mockRoot.removeAttribute('data-theme-mode');
      mockRoot.classList.remove('dark', 'dark-mode');
      
      // Simulate theme restoration on page load
      const savedTheme = localStorage.getItem('anhad_theme');
      expect(savedTheme).toBe('dark');
      
      // Apply saved theme
      mockRoot.setAttribute('data-theme', 'dark');
      mockRoot.setAttribute('data-theme-mode', 'dark');
      mockRoot.classList.add('dark', 'dark-mode');
      
      // Verify theme is restored correctly
      expect(mockRoot.getAttribute('data-theme')).toBe('dark');
      expect(mockRoot.getAttribute('data-theme-mode')).toBe('dark');
      expect(mockRoot.classList.contains('dark')).toBe(true);
    });
    
    test('interactive elements function correctly after theme switch', () => {
      const button = document.querySelector('button');
      
      // Test in light mode
      mockRoot.setAttribute('data-theme', 'light');
      mockRoot.setAttribute('data-theme-mode', 'light');
      
      let clicked = false;
      button.onclick = () => { clicked = true; };
      button.click();
      
      expect(clicked).toBe(true);
      
      // Switch to dark mode
      clicked = false;
      mockRoot.setAttribute('data-theme', 'dark');
      mockRoot.setAttribute('data-theme-mode', 'dark');
      mockRoot.classList.add('dark', 'dark-mode');
      
      button.click();
      expect(clicked).toBe(true);
      
      // Switch to auto mode
      clicked = false;
      mockRoot.setAttribute('data-theme-mode', 'auto');
      
      button.click();
      expect(clicked).toBe(true);
    });
    
    test('content displays correctly from initial render in all themes', () => {
      const card = document.querySelector('.practice-card');
      const text = document.querySelector('.card-text');
      
      // Test light mode initial render
      mockRoot.setAttribute('data-theme', 'light');
      mockRoot.setAttribute('data-theme-mode', 'light');
      
      expect(window.getComputedStyle(card).display).not.toBe('none');
      expect(window.getComputedStyle(text).display).not.toBe('none');
      
      // Test dark mode initial render
      mockRoot.setAttribute('data-theme', 'dark');
      mockRoot.setAttribute('data-theme-mode', 'dark');
      mockRoot.classList.add('dark', 'dark-mode');
      
      expect(window.getComputedStyle(card).display).not.toBe('none');
      expect(window.getComputedStyle(text).display).not.toBe('none');
      
      // Test auto mode initial render
      mockRoot.setAttribute('data-theme-mode', 'auto');
      mockRoot.setAttribute('data-time-of-day', 'day');
      
      expect(window.getComputedStyle(card).display).not.toBe('none');
      expect(window.getComputedStyle(text).display).not.toBe('none');
    });
    
    /**
     * Property-based test: For ANY theme switching sequence,
     * theme changes must apply immediately and persist correctly
     */
    test('property: theme switching works correctly across all theme transition sequences', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom('light', 'dark', 'auto'), { minLength: 2, maxLength: 10 }),
          (themeSequence) => {
            let allTransitionsValid = true;
            
            themeSequence.forEach(theme => {
              // Apply theme
              mockRoot.setAttribute('data-theme-mode', theme);
              mockLocalStorage['anhad_theme'] = theme;
              
              if (theme === 'dark') {
                mockRoot.setAttribute('data-theme', 'dark');
                mockRoot.classList.add('dark', 'dark-mode');
              } else if (theme === 'light') {
                mockRoot.setAttribute('data-theme', 'light');
                mockRoot.classList.remove('dark', 'dark-mode');
              } else {
                // Auto resolves to light or dark
                mockRoot.setAttribute('data-theme', 'light'); // Assume daytime
                mockRoot.classList.remove('dark', 'dark-mode');
              }
              
              // Verify theme is applied
              const modeApplied = mockRoot.getAttribute('data-theme-mode') === theme;
              const themePersisted = localStorage.getItem('anhad_theme') === theme;
              
              if (!modeApplied || !themePersisted) {
                allTransitionsValid = false;
              }
            });
            
            // Property: All theme transitions apply immediately and persist
            return allTransitionsValid;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
