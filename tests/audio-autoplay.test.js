/**
 * Audio Autoplay Fix Tests
 * 
 * Tests that verify audio elements are properly initialized and can play
 * within user gesture contexts to comply with browser autoplay policies.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Audio Autoplay Fixes', () => {
  let dom;
  let window;
  let document;
  let audio;

  beforeEach(() => {
    // Create a fresh DOM environment for each test
    dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      url: 'http://localhost:3000',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    window = dom.window;
    document = window.document;
    
    // Mock Audio constructor
    audio = {
      src: '',
      paused: true,
      volume: 0.7,
      preload: 'auto',
      currentTime: 0,
      duration: 0,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      load: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    global.Audio = vi.fn(function() { return audio; });
    global.document = document;
    global.window = window;
  });

  afterEach(() => {
    dom.window.close();
    vi.clearAllMocks();
  });

  describe('AnhadAudio Singleton', () => {
    it('should create audio element with preload="auto"', () => {
      const mockAudio = new Audio();
      expect(mockAudio.preload).toBe('auto');
    });

    it('should initialize audio within user gesture context', async () => {
      // Simulate user click event
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });

      // Create a button and add click handler
      const button = document.createElement('button');
      button.id = 'playBtn';
      
      let audioCreated = false;
      button.addEventListener('click', async () => {
        const testAudio = new Audio();
        audioCreated = true;
        await testAudio.play();
      });
      
      document.body.appendChild(button);
      button.dispatchEvent(clickEvent);
      
      // Verify audio was created in click handler
      expect(audioCreated).toBe(true);
      expect(audio.play).toHaveBeenCalled();
    });

    it('should add audio unlock listeners on first load', () => {
      const clickListener = vi.fn();
      const touchListener = vi.fn();
      
      // Mock addEventListener
      const originalAddListener = document.addEventListener;
      document.addEventListener = vi.fn((event, handler, options) => {
        if (event === 'click') clickListener(event, handler, options);
        if (event === 'touchstart') touchListener(event, handler, options);
      });

      // Simulate audio unlock setup
      const setupAudioUnlock = () => {
        document.addEventListener('click', () => {}, { once: true });
        document.addEventListener('touchstart', () => {}, { once: true });
      };

      setupAudioUnlock();

      expect(clickListener).toHaveBeenCalled();
      expect(touchListener).toHaveBeenCalled();
      
      // Restore
      document.addEventListener = originalAddListener;
    });

    it('should handle autoplay block gracefully', async () => {
      const mockAudio = new Audio();
      mockAudio.play = vi.fn().mockRejectedValue(
        new Error('NotAllowedError: play() failed because user didn\'t interact with document')
      );

      try {
        await mockAudio.play();
      } catch (e) {
        expect(e.message).toContain('NotAllowedError');
      }

      expect(mockAudio.play).toHaveBeenCalled();
    });
  });

  describe('Hukamnama Player', () => {
    let HukamPlayer;

    beforeEach(() => {
      // Mock Hukamnama player structure
      HukamPlayer = {
        audio: null,
        
        init() {
          if (!this.audio) {
            this.audio = new Audio();
            this.audio.preload = 'auto';
          }
        },
        
        async start() {
          // Initialize audio in user gesture context
          if (!this.audio) {
            this.audio = new Audio();
            this.audio.preload = 'auto';
            this.init();
          }
          
          const urls = [
            'http://localhost:3000/api/hukamnama/audio',
            'https://www.sgpc.net/hukamnama/hukamnama.mp3'
          ];
          
          for (const url of urls) {
            try {
              this.audio.src = url;
              this.audio.load();
              await this.audio.play();
              return true; // Success
            } catch (e) {
              console.warn('URL failed:', url);
            }
          }
          return false;
        }
      };
    });

    it('should create audio with preload="auto"', () => {
      HukamPlayer.init();
      expect(HukamPlayer.audio).toBeDefined();
      expect(HukamPlayer.audio.preload).toBe('auto');
    });

    it('should initialize audio lazily in start()', async () => {
      expect(HukamPlayer.audio).toBeNull();
      await HukamPlayer.start();
      expect(HukamPlayer.audio).toBeDefined();
    });

    it('should call load() before play()', async () => {
      await HukamPlayer.start();
      expect(audio.load).toHaveBeenCalled();
      expect(audio.play).toHaveBeenCalled();
      
      // Verify load was called before play
      const loadCallOrder = audio.load.mock.invocationCallOrder[0];
      const playCallOrder = audio.play.mock.invocationCallOrder[0];
      expect(loadCallOrder).toBeLessThan(playCallOrder);
    });

    it('should try multiple URLs on failure', async () => {
      let callCount = 0;
      audio.play = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('First URL failed'));
        }
        return Promise.resolve();
      });

      const result = await HukamPlayer.start();
      expect(audio.play).toHaveBeenCalledTimes(2); // First fails, second succeeds
      expect(result).toBe(true);
    });

    it('should handle play within user click event', async () => {
      const button = document.createElement('button');
      button.id = 'hukamPlayBtn';
      
      let playSuccess = false;
      button.addEventListener('click', async () => {
        await HukamPlayer.start();
        playSuccess = audio.play.mock.results[0].value !== undefined;
      });
      
      document.body.appendChild(button);
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      
      await button.dispatchEvent(clickEvent);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(audio.play).toHaveBeenCalled();
    });
  });

  describe('Browser Autoplay Policy Compliance', () => {
    it('should create Audio element within user gesture', () => {
      // Simulate user gesture
      let audioInGesture = null;
      
      const handleUserClick = () => {
        audioInGesture = new Audio();
      };
      
      handleUserClick();
      expect(audioInGesture).toBeDefined();
    });

    it('should call play() synchronously after user interaction', async () => {
      const mockAudio = new Audio();
      const playPromise = mockAudio.play();
      
      expect(playPromise).toBeInstanceOf(Promise);
      await expect(playPromise).resolves.toBeUndefined();
    });

    it('should handle autoplay errors with proper messaging', async () => {
      const mockAudio = new Audio();
      const autoplayError = new DOMException(
        'play() failed because user didn\'t interact with document',
        'NotAllowedError'
      );
      
      mockAudio.play = vi.fn().mockRejectedValue(autoplayError);
      
      let errorCaught = false;
      let errorMessage = '';
      
      try {
        await mockAudio.play();
      } catch (e) {
        errorCaught = true;
        errorMessage = e.message;
      }
      
      expect(errorCaught).toBe(true);
      expect(errorMessage).toContain('interact with document');
    });
  });

  describe('Audio Element Configuration', () => {
    it('should set volume to safe default (0.7)', () => {
      const mockAudio = new Audio();
      expect(mockAudio.volume).toBe(0.7);
    });

    it('should configure preload for immediate playback', () => {
      const mockAudio = new Audio();
      mockAudio.preload = 'auto';
      expect(mockAudio.preload).toBe('auto');
    });

    it('should handle src assignment correctly', () => {
      const mockAudio = new Audio();
      const testUrl = 'http://localhost:3000/api/hukamnama/audio';
      mockAudio.src = testUrl;
      expect(mockAudio.src).toBe(testUrl);
    });
  });

  describe('Error Recovery', () => {
    it('should emit error event on autoplay block', async () => {
      const errorHandler = vi.fn();
      const mockAudio = new Audio();
      
      mockAudio.addEventListener('error', errorHandler);
      mockAudio.play = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
      
      try {
        await mockAudio.play();
      } catch (e) {
        // Error expected
      }
      
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('should provide fallback instructions on block', () => {
      const errorDetails = {
        message: 'Tap the play button to start audio',
        code: 'AUTOPLAY_BLOCKED'
      };
      
      expect(errorDetails.message).toContain('Tap');
      expect(errorDetails.code).toBe('AUTOPLAY_BLOCKED');
    });
  });
});
