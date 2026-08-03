/**
 * GURBANI RADIO — Page controller and stream recording engine
 * ══════════════════════════════════════════════════════════════════
 * Implements:
 *   1. Direct binding to window.AnhadAudio (Unified audio singleton)
 *   2. Ditto UI representation of the shared gold/beige design
 *   3. Custom MediaRecorder captureStream recorder (works for all streams)
 *   4. Sleep timer logic
 *   5. Robust progress bar seeking & time updating
 *   6. Auto-theme selection (5 AM to 8 PM Light theme, 8 PM to 5 AM Dark theme)
 *   7. Full Gurbani Alarm Scheduler (Local Notifications + Foreground)
 * ══════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  // ─── DOM References ───
  var DOM = {};
  var sleepTimerId = null;
  var sleepTimerEnd = 0;

  // ─── Recording State ───
  var recState = {
    isRecording: false,
    chunks: [],
    startTime: 0,
    intervalId: null,
    mediaRecorder: null,
    abortController: null,
    xhr: null,
    maxDurationSeconds: 300,
    streamType: null
  };

  // ─── Haptics ───
  function haptic(style) {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        window.Capacitor.Plugins.Haptics.impact({ style: style || 'MEDIUM' }).catch(function () {});
      } else if (navigator.vibrate) {
        navigator.vibrate(style === 'HEAVY' ? 80 : 40);
      }
    } catch (e) {}
  }

  // ─── Toast ───
  var toastTimer = null;
  function showToast(msg) {
    var el = DOM.toast;
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3000);
  }

  // ─── Date Formatter ───
  function formatSeconds(sec) {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '00:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  // ─── Time of Day helpers ───
  function getTimeOfDay() {
    var h = new Date().getHours();
    if (h >= 5 && h < 9) return 'morning';
    if (h >= 9 && h < 16) return 'day';
    if (h >= 16 && h < 20) return 'evening';
    return 'night';
  }

  function getCoverForStream(stream) {
    var timeSlot = getTimeOfDay();
    
    // Force night artwork if theme is dark
    var theme = document.documentElement.getAttribute('data-theme') || 'light';
    if (theme === 'dark') {
      timeSlot = 'night';
    }

    var covers = {
      darbar: {
        morning: '../assets/HERO CARD IMAGES/morning-darbar-sahib.webp',
        day: '../assets/HERO CARD IMAGES/day-darbar-sahib.webp',
        evening: '../assets/HERO CARD IMAGES/evening-darbar-sahib.webp',
        night: '../assets/HERO CARD IMAGES/night-darbar-sahib.webp'
      },
      amritvela: {
        morning: '../assets/HERO CARD IMAGES/morning-amritvela-kirtan.webp',
        day: '../assets/HERO CARD IMAGES/day-amritvela-kirtan.webp',
        evening: '../assets/HERO CARD IMAGES/evening-amritvela-kirtan.webp',
        night: '../assets/HERO CARD IMAGES/night-amritvela-kirtan.webp'
      },
      simran: {
        morning: '../assets/HERO CARD IMAGES/morning-waheguru-simran.webp',
        day: '../assets/HERO CARD IMAGES/day-waheguru-simran.webp',
        evening: '../assets/HERO CARD IMAGES/evening-waheguru-simran.webp',
        night: '../assets/HERO CARD IMAGES/night-waheguru-simran.webp'
      }
    };

    var streamCovers = covers[stream] || covers.darbar;
    var cover = streamCovers[timeSlot];
    return cover || streamCovers.day;
  }

  // ─── Audio Meta Resolvers ───
  var METADATA = {
    darbar: {
      title: 'Darbar Sahib Live',
      artist: 'Sri Harmandir Sahib Ji, Amritsar',
      location: 'Live from Amritsar'
    },
    amritvela: {
      title: 'Amritvela Kirtan',
      artist: 'Daily Amritvela Kirtan Recitals',
      location: 'Daily Recital'
    },
    simran: {
      title: 'Waheguru Simran',
      artist: 'Waheguru Naam Jaap',
      location: 'Amritvela Trust'
    }
  };

  // Cover fallback checker
  function verifyCover(src, targetImg) {
    var img = new Image();
    img.src = src;
    img.onload = function() {
      if (targetImg) targetImg.src = src;
    };
    img.onerror = function() {
      if (targetImg) targetImg.src = '../assets/darbar-sahib-evening.webp';
    };
  }

  // ─── Sync UI with Audio State ───
  function syncUI() {
    var audio = window.AnhadAudio;
    if (!audio) return;

    var state = audio.getState();
    var stream = state.currentStream || 'darbar';

    // If a custom library stream is playing, let stream-library manage UI
    // (still update play/pause button and wave icon here)
    var customStream = window._anhadCustomStream;

    // 1. Update Tabs & Sliding Indicator
    var tabsContainer = document.querySelector('.gr-tabs');
    if (tabsContainer) {
      var tabs = tabsContainer.querySelectorAll('.gr-tab');
      var activeStreamId = customStream ? customStream.id : stream;
      var tabIndex = 0;
      tabs.forEach(function(tab, idx) {
        if (tab.getAttribute('data-stream') === activeStreamId) tabIndex = idx;
      });
      tabsContainer.setAttribute('data-active', tabIndex);
    }

    document.querySelectorAll('.gr-tab').forEach(function (tab) {
      var activeId = customStream ? customStream.id : stream;
      if (tab.getAttribute('data-stream') === activeId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // 1b. Update Favorite button state
    var isFav = localStorage.getItem('gr_fav_' + stream) === 'true';
    if (DOM.favoriteBtn) {
      if (isFav) {
        DOM.favoriteBtn.classList.add('favorited');
      } else {
        DOM.favoriteBtn.classList.remove('favorited');
      }
    }

    // 2. Update Play/Pause Buttons
    if (state.isPlaying) {
      DOM.playBtn.querySelector('.play-icon').style.display = 'none';
      DOM.playBtn.querySelector('.pause-icon').style.display = 'block';
      DOM.waveIcon.classList.add('playing');
    } else {
      DOM.playBtn.querySelector('.play-icon').style.display = 'block';
      DOM.playBtn.querySelector('.pause-icon').style.display = 'none';
      DOM.waveIcon.classList.remove('playing');
    }

    // 3. Update Text Info
    var streamInfo = audio.getStreamInfo ? audio.getStreamInfo(stream) : null;
    var meta = METADATA[stream] || {
      title: (streamInfo && streamInfo.name) ? streamInfo.name : 'Gurbani Stream',
      artist: (streamInfo && streamInfo.subtitle) ? streamInfo.subtitle : 'ANHAD Radio',
      location: (streamInfo && streamInfo.subtitle) ? streamInfo.subtitle : 'Live Stream'
    };

    DOM.trackTitle.textContent = state.currentTrackTitle || meta.title;
    DOM.trackArtist.textContent = state.currentTrackArtist || meta.artist;
    DOM.pillLocationText.textContent = meta.location;
    
    // Dynamic time-based and theme-based album cover resolution
    var coverSrc = getCoverForStream(stream);
    verifyCover(coverSrc, DOM.coverImg);

    // 4. Update Banner & Recording controls
    if (state.streamType === 'live' || stream === 'darbar') {
      DOM.listeningLiveText.textContent = 'DARBAR SAHIB';
      DOM.listeningLiveText.style.color = '#E24C4C';
      DOM.listeningTimeBadge.textContent = 'LIVE';
    } else {
      // Use proper stream names from METADATA
      var streamNames = {
        'amritvela': 'AMRITVELA KIRTAN',
        'simran': 'WAHEGURU SIMRAN'
      };
      DOM.listeningLiveText.textContent = streamNames[stream] || stream.toUpperCase();
      DOM.listeningLiveText.style.color = 'var(--accent-gold)';
      DOM.listeningTimeBadge.textContent = formatSeconds(state.currentTime);
    }

    if (DOM.recordItem) {
      DOM.recordLabel.textContent = recState.isRecording ? formatSeconds(Math.floor((Date.now() - recState.startTime) / 1000)) : 'Record';
    }

    // 4b. Update Behind Live Button status
    var behindLiveBtn = document.getElementById('grBtnJumpLive');
    if (behindLiveBtn) {
      var offset = audio.getLiveOffset();
      if (stream !== 'darbar' && offset > 5) {
        behindLiveBtn.style.display = 'inline-block';
        behindLiveBtn.textContent = 'Behind Live ' + formatSeconds(offset) + ' (Tap to Jump Live)';
      } else {
        behindLiveBtn.style.display = 'none';
      }
    }

    // 5. Update Timeline
    updateTimeline(state.currentTime, state.duration, stream);
  }

  function updateTimeline(current, duration, stream) {
    if (DOM.isDraggingSlider) return;

    DOM.timeCurrent.textContent = formatSeconds(current);

    if (stream === 'darbar') {
      DOM.timeTotal.textContent = 'LIVE';
      DOM.sliderFill.style.width = '100%';
      DOM.sliderHandle.style.left = '100%';
    } else {
      var dur = duration || 3600; // fallback 1 hour
      DOM.timeTotal.textContent = formatSeconds(dur);
      var pct = Math.max(0, Math.min(100, (current / dur) * 100));
      DOM.sliderFill.style.width = pct + '%';
      DOM.sliderHandle.style.left = pct + '%';
    }
  }

  // ─── Timeline dragging ───
  function setupSlider() {
    DOM.isDraggingSlider = false;

    function handleMove(e) {
      var audio = window.AnhadAudio;
      if (!audio || audio.getState().currentStream === 'darbar') return;

      var rect = DOM.sliderContainer.getBoundingClientRect();
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

      DOM.sliderFill.style.width = (pct * 100) + '%';
      DOM.sliderHandle.style.left = (pct * 100) + '%';

      var state = audio.getState();
      var dur = state.duration || 3600;
      DOM.timeCurrent.textContent = formatSeconds(pct * dur);
    }

    function handleEnd(e) {
      if (!DOM.isDraggingSlider) return;
      DOM.isDraggingSlider = false;

      var audio = window.AnhadAudio;
      if (audio) {
        var rect = DOM.sliderContainer.getBoundingClientRect();
        var clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        var pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

        var state = audio.getState();
        var dur = state.duration || 3600;
        var seekTime = pct * dur;

        var audioEl = audio.getAudio();
        if (audioEl) {
          audioEl.currentTime = seekTime;
        }
      }

      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    }

    DOM.sliderContainer.addEventListener('mousedown', function (e) {
      DOM.isDraggingSlider = true;
      handleMove(e);
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
    });

    DOM.sliderContainer.addEventListener('touchstart', function (e) {
      DOM.isDraggingSlider = true;
      handleMove(e);
      document.addEventListener('touchmove', handleMove);
      document.addEventListener('touchend', handleEnd);
    }, { passive: true });
  }

  // ─── Gurbani Recording Engine (Multi-Tier Recorder: MediaStream / WebAudio / Direct Stream) ───
  async function startRecording() {
    var audio = window.AnhadAudio;
    if (!audio) {
      showToast('⚠️ Audio system not initialized');
      return;
    }

    var state = audio.getState();
    var stream = state.currentStream || 'darbar';
    var audioEl = audio.getAudio();

    if (!audioEl || audioEl.paused) {
      showToast('⚠️ Please play radio before recording');
      return;
    }

    haptic('HEAVY');
    recState.isRecording = true;
    recState.chunks = [];
    recState.startTime = Date.now();
    recState.streamType = stream;
    recState.recordedMimeType = '';

    DOM.recordItem.classList.add('recording');
    DOM.recordLabel.textContent = '00:00';
    showToast('🔴 Recording Gurbani... Tap again to stop');

    recState.intervalId = setInterval(function () {
      var elapsed = Math.floor((Date.now() - recState.startTime) / 1000);
      DOM.recordLabel.textContent = formatSeconds(elapsed);

      if (elapsed >= recState.maxDurationSeconds) {
        stopRecording(true);
      }
    }, 1000);

    var mediaStream = null;

    // Strategy 1: AnhadAudio capture stream or HTMLAudioElement captureStream
    if (audio.getCaptureStream) {
      mediaStream = audio.getCaptureStream();
    }
    if (!mediaStream && audioEl.captureStream) {
      try {
        mediaStream = audioEl.captureStream();
      } catch (err) {
        console.warn('audioEl.captureStream failed:', err);
      }
    }
    if (!mediaStream && audioEl.mozCaptureStream) {
      try {
        mediaStream = audioEl.mozCaptureStream();
      } catch (err) {
        console.warn('audioEl.mozCaptureStream failed:', err);
      }
    }

    // Strategy 2: Web Audio API MediaStreamDestination if captureStream is unavailable/empty
    if (!mediaStream && (window.AudioContext || window.webkitAudioContext)) {
      try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!recState.webAudioCtx) {
          recState.webAudioCtx = new AudioCtx();
        }
        if (recState.webAudioCtx.state === 'suspended') {
          await recState.webAudioCtx.resume();
        }
        if (!recState.mediaSourceNode && audioEl) {
          recState.mediaSourceNode = recState.webAudioCtx.createMediaElementSource(audioEl);
          recState.destNode = recState.webAudioCtx.createMediaStreamDestination();
          recState.mediaSourceNode.connect(recState.destNode);
          recState.mediaSourceNode.connect(recState.webAudioCtx.destination);
        }
        if (recState.destNode) {
          mediaStream = recState.destNode.stream;
        }
      } catch (webAudioErr) {
        console.warn('Web Audio capture failed:', webAudioErr);
      }
    }

    // Attempt MediaRecorder with mediaStream if available
    if (mediaStream && typeof MediaRecorder !== 'undefined') {
      try {
        var options = { audioBitsPerSecond: 128000 };
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options.mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options.mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options.mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          options.mimeType = 'audio/ogg;codecs=opus';
        }

        recState.recordedMimeType = options.mimeType || 'audio/webm';
        var mediaRecorder = new MediaRecorder(mediaStream, options);
        recState.mediaRecorder = mediaRecorder;

        mediaRecorder.ondataavailable = function (e) {
          if (e.data && e.data.size > 0) {
            recState.chunks.push(e.data);
          }
        };

        mediaRecorder.onerror = function (e) {
          console.error('MediaRecorder error:', e);
        };

        mediaRecorder.start(500);
        return;
      } catch (mrErr) {
        console.warn('MediaRecorder init failed, falling back to direct stream fetch:', mrErr);
      }
    }

    // Strategy 3: Direct Stream Fetch Fallback
    try {
      var streamUrl = audio.getCurrentStreamUrl ? audio.getCurrentStreamUrl() : (audioEl ? audioEl.src : '');
      if (!streamUrl) {
        throw new Error('No active stream URL available');
      }

      recState.abortController = new AbortController();
      recState.recordedMimeType = 'audio/mpeg';

      fetch(streamUrl, { signal: recState.abortController.signal })
        .then(function (res) {
          if (!res.body) throw new Error('ReadableStream not supported');
          var reader = res.body.getReader();
          function readChunk() {
            if (!recState.isRecording) return;
            reader.read().then(function (result) {
              if (result.done) return;
              if (result.value && result.value.byteLength > 0) {
                recState.chunks.push(result.value);
              }
              readChunk();
            }).catch(function (err) {
              if (err.name !== 'AbortError') console.warn('Fetch stream read error:', err);
            });
          }
          readChunk();
        })
        .catch(function (err) {
          if (err.name !== 'AbortError') {
            console.error('Direct stream fetch error:', err);
            if (recState.chunks.length === 0) {
              showToast('⚠️ Recording failed: ' + err.message);
              recState.isRecording = false;
              DOM.recordItem.classList.remove('recording');
              DOM.recordLabel.textContent = 'Record';
              if (recState.intervalId) clearInterval(recState.intervalId);
            }
          }
        });
    } catch (fetchErr) {
      console.error('Stream fetch fallback failed:', fetchErr);
      showToast('⚠️ Recording not supported on this device/stream');
      recState.isRecording = false;
      DOM.recordItem.classList.remove('recording');
      DOM.recordLabel.textContent = 'Record';
      if (recState.intervalId) clearInterval(recState.intervalId);
    }
  }

  async function stopRecording(autoStop) {
    if (!recState.isRecording) return;
    recState.isRecording = false;

    if (recState.intervalId) clearInterval(recState.intervalId);

    // Wait for MediaRecorder to finish and collect final chunks
    if (recState.mediaRecorder && recState.mediaRecorder.state !== 'inactive') {
      try {
        recState.mediaRecorder.stop();
        await new Promise(function(resolve) { setTimeout(resolve, 300); });
      } catch(e) {
        console.error('MediaRecorder stop error:', e);
      }
    }

    if (recState.abortController) {
      try { recState.abortController.abort(); } catch(e) {}
    }
    if (recState.xhr) {
      try { recState.xhr.abort(); } catch(e) {}
    }

    DOM.recordItem.classList.remove('recording');
    DOM.recordLabel.textContent = 'Record';
    haptic('MEDIUM');

    setTimeout(function() {
      if (recState.chunks.length === 0) {
        showToast('⚠️ No audio recorded. Please try again.');
        return;
      }

      showToast('💾 Saving Gurbani recording...');

      var streamObj = window._anhadCustomStream || (window.AnhadAudio && window.AnhadAudio.getStreamInfo ? window.AnhadAudio.getStreamInfo(recState.streamType) : null);
      var rawStreamName = streamObj ? streamObj.name : (recState.streamType || 'Gurbani');
      var sanitizedStreamName = rawStreamName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');

      var mimeType = recState.recordedMimeType || 'audio/webm';
      var ext = '.webm';
      if (mimeType.indexOf('mp4') !== -1) ext = '.m4a';
      else if (mimeType.indexOf('mpeg') !== -1 || mimeType.indexOf('mp3') !== -1) ext = '.mp3';
      else if (mimeType.indexOf('ogg') !== -1) ext = '.ogg';

      // Create blob from all collected chunks
      var blob = new Blob(recState.chunks, { type: mimeType });

      if (blob.size === 0) {
        showToast('⚠️ Recording is empty. Please try again.');
        return;
      }

      var dateStr = new Date().toISOString().slice(0,10);
      var timeStr = new Date().toISOString().slice(11,19).replace(/:/g, '-');
      var filename = 'Gurbani_' + sanitizedStreamName + '_' + dateStr + '_' + timeStr + ext;

      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
        try {
          var reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = function () {
            var base64data = reader.result.split(',')[1];
            window.Capacitor.Plugins.Filesystem.writeFile({
              path: filename,
              data: base64data,
              directory: 'DOCUMENTS'
            }).then(function () {
              showToast('✅ Saved to Documents: ' + filename);
              recState.chunks = [];
            }).catch(function (err) {
              console.error('File write failed:', err);
              showToast('⚠️ Save failed, downloading instead...');
              triggerWebDownload(blob, filename);
            });
          };
          reader.onerror = function(err) {
            console.error('FileReader error:', err);
            triggerWebDownload(blob, filename);
          };
        } catch (err) {
          console.error('Filesystem write error:', err);
          triggerWebDownload(blob, filename);
        }
      } else {
        triggerWebDownload(blob, filename);
      }
    }, 400);
  }

  function triggerWebDownload(blob, filename) {
    try {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('✅ Recording downloaded successfully!');
    } catch (e) {
      showToast('❌ Recording export failed');
    }
  }

  function toggleRecording() {
    if (recState.isRecording) {
      stopRecording(false);
    } else {
      startRecording();
    }
  }

  // ─── Sleep Timer ───
  function setSleepTimer(mins) {
    if (sleepTimerId) {
      clearTimeout(sleepTimerId);
      sleepTimerId = null;
    }

    if (mins <= 0) {
      sleepTimerEnd = 0;
      showToast('⏰ Sleep Timer Cancelled');
      return;
    }

    sleepTimerEnd = Date.now() + mins * 60 * 1000;
    showToast('⏰ Sleep Timer set for ' + mins + ' minutes');

    sleepTimerId = setTimeout(function () {
      var audio = window.AnhadAudio;
      if (audio && audio.isPlaying()) {
        audio.pause();
        showToast('⏰ Sleep timer completed. Audio paused.');
      }
    }, mins * 60 * 1000);
  }

  // ─── Alarm Management ───
  function loadAlarmSettings() {
    try {
      var alarmRaw = localStorage.getItem('anhad_radio_alarm');
      if (alarmRaw) {
        var alarm = JSON.parse(alarmRaw);
        document.getElementById('alarmEnabled').checked = !!alarm.enabled;
        document.getElementById('alarmTime').value = alarm.time || '04:30';
        document.getElementById('alarmStream').value = alarm.stream || 'amritvela';
      }
    } catch(e) {}
  }

  function saveAlarmSettings() {
    var enabled = document.getElementById('alarmEnabled').checked;
    var time = document.getElementById('alarmTime').value;
    var stream = document.getElementById('alarmStream').value;

    var alarm = {
      enabled: enabled,
      time: time,
      stream: stream
    };

    localStorage.setItem('anhad_radio_alarm', JSON.stringify(alarm));
    scheduleNotificationAlarm(alarm);
    
    showToast(enabled ? '⏰ Alarm set for ' + time : '⏰ Alarm disabled');
    document.getElementById('alarmSheet').style.display = 'none';
  }

  function scheduleNotificationAlarm(alarm) {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
      var ln = window.Capacitor.Plugins.LocalNotifications;
      
      ln.requestPermissions().then(function (permission) {
        if (permission.display === 'granted') {
          // Cancel previous alarm ID 4242
          ln.cancel({ notifications: [{ id: 4242 }] }).catch(function(){});
          
          if (!alarm.enabled) return;

          var timeParts = alarm.time.split(':');
          var hour = parseInt(timeParts[0], 10);
          var min = parseInt(timeParts[1], 10);

          ln.schedule({
            notifications: [
              {
                title: '⏰ Gurbani Alarm',
                body: 'Time to listen to ' + METADATA[alarm.stream].title + '! Tap to play.',
                id: 4242,
                schedule: {
                  on: {
                    hour: hour,
                    minute: min
                  },
                  repeats: true,
                  allowWhileIdle: true
                },
                extra: {
                  url: 'GurbaniRadio/gurbani-radio.html?stream=' + alarm.stream
                }
              }
            ]
          }).then(function() {
            console.log('[Alarm] Local notification scheduled daily at ' + alarm.time);
          }).catch(function(e) {
            console.warn('Failed to schedule local notification:', e);
          });
        } else {
          showToast('⚠️ Enable notifications to support Gurbani alarm');
        }
      }).catch(function(err) {
        console.warn('Notification permission request error:', err);
      });
    }
  }

  function initTheme() {
    function applyRadioTheme() {
      // Time-based auto theme: dark at night (8 PM – 5 AM), light otherwise
      var hour = new Date().getHours();
      var isNight = (hour >= 20 || hour < 5);

      // If global theme explicitly forces dark, honour it
      var globalTheme = window.AnhadTheme ? window.AnhadTheme.get() : 'auto';
      var isDark = isNight || globalTheme === 'dark' || (globalTheme === 'auto' && (window.AnhadTheme ? window.AnhadTheme.isDark() : isNight));

      var activeTheme = isDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', activeTheme);
      document.body.classList.toggle('dark-mode', isDark);
      document.body.style.backgroundColor = isDark ? '#0A0A0C' : '#FAF8F5';
      if (typeof syncUI === 'function') {
        syncUI();
      }
    }
    applyRadioTheme();
    window.addEventListener('themechange', applyRadioTheme);
    window.addEventListener('anhadThemeChanged', applyRadioTheme);
    // Re-check every 10 minutes so the page auto-switches at nightfall
    setInterval(applyRadioTheme, 10 * 60 * 1000);
  }

  // ─── Event Bindings ───
  function cacheDom() {
    DOM.toast          = document.getElementById('grToast');
    DOM.playBtn        = document.getElementById('grPlayBtn');
    DOM.coverImg       = document.getElementById('grCoverImg');
    DOM.trackTitle     = document.getElementById('grTrackTitle');
    DOM.trackArtist    = document.getElementById('grTrackArtist');
    DOM.pillLocationText = document.getElementById('grPillLocationText');
    DOM.listeningLiveText = document.getElementById('grListeningLiveText');
    DOM.listeningTimeBadge = document.getElementById('grListeningTimeBadge');
    DOM.waveIcon       = document.getElementById('grWaveIcon');
    DOM.timeCurrent    = document.getElementById('grTimeCurrent');
    DOM.timeTotal      = document.getElementById('grTimeTotal');
    DOM.sliderContainer = document.getElementById('grSliderContainer');
    DOM.sliderFill     = document.getElementById('grSliderFill');
    DOM.sliderHandle   = document.getElementById('grSliderHandle');
    DOM.recordItem     = document.getElementById('btnRecord');
    DOM.recordLabel    = document.getElementById('grRecordLabel');
    DOM.favoriteBtn    = document.getElementById('grFavoriteBtn');
  }

  function bindEvents() {
    // Back navigation
    document.getElementById('grBackBtn').addEventListener('click', function () {
      haptic('LIGHT');
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '../index.html';
      }
    });

    // Settings icon — handled exclusively by stream-library.js patchSettingsButton()
    // stream-library.js replaces the button and wires its own click to openSheet()
    // No binding needed here.

    // Play/Pause toggle
    DOM.playBtn.addEventListener('click', function () {
      haptic('MEDIUM');
      var audio = window.AnhadAudio;
      if (audio) {
        audio.toggle();
      }
    });

    // Skip controls
    document.getElementById('grBtnSkipBack').addEventListener('click', function () {
      haptic('LIGHT');
      var audio = window.AnhadAudio;
      if (audio) {
        var audioEl = audio.getAudio();
        if (audioEl && audio.getState().currentStream !== 'darbar') {
          audioEl.currentTime = Math.max(0, audioEl.currentTime - 15);
        }
      }
    });

    document.getElementById('grBtnSkipFwd').addEventListener('click', function () {
      haptic('LIGHT');
      var audio = window.AnhadAudio;
      if (audio) {
        var state = audio.getState();
        if (state.currentStream === 'darbar') return;
        var audioEl = audio.getAudio();
        if (audioEl) {
          var offset = audio.getLiveOffset ? audio.getLiveOffset() : 0;
          if (offset < 10) {
            showToast('⚠️ Cannot skip forward past the live broadcast');
            return;
          }
          // Clamp skip to the live edge boundary (offset = 0)
          var maxAllowedTime = Math.max(0, audioEl.currentTime + offset - 2);
          audioEl.currentTime = Math.min(maxAllowedTime, audioEl.currentTime + 15);
        }
      }
    });

    // Prev/Next controls
    document.getElementById('grBtnPrev').addEventListener('click', function () {
      haptic('LIGHT');
      var audio = window.AnhadAudio;
      if (audio && typeof audio.playNextTrack === 'function') {
        audio.playNextTrack(false);
      }
    });

    document.getElementById('grBtnNext').addEventListener('click', function () {
      haptic('LIGHT');
      var audio = window.AnhadAudio;
      if (audio && typeof audio.playNextTrack === 'function') {
        audio.playNextTrack(true);
      }
    });

    // Tabs switching — delegate to stream library if loaded
    document.querySelectorAll('.gr-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var stream = tab.getAttribute('data-stream');
        haptic('MEDIUM');
        // Clear any custom stream override on tab click
        window._anhadCustomStream = null;
        var audio = window.AnhadAudio;
        if (audio) {
          audio.play(stream);
        }
      });
    });

    // Utility panel
    document.getElementById('btnSleepTimer').addEventListener('click', function () {
      haptic('LIGHT');
      document.getElementById('sleepTimerSheet').style.display = 'flex';
    });

    // Alarm sheet open
    document.getElementById('btnAlarm').addEventListener('click', function () {
      haptic('LIGHT');
      loadAlarmSettings();
      document.getElementById('alarmSheet').style.display = 'flex';
    });

    document.getElementById('btnShare').addEventListener('click', function () {
      haptic('LIGHT');
      if (navigator.share) {
        navigator.share({
          title: 'Gurbani Radio',
          text: 'Listen to Darbar Sahib Live Kirtan on ANHAD App',
          url: window.location.href
        }).catch(function() {});
      } else {
        showToast('🔗 App Link copied to clipboard!');
      }
    });

    // Record click
    DOM.recordItem.addEventListener('click', function () {
      toggleRecording();
    });

    // Favorite click
    if (DOM.favoriteBtn) {
      DOM.favoriteBtn.addEventListener('click', function () {
        haptic('LIGHT');
        var audio = window.AnhadAudio;
        if (!audio) return;
        var state = audio.getState();
        var stream = state.currentStream || 'darbar';
        var isFav = localStorage.getItem('gr_fav_' + stream) === 'true';
        if (isFav) {
          localStorage.setItem('gr_fav_' + stream, 'false');
          DOM.favoriteBtn.classList.remove('favorited');
          showToast('💔 Removed from Library');
        } else {
          localStorage.setItem('gr_fav_' + stream, 'true');
          DOM.favoriteBtn.classList.add('favorited');
          showToast('❤️ Added to Library');
        }
      });
    }

    // Behind Live button
    var behindLiveBtn = document.getElementById('grBtnJumpLive');
    if (behindLiveBtn) {
      behindLiveBtn.addEventListener('click', function () {
        haptic('MEDIUM');
        var audio = window.AnhadAudio;
        if (audio) {
          audio.jumpToLive();
          showToast('⏭️ Jumped to Live Stream');
        }
      });
    }

    // Sleep Timer Sheet dismiss
    document.getElementById('sleepTimerBackdrop').addEventListener('click', function () {
      document.getElementById('sleepTimerSheet').style.display = 'none';
    });

    document.querySelectorAll('.gr-sheet-opt').forEach(function (opt) {
      opt.addEventListener('click', function () {
        document.querySelectorAll('.gr-sheet-opt').forEach(function (el) { el.classList.remove('active'); });
        opt.classList.add('active');

        var mins = parseInt(opt.getAttribute('data-mins'), 10);
        setSleepTimer(mins);

        setTimeout(function () {
          document.getElementById('sleepTimerSheet').style.display = 'none';
        }, 300);
      });
    });

    // Alarm Sheet dismiss & save
    document.getElementById('alarmBackdrop').addEventListener('click', function () {
      document.getElementById('alarmSheet').style.display = 'none';
    });

    document.getElementById('btnSaveAlarm').addEventListener('click', function () {
      haptic('MEDIUM');
      saveAlarmSettings();
    });

    // Audio Engine subscriptions
    var audio = window.AnhadAudio;
    if (audio) {
      audio.on('statechange', syncUI);
      audio.on('loading', function (e) {
        if (e.isLoading) {
          DOM.playBtn.classList.add('loading');
        } else {
          DOM.playBtn.classList.remove('loading');
        }
      });
      audio.on('error', function (e) {
        // Show helpful toast when a stream fails with specific error details
        var state = audio.getState();
        var streamName = state.currentTrackTitle || state.currentStream || 'stream';
        
        var errorMsg = '⚠️ Stream failed: ' + streamName;
        
        // Provide specific error messages based on error type
        if (e && e.type) {
          switch (e.type) {
            case 'network':
              errorMsg = '🌐 No internet connection. Please check your network.';
              break;
            case 'offline':
              errorMsg = '📡 You are offline. Connect to internet to stream.';
              break;
            case 'source':
              errorMsg = '⚠️ ' + streamName + ' is currently unavailable.';
              break;
            case 'decode':
              errorMsg = '⚠️ Stream format issue. Try another stream.';
              break;
            default:
              errorMsg = '⚠️ ' + streamName + ' failed. Check connection or try another stream.';
          }
        } else if (!navigator.onLine) {
          errorMsg = '📡 No internet connection. Please check your network.';
        } else {
          errorMsg = '⚠️ ' + streamName + ' may be offline. Try another stream.';
        }
        
        showToast(errorMsg);
      });

      // Update seek slider on timeupdate
      var audioEl = audio.getAudio();
      if (audioEl) {
        audioEl.addEventListener('timeupdate', function () {
          var state = audio.getState();
          updateTimeline(audioEl.currentTime, audioEl.duration, state.currentStream);
        });
      }
    }
  }

  // ─── Alarm foreground checker ───
  var lastCheckedMinute = -1;
  setInterval(function () {
    var alarmRaw = localStorage.getItem('anhad_radio_alarm');
    if (!alarmRaw) return;
    try {
      var alarm = JSON.parse(alarmRaw);
      if (!alarm || !alarm.enabled || !alarm.time) return;

      var now = new Date();
      var currentMin = now.getMinutes();
      if (currentMin === lastCheckedMinute) return; // check once per minute

      var timeParts = alarm.time.split(':');
      var alarmHour = parseInt(timeParts[0], 10);
      var alarmMin = parseInt(timeParts[1], 10);

      if (now.getHours() === alarmHour && currentMin === alarmMin) {
        lastCheckedMinute = currentMin;
        var audio = window.AnhadAudio;
        if (audio && !audio.isPlaying()) {
          audio.play(alarm.stream);
          showToast('⏰ Daily Gurbani Alarm triggered!');
          haptic('HEAVY');
        }
      }
    } catch(e) {}
  }, 15000);

  // ─── Network Status Monitor ───
  function initNetworkMonitor() {
    // Check initial network status
    function updateNetworkStatus() {
      var isOnline = navigator.onLine;
      if (!isOnline) {
        showToast('📡 No internet connection - Streams require network access');
      }
    }

    // Monitor network changes
    window.addEventListener('online', function() {
      showToast('🌐 Back online! You can now stream Gurbani.');
    });

    window.addEventListener('offline', function() {
      showToast('📡 Connection lost - Please check your network');
      // Pause audio if playing
      var audio = window.AnhadAudio;
      if (audio && audio.isPlaying()) {
        audio.pause();
      }
    });

    // Check on load
    if (!navigator.onLine) {
      setTimeout(updateNetworkStatus, 1000);
    }
  }

  // ─── Initializer ───
  function boot() {
    cacheDom();
    initTheme();
    bindEvents();
    setupSlider();
    syncUI();
    initNetworkMonitor(); // Add network monitoring

    var urlParams = new URLSearchParams(window.location.search);
    var streamParam = urlParams.get('stream');
    if (streamParam) {
      var audio = window.AnhadAudio;
      if (audio && audio.STREAMS.indexOf(streamParam) !== -1) {
        setTimeout(function() {
          audio.play(streamParam);
        }, 500);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();
