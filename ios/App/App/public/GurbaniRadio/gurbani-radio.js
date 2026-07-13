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

    // 1. Update Tabs & Sliding Indicator
    var tabsContainer = document.querySelector('.gr-tabs');
    if (tabsContainer) {
      var tabIndex = stream === 'darbar' ? 0 : (stream === 'amritvela' ? 1 : 2);
      tabsContainer.setAttribute('data-active', tabIndex);
    }
    document.querySelectorAll('.gr-tab').forEach(function (tab) {
      if (tab.getAttribute('data-stream') === stream) {
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
    var meta = METADATA[stream];
    if (meta) {
      DOM.trackTitle.textContent = state.currentTrackTitle || meta.title;
      DOM.trackArtist.textContent = state.currentTrackArtist || meta.artist;
      DOM.pillLocationText.textContent = meta.location;
      
      // Dynamic time-based and theme-based album cover resolution
      var coverSrc = getCoverForStream(stream);
      verifyCover(coverSrc, DOM.coverImg);
    }

    // 4. Update Banner & Recording controls
    if (stream === 'darbar') {
      DOM.listeningLiveText.textContent = 'LIVE';
      DOM.listeningLiveText.style.color = '#E24C4C';
      DOM.listeningTimeBadge.textContent = 'LIVE';
    } else {
      DOM.listeningLiveText.textContent = stream.toUpperCase();
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

  // ─── Gurbani Recording Engine (MediaRecorder exactly what plays) ───
  async function startRecording() {
    var audio = window.AnhadAudio;
    if (!audio) return;

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

    try {
      var mediaStream = null;
      if (audioEl.captureStream) {
        mediaStream = audioEl.captureStream();
      } else if (audioEl.mozCaptureStream) {
        mediaStream = audioEl.mozCaptureStream();
      }

      if (mediaStream) {
        var options = {};
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          options.mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          options.mimeType = 'audio/aac';
        }

        var mediaRecorder = new MediaRecorder(mediaStream, options);
        recState.mediaRecorder = mediaRecorder;
        
        mediaRecorder.ondataavailable = function (e) {
          if (e.data && e.data.size > 0) {
            recState.chunks.push(e.data);
          }
        };

        mediaRecorder.start(1000);
      } else {
        downloadStream(audioEl.src);
      }
    } catch (e) {
      console.warn('Recording start error, trying direct download:', e);
      downloadStream(audioEl && audioEl.src);
    }
  }

  function downloadStream(url) {
    if (!url) { showToast('No stream URL'); return; }
    var xhr = new XMLHttpRequest();
    recState.xhr = xhr;
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onprogress = function(e) {
      if (!recState.isRecording && xhr.readyState < 4) {
        xhr.abort();
      }
    };
    xhr.onload = function() {
      if (xhr.status === 200 && recState.isRecording) {
        recState.chunks.push(xhr.response);
      }
    };
    xhr.onerror = function() {
      console.error('XHR download failed');
    };
    xhr.onloadend = function() {
      if (recState.isRecording) {
        stopRecording(false);
      }
    };
    xhr.send();
  }

  async function stopRecording(autoStop) {
    if (!recState.isRecording) return;
    recState.isRecording = false;

    if (recState.intervalId) clearInterval(recState.intervalId);
    if (recState.mediaRecorder) {
      try { recState.mediaRecorder.stop(); } catch(e) {}
    }
    if (recState.abortController) recState.abortController.abort();
    if (recState.xhr) {
      try { recState.xhr.abort(); } catch(e) {}
    }

    DOM.recordItem.classList.remove('recording');
    DOM.recordLabel.textContent = 'Record';
    haptic('MEDIUM');

    setTimeout(function() {
      if (recState.chunks.length === 0) {
        showToast('No audio recorded');
        return;
      }

      showToast('Saving Gurbani recording...');

      var isSimran = recState.streamType === 'simran';
      var mimeType = isSimran ? 'audio/mpeg' : 'audio/webm';
      var ext = isSimran ? '.mp3' : '.webm';
      var blob = new Blob(recState.chunks, { type: mimeType });
      var dateStr = new Date().toISOString().slice(0,10);
      var filename = 'Gurbani_' + recState.streamType + '_' + dateStr + ext;

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
              showToast('Saved to Documents!');
            }).catch(function (err) {
              console.error('File write failed:', err);
              triggerWebDownload(blob, filename);
            });
          };
        } catch (err) {
          triggerWebDownload(blob, filename);
        }
      } else {
        triggerWebDownload(blob, filename);
      }
    }, 200);
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

  // ─── Theme Manager (100% Time-Based Auto) ───
  function initTheme() {
    var h = new Date().getHours();
    // 5 AM to 8 PM (20:00) is light theme, otherwise dark theme
    var autoTheme = (h >= 5 && h < 20) ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', autoTheme);
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

    // Settings icon shows informational theme toast
    document.getElementById('grSettingsBtn').addEventListener('click', function () {
      haptic('LIGHT');
      showToast('⏰ Theme is set automatically based on time of day');
    });

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

    // Tabs switching
    document.querySelectorAll('.gr-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var stream = tab.getAttribute('data-stream');
        haptic('MEDIUM');
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

  // ─── Initializer ───
  function boot() {
    initTheme();
    cacheDom();
    bindEvents();
    setupSlider();
    syncUI();

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
