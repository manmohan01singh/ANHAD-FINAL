/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD EVENT SERVICE - Centralized Event Management
 * Single source of truth for all Gurpurab events across the app
 * Eliminates duplicate API calls and inconsistent event state
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  // Singleton pattern - only one EventService instance per page
  if (window.AnhadEventService) {
    console.log('[EventService] Already initialized, returning existing instance');
    return;
  }

  const EventService = {
    // Internal state
    _events: null,
    _upcomingEvent: null,
    _todayEvents: null,
    _lastFetch: null,
    _fetchPromise: null,
    _cacheKey: 'anhad_cached_upcoming_gurpurab',
    _cacheDuration: 6 * 60 * 60 * 1000, // 6 hours

    /**
     * Fetch and cache events from JSON file
     * Returns: Promise<Array<Event>>
     */
    async fetchEvents() {
      // If already fetching, return the existing promise
      if (this._fetchPromise) {
        return this._fetchPromise;
      }

      // Check cache first
      const cached = this._getFromCache();
      if (cached) {
        console.log('[EventService] Using cached events');
        this._events = cached.events;
        this._upcomingEvent = cached.upcomingEvent;
        this._todayEvents = cached.todayEvents;
        this._lastFetch = cached.timestamp;
        return this._events;
      }

      // Fetch from JSON
      this._fetchPromise = this._fetchFromServer()
        .then(events => {
          this._fetchPromise = null;
          return events;
        })
        .catch(err => {
          this._fetchPromise = null;
          throw err;
        });

      return this._fetchPromise;
    },

    async _fetchFromServer() {
      try {
        const dataUrl = (window.ANHAD_ROOT || '') + 'data/gurpurab-events-2026.json';
        console.log('[EventService] Fetching events from:', dataUrl);
        
        const response = await fetch(dataUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const rawEvents = data.years['2026'] || [];

        // Filter: Guru-related events only (exclude Dastar Bandi etc.)
        const guruKeywords = [
          'guru nanak', 'ਗੁਰੂ ਨਾਨਕ',
          'guru angad', 'ਗੁਰੂ ਅੰਗਦ',
          'guru amar das', 'ਗੁਰੂ ਅਮਰ ਦਾਸ',
          'guru ram das', 'ਗੁਰੂ ਰਾਮ ਦਾਸ',
          'guru arjan', 'ਗੁਰੂ ਅਰਜਨ',
          'guru hargobind', 'ਗੁਰੂ ਹਰਿਗੋਬਿੰਦ', 'guru har gobind', 'ਗੁਰੂ ਹਰਗੋਬਿੰਦ',
          'guru har rai', 'ਗੁਰੂ ਹਰਿ ਰਾਇ',
          'guru harkrishan', 'ਗੁਰੂ ਹਰਿ ਕ੍ਰਿਸ਼ਨ', 'guru har krishan', 'ਗੁਰੂ ਹਰਿਕ੍ਰਿਸ਼ਨ',
          'guru tegh bahadur', 'ਗੁਰੂ ਤੇਗ ਬਹਾਦੁਰ', 'guru teg bahadur', 'ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ',
          'guru gobind singh', 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ',
          'guru granth', 'ਗੁਰੂ ਗ੍ਰੰਥ', 'granth sahib', 'ਗ੍ਰੰਥ ਸਾਹਿਬ', 'sggs', 'sampuranta', 'first-parkash',
          'bandi chhor', 'khalsa', 'vaisakhi', 'sahibzade'
        ];

        const events = rawEvents
          .filter(e => {
            // Skip Dastar Bandi events
            const name = String(e.name_en || '').toLowerCase();
            const namePa = String(e.name_pa || '').toLowerCase();
            const id = String(e.id || '').toLowerCase();
            
            if (name.includes('dastar') || id.includes('dastar')) return false;

            // Check if any guru keyword matches
            return guruKeywords.some(keyword => 
              name.includes(keyword) || namePa.includes(keyword) || id.includes(keyword)
            );
          })
          .map(e => this._parseEvent(e))
          .filter(e => e.date) // Remove events with invalid dates
          .sort((a, b) => a.date - b.date);

        console.log('[EventService] Parsed events:', events.length);

        // Separate today and upcoming
        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        this._todayEvents = events.filter(e => e.date.getTime() === todayMidnight.getTime());
        const futureEvents = events.filter(e => e.date > todayMidnight);
        this._upcomingEvent = futureEvents.length > 0 ? futureEvents[0] : null;
        this._events = events;
        this._lastFetch = Date.now();

        // Cache the results
        this._saveToCache();

        return events;

      } catch (error) {
        console.error('[EventService] Fetch failed:', error);
        throw error;
      }
    },

    /**
     * Parse raw event object into standardized format
     */
    _parseEvent(rawEvent) {
      try {
        // Parse date safely (calendar date, not timestamp)
        const [year, month, day] = rawEvent.gregorian_date.split('-').map(Number);
        const date = new Date(year, month - 1, day); // Month is 0-indexed

        // Validate date
        if (isNaN(date.getTime())) {
          console.warn('[EventService] Invalid date for event:', rawEvent);
          return null;
        }

        return {
          name: rawEvent.name_en || 'Gurpurab',
          name_pa: rawEvent.name_pa || '',
          id: rawEvent.id || '',
          date: date,
          dateString: rawEvent.gregorian_date,
          type: rawEvent.type || 'gurpurab',
          eventCategory: this._classifyEventType(rawEvent.type, rawEvent.name_en),
          guruId: this._extractGuruId(rawEvent)
        };
      } catch (error) {
        console.error('[EventService] Error parsing event:', rawEvent, error);
        return null;
      }
    },

    /**
     * Classify event type for UI display
     */
    _classifyEventType(type, name) {
      if (!type) return 'gurpurab';
      
      const typeL = String(type).toLowerCase();
      const nameL = String(name).toLowerCase();

      if (typeL.includes('parkash') || nameL.includes('parkash')) return 'parkash';
      if (typeL.includes('jyoti') || typeL.includes('shaheedi') || nameL.includes('shaheedi')) return 'shaheedi';
      if (typeL.includes('samapti') || typeL.includes('sampuranta')) return 'samapti';
      if (nameL.includes('bandi chhor') || nameL.includes('diwali')) return 'special';
      if (nameL.includes('vaisakhi') || nameL.includes('khalsa')) return 'special';

      return 'gurpurab';
    },

    /**
     * Extract Guru ID from event for portrait matching
     */
    _extractGuruId(event) {
      const searchStr = `${event.name_en} ${event.name_pa} ${event.id}`.toLowerCase();

      const mapping = {
        'guru nanak': 'guru-nanak',
        'guru angad': 'guru-angad',
        'guru amar das': 'guru-amar-das',
        'guru ram das': 'guru-ram-das',
        'guru arjan': 'guru-arjan',
        'guru hargobind': 'guru-hargobind',
        'guru har gobind': 'guru-hargobind',
        'bandi chhor': 'guru-hargobind',
        'guru har rai': 'guru-har-rai',
        'guru harkrishan': 'guru-harkrishan',
        'guru har krishan': 'guru-harkrishan',
        'guru tegh bahadur': 'guru-teg-bahadur',
        'guru teg bahadur': 'guru-teg-bahadur',
        'guru gobind': 'guru-gobind',
        'sahibzade': 'guru-gobind',
        'vaisakhi': 'guru-gobind',
        'khalsa': 'guru-gobind',
        'guru granth': 'sggs',
        'granth sahib': 'sggs',
        'sampuranta': 'sggs',
        'first-parkash': 'sggs'
      };

      for (const [keyword, guruId] of Object.entries(mapping)) {
        if (searchStr.includes(keyword)) {
          return guruId;
        }
      }

      return null;
    },

    /**
     * Calculate days remaining until event
     */
    _calculateDaysLeft(eventDate) {
      if (!eventDate || isNaN(eventDate.getTime())) {
        return null;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const event = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      
      const diffTime = event - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    },

    /**
     * Get formatted date string
     */
    _formatDate(date) {
      if (!date) return '';
      
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    },

    /**
     * Cache management
     */
    _getFromCache() {
      try {
        const cached = localStorage.getItem(this._cacheKey);
        if (!cached) return null;

        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        if (age > this._cacheDuration) {
          console.log('[EventService] Cache expired');
          localStorage.removeItem(this._cacheKey);
          return null;
        }

        // Reconstruct Date objects
        if (data.events) {
          data.events = data.events.map(e => ({
            ...e,
            date: new Date(e.date)
          }));
        }
        if (data.upcomingEvent && data.upcomingEvent.date) {
          data.upcomingEvent.date = new Date(data.upcomingEvent.date);
        }
        if (data.todayEvents) {
          data.todayEvents = data.todayEvents.map(e => ({
            ...e,
            date: new Date(e.date)
          }));
        }

        return data;
      } catch (error) {
        console.error('[EventService] Cache read error:', error);
        return null;
      }
    },

    _saveToCache() {
      try {
        const data = {
          events: this._events,
          upcomingEvent: this._upcomingEvent,
          todayEvents: this._todayEvents,
          timestamp: this._lastFetch
        };
        localStorage.setItem(this._cacheKey, JSON.stringify(data));
        console.log('[EventService] Saved to cache');
      } catch (error) {
        console.error('[EventService] Cache write error:', error);
      }
    },

    /**
     * Public API - Get upcoming event with countdown
     */
    async getUpcomingEvent() {
      if (!this._events) {
        await this.fetchEvents();
      }

      if (!this._upcomingEvent) {
        return null;
      }

      const daysLeft = this._calculateDaysLeft(this._upcomingEvent.date);
      const formattedDate = this._formatDate(this._upcomingEvent.date);

      return {
        ...this._upcomingEvent,
        daysLeft: daysLeft,
        daysLeftText: daysLeft !== null ? `${daysLeft} days left` : 'Coming Soon',
        formattedDate: formattedDate,
        isToday: daysLeft === 0,
        isValid: daysLeft !== null
      };
    },

    /**
     * Public API - Get today's events
     */
    async getTodayEvents() {
      if (!this._events) {
        await this.fetchEvents();
      }

      return this._todayEvents || [];
    },

    /**
     * Public API - Get all events
     */
    async getAllEvents() {
      if (!this._events) {
        await this.fetchEvents();
      }

      return this._events || [];
    },

    /**
     * Public API - Force refresh (bypasses cache)
     */
    async refresh() {
      console.log('[EventService] Force refreshing events');
      this._events = null;
      this._upcomingEvent = null;
      this._todayEvents = null;
      this._lastFetch = null;
      localStorage.removeItem(this._cacheKey);
      return this.fetchEvents();
    },

    /**
     * Public API - Get event by date
     */
    async getEventByDate(date) {
      if (!this._events) {
        await this.fetchEvents();
      }

      const searchDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return this._events.find(e => e.date.getTime() === searchDate.getTime()) || null;
    }
  };

  // Export globally
  window.AnhadEventService = EventService;
  console.log('[EventService] Initialized successfully');

  // Auto-fetch on page load (async, non-blocking)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      EventService.fetchEvents().catch(err => {
        console.error('[EventService] Auto-fetch failed:', err);
      });
    });
  } else {
    EventService.fetchEvents().catch(err => {
      console.error('[EventService] Auto-fetch failed:', err);
    });
  }

})();
