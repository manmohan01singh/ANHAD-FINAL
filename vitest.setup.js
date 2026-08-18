// Vitest setup file
// Runs before each test file
import fs from 'node:fs';
import path from 'node:path';
import { vi } from 'vitest';

// Compatibility alias for existing suites using Jest globals
global.jest = vi;

// Load AnhadAudio singleton code once
const singletonPath = path.resolve(process.cwd(), 'frontend/lib/anhad-audio-singleton.js');
let singletonCode = '';
try {
  if (fs.existsSync(singletonPath)) {
    singletonCode = fs.readFileSync(singletonPath, 'utf8');
  }
} catch (e) {}

// Mock global browser APIs that might not exist in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock MediaSession API (for media controls)
if (!('mediaSession' in navigator)) {
  navigator.mediaSession = {
    metadata: null,
    playbackState: 'none',
    setActionHandler: () => {},
    setPositionState: () => {},
  };
}

// Mock Notification API
global.Notification = class Notification {
  constructor(title, options) {
    this.title = title;
    this.options = options;
  }
  static permission = 'default';
  static requestPermission() {
    return Promise.resolve('granted');
  }
  close() {}
};

// Mock BroadcastChannel
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
  }
  postMessage(message) {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
};

// Mock Service Worker
if (!('serviceWorker' in navigator)) {
  navigator.serviceWorker = {
    register: () => Promise.resolve({ scope: '/' }),
    ready: Promise.resolve({ active: { postMessage: () => {} } }),
    controller: { postMessage: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

// Mock AudioContext
global.AudioContext = class AudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = {};
  }
  createGain() {
    return {
      gain: { value: 1 },
      connect: () => {},
      disconnect: () => {},
    };
  }
  createMediaElementSource() {
    return { connect: () => {}, disconnect: () => {} };
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
};

// Mock Audio API (HTMLAudioElement) - Enhanced for PWA testing
global.Audio = class Audio {
  constructor(src) {
    this.src = src;
    this.currentTime = 0;
    this.duration = 0;
    this.paused = true;
    this.volume = 1;
    this.playbackRate = 1;
    this.readyState = 0;
    this.networkState = 0;
    this.ended = false;
    this._eventListeners = {};
  }

  play() {
    this.paused = false;
    this._trigger('play');
    this._trigger('playing');
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this._trigger('pause');
  }

  load() {
    this.readyState = 4;
    this._trigger('loadstart');
    this._trigger('loadedmetadata');
    this._trigger('loadeddata');
    this._trigger('canplay');
    this._trigger('canplaythrough');
  }

  setAttribute(name, value) {
    this[name] = value;
  }

  getAttribute(name) {
    return this[name] ?? null;
  }

  removeAttribute(name) {
    delete this[name];
  }

  addEventListener(event, handler, options) {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = [];
    }
    this._eventListeners[event].push({ handler, options });
  }

  removeEventListener(event, handler) {
    if (this._eventListeners[event]) {
      this._eventListeners[event] = this._eventListeners[event].filter(
        (listener) => listener.handler !== handler
      );
    }
  }

  _trigger(event) {
    if (this._eventListeners[event]) {
      this._eventListeners[event].forEach(({ handler, options }) => {
        handler.call(this, { type: event, target: this });
        if (options?.once) {
          this.removeEventListener(event, handler);
        }
      });
    }
  }
};

// Mock requestAnimationFrame & cancelAnimationFrame
let rafId = 0;
global.requestAnimationFrame = (callback) => {
  rafId++;
  setTimeout(() => callback(Date.now()), 16);
  return rafId;
};
global.cancelAnimationFrame = (id) => {
  // No-op for testing
};

// Mock Page Visibility API
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false,
});

Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible',
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock CustomEvent
global.CustomEvent = class CustomEvent extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.detail = options.detail;
  }
};

// Mock fetch for API calls
global.fetch = async (url, options) => {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
    blob: async () => new Blob(),
  };
};

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
  get length() {
    return Object.keys(this.store).length;
  },
  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  },
};

global.localStorage = localStorageMock;
global.sessionStorage = { ...localStorageMock, store: {} };

// Mock console methods to reduce noise in tests (can be commented out for debugging)
const originalConsole = { ...console };
global.console = {
  ...console,
  log: () => {}, // Silence logs during tests
  warn: () => {},
  error: () => {}, // Comment these out to see errors during test development
  debug: () => {},
  info: () => {},
};

// Export original console for tests that need it
global.originalConsole = originalConsole;

// Mock MediaMetadata
global.MediaMetadata = class MediaMetadata {
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
window.MediaMetadata = global.MediaMetadata;
window.Audio = global.Audio;

function initAnhadAudioSingleton() {
  if (singletonCode) {
    try {
      if (window.AnhadAudio) delete window.AnhadAudio;
      const fn = new Function('window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'location', 'Audio', 'MediaMetadata', singletonCode);
      fn(window, document, navigator, global.localStorage, global.sessionStorage, window.location, global.Audio, global.MediaMetadata);
      if (window.AnhadAudio) {
        global.AnhadAudio = window.AnhadAudio;
      }
      if (window.AnhadOverlayPlayer) {
        global.AnhadOverlayPlayer = window.AnhadOverlayPlayer;
      }
      if (window.AnhadMiniPlayer) {
        global.AnhadMiniPlayer = window.AnhadMiniPlayer;
      }
    } catch (e) {
      if (typeof originalConsole !== 'undefined' && originalConsole.error) {
        originalConsole.error('[Vitest Setup] AnhadAudio error:', e);
      }
    }
  }
}

// Initialize immediately
initAnhadAudioSingleton();

// Ensure it's re-attached in beforeEach for every test
beforeEach(() => {
  initAnhadAudioSingleton();
});


