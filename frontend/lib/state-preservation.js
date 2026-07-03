/**
 * State Preservation Library for ANHAD
 * 
 * This library saves and restores page state (scroll position, form data, UI state)
 * across navigations to ensure smooth back button functionality.
 * 
 * Usage:
 * - Automatically saves state before navigation (via smooth-navigation.js integration)
 * - Automatically restores state on page load (via page-lifecycle.js integration)
 * - Can be manually called: StatePreservation.saveState() / StatePreservation.restoreState()
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'anhad_page_state';
  const CURRENT_PAGE_KEY = 'anhad_current_page';

  const StatePreservation = {
    /**
     * Save current page state to sessionStorage
     */
    saveState: function() {
      try {
        const state = {
          url: window.location.href,
          timestamp: Date.now(),
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          formData: this._captureFormData(),
          uiState: this._captureUIState()
        };

        // Store state keyed by URL
        const allStates = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
        allStates[state.url] = state;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(allStates));
        
        // Mark current page
        sessionStorage.setItem(CURRENT_PAGE_KEY, state.url);
        
        console.log('[StatePreservation] Saved state for:', state.url);
      } catch (e) {
        console.warn('[StatePreservation] Failed to save state:', e);
      }
    },

    /**
     * Restore page state from sessionStorage
     */
    restoreState: function() {
      try {
        const currentUrl = window.location.href;
        const allStates = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
        const state = allStates[currentUrl];

        if (!state) {
          console.log('[StatePreservation] No saved state for:', currentUrl);
          return;
        }

        // Restore scroll position
        if (state.scrollY !== undefined || state.scrollX !== undefined) {
          window.scrollTo(state.scrollX || 0, state.scrollY || 0);
        }

        // Restore form data
        if (state.formData) {
          this._restoreFormData(state.formData);
        }

        // Restore UI state
        if (state.uiState) {
          this._restoreUIState(state.uiState);
        }

        console.log('[StatePreservation] Restored state for:', currentUrl);
      } catch (e) {
        console.warn('[StatePreservation] Failed to restore state:', e);
      }
    },

    /**
     * Clear saved state for current page
     */
    clearState: function() {
      try {
        const currentUrl = window.location.href;
        const allStates = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
        delete allStates[currentUrl];
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(allStates));
        console.log('[StatePreservation] Cleared state for:', currentUrl);
      } catch (e) {
        console.warn('[StatePreservation] Failed to clear state:', e);
      }
    },

    /**
     * Clear all saved states
     */
    clearAllStates: function() {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(CURRENT_PAGE_KEY);
        console.log('[StatePreservation] Cleared all states');
      } catch (e) {
        console.warn('[StatePreservation] Failed to clear all states:', e);
      }
    },

    /**
     * Capture form data from all forms on the page
     */
    _captureFormData: function() {
      const formData = {};
      const forms = document.querySelectorAll('form');
      
      forms.forEach((form, formIndex) => {
        formData[`form_${formIndex}`] = {
          action: form.action,
          method: form.method,
          fields: {}
        };

        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach((input) => {
          if (input.name || input.id) {
            const key = input.name || input.id;
            if (input.type === 'checkbox' || input.type === 'radio') {
              formData[`form_${formIndex}`].fields[key] = input.checked;
            } else if (input.type === 'select-multiple') {
              formData[`form_${formIndex}`].fields[key] = Array.from(input.selectedOptions).map(opt => opt.value);
            } else {
              formData[`form_${formIndex}`].fields[key] = input.value;
            }
          }
        });
      });

      return formData;
    },

    /**
     * Restore form data
     */
    _restoreFormData: function(formData) {
      Object.keys(formData).forEach(formKey => {
        const formState = formData[formKey];
        const form = document.querySelector(`form[action="${formState.action}"]`) || 
                     document.querySelectorAll('form')[parseInt(formKey.split('_')[1])];
        
        if (!form) return;

        Object.keys(formState.fields).forEach(fieldKey => {
          const value = formState.fields[fieldKey];
          const input = form.querySelector(`[name="${fieldKey}"]`) || 
                       form.querySelector(`#${fieldKey}`);
          
          if (!input) return;

          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = value;
          } else if (input.type === 'select-multiple') {
            Array.from(input.options).forEach(opt => {
              opt.selected = value.includes(opt.value);
            });
          } else {
            input.value = value;
          }
        });
      });
    },

    /**
     * Capture UI state (active tabs, expanded sections, etc.)
     */
    _captureUIState: function() {
      const uiState = {};

      // Capture active tabs (common pattern: .tab.active)
      const activeTabs = document.querySelectorAll('.tab.active, [data-tab].active');
      activeTabs.forEach((tab, index) => {
        uiState[`activeTab_${index}`] = {
          selector: this._getSelector(tab),
          parent: this._getSelector(tab.parentElement)
        };
      });

      // Capture expanded/collapsed state (common pattern: .expanded, .collapsed)
      const expandedElements = document.querySelectorAll('.expanded, [aria-expanded="true"]');
      expandedElements.forEach((el, index) => {
        uiState[`expanded_${index}`] = {
          selector: this._getSelector(el)
        };
      });

      // Capture custom data attributes that might represent state
      const statefulElements = document.querySelectorAll('[data-state]');
      statefulElements.forEach((el, index) => {
        uiState[`dataState_${index}`] = {
          selector: this._getSelector(el),
          state: el.dataset.state
        };
      });

      return uiState;
    },

    /**
     * Restore UI state
     */
    _restoreUIState: function(uiState) {
      Object.keys(uiState).forEach(key => {
        const state = uiState[key];
        
        if (key.startsWith('activeTab_')) {
          const element = document.querySelector(state.selector);
          if (element) {
            // Remove active class from siblings
            const siblings = element.parentElement.querySelectorAll('.tab, [data-tab]');
            siblings.forEach(s => s.classList.remove('active'));
            element.classList.add('active');
          }
        } else if (key.startsWith('expanded_')) {
          const element = document.querySelector(state.selector);
          if (element) {
            element.classList.add('expanded');
            element.setAttribute('aria-expanded', 'true');
          }
        } else if (key.startsWith('dataState_')) {
          const element = document.querySelector(state.selector);
          if (element) {
            element.dataset.state = state.state;
          }
        }
      });
    },

    /**
     * Get a unique selector for an element
     */
    _getSelector: function(element) {
      if (element.id) {
        return `#${element.id}`;
      }
      if (element.className) {
        const classes = element.className.split(' ').filter(c => c).join('.');
        return `.${classes}`;
      }
      return element.tagName.toLowerCase();
    }
  };

  // Expose to global scope
  window.StatePreservation = StatePreservation;

  // Auto-save state before navigation
  // This integrates with smooth-navigation.js
  document.addEventListener('DOMContentLoaded', function() {
    // Restore state on page load
    if (document.referrer && sessionStorage.getItem(CURRENT_PAGE_KEY) !== window.location.href) {
      // We're navigating back to this page
      setTimeout(() => StatePreservation.restoreState(), 100);
    }
  });

  // Save state before navigation
  window.addEventListener('pagehide', function() {
    StatePreservation.saveState();
  });

  // Also save state when using smooth-navigation
  if (window.navigateTo) {
    const originalNavigateTo = window.navigateTo;
    window.navigateTo = function(url, options) {
      StatePreservation.saveState();
      return originalNavigateTo(url, options);
    };
  }

  // Integrate with page-lifecycle.js pageshow event
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      // Page was restored from bfcache
      StatePreservation.restoreState();
    }
  });

})();
