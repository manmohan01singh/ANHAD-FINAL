/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD AUDIO SINGLETON — Rebuilt Production Rebuild
 * 
 * Subsystems:
 *   1. PlaybackQueueController (Promise-serialized HTML5 Audio wrapper)
 *   2. VirtualLiveBroadcastEngine (Pure UTC television-style scheduler)
 *   3. DarbarLiveSubsystem (Dedicated true live-stream player)
 *   4. MediaSessionCoordinator (OS lockscreen integration)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Prevent double-init
  if (window.AnhadAudio && window.AnhadAudio._singleton) return;

  const STATE_KEY = 'anhad_audio_state_v4';
  const DURATION_CACHE_KEY = 'anhad_audio_track_durations_v4';
  
  const CDN_BASE_R2 = 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev';
  const CDN_BASE_SIMRAN = 'https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev/waheguru';
  const SGPC_LIVE = 'https://live.sgpc.net:8443/;nocache=1';
  
  const VIRTUAL_LIVE_EPOCH_START = 1704067200; // 2024-01-01 00:00:00 UTC
  
  const AMRITVELA_KNOWN_DURATIONS = {
    2: 5191, 5: 5638, 10: 5591, 12: 5633, 13: 6537, 14: 5640,
    18: 6038, 21: 6026, 23: 4899, 25: 5771, 29: 5136, 30: 5755,
    31: 5181, 32: 5747, 33: 6628, 34: 5990, 35: 4796, 37: 5717
  };
  const SIMRAN_KNOWN_DURATIONS = {
    0: 2747, 1: 2676, 5: 2379, 9: 2250, 10: 2287, 11: 2116,
    12: 2250, 13: 2080, 14: 2062, 15: 2455, 17: 2024, 21: 1951,
    23: 1959, 24: 1994, 25: 2262, 26: 2136, 27: 2477, 28: 1895,
    31: 5371, 32: 2019, 34: 2282, 37: 3167
  };

  // Asset base resolution
  const SCRIPT_BASE = (() => {
    try {
      const scripts = document.querySelectorAll('script[src]');
      for (const s of scripts) {
        if (s.src.includes('anhad-audio-singleton')) {
          return s.src.replace(/lib\/anhad-audio-singleton\.js.*$/, '');
        }
      }
    } catch (e) { }
    return '';
  })();

  function resolveAsset(filename) {
    return SCRIPT_BASE ? SCRIPT_BASE + 'assets/' + filename : 'assets/' + filename;
  }

  const STREAMS = {
    darbar: {
      name: 'Darbar Sahib Live',
      subtitle: 'Sri Harmandir Sahib Ji',
      url: SGPC_LIVE,
      artwork: resolveAsset('HERO CARD IMAGES/day-darbar-sahib.webp'),
      artworkSlots: {
        morning: resolveAsset('HERO CARD IMAGES/morning-darbar-sahib.webp'),
        day: resolveAsset('HERO CARD IMAGES/day-darbar-sahib.webp'),
        evening: resolveAsset('HERO CARD IMAGES/evening-darbar-sahib.webp'),
        night: resolveAsset('HERO CARD IMAGES/night-darbar-sahib.webp')
      },
      type: 'live',
      playerPage: 'GurbaniRadio/gurbani-radio.html'
    },
    amritvela: {
      name: 'Amritvela Kirtan',
      subtitle: 'ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦੀ ਬਾਣੀ',
      artwork: resolveAsset('HERO CARD IMAGES/day-amritvela-kirtan.webp'),
      artworkSlots: {
        morning: resolveAsset('HERO CARD IMAGES/morning-amritvela-kirtan.webp'),
        day: resolveAsset('HERO CARD IMAGES/day-amritvela-kirtan.webp'),
        evening: resolveAsset('HERO CARD IMAGES/evening-amritvela-kirtan.webp'),
        night: resolveAsset('HERO CARD IMAGES/night-amritvela-kirtan.webp')
      },
      type: 'playlist',
      totalTracks: 40,
      defaultTrackDuration: 3600,
      playerPage: 'GurbaniRadio/gurbani-radio.html',
      getTrackUrl(index) {
        const safeIndex = ((index % 40) + 40) % 40 + 1;
        return `${CDN_BASE_R2}/day-${safeIndex}.webm?v=2.1.5`;
      }
    },
    simran: {
      name: 'Waheguru Simran',
      subtitle: 'Amritvela Trust',
      artwork: resolveAsset('HERO CARD IMAGES/day-waheguru-simran.webp'),
      type: 'playlist',
      totalTracks: 38,
      defaultTrackDuration: 3600,
      playerPage: 'GurbaniRadio/gurbani-radio.html',
      getTrackUrl(index) {
        const simranTracks = [
          '01 - DEENANATH SUNO WAHEGURU SIMRAN DAY 1.mp3', 
          '02 - TUM KARO DAYA WAHEGURU SIMRAIN DAY 2.mp3', 
          '03 - SUNN YAAR HAMARE SAJAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '04 - SUKH NAAHI RE HAR BHAGAT BINA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '05 - TU PRABH DATA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '06 - SATNAM WAHEGURU - SIMRAN - AMRITVELA TRUST..mp3',
          '07 - MERE RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '08 - RAKHWALA SIMRAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '09 - AAS PYAASI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '10 - PRABH PAAS JAN KI ARDAS - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '11 - TU HI TU HI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '12 - NAAM NAAM NAAM APNA NAAM DEHO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '13 - DHAN GURU RAMDAS JI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '14 - AAO SAJANA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '15 - TUJ BIN KAVAN HAMARA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '16 - MERA BAID GURU GOVINDA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '17 - JAGAN TE SUPNA BHALA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '18 - EH NEECH KARAM HAR MERE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '19 - APNA NAAM JAPAO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '20 - MERE PYAARE SATUGURU JI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '21 - RAKH LEHO BHAGWAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '22 - KAB GAL LAVENGE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '23 - MERE RAM MERE RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '24 - RAKHEYA KARO SIMRAN DAY 25.mp3',
          '25 - WAHEGURU SIMRAN UTH NAAM JAP AMRITVELA TRUST BEST SIMRAN.mp3', 
          '26 - BEST WAHEGURU SIMRAN DAY 27 CHALIYA 2020.mp3', 
          '27 - KAD NANAK AAVE VARI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '28 - BIN GUR NA PAVAIGO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '29 - KIYO SHINGAR MILAN KE TAAYEE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '30 - NAAM BINA NAHI JEEVIA JAYE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '31 - AATH PEHAR SIMRO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '32 - MIL MERE PREETMA JEEO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '33 - SATNAM SHRI WAHEGURU SIMRAN DAY 35 CHALIYA 2020.mp3',
          '34 - RAKH RAKH MERE BEETHLA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '35 - PRAAN ADHAARA RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '36 - DHAN BABA NANAK - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '37 - SUNN MANN MITTAR PYAREYA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', 
          '38 - MERE SATGUR PYARE GURNANAK AAJA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3'
        ];
        const safeIndex = ((index % 38) + 38) % 38;
        const filename = simranTracks[safeIndex];
        return `${CDN_BASE_SIMRAN}/${encodeURIComponent(filename)}?v=2.1.5`;
      }
    }
  };

  function getSimranTitles() {
    return [
      'DEENANATH SUNO WAHEGURU SIMRAN',
      'TUM KARO DAYA MERE SAI WAHEGURU SIMRAN',
      'SUNN YAAR HAMARE SAJAN WAHEGURU SIMRAN',
      'SUKH NAAHI RE HAR HAR BIN WAHEGURU SIMRAN',
      'TU PRABH DATA WAHEGURU SIMRAN',
      'SATNAM WAHEGURU WAHEGURU SIMRAN',
      'MERE RAM HAR JAN KE JI PRAN WAHEGURU SIMRAN',
      'RAKHWALA SIMRAN',
      'AAS PYAASI MERE PRITAMA WAHEGURU SIMRAN',
      'PRABH PAAS JAN KI ARDAS WAHEGURU SIMRAN',
      'TU HI TU HI WAHEGURU SIMRAN',
      'NAAM NAAM NAAM APNA NAAM DEHO WAHEGURU SIMRAN',
      'DHAN GURU RAMDAS JI WAHEGURU SIMRAN',
      'AAO SAJANA WAHEGURU SIMRAN',
      'TUJ BIN KAVAN HAMARA WAHEGURU SIMRAN',
      'MERA BAID GURU GOVINDA WAHEGURU SIMRAN',
      'JAGAN TE SUPNA BHALA WAHEGURU SIMRAN',
      'EH NEECH KARAM HAR MERE WAHEGURU SIMRAN',
      'APNA NAAM JAPAO MERE RAM WAHEGURU SIMRAN',
      'MERE PYAARE SATUGURU JI WAHEGURU SIMRAN',
      'RAKHA LEHO BHAGWAN WAHEGURU SIMRAN',
      'KAB GAL LAVENGE WAHEGURU SIMRAN',
      'MERE RAM MERE RAM WAHEGURU SIMRAN',
      'RAKHEYA KARO WAHEGURU SIMRAN',
      'WAHEGURU SIMRAN UTH NAAM JAP',
      'BEST WAHEGURU SIMRAN',
      'KAD NANAK AAVE VARI WAHEGURU SIMRAN',
      'BIN GUR NA PAVAIGO WAHEGURU SIMRAN',
      'KIYO SHINGAR MILAN KE TAAYEE WAHEGURU SIMRAN',
      'NAAM BINA NAHI JEEVIA JAYE WAHEGURU SIMRAN',
      'AATH PEHAR SIMRO WAHEGURU SIMRAN',
      'MIL MERE PREETMA JEEO WAHEGURU SIMRAN',
      'SATNAM SHRI WAHEGURU WAHEGURU SIMRAN',
      'RAKH RAKH MERE BEETHLA WAHEGURU SIMRAN',
      'PRAAN ADHAARA RAM WAHEGURU SIMRAN',
      'DHAN BABA NANAK WAHEGURU SIMRAN',
      'SUNN MANN MITTAR PYAREYA WAHEGURU SIMRAN',
      'MERE SATGUR PYARE GURNANAK AAJA'
    ];
  }

  // ─── STATE MANAGEMENT ───
  let currentStream = null;
  let isPlaying = false;
  let isLoading = false;
  let currentTrackIndex = 0;
  let currentTrackTitle = '';
  let currentTrackArtist = '';
  let manualOffset = 0; // seconds behind live edge
  let pauseAnchor = null; // { timestamp, offset }

  const listeners = {
    statechange: [],
    loading: [],
    timeupdate: [],
    error: []
  };

  function emit(event, data) {
    const list = listeners[event] || [];
    list.forEach(fn => { try { fn(data); } catch(e) {} });
  }

  function on(event, callback) {
    if (listeners[event]) listeners[event].push(callback);
    return () => off(event, callback);
  }

  function off(event, callback) {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(fn => fn !== callback);
    }
  }

  function getDurationCache() {
    try {
      return JSON.parse(localStorage.getItem(DURATION_CACHE_KEY) || '{}');
    } catch(e) {
      return {};
    }
  }

  function getCachedTrackDuration(streamName, trackIndex) {
    const stream = STREAMS[streamName];
    const fallback = stream ? stream.defaultTrackDuration || 3600 : 3600;
    const known = streamName === 'amritvela'
      ? AMRITVELA_KNOWN_DURATIONS[trackIndex]
      : streamName === 'simran'
        ? SIMRAN_KNOWN_DURATIONS[trackIndex]
        : null;
    if (Number.isFinite(known)) return known;
    return fallback;
  }

  function saveDurationToCache(streamName, trackIndex, duration) {
    if (!streamName || !Number.isFinite(duration) || duration <= 60) return;
    try {
      const cache = getDurationCache();
      cache[streamName] = cache[streamName] || {};
      cache[streamName][trackIndex] = Math.round(duration);
      localStorage.setItem(DURATION_CACHE_KEY, JSON.stringify(cache));
    } catch(e) {}
  }

  // ─── SHUFFLE ENGINE ───
  function regenerateShuffleOrder(epoch, cycle, length) {
    let seed = (epoch || 0) + cycle * 2654435761;
    function rand() {
      seed |= 0;
      seed = seed + 0x6d2b79f5 | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    const shuffleOrder = Array.from({ length }, (_, i) => i);
    for (let i = shuffleOrder.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffleOrder[i], shuffleOrder[j]] = [shuffleOrder[j], shuffleOrder[i]];
    }
    return shuffleOrder;
  }

  // ─── VIRTUAL LIVE BROADCAST ENGINE ───
  // Represents a continuous television broadcast calculated directly from current UTC time.
  const VirtualLiveEngine = {
    getPlaylist(streamName) {
      const stream = STREAMS[streamName];
      if (!stream) return [];
      const titles = streamName === 'simran' ? getSimranTitles() : [];
      return Array.from({ length: stream.totalTracks }, (_, idx) => ({
        index: idx,
        url: stream.getTrackUrl(idx),
        duration: getCachedTrackDuration(streamName, idx),
        title: streamName === 'simran' ? (titles[idx] || 'Waheguru Simran') : `Day ${idx + 1} - Amritvela Kirtan`,
        artist: stream.subtitle || ''
      }));
    },

    getPlaylistTotalDuration(playlist) {
      return playlist.reduce((sum, t) => sum + t.duration, 0);
    },

    // Resolves what track and position within it is broadcasting at a given UTC timeline coordinate
    resolveBroadcastPosition(streamName, timelineCoordinate) {
      const playlist = this.getPlaylist(streamName);
      const totalDur = this.getPlaylistTotalDuration(playlist);
      if (!playlist.length || totalDur <= 0) {
        return { trackIndex: 0, position: 0, cycle: 0 };
      }

      const cycle = Math.floor(timelineCoordinate / totalDur);
      const cycleOffset = ((timelineCoordinate % totalDur) + totalDur) % totalDur;
      const shuffleOrder = regenerateShuffleOrder(VIRTUAL_LIVE_EPOCH_START, cycle, playlist.length);

      let accumulated = 0;
      for (let i = 0; i < shuffleOrder.length; i++) {
        const trackIdx = shuffleOrder[i];
        const track = playlist[trackIdx];
        if (accumulated + track.duration > cycleOffset) {
          return {
            trackIndex: trackIdx,
            position: cycleOffset - accumulated,
            shufflePosition: i,
            cycle: cycle,
            trackDuration: track.duration,
            trackTitle: track.title,
            trackArtist: track.artist
          };
        }
        accumulated += track.duration;
      }

      return { trackIndex: shuffleOrder[0], position: 0, shufflePosition: 0, cycle: cycle };
    },

    // Returns the absolute UTC timeline offset (accumulated seconds since Jan 1 2024)
    getCurrentTimelineValue() {
      return Math.floor(Date.now() / 1000) - VIRTUAL_LIVE_EPOCH_START;
    },

    // Converts a local trackIndex & playhead position back to an absolute timeline coordinate
    convertToTimelineCoordinate(streamName, trackIndex, position, currentCycle) {
      const playlist = this.getPlaylist(streamName);
      const totalDur = this.getPlaylistTotalDuration(playlist);
      const shuffleOrder = regenerateShuffleOrder(VIRTUAL_LIVE_EPOCH_START, currentCycle, playlist.length);

      let accumulated = 0;
      for (let i = 0; i < shuffleOrder.length; i++) {
        const trackIdx = shuffleOrder[i];
        if (trackIdx === trackIndex) {
          return currentCycle * totalDur + accumulated + position;
        }
        accumulated += playlist[trackIdx].duration;
      }
      return currentCycle * totalDur + position;
    }
  };

  // ─── PLAYBACK QUEUE CONTROLLER ───
  // Serializes all HTML5 Audio operations into a Promise queue to avoid race conditions.
  const PlaybackQueueController = {
    audio: null,
    promiseChain: Promise.resolve(),

    init() {
      if (this.audio) return;
      this.audio = new Audio();
      this.audio.id = 'anhad-global-audio';
      this.audio.preload = 'auto';
      this.audio.volume = 0.7;

      // HTML5 event listeners
      this.audio.addEventListener('play', () => {
        isPlaying = true;
        emit('statechange', getPublicState());
        persistState();
        updateNativeMediaState();
      });
      this.audio.addEventListener('pause', () => {
        isPlaying = false;
        emit('statechange', getPublicState());
        persistState();
        updateNativeMediaState();
      });
      this.audio.addEventListener('timeupdate', () => {
        persistState();
        // Dispatch UI timeupdate
        const dur = this.audio.duration || 3600;
        const pct = Math.max(0, Math.min(100, (this.audio.currentTime / dur) * 100));
        emit('timeupdate', { currentTime: this.audio.currentTime, duration: dur, progress: pct });
      });
      this.audio.addEventListener('durationchange', () => {
        if (currentStream && STREAMS[currentStream].type === 'playlist') {
          saveDurationToCache(currentStream, currentTrackIndex, this.audio.duration);
        }
      });
      this.audio.addEventListener('ended', () => {
        console.log('[PlaybackQueueController] Track ended naturally');
        handleTrackEnded();
      });
      this.audio.addEventListener('error', (e) => {
        console.error('[PlaybackQueueController] HTMLAudio Error:', e);
        emit('error', { message: 'Audio playback error' });
      });

      // Background capabilities
      if (window.Capacitor) {
        this.audio.setAttribute('playsinline', '');
        this.audio.setAttribute('webkit-playsinline', '');
      }

      if (document.body) {
        document.body.appendChild(this.audio);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          document.body.appendChild(this.audio);
        });
      }
    },

    enqueue(actionFn) {
      this.promiseChain = this.promiseChain.then(() => {
        return new Promise((resolve) => {
          try {
            const res = actionFn();
            if (res instanceof Promise) {
              res.then(resolve).catch((err) => {
                console.warn('[PlaybackQueueController] promise rejected:', err);
                resolve();
              });
            } else {
              resolve();
            }
          } catch(e) {
            console.error('[PlaybackQueueController] runtime error:', e);
            resolve();
          }
        });
      });
      return this.promiseChain;
    },

    loadAndPlay(url, preloadMode) {
      return this.enqueue(async () => {
        this.init();
        isLoading = true;
        emit('loading', { isLoading: true });

        // Set preload type
        this.audio.preload = preloadMode || 'auto';

        // Set CORS policy: Only Amritvela R2 bucket supports CORS, others do not (causes playback errors)
        if (url && url.indexOf('pub-525228169e0c44e38a67c306ba1a458c.r2.dev') !== -1) {
          this.audio.crossOrigin = 'anonymous';
        } else {
          this.audio.removeAttribute('crossorigin');
        }

        if (this.audio.src !== url) {
          this.audio.src = url;
          // PWA only: call load() to reset pipeline
          if (!window.Capacitor) {
            try { this.audio.load(); } catch (e) { }
          }
        }

        try {
          await this.audio.play();
          // Play succeeded — don't emit statechange here.
          // The 'play' event listener will set isPlaying=true and emit statechange.
        } catch (e) {
          console.warn('[PlaybackQueueController] autoplay blocked or load failed:', e.message);
          isPlaying = false;
          emit('statechange', getPublicState());
        } finally {
          isLoading = false;
          emit('loading', { isLoading: false });
        }
      });
    },

    pause() {
      return this.enqueue(() => {
        this.init();
        this.audio.pause();
        isPlaying = false;
        emit('statechange', getPublicState());
      });
    },

    seek(time) {
      return this.enqueue(() => {
        this.init();
        if (Number.isFinite(time)) {
          this.audio.currentTime = time;
        }
      });
    },

    stop() {
      return this.enqueue(() => {
        this.init();
        this.audio.pause();
        this.audio.src = '';
        this.audio.removeAttribute('src');
        isPlaying = false;
        currentStream = null;
        emit('statechange', getPublicState());
      });
    }
  };

  // ─── DARBAR LIVE STREAM MANAGER ───
  const DarbarLiveManager = {
    play() {
      const url = SGPC_LIVE + '?t=' + Math.floor(Date.now() / 5000) * 5000;
      currentTrackTitle = 'Darbar Sahib Live';
      currentTrackArtist = 'Sri Harmandir Sahib Ji, Amritsar';
      updateMediaSession();

      // Force 'auto' preload for live Shoutcast stream to bypass metadata load stalls
      PlaybackQueueController.loadAndPlay(url, 'auto');
    }
  };

  // ─── TRACK TRANSITION & PLAYBACK CONTROLLER ───
  function playStream(streamName) {
    if (!STREAMS[streamName]) return;
    currentStream = streamName;
    pauseAnchor = null;

    if (STREAMS[streamName].type === 'live') {
      DarbarLiveManager.play();
      return;
    }

    // Playlist stream (Amritvela / Simran)
    const liveTime = VirtualLiveEngine.getCurrentTimelineValue();
    const userTime = liveTime - manualOffset;
    const resolved = VirtualLiveEngine.resolveBroadcastPosition(streamName, userTime);

    currentTrackIndex = resolved.trackIndex;
    currentTrackTitle = resolved.trackTitle || STREAMS[streamName].name;
    currentTrackArtist = resolved.trackArtist || STREAMS[streamName].subtitle;

    const trackUrl = STREAMS[streamName].getTrackUrl(currentTrackIndex);

    updateMediaSession();

    // Use 'metadata' preload for static R2 tracks to optimize bandwidth
    PlaybackQueueController.loadAndPlay(trackUrl, 'metadata').then(() => {
      // Seek once loaded metadata is available or immediately if ready
      const seekTime = resolved.position;
      const audioEl = PlaybackQueueController.audio;

      const performSeek = () => {
        // Clamp seek within track duration
        const dur = audioEl.duration || resolved.trackDuration;
        const safeSeek = Math.max(0, Math.min(seekTime, dur - 2));
        PlaybackQueueController.seek(safeSeek);
      };

      if (audioEl.readyState >= 1) {
        performSeek();
      } else {
        audioEl.addEventListener('loadedmetadata', performSeek, { once: true });
      }
    });
  }

  function handleTrackEnded() {
    if (!currentStream || STREAMS[currentStream].type !== 'playlist') return;

    // Reset manual offset to 0 if the user was close to LIVE (within 10s)
    if (manualOffset < 10) {
      manualOffset = 0;
    }

    const playlist = VirtualLiveEngine.getPlaylist(currentStream);
    const totalTracks = playlist.length;
    const liveTime = VirtualLiveEngine.getCurrentTimelineValue();
    
    // Find current cycle and shuffle index
    const userTime = liveTime - manualOffset;
    const currentCycle = Math.floor(userTime / VirtualLiveEngine.getPlaylistTotalDuration(playlist));
    const shuffleOrder = regenerateShuffleOrder(VIRTUAL_LIVE_EPOCH_START, currentCycle, totalTracks);

    let posInShuffle = shuffleOrder.indexOf(currentTrackIndex);
    if (posInShuffle === -1) posInShuffle = 0;
    
    let nextPosInShuffle = (posInShuffle + 1) % totalTracks;
    let nextCycle = currentCycle;
    if (nextPosInShuffle === 0) {
      nextCycle += 1;
    }
    
    const nextShuffleOrder = regenerateShuffleOrder(VIRTUAL_LIVE_EPOCH_START, nextCycle, totalTracks);
    const nextTrackIndex = nextShuffleOrder[nextPosInShuffle];

    console.log(`[AnhadAudio] Track ended naturally. Advancing shuffle: ${currentTrackIndex+1} -> ${nextTrackIndex+1}`);

    currentTrackIndex = nextTrackIndex;
    currentTrackTitle = playlist[nextTrackIndex].title;
    currentTrackArtist = playlist[nextTrackIndex].artist;

    // Recalibrate manual offset so user playhead starts at 0 of next track
    const newU = VirtualLiveEngine.convertToTimelineCoordinate(currentStream, nextTrackIndex, 0, nextCycle);
    manualOffset = Math.max(0, liveTime - newU);
    persistState();

    const trackUrl = STREAMS[currentStream].getTrackUrl(currentTrackIndex);
    updateMediaSession();

    PlaybackQueueController.loadAndPlay(trackUrl, 'metadata').then(() => {
      PlaybackQueueController.seek(0);
    });
  }

  // ─── API CONTROL GATEWAYS ───
  function play(streamName) {
    if (streamName) {
      playStream(streamName);
    } else if (currentStream) {
      resume();
    } else {
      playStream('darbar'); // default
    }
  }

  function pause() {
    if (!isPlaying) return;
    PlaybackQueueController.pause();
    
    // Set pause anchor to compute correct manual offset upon resumption
    pauseAnchor = {
      timestamp: Date.now(),
      offset: manualOffset
    };
    persistState();
    _nativeServiceStarted = false;
    // Update MediaSession so Android notification shows Paused (not Playing)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioService) {
      try { window.Capacitor.Plugins.AudioService.stop(); } catch(e) { /* silently fail */ }
    }
  }

  function resume() {
    if (isPlaying) return;

    // If there is a pause anchor, add elapsed pause duration to manualOffset
    if (pauseAnchor) {
      const elapsedPause = Math.floor((Date.now() - pauseAnchor.timestamp) / 1000);
      manualOffset = pauseAnchor.offset + elapsedPause;
      pauseAnchor = null;
    }

    playStream(currentStream || 'darbar');
  }

  // Play/Pause button logic (resumes exactly in place)
  function resumeInPlace() {
    if (isPlaying) return;
    
    // Direct resume without shifting offset
    if (pauseAnchor) {
      pauseAnchor = null;
    }
    
    const audio = PlaybackQueueController.audio;
    if (audio && audio.src && audio.src !== window.location.href) {
      PlaybackQueueController.enqueue(() => audio.play());
    } else {
      playStream(currentStream || 'darbar');
    }
  }

  function toggle() {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }

  function stop() {
    PlaybackQueueController.stop();
    manualOffset = 0;
    pauseAnchor = null;
    persistState();
    _nativeServiceStarted = false;
    // Clear MediaSession so Android removes the notification entirely
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.metadata = null;
    }
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioService) {
      try { window.Capacitor.Plugins.AudioService.stop(); } catch(e) { /* silently fail */ }
    }
  }

  function jumpToLive() {
    manualOffset = 0;
    pauseAnchor = null;
    if (currentStream) {
      playStream(currentStream);
    }
  }

  function playNextTrack(isForward) {
    if (!currentStream || STREAMS[currentStream].type !== 'playlist') return;
    
    // Jump forward or back shifts timeline coordinate by +/- track duration
    const playlist = VirtualLiveEngine.getPlaylist(currentStream);
    const track = playlist[currentTrackIndex];
    const duration = track ? track.duration : 3600;
    
    manualOffset = Math.max(0, manualOffset + (isForward ? -duration : duration));
    playStream(currentStream);
  }

  function setVolume(vol) {
    PlaybackQueueController.init();
    const safeVol = Math.max(0, Math.min(1, vol));
    PlaybackQueueController.audio.volume = safeVol;
    persistState();
  }

  // ─── STATE PERSISTENCE ───
  function persistState() {
    if (!currentStream) return;
    try {
      const state = {
        currentStream,
        manualOffset,
        pauseAnchor,
        isPlaying,
        volume: PlaybackQueueController.audio ? PlaybackQueueController.audio.volume : 0.7,
        timestamp: Date.now()
      };
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch(e) {}
  }

  function loadState() {
    try {
      const state = JSON.parse(localStorage.getItem(STATE_KEY));
      if (state && state.currentStream) {
        currentStream = state.currentStream;
        manualOffset = state.manualOffset || 0;
        pauseAnchor = state.pauseAnchor;
        
        // Restore volume preference
        PlaybackQueueController.init();
        if (Number.isFinite(state.volume)) {
          PlaybackQueueController.audio.volume = state.volume;
        }
      }
    } catch(e) {}
  }

  function getTimeOfDay() {
    const h = new Date().getHours();
    if (h >= 5 && h < 9) return 'morning';
    if (h >= 9 && h < 16) return 'day';
    if (h >= 16 && h < 20) return 'evening';
    return 'night';
  }

  function getDynamicCoverAsset(streamName, forNotification = false) {
    // System notifications (lock screen, notification panel) → Always use ANHAD app logo
    // Mini player (inside app UI) → Use time-based artwork
    if (forNotification) {
      return resolveAsset('icon-1024x1024.png');
    }

    // Mini player: Time-based artwork
    if (!streamName) return resolveAsset('icon-512x512.png');
    const timeSlot = getTimeOfDay();
    let forceNight = false;
    try {
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      if (theme === 'dark') forceNight = true;
    } catch(e) {}
    const slot = forceNight ? 'night' : timeSlot;

    const covers = {
      darbar: {
        morning: 'HERO CARD IMAGES/morning-darbar-sahib.webp',
        day: 'HERO CARD IMAGES/day-darbar-sahib.webp',
        evening: 'HERO CARD IMAGES/evening-darbar-sahib.webp',
        night: 'HERO CARD IMAGES/night-darbar-sahib.webp'
      },
      amritvela: {
        morning: 'HERO CARD IMAGES/morning-amritvela-kirtan.webp',
        day: 'HERO CARD IMAGES/day-amritvela-kirtan.webp',
        evening: 'HERO CARD IMAGES/evening-amritvela-kirtan.webp',
        night: 'HERO CARD IMAGES/night-amritvela-kirtan.webp'
      },
      simran: {
        morning: 'HERO CARD IMAGES/morning-waheguru-simran.webp',
        day: 'HERO CARD IMAGES/day-waheguru-simran.webp',
        evening: 'HERO CARD IMAGES/evening-waheguru-simran.webp',
        night: 'HERO CARD IMAGES/night-waheguru-simran.webp'
      }
    };

    const streamCovers = covers[streamName] || covers.darbar;
    const cover = streamCovers[slot] || streamCovers.day;
    return resolveAsset(cover);
  }

  // ─── OS LOCKSCREEN (MEDIA SESSION) ───
  function updateMediaSession() {
    if (!currentStream) return;
    const stream = STREAMS[currentStream];
    if (!stream) return;

    const title = currentTrackTitle || stream.name;
    const artist = currentTrackArtist || stream.subtitle;

    // Web MediaSession for lock screen controls (PWA)
    if ('mediaSession' in navigator) {
      const artworkUrl = getDynamicCoverAsset(currentStream, true); // true = for notification (use app logo)
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: artist,
        album: 'ANHAD',
        artwork: [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.setActionHandler('play', () => resume());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('stop', () => stop());
      navigator.mediaSession.setActionHandler('previoustrack', () => playNextTrack(false));
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack(true));
    }

    // Native Capacitor foreground service notification
    updateNativeMediaNotification(title, artist);
  }

  function updateNativeMediaState() {
    if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.AudioService) return;
    try {
      window.Capacitor.Plugins.AudioService.updateState({ action: isPlaying ? 'PLAY' : 'PAUSE' });
    } catch(e) { /* silently fail */ }
  }

  var _nativeServiceStarted = false;
  function updateNativeMediaNotification(title, artist) {
    if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.AudioService) return;
    try {
      if (!_nativeServiceStarted) {
        _nativeServiceStarted = true;
        window.Capacitor.Plugins.AudioService.start({
          title: title || 'ANHAD Kirtan',
          artist: artist || 'Sri Harmandir Sahib Ji',
          stream: currentStream || 'darbar'
        });
      } else {
        window.Capacitor.Plugins.AudioService.updateNotification({
          title: title || 'ANHAD Kirtan',
          artist: artist || '',
          stream: currentStream || 'darbar'
        });
      }
    } catch(e) { /* silently fail */ }
  }

  // ─── UTILITIES & ACCESSORS ───
  function getLiveOffset() {
    if (!currentStream || STREAMS[currentStream].type !== 'playlist') return 0;
    return manualOffset;
  }

  function getLiveDrift() {
    return 0;
  }

  function getPublicState() {
    return {
      currentStream,
      isPlaying,
      isLoading,
      currentTrackTitle,
      currentTrackArtist,
      currentTime: PlaybackQueueController.audio ? PlaybackQueueController.audio.currentTime : 0,
      duration: PlaybackQueueController.audio ? PlaybackQueueController.audio.duration : 3600,
      manualOffset,
      streamType: currentStream ? STREAMS[currentStream].type : null,
      artwork: currentStream ? getDynamicCoverAsset(currentStream) : ''
    };
  }

  // ─── CO-ORDINATOR REGISTER ───
  function registerWithCoordinator() {
    if (window.AudioCoordinator) {
      window.AudioCoordinator.register('AnhadAudio', {
        pause: () => pause(),
        isPlaying: () => isPlaying,
        getStream: () => currentStream
      });
    }
  }

  // ─── INITIALIZATION ───
  loadState();
  PlaybackQueueController.init();
  registerWithCoordinator();

  // Listen for global custom play triggers
  window.addEventListener('anhadPlayStream', (e) => {
    const stream = e.detail && e.detail.stream;
    if (stream) play(stream);
  });

  // Export Unified Singleton API
  window.AnhadAudio = {
    _singleton: true,
    play,
    pause,
    resume,
    resumeInPlace,
    toggle,
    stop,
    jumpToLive,
    playNextTrack,
    setVolume,
    getState: getPublicState,
    getAudio: () => PlaybackQueueController.audio,
    isPlaying: () => isPlaying,
    getCurrentStream: () => currentStream,
    getCurrentTrackTitle: () => currentTrackTitle,
    getCurrentTrackArtist: () => currentTrackArtist,
    on,
    off,
    STREAMS: Object.keys(STREAMS),
    getStreamInfo: (name) => STREAMS[name] ? { ...STREAMS[name] } : null,
    getLiveOffset,
    getLiveDrift,
    getLastTransitionProof: () => '',
    getLiveSyncAnchor: () => null
  };

  // Backwards compatibility shims
  window.AnhadOverlayPlayer = {
    play: (stream) => play(stream),
    pause,
    toggle: (stream) => toggle(stream),
    stop,
    getState: getPublicState,
    updateUI: () => emit('statechange', getPublicState())
  };

  window.AnhadMiniPlayer = {
    play: (stream) => play(stream),
    pause,
    toggle: () => toggle(),
    stop,
    isPlaying: () => isPlaying,
    getStream: () => currentStream
  };



  console.log('🪯 ANHAD Audio Singleton loaded — ONE audio, ONE truth');
})();
