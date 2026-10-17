/**
 * ANHAD GLOBAL ALARM + NOTIFICATION + BACK BUTTON ENGINE
 * v3.0 — Full production fixes:
 *   ✅ Richer bilingual Naam Abhyas notification messages
 *   ✅ Time shown in notification title (e.g. "🙏 Naam Abhyas — 6:32 AM")
 *   ✅ launchUrl for reliable cold-start navigation to Naam Abhyas page
 *   ✅ Naam-specific foreground popup with "Start Simran" button
 *   ✅ Single alarm path — sessionStorage flag prevents multi-page duplicate popups
 *   ✅ Full-screen alarm wiring for Smart Reminders via AlarmReliabilityPlugin
 */
(function() {
    'use strict';
    var EXPIRY_MS = 5 * 60 * 1000;
    var MANAGED_NOTIFICATION_IDS_KEY = 'anhad_managed_notification_ids_v2';
    var SESSION_ALARM_SHOWN_KEY = 'anhadAlarmShownThisSession';

    // Audio file mapping (matches Smart Reminder v7 CONFIG.audio.files)
    var AUDIO_FILES = {
        'audio1': 'audio1.mp3',
        'audio2': 'audio2.mp3',
        'audio3': 'audio3.mpeg',
        'audio4': 'audio4.mpeg',
        'audio5': 'audio5.mpeg',
        'audio6': 'audio6.mpeg'
    };

    function isNative() {
        return window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();
    }

    function getNaamManager() {
        return window.NaamAbhyasManager || null;
    }

    function ensureNaamManagerLoaded() {
        if (window.NaamAbhyasManager || document.getElementById('naamAbhyasManagerScript')) return;
        var path = window.location.pathname;
        var src = 'lib/naam-abhyas-manager.js';
        if (path.indexOf('/NaamAbhyas/') !== -1 ||
            path.indexOf('/reminders/') !== -1 ||
            path.indexOf('/Homepage/') !== -1 ||
            path.indexOf('/NitnemTracker/') !== -1 ||
            path.indexOf('/GurbaniRadio/') !== -1 ||
            path.indexOf('/Calendar/') !== -1 ||
            path.indexOf('/Hukamnama/') !== -1 ||
            path.indexOf('/GurbaniKhoj/') !== -1 ||
            path.indexOf('/SehajPaath/') !== -1 ||
            path.indexOf('/Favorites/') !== -1 ||
            path.indexOf('/Notes/') !== -1 ||
            path.indexOf('/Insights/') !== -1 ||
            path.indexOf('/Profile/') !== -1 ||
            path.indexOf('/ShabadVichar/') !== -1 ||
            path.indexOf('/RandomShabad/') !== -1 ||
            path.indexOf('/nitnem/') !== -1) {
            src = '../lib/naam-abhyas-manager.js';
        }
        if (path.indexOf('/nitnem/category/') !== -1) src = '../../lib/naam-abhyas-manager.js';
        var script = document.createElement('script');
        script.id = 'naamAbhyasManagerScript';
        script.src = src;
        script.defer = true;
        document.head.appendChild(script);
    }

    function hash(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
        // Murmur3 finalizer mix to ensure non-linear avalanche effect across sequential inputs
        h ^= h >>> 16;
        h = Math.imul(h, 0x85ebca6b);
        h ^= h >>> 13;
        h = Math.imul(h, 0xc2b2ae35);
        h ^= h >>> 16;
        return Math.abs(h) % 2000000000;
    }

    function getReliabilityPlugin() {
        return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AlarmReliability;
    }

    async function ensureAndroidAlarmReliability() {
        var plugin = getReliabilityPlugin();
        if (!plugin) return;
        try {
            var status = await plugin.getStatus();
            if (!status || status.exactAlarm !== true) {
                await plugin.requestExactAlarmPermission();
            }
            if (status && status.batteryOptimized === true) {
                await plugin.requestIgnoreBatteryOptimizations();
            }
        } catch(e) {
            console.warn('[ANHAD] Alarm reliability permission check failed:', e);
        }
    }

    async function cancelManagedNotifications(LN) {
        try {
            var ids = JSON.parse(localStorage.getItem(MANAGED_NOTIFICATION_IDS_KEY) || '[]');
            if (!Array.isArray(ids) || ids.length === 0) return;
            await LN.cancel({ notifications: ids.map(function(id) { return { id: Number(id) }; }) });
        } catch(e) {
            console.warn('[ANHAD] Managed notification cleanup failed:', e);
        }
    }

    function saveManagedNotifications(notifs) {
        try {
            var ids = (notifs || []).map(function(n) { return n.id; }).filter(function(id) { return typeof id === 'number'; });
            localStorage.setItem(MANAGED_NOTIFICATION_IDS_KEY, JSON.stringify(ids));
        } catch(e) {}
    }

    async function cancelManagedFSAlarms() {
        var reliabilityPlugin = getReliabilityPlugin();
        if (!reliabilityPlugin) return;
        try {
            var ids = JSON.parse(localStorage.getItem('anhad_managed_fs_alarm_ids') || '[]');
            if (!Array.isArray(ids) || ids.length === 0) return;
            for (var i = 0; i < ids.length; i++) {
                try {
                    await reliabilityPlugin.cancelFullScreenAlarm({ id: Number(ids[i]) });
                } catch(e) {}
            }
            localStorage.setItem('anhad_managed_fs_alarm_ids', '[]');
        } catch(e) {
            console.warn('[ANHAD] Full-screen alarm cleanup failed:', e);
        }
    }

    function saveManagedFSAlarms(ids) {
        try {
            localStorage.setItem('anhad_managed_fs_alarm_ids', JSON.stringify(ids));
        } catch(e) {}
    }

    function esc(t) { var d = document.createElement('span'); d.textContent = t || ''; return d.innerHTML; }

    function getAudioBasePath() {
        var p = window.location.pathname;
        if (p.includes('/reminders/') || p.includes('/Homepage/') || p.includes('/NaamAbhyas/') || p.includes('/NitnemTracker/') || p.includes('/GurbaniRadio/'))
            return '../Audio/';
        return './Audio/';
    }

    // ═══ INJECT GLOBAL CSS ═══
    function injectCSS() {
        if (document.getElementById('anhadAlarmCSS')) return;
        var s = document.createElement('style');
        s.id = 'anhadAlarmCSS';
        s.textContent = [
            '#anhadAlarmOverlay{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;visibility:hidden;transition:all .3s ease}',
            '#anhadAlarmOverlay.active{opacity:1;visibility:visible}',
            '.anhad-alarm-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}',
            '.anhad-alarm-card{position:relative;background:var(--card-bg,#fff);border-radius:28px;padding:36px 28px;text-align:center;width:100%;max-width:340px;box-shadow:0 32px 64px rgba(0,0,0,.5);animation:anhadModalIn .4s cubic-bezier(.175,.885,.32,1.275)}',
            '@keyframes anhadModalIn{from{opacity:0;transform:scale(.85) translateY(24px)}to{opacity:1;transform:scale(1) translateY(0)}}',
            '.anhad-alarm-visual{position:relative;margin-bottom:16px;display:flex;align-items:center;justify-content:center}',
            '.anhad-alarm-ripple{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:90px;height:90px;border-radius:50%;border:2px solid rgba(255,149,0,.6);animation:anhadRipple 2s ease-out infinite}',
            '.anhad-alarm-ripple:nth-child(2){animation-delay:.7s;width:110px;height:110px}',
            '@keyframes anhadRipple{0%{transform:translate(-50%,-50%) scale(1);opacity:.8}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}',
            '.anhad-alarm-icon{position:relative;font-size:60px;z-index:1;filter:drop-shadow(0 4px 12px rgba(255,149,0,.4))}',
            '.anhad-alarm-time{font-size:38px;font-weight:200;letter-spacing:-1px;color:var(--text-primary,#1a1a2e);margin:8px 0 2px;font-variant-numeric:tabular-nums}',
            '.anhad-alarm-label{font-size:15px;color:var(--text-secondary,#666);margin-bottom:6px;font-weight:500}',
            '.anhad-alarm-gurmukhi{font-size:17px;color:#ff9500;margin-bottom:4px;line-height:1.5}',
            '.anhad-alarm-english{font-size:13px;color:var(--text-secondary,#888);margin-bottom:24px;font-style:italic;line-height:1.5}',
            '.anhad-alarm-actions{display:flex;gap:10px}',
            '.anhad-alarm-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:16px 12px;border-radius:18px;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s ease;letter-spacing:.3px}',
            '.anhad-alarm-btn svg{width:26px;height:26px}',
            '.anhad-alarm-btn.snooze{background:var(--bg-tertiary,#f0f0f5);color:var(--text-primary,#1a1a2e)}',
            '.anhad-alarm-btn.complete{background:linear-gradient(135deg,#ff9500,#e65c00);color:#fff;box-shadow:0 6px 20px rgba(255,100,0,.35)}',
            '.anhad-alarm-btn.complete:active,.anhad-naam-btn-primary:active,.anhad-naam-btn-reading:active{transform:scale(.95)}',
            // Naam Abhyas specific popup — Serene, calm spiritual design
            '#anhadNaamPopup{position:fixed;inset:0;z-index:9999999;display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;visibility:hidden;transition:all .35s cubic-bezier(.4,0,.2,1)}',
            '#anhadNaamPopup.active{opacity:1;visibility:visible}',
            '.anhad-naam-sheet{width:100%;max-width:380px;background:linear-gradient(165deg,#120f24 0%,#1c0c00 100%);border:1px solid rgba(255,180,50,.3);border-radius:28px;padding:32px 24px 28px;position:relative;box-shadow:0 30px 80px rgba(0,0,0,.85),0 0 40px rgba(255,149,0,.15);text-align:center;animation:anhadPopupIn .4s cubic-bezier(.175,.885,.32,1.275)}',
            '@keyframes anhadPopupIn{from{opacity:0;transform:scale(.88) translateY(24px)}to{opacity:1;transform:scale(1) translateY(0)}}',
            '.anhad-naam-aura{position:relative;width:76px;height:76px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center}',
            '.anhad-naam-pulse{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(255,180,50,.4);animation:anhadPulse 2.4s ease-out infinite}',
            '.anhad-naam-pulse:nth-child(2){animation-delay:.9s;border-color:rgba(255,149,0,.25)}',
            '@keyframes anhadPulse{0%{transform:scale(.8);opacity:.9}100%{transform:scale(1.7);opacity:0}}',
            '.anhad-naam-ikonkar{font-size:46px;color:#ffb347;filter:drop-shadow(0 0 16px rgba(255,179,71,.6));z-index:2;line-height:1;user-select:none}',
            '.anhad-naam-title{font-size:22px;font-weight:800;color:#fff;margin-bottom:4px;letter-spacing:-.3px}',
            '.anhad-naam-badge{display:inline-block;padding:4px 14px;background:rgba(255,180,50,.15);border:1px solid rgba(255,180,50,.3);border-radius:20px;font-size:12px;font-weight:600;color:#ffc56e;margin-bottom:16px}',
            '.anhad-naam-quote-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:16px;margin-bottom:20px}',
            '.anhad-naam-quote-g{font-size:17px;font-weight:600;color:#ffb347;margin-bottom:6px;line-height:1.5}',
            '.anhad-naam-quote-e{font-size:13px;color:rgba(255,255,255,.75);font-style:italic;line-height:1.5}',
            '.anhad-naam-actions{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}',
            '.anhad-naam-btn-primary{width:100%;padding:16px;background:linear-gradient(135deg,#ff9500,#e65c00);color:#fff;font-size:16px;font-weight:700;border:none;border-radius:18px;cursor:pointer;box-shadow:0 8px 24px rgba(255,120,0,.4);transition:all .2s ease;display:flex;align-items:center;justify-content:center;gap:8px}',
            '.anhad-naam-btn-reading{width:100%;padding:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,180,50,.35);color:#ffc56e;font-size:15px;font-weight:600;border-radius:18px;cursor:pointer;transition:all .2s ease;display:flex;align-items:center;justify-content:center;gap:8px}',
            '.anhad-naam-subactions{display:flex;gap:8px;justify-content:center}',
            '.anhad-naam-subbtn{flex:1;padding:10px;background:transparent;border:none;color:rgba(255,255,255,.5);font-size:13px;cursor:pointer;border-radius:10px;transition:color .2s ease}',
            '.anhad-naam-subbtn:hover{color:#fff}',
            '[data-theme="dark"] .anhad-alarm-card,[data-theme="dark"] .anhad-alarm-card{background:#1a1a2e}',
            '[data-theme="dark"] .anhad-alarm-time{color:#fff}',
            '[data-theme="dark"] .anhad-alarm-label{color:#aaa}',
            '[data-theme="dark"] .anhad-alarm-btn.snooze{background:#2c2c2e;color:#fff}'
        ].join('\n');
        document.head.appendChild(s);
    }

    // ═══ ALARM POPUP — Uses selected tone ═══
    function showAlarmPopup(label, time, icon, tone) {
        if (document.getElementById('anhadAlarmOverlay')) return;
        injectCSS();

        var h12 = '--:--';
        if (time) {
            var p = time.split(':');
            var hh = parseInt(p[0], 10), mm = p[1] || '00';
            var per = hh >= 12 ? 'PM' : 'AM';
            hh = hh % 12 || 12;
            h12 = hh + ':' + mm + ' ' + per;
        } else {
            var now = new Date();
            h12 = ((now.getHours() % 12) || 12) + ':' + now.getMinutes().toString().padStart(2, '0') + ' ' + (now.getHours() >= 12 ? 'PM' : 'AM');
        }

        var alarmId = label + '_' + (time || '');

        var o = document.createElement('div');
        o.id = 'anhadAlarmOverlay';
        o.innerHTML =
            '<div class="anhad-alarm-backdrop"></div>' +
            '<div class="anhad-alarm-card">' +
            '  <div class="anhad-alarm-visual">' +
            '    <div class="anhad-alarm-ripple"></div>' +
            '    <div class="anhad-alarm-ripple"></div>' +
            '    <div class="anhad-alarm-icon">' + esc(icon || '🔔') + '</div>' +
            '  </div>' +
            '  <div class="anhad-alarm-time">' + esc(h12) + '</div>' +
            '  <div class="anhad-alarm-label">' + esc(label || 'Reminder') + '</div>' +
            '  <div class="anhad-alarm-actions">' +
            '    <button class="anhad-alarm-btn snooze" id="anhadSnoozeBtn">' +
            '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>' +
            '      Snooze' +
            '    </button>' +
            '    <button class="anhad-alarm-btn complete" id="anhadCompleteBtn">' +
            '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>' +
            '      Dismiss' +
            '    </button>' +
            '  </div>' +
            '</div>';

        document.body.appendChild(o);
        requestAnimationFrame(function() { o.classList.add('active'); });

        // ═══ PLAY THE CORRECT SELECTED TONE ═══
        var audio = document.createElement('audio');
        audio.id = 'anhadAlarmAudio'; audio.loop = true; audio.volume = 1.0;
        var selectedTone = tone || 'audio1';
        var audioFile = AUDIO_FILES[selectedTone] || 'audio1.mp3';
        audio.src = getAudioBasePath() + audioFile;
        document.body.appendChild(audio);
        audio.play().catch(function() {});

        // Vibration
        var vib = null;
        if (navigator.vibrate) {
            vib = setInterval(function() { navigator.vibrate([400, 200, 400]); }, 2000);
        }

        function stop() {
            audio.pause(); audio.remove();
            if (vib) clearInterval(vib);
            if (navigator.vibrate) navigator.vibrate(0);
        }

        function dismiss() {
            stop();
            o.classList.remove('active');
            setTimeout(function() { o.remove(); }, 300);
            try { localStorage.removeItem('anhad_pending_alarm'); } catch(e) {}
            // ═══ RECORD ALARM RESPONSE FOR OBEDIENCE TRACKING ═══
            recordAlarmResponse(alarmId, 'completed', label, time);
            window.dispatchEvent(new CustomEvent('alarmInteraction', {
                detail: { action: 'completed', alarmId: alarmId, label: label, time: time, timestamp: new Date().toISOString() }
            }));
        }

        function snooze(mins) {
            stop();
            o.classList.remove('active');
            setTimeout(function() { o.remove(); }, 300);
            try { localStorage.removeItem('anhad_pending_alarm'); } catch(e) {}
            recordAlarmResponse(alarmId, 'snoozed', label, time);
            if (isNative() && window.Capacitor.Plugins.LocalNotifications) {
                window.Capacitor.Plugins.LocalNotifications.schedule({ notifications: [{
                    id: hash('snz' + Date.now()), title: '🔔 Snoozed: ' + (label || 'Reminder'),
                    body: 'Your reminder is back!',
                    schedule: { at: new Date(Date.now() + mins * 60000), allowWhileIdle: true, exact: true },
                    channelId: 'anhad_alarms', sound: 'default',
                    extra: { action: 'show_alarm', alarmLabel: label, alarmTime: time, alarmIcon: icon || '🔔', alarmTone: selectedTone }
                }]});
            }
            showToast('Snoozed for ' + mins + ' min 😴');
        }

        document.getElementById('anhadCompleteBtn').onclick = dismiss;
        document.getElementById('anhadSnoozeBtn').onclick = function() { snooze(10); };

        setTimeout(function() {
            if (document.getElementById('anhadAlarmOverlay')) dismiss();
        }, 60000);

        try {
            localStorage.setItem('anhad_pending_alarm', JSON.stringify({
                label: label, time: time, icon: icon, tone: selectedTone, ts: Date.now()
            }));
        } catch(e) {}
    }

    // ═══ FORMAT TIME AS 12H ═══
    function formatH12(h, m) {
        var per = h >= 12 ? 'PM' : 'AM';
        var hh = h % 12 || 12;
        return hh + ':' + (m < 10 ? '0' + m : m) + ' ' + per;
    }

    // ═══ NAAM ABHYAS FOREGROUND POPUP (Fix 4) ═══
    // Beautiful bottom-sheet shown when Naam Abhyas alarm fires on any non-Naam page.
    // Has Gurbani quote + "Start Simran" button that navigates to the Naam Abhyas page.
    var NAAM_QUOTES = [
        { g: 'ਨਾਮ ਜਪਤ ਅਘ ਕੋਟਿ ਉਤਾਰੇ', e: 'Chanting the Naam erases millions of sins' },
        { g: 'ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ', e: 'O mind, recognize your divine origin' },
        { g: 'ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਉ', e: 'Meditate, meditate, meditate and find peace' },
        { g: 'ਗੁਰਮੁਖਿ ਨਾਮੁ ਜਪਹੁ ਮਨ ਮੇਰੇ', e: 'O my mind, chant the Naam as Gurmukh' },
        { g: 'ਹਰਿ ਕਾ ਨਾਮੁ ਜਪਿ ਦਿਨਸੁ ਰਾਤਿ', e: 'Chant the Lord\'s Name, day and night' },
        { g: 'ਜਪਿ ਮਨ ਸਤਿ ਨਾਮੁ ਸਦਾ ਸਤਿ ਨਾਮੁ', e: 'Chant the True Name always' },
        { g: 'ਤੂੰ ਮੇਰਾ ਪਿਤਾ ਤੂੰਹੈ ਮੇਰਾ ਮਾਤਾ', e: 'You are my Father, You are my Mother' },
        { g: 'ਸਬ ਕੰਮ ਛੱਡੋ, ਵਾਹਿਗੁਰੂ ਜੀ ਦਾ ਸਿਮਰਨ ਕਰੋ', e: 'Leave all work, remember Vaheguru Ji' }
    ];

    function showNaamAbhyasPopup(hour, minute) {
        if (document.getElementById('anhadNaamPopup')) return;
        injectCSS();

        var now = new Date();
        var h = (hour !== undefined) ? Number(hour) : now.getHours();
        var m = (minute !== undefined) ? Number(minute) : now.getMinutes();
        var timeStr = formatH12(h, m);
        var quote = NAAM_QUOTES[Math.floor(Math.random() * NAAM_QUOTES.length)];

        // Resolve Naam Abhyas URL relative to current page depth
        var path = window.location.pathname;
        var naamBaseUrl;
        if (path.includes('/NaamAbhyas/')) {
            naamBaseUrl = 'naam-abhyas.html';
        } else if (path.indexOf('/nitnem/category/') !== -1) {
            naamBaseUrl = '../../NaamAbhyas/naam-abhyas.html';
        } else if (path.includes('/reminders/') || path.includes('/Homepage/') || path.includes('/NitnemTracker/') ||
                   path.includes('/GurbaniRadio/') || path.includes('/Calendar/') || path.includes('/Hukamnama/') ||
                   path.includes('/GurbaniKhoj/') || path.includes('/SehajPaath/') || path.includes('/Favorites/') ||
                   path.includes('/Notes/') || path.includes('/Insights/') || path.includes('/Profile/') ||
                   path.includes('/ShabadVichar/') || path.includes('/RandomShabad/') || path.includes('/nitnem/')) {
            naamBaseUrl = '../NaamAbhyas/naam-abhyas.html';
        } else {
            naamBaseUrl = 'NaamAbhyas/naam-abhyas.html';
        }

        var el = document.createElement('div');
        el.id = 'anhadNaamPopup';
        el.innerHTML =
            '<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)" id="anhadNaamBd"></div>' +
            '<div class="anhad-naam-sheet">' +
            '  <div class="anhad-naam-aura">' +
            '    <div class="anhad-naam-pulse"></div>' +
            '    <div class="anhad-naam-pulse"></div>' +
            '    <div class="anhad-naam-ikonkar">ੴ</div>' +
            '  </div>' +
            '  <div class="anhad-naam-title">ਨਾਮ ਅਭਿਆਸ | Naam Abhyas</div>' +
            '  <div class="anhad-naam-badge">✨ ' + esc(timeStr) + ' • Sacred Pause</div>' +
            '  <div class="anhad-naam-quote-box">' +
            '    <div class="anhad-naam-quote-g">' + esc(quote.g) + '</div>' +
            '    <div class="anhad-naam-quote-e">“' + esc(quote.e) + '”</div>' +
            '  </div>' +
            '  <div class="anhad-naam-actions">' +
            '    <button class="anhad-naam-btn-primary" id="anhadNaamStartBtn">' +
            '      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 3l14 9-14 9V3z"/></svg>' +
            '      <span>Start Simran (2 min)</span>' +
            '    </button>' +
            '    <button class="anhad-naam-btn-reading" id="anhadNaamReadingBtn">' +
            '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' +
            '      <span>Sacred Reading &amp; Simran</span>' +
            '    </button>' +
            '  </div>' +
            '  <div class="anhad-naam-subactions">' +
            '    <button class="anhad-naam-subbtn" id="anhadNaamSnoozeBtn">⏰ Snooze 5 min</button>' +
            '    <button class="anhad-naam-subbtn" id="anhadNaamSkipBtn">Dismiss</button>' +
            '  </div>' +
            '</div>';

        document.body.appendChild(el);
        requestAnimationFrame(function() { el.classList.add('active'); });

        // Play calm Tibetan singing bowl softly
        var audio = document.createElement('audio');
        audio.id = 'anhadNaamAudio'; audio.loop = false; audio.volume = 0.6;
        audio.src = getAudioBasePath() + 'calm-singing-bowl.mp3';
        document.body.appendChild(audio);
        audio.play().catch(function() {
            // Fallback to audio1 if needed
            audio.src = getAudioBasePath() + 'audio1.mp3';
            audio.play().catch(function() {});
        });

        // Vibration
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }

        function closePopup() {
            el.classList.remove('active');
            setTimeout(function() { el.remove(); }, 350);
            var a = document.getElementById('anhadNaamAudio');
            if (a) { a.pause(); a.remove(); }
        }

        function launchSession(mode) {
            closePopup();
            var targetMode = mode || 'simran';
            var finalUrl = naamBaseUrl + '?autoStart=true&hour=' + h + '&minute=' + m + '&mode=' + targetMode;
            try {
                localStorage.setItem('anhad_pending_naam_launch', JSON.stringify({
                    autoStart: true,
                    hour: String(h),
                    minute: String(m),
                    mode: targetMode,
                    practiceType: targetMode,
                    timestamp: Date.now()
                }));
            } catch(e) {}
            window.location.href = finalUrl;
        }

        document.getElementById('anhadNaamStartBtn').onclick = function() { launchSession('simran'); };
        document.getElementById('anhadNaamReadingBtn').onclick = function() { launchSession('reading'); };

        document.getElementById('anhadNaamSnoozeBtn').onclick = function() {
            closePopup();
            showToast('Naam Abhyas snoozed for 5 minutes 🙏');
            if (isNative() && window.Capacitor.Plugins.LocalNotifications) {
                window.Capacitor.Plugins.LocalNotifications.schedule({
                    notifications: [{
                        id: hash('naam_snz_' + Date.now()),
                        title: '🙏 ਨਾਮ ਅਭਿਆਸ — Reminder',
                        body: 'Time to pause and remember Vaheguru ✨',
                        schedule: { at: new Date(Date.now() + 5 * 60000), allowWhileIdle: true, exact: true },
                        channelId: 'naam_abhyas_v3',
                        sound: 'naam_bell',
                        extra: {
                            action: 'auto_start_naam',
                            autoStart: 'true',
                            hour: String(h),
                            minute: String(m),
                            url: 'NaamAbhyas/naam-abhyas.html'
                        }
                    }]
                });
            }
        };

        document.getElementById('anhadNaamSkipBtn').onclick = closePopup;
        document.getElementById('anhadNaamBd').onclick = closePopup;

        // Auto-dismiss after 90 seconds
        setTimeout(function() {
            if (document.getElementById('anhadNaamPopup')) closePopup();
        }, 90000);
    }

    // ═══ ALARM RESPONSE RECORDING (for Nitnem Tracker obedience) ═══
    function recordAlarmResponse(alarmId, action, label, time) {
        try {
            var today = new Date().toLocaleDateString('en-CA');
            var log = JSON.parse(localStorage.getItem('nitnemTracker_alarmLog') || '{}');
            if (!log[today]) log[today] = {};
            log[today][alarmId || label] = {
                action: action,
                label: label || '',
                time: time || '',
                respondedAt: new Date().toISOString()
            };
            localStorage.setItem('nitnemTracker_alarmLog', JSON.stringify(log));

            // ═══ BRIDGE TO NitnemSync for alarm obedience ═══
            // Determine alarm type from label (amritvela/rehras/sohila/custom)
            var alarmType = 'custom';
            var labelLower = (label || '').toLowerCase();
            if (labelLower.includes('amritvela') || labelLower.includes('japji') || labelLower.includes('morning'))
                alarmType = 'amritvela';
            else if (labelLower.includes('rehras') || labelLower.includes('evening'))
                alarmType = 'rehras';
            else if (labelLower.includes('sohila') || labelLower.includes('night'))
                alarmType = 'sohila';

            // Dispatch for NitnemSync (alarm obedience tracking)
            window.dispatchEvent(new CustomEvent('alarmSyncUpdate', {
                detail: { reminderId: alarmType, status: action, timestamp: new Date().toISOString(), label: label }
            }));

            // Dispatch for widget bridge
            window.dispatchEvent(new CustomEvent('alarmResponseRecorded', {
                detail: { alarmId: alarmId, action: action, label: label }
            }));
        } catch(e) {}
    }

    function showToast(msg) {
        var t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;padding:12px 24px;border-radius:25px;font-size:14px;z-index:9999999;font-family:-apple-system,sans-serif;';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function() { t.remove(); }, 3000);
    }

    // ═══ CHECK PENDING ALARM (with expiry + single-show guard) ═══
    // Fix 6: Use sessionStorage flag so alarm only fires ONCE per app session,
    // not once per page navigation (which caused multi-page duplicate popups).
    function checkPendingAlarm() {
        try {
            // Guard: if already shown in this JS session, skip
            if (sessionStorage.getItem(SESSION_ALARM_SHOWN_KEY)) return;
            var raw = localStorage.getItem('anhad_pending_alarm');
            if (!raw) return;
            var data = JSON.parse(raw);
            // Expired or already shown flag set
            if (Date.now() - data.ts > EXPIRY_MS || data._shown) {
                localStorage.removeItem('anhad_pending_alarm');
                return;
            }
            // Mark immediately to prevent re-show on next page load this session
            sessionStorage.setItem(SESSION_ALARM_SHOWN_KEY, '1');
            // Mark in localStorage too so concurrent pages don't re-trigger
            data._shown = true;
            localStorage.setItem('anhad_pending_alarm', JSON.stringify(data));
            showAlarmPopup(data.label, data.time, data.icon, data.tone);
        } catch(e) { localStorage.removeItem('anhad_pending_alarm'); }
    }

    // ═══ SCHEDULE STREAK SAVER NOTIFICATION (6:01 AM daily) ═══
    function scheduleStreakSaverCheck(notifs) {
        if (!isNative()) return;
        try {
            var now = new Date();
            
            // Schedule for next 7 days (Capacitor doesn't support repeats with specific time)
            // scheduleAll() runs periodically so it will reschedule as needed
            for (var d = 0; d < 7; d++) {
                var scheduleDate = new Date(now);
                scheduleDate.setDate(scheduleDate.getDate() + d);
                scheduleDate.setHours(6, 1, 0, 0); // 6:01 AM
                
                // Skip if time has passed for today
                if (scheduleDate <= now) continue;

                // Check if user has a streak to protect
                var streakData = null;
                try { streakData = JSON.parse(localStorage.getItem('anhad_streak_data') || localStorage.getItem('nitnemTracker_streakData') || '{}'); } catch(e) {}
                var hasStreak = streakData && ((streakData.current || streakData.currentStreak || 0) > 0);

                if (hasStreak) {
                    notifs.push({
                        id: 70001 + d,
                        title: '⚡ Streak Saver Check',
                        body: 'Your streak needs protection. Open the app to check your Amritvela status.',
                        schedule: { at: scheduleDate, allowWhileIdle: true, exact: true },
                        channelId: 'anhad_alarms', sound: 'default', smallIcon: 'ic_stat_notify',
                        extra: { action: 'show_streak_saver', url: 'NitnemTracker/nitnem-tracker.html?streakSaver=activate' }
                    });
                }
            }
        } catch(e) {
            console.error('[StreakSaver] Error scheduling notification:', e);
        }
    }

    // ═══ SCHEDULE NOTIFICATIONS (with tone in extras) ═══
    async function scheduleAll() {
        if (!isNative()) return;
        var LN = window.Capacitor.Plugins.LocalNotifications;
        try {
            var p = await LN.checkPermissions();
            if (p.display !== 'granted') await LN.requestPermissions();

            // ═══ CHANNEL SETUP ═══
            // importance=4 (IMPORTANCE_HIGH) is required for heads-up popup.
            try { await LN.createChannel({ id: 'anhad_alarms', name: 'Anhad Alarms', importance: 4, visibility: 1, vibration: true, sound: 'default', lights: true, lightColor: '#f7c634' }); } catch(e) {}
            try { await LN.createChannel({ id: 'anhad_reminders', name: 'ANHAD Reminders', description: 'Nitnem and spiritual practice alarms', importance: 4, visibility: 1, vibration: true, sound: 'default', lights: true, lightColor: '#f7c634' }); } catch(e) {}
            // Delete old channels
            try { await LN.deleteChannel({ id: 'naam_abhyas' }); } catch(e) {}
            try { await LN.deleteChannel({ id: 'naam_abhyas_v3' }); } catch(e) {}
            // Create fresh channel with guaranteed IMPORTANCE_HIGH for heads-up popup and calm bell sound
            try { await LN.createChannel({ id: 'naam_abhyas_v4', name: 'Naam Abhyas Reminders', description: 'Hourly sacred reminders for Naam Simran & Reading', importance: 4, visibility: 1, vibration: true, sound: 'naam_bell', lights: true, lightColor: '#f7c634' }); } catch(e) {}
            try { await LN.createChannel({ id: 'spiritual_reminders', name: 'Spiritual Reminders', importance: 4, visibility: 1, vibration: true, sound: 'default', lights: true, lightColor: '#f7c634' }); } catch(e) {}
            await ensureAndroidAlarmReliability();
            await cancelManagedNotifications(LN);
            await cancelManagedFSAlarms();

            var notifs = [];
            var fsAlarmIds = [];
            var now = new Date();

            // SmartReminders v7 — include tone in extras
            var sr = null;
            try { sr = JSON.parse(localStorage.getItem('sr_reminders_v7') || localStorage.getItem('sr_reminders_v4')); } catch(e) {}
            if (sr) {
                var all = [];
                if (sr.core) { Object.keys(sr.core).forEach(function(k) { var r = sr.core[k]; if (r && r.enabled) all.push(r); }); }
                if (sr.custom) { sr.custom.forEach(function(r) { if (r && r.enabled) all.push(r); }); }
                var reliabilityPlugin = getReliabilityPlugin();
                all.forEach(function(alarm) {
                    for (var d = 0; d < 7; d++) {
                        var dt = new Date(now); dt.setDate(dt.getDate() + d);
                        if (alarm.days && alarm.days.indexOf(dt.getDay()) === -1) continue;
                        var tp = (alarm.time || '05:00').split(':');
                        var st = new Date(dt); st.setHours(parseInt(tp[0], 10), parseInt(tp[1], 10), 0, 0);
                        if (st <= now) continue;
                        var alarmLabel = alarm.label || alarm.title || 'Reminder';
                        var alarmTime = alarm.time || '';
                        notifs.push({
                            id: hash((alarm.id || 'a') + '_d' + d),
                            title: '🔔 ' + alarmLabel,
                            body: alarmTime + ' \u2014 Chak de phatte! Time aa gya \ud83d\ude4f Open ANHAD.',
                            schedule: { at: st, allowWhileIdle: true, exact: true },
                            channelId: 'anhad_reminders', sound: 'default', smallIcon: 'ic_stat_notify',
                            extra: {
                                action: 'show_alarm',
                                alarmLabel: alarmLabel,
                                alarmTime: alarmTime,
                                alarmIcon: alarm.icon || '\ud83d\udd14',
                                alarmTone: alarm.tone || 'audio1',
                                alarmId: alarm.id || ''
                            }
                        });
                        // ═══ FIX 5: Native full-screen alarm for locked screen ═══
                        // Fires even when phone is locked or app is closed.
                        // Schedule for days 0-1 to extend coverage without exceeding AlarmManager quota.
                        if (reliabilityPlugin && d <= 1) {
                            var fsId = hash('fs_' + (alarm.id || 'a') + '_d' + d);
                            fsAlarmIds.push(fsId);
                            (function(lbl, alTime, ts, hourStr, minStr, dayIdx, fId) {
                                reliabilityPlugin.scheduleFullScreenAlarm({
                                    id: fId,
                                    timestamp: ts,
                                    title: lbl,
                                    message: alTime + ' \u2014 Tera alarm aa gya! \ud83d\ude4f',
                                    hour: hourStr,
                                    minute: minStr
                                }).catch(function(e) {
                                    console.warn('[ANHAD] FS alarm failed:', e);
                                });
                            })(alarmLabel, alarmTime, st.getTime(), tp[0], tp[1], d, fsId);
                        }
                    }
                });
            }

            // NaamAbhyas — Enabled by default to guarantee hourly notifications
            var nc = null;
            try { nc = JSON.parse(localStorage.getItem('naam_abhyas_config')); } catch(e) {}
            if (!nc) {
                nc = {
                    enabled: true,
                    duration: 2,
                    activeHours: { start: 5, end: 22 },
                    notifications: { hourStart: true, sound: 'calm-singing-bowl', vibration: true, soundEnabled: true },
                    autoStartTimer: true,
                    theme: 'system'
                };
                try { localStorage.setItem('naam_abhyas_config', JSON.stringify(nc)); } catch(e) {}
            }
            if (nc && nc.enabled !== false) {
                var sh = (nc.activeHours && nc.activeHours.start) || 5;
                var eh = (nc.activeHours && nc.activeHours.end) || 22;
                var auto = nc.autoStartTimer || false;
                
                // Read schedule data safely (support object, wrapper, or array)
                var rawSchedule = null;
                try { rawSchedule = JSON.parse(localStorage.getItem('naam_abhyas_schedule')); } catch(e) {}
                var scheduleMap = (rawSchedule && rawSchedule._schedule) ? rawSchedule._schedule : (rawSchedule || {});

                // Helper to format 12-hour time with leading zero on minute
                function formatTime12(h, m) {
                    var per = h >= 12 ? 'PM' : 'AM';
                    var hh = h % 12 || 12;
                    var mm = m < 10 ? '0' + m : m;
                    return hh + ':' + mm + ' ' + per;
                }

                // If scheduleMap is missing, empty, or from a different day, generate today's random timeline!
                var todayDateStr = now.toLocaleDateString('en-CA');
                var isScheduleFresh = rawSchedule && rawSchedule._date === todayDateStr && scheduleMap && Object.keys(scheduleMap).length > 0 && scheduleMap[sh];
                if (!isScheduleFresh) {
                    scheduleMap = {};
                    for (var hIdx = sh; hIdx <= eh; hIdx++) {
                        var randMin = 2 + (hash(todayDateStr + '_naam_slot_' + hIdx) % 56);
                        scheduleMap[hIdx] = {
                            hour: hIdx,
                            startMinute: randMin,
                            endMinute: randMin + 2,
                            durationMinutes: 2,
                            startTime: formatTime12(hIdx, randMin),
                            endTime: formatTime12(hIdx, randMin + 2),
                            status: 'pending'
                        };
                    }
                    try {
                        localStorage.setItem('naam_abhyas_schedule', JSON.stringify({
                            _date: todayDateStr,
                            _schedule: scheduleMap,
                            ...scheduleMap
                        }));
                    } catch(e) {}
                }

                var spiritualMessages = [
                    { gurmukhi: 'ਵਾਹਿਗੁਰੂ ਜੀ — ਸਮਾਂ ਹੋ ਗਿਆ', english: 'Time for Naam! Leave everything for 2 minutes 🙏' },
                    { gurmukhi: 'ਸਬ ਕੰਮ ਛੱਡੋ, ਵਾਹਿਗੁਰੂ ਜੀ ਦਾ ਸਿਮਰਨ ਕਰੋ', english: 'Leave all work, remember Vaheguru Ji 🙏' },
                    { gurmukhi: 'ਜਪਿ ਮਨ ਸਤਿ ਨਾਮੁ ਸਦਾ ਸਤਿ ਨਾਮੁ', english: 'Chant the True Name — Sat Naam always' },
                    { gurmukhi: 'ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਉ', english: 'Meditate, meditate, meditate and find peace' },
                    { gurmukhi: 'ਨਾਮ ਜਪਤ ਅਘ ਕੋਟਿ ਉਤਾਰੇ', english: 'Naam japan naal anand aunda hai 🙏' },
                    { gurmukhi: 'ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ', english: 'Recognize your divine origin' },
                    { gurmukhi: 'ਹਰਿ ਕਾ ਨਾਮੁ ਜਪਿ ਦਿਨਸੁ ਰਾਤਿ', english: 'Chant the Lord\'s Name day and night' },
                    { gurmukhi: 'ਗੁਰਮੁਖਿ ਨਾਮੁ ਜਪਹੁ ਮਨ ਮੇਰੇ', english: 'O my mind, chant the Naam as Gurmukh' },
                    { gurmukhi: 'ਤੂੰ ਮੇਰਾ ਪਿਤਾ ਤੂੰਹੈ ਮੇਰਾ ਮਾਤਾ', english: 'You are my Father, You are my Mother' },
                    { gurmukhi: 'ਏਕੋ ਨਾਮੁ ਹੁਕਮੁ ਹੈ ਨਾਨਕ', english: 'The One Name is the Lord\'s Command' },
                    { gurmukhi: 'ਕਿਰਪਾ ਕਰਕੇ 2 ਮਿੰਟ ਲਈ ਅੱਖਾਂ ਬੰਦ ਕਰੋ', english: 'Sat Naam, Waheguru 🙏 2 min only' },
                    { english: 'Phone pocket vich rakh lo • akhan band kro • Waheguru japo 🙏' },
                    { english: '2 minutes with Waheguru > 2 hours of scrolling 🙏' },
                    { english: 'Tera schedule ho gya. Chal 2 min Waheguru bol 🙏' },
                    { english: 'Har kise nu wait kra, Waheguru nu nahi. Time ho gya! 🙏' },
                    { english: 'Drop everything. Your appointment with the Divine is NOW.' },
                    { english: 'In the noise of life, find 2 minutes of Naam silence.' },
                    { english: 'Naam Abhyas slot live! 120 seconds Rab naal 🙏' },
                    { english: '2-minute Simran break: kaam pause, Waheguru play 🙏' },
                    { english: 'Your streak grows stronger with every session. Japo Waheguru!' },
                    { english: 'The Divine is waiting. Just 2 minutes, right now. 🙏' },
                    { english: 'Be still. Breathe. Close your eyes. Waheguru Waheguru... 🙏' },
                    { english: 'Discipline compounds. Every 2 min session brings moksha closer.' },
                    { english: 'Waheguru Waheguru Waheguru... bas 2 min. Tu kar sakda hai! 🙏' }
                ];

                for (var nd = 0; nd < 7; nd++) {
                    var ndtDay = new Date(now);
                    ndtDay.setDate(ndtDay.getDate() + nd);
                    var dayDateStr = ndtDay.toLocaleDateString('en-CA');

                    for (var nh = sh; nh <= eh; nh++) {
                        var sessionMinute;
                        if (nd === 0 && scheduleMap[nh] && typeof scheduleMap[nh].startMinute === 'number') {
                            sessionMinute = scheduleMap[nh].startMinute;
                        } else {
                            // Generate deterministic random minute for each day and hour between 2 and 57 (e.g. 8:43, 9:05)
                            sessionMinute = 2 + (hash(dayDateStr + '_naam_slot_' + nh) % 56);
                        }

                        var ndt = new Date(ndtDay);
                        ndt.setHours(nh, sessionMinute, 0, 0);

                        var alertTime = new Date(ndt.getTime());
                        if (ndt <= now) continue;

                        var msgIdx = (nh + nd * 7) % spiritualMessages.length;
                        var message = spiritualMessages[msgIdx];
                        var bodyText = message.gurmukhi && message.english 
                            ? message.gurmukhi + ' — ' + message.english 
                            : message.english || message.gurmukhi;

                        var sessionH12 = (function(h, m) {
                            var per = h >= 12 ? 'PM' : 'AM';
                            var hh = h % 12 || 12;
                            return hh + ':' + (m < 10 ? '0' + m : m) + ' ' + per;
                        })(nh, sessionMinute);
                        var naamTitle = '🙏 ਨਾਮ ਅਭਿਆਸ — ' + sessionH12;

                        var naamLaunchUrl = 'NaamAbhyas/naam-abhyas.html?autoStart=true&hour=' + nh + '&minute=' + sessionMinute + '&mode=simran';

                        notifs.push({
                            id: 90000 + (nd * 24) + nh,
                            title: naamTitle,
                            body: bodyText,
                            schedule: { at: alertTime, allowWhileIdle: true, exact: true },
                            channelId: 'naam_abhyas_v4',
                            sound: 'naam_bell',
                            smallIcon: 'ic_stat_notify',
                            extra: {
                                action: 'auto_start_naam',
                                autoStart: 'true',
                                hour: String(nh),
                                minute: String(sessionMinute),
                                mode: 'simran',
                                practiceType: 'simran',
                                url: 'NaamAbhyas/naam-abhyas.html',
                                launchUrl: naamLaunchUrl,
                                type: 'naam_abhyas'
                            }
                        });

                        if (reliabilityPlugin && nd <= 2) {
                            var fsId = hash('fs_naam_' + nh + '_d' + nd);
                            fsAlarmIds.push(fsId);
                            (function(lbl, alTime, ts, hStr, mStr, dayIdx, fId) {
                                reliabilityPlugin.scheduleFullScreenAlarm({
                                    id: fId,
                                    timestamp: ts,
                                    title: lbl,
                                    message: alTime + ' \u2014 ' + bodyText,
                                    hour: hStr,
                                    minute: mStr,
                                    mode: 'simran'
                                }).catch(function(e) {
                                    console.warn('[ANHAD] FS alarm failed:', e);
                                });
                            })(naamTitle, sessionH12, alertTime.getTime(), String(nh), String(sessionMinute), nd, fsId);
                        }
                    }
                }
                console.log('[ANHAD] Naam Abhyas: scheduled ' + notifs.filter(function(n) { return n.channelId === 'naam_abhyas_v4'; }).length + ' notifications with calm sound');
            }

            // Daily nitnem summary at 10 PM
            for (var sd = 0; sd < 3; sd++) {
                var sdt = new Date(now); sdt.setDate(sdt.getDate() + sd); sdt.setHours(22, 0, 0, 0);
                if (sdt <= now) continue;
                notifs.push({
                    id: 80000 + sd,
                    title: '📋 Nitnem Summary',
                    body: 'Complete your remaining banis to save your streak 🙏',
                    schedule: { at: sdt, allowWhileIdle: true, exact: true },
                    channelId: 'anhad_alarms', sound: 'default', smallIcon: 'ic_stat_notify',
                    extra: { action: 'show_tracker', url: 'NitnemTracker/nitnem-tracker.html' }
                });
            }

            // ═══ ADD STREAK SAVER NOTIFICATION ═══
            for (var ndc = 0; ndc < 3; ndc++) {
                var ndtComplete = new Date(now);
                ndtComplete.setDate(ndtComplete.getDate() + ndc);
                ndtComplete.setHours(21, 0, 0, 0);
                if (ndtComplete <= now) continue;
                var completeDate = ndtComplete.toLocaleDateString('en-CA');
                if (ndc === 0 && localStorage.getItem('anhad_nitnem_notif_' + completeDate) === 'sent') continue;
                notifs.push({
                    id: 81000 + ndc,
                    title: 'Nitnem Check',
                    body: 'Tap to complete any remaining banis for today.',
                    schedule: { at: ndtComplete, allowWhileIdle: true, exact: true },
                    channelId: 'anhad_alarms', sound: 'default', smallIcon: 'ic_stat_notify',
                    extra: { action: 'show_tracker', url: 'NitnemTracker/nitnem-tracker.html' }
                });
            }

            var lastRadioOpened = parseInt(localStorage.getItem('anhad_gurbani_radio_last_opened') || '0', 10);
            var heardKirtanRecently = lastRadioOpened && (Date.now() - lastRadioOpened < 6 * 60 * 60 * 1000);
            if (!heardKirtanRecently) {
                var kirtanSlots = [
                    { hour: 6, stream: 'darbar', body: 'Darbar Sahib live kirtan is ready. Tap to listen.' },
                    { hour: 18, stream: 'amritvela', body: 'Take a quiet moment with Gurbani kirtan.' }
                ];
                for (var kd = 0; kd < 3; kd++) {
                    kirtanSlots.forEach(function(slot, slotIndex) {
                        var kt = new Date(now);
                        kt.setDate(kt.getDate() + kd);
                        kt.setHours(slot.hour, 0, 0, 0);
                        if (kt <= now) return;
                        notifs.push({
                            id: 82000 + kd * 10 + slotIndex,
                            title: 'Gurbani Kirtan',
                            body: slot.body,
                            schedule: { at: kt, allowWhileIdle: true, exact: true },
                            channelId: 'spiritual_reminders', sound: 'default', smallIcon: 'ic_stat_notify',
                            extra: { action: 'open_radio', url: 'GurbaniRadio/gurbani-radio.html?stream=' + slot.stream }
                        });
                    });
                }
            }

            scheduleStreakSaverCheck(notifs);

            // ═══ ADD SPIRITUAL NOTIFICATIONS (all 15 categories from notifications-content.json) ═══
            if (window.SpiritualNotifications && typeof window.SpiritualNotifications.buildNotifications === 'function') {
                try {
                    var spiritualNotifs = await window.SpiritualNotifications.buildNotifications();
                    if (Array.isArray(spiritualNotifs)) {
                        notifs = notifs.concat(spiritualNotifs);
                        console.log('[ANHAD] Built ' + spiritualNotifs.length + ' spiritual notifications for scheduling');
                    }
                } catch(spErr) {
                    console.warn('[ANHAD] Failed to build spiritual notifications:', spErr);
                }
            }

            if (notifs.length > 0) {
                await LN.schedule({ notifications: notifs });
                saveManagedNotifications(notifs);
            } else {
                saveManagedNotifications([]);
            }
            saveManagedFSAlarms(fsAlarmIds);
        } catch(e) {}
    }

    // ═══ NOTIFICATION LISTENERS — PRODUCTION FIX: Cold-start + warm-start deep-link ═══
    function setupListeners() {
        if (!isNative()) return;
        var LN = window.Capacitor.Plugins.LocalNotifications;

        // Resolve correct Naam Abhyas URL based on current page depth
        function resolveNaamUrl(ex) {
            var manager = getNaamManager();
            if (manager && typeof manager.getLaunchUrl === 'function') {
                return manager.getLaunchUrl(ex || {}, window.location.pathname);
            }
            var currentPath = window.location.pathname;
            var basePath = 'NaamAbhyas/naam-abhyas.html';
            if (currentPath.indexOf('/NaamAbhyas/') !== -1) {
                basePath = 'naam-abhyas.html';
            } else if (currentPath.indexOf('/reminders/') !== -1 || 
                       currentPath.indexOf('/Homepage/') !== -1 ||
                       currentPath.indexOf('/NitnemTracker/') !== -1 ||
                       currentPath.indexOf('/GurbaniRadio/') !== -1 ||
                       currentPath.indexOf('/Calendar/') !== -1 ||
                       currentPath.indexOf('/Hukamnama/') !== -1 ||
                       currentPath.indexOf('/GurbaniKhoj/') !== -1 ||
                       currentPath.indexOf('/SehajPaath/') !== -1 ||
                       currentPath.indexOf('/Favorites/') !== -1 ||
                       currentPath.indexOf('/Notes/') !== -1 ||
                       currentPath.indexOf('/Insights/') !== -1 ||
                       currentPath.indexOf('/Profile/') !== -1 ||
                       currentPath.indexOf('/ShabadVichar/') !== -1 ||
                       currentPath.indexOf('/RandomShabad/') !== -1 ||
                       currentPath.indexOf('/nitnem/') !== -1) {
                basePath = '../NaamAbhyas/naam-abhyas.html';
            } else if (currentPath.indexOf('/nitnem/category/') !== -1) {
                basePath = '../../NaamAbhyas/naam-abhyas.html';
            }
            var params = ['autoStart=true'];
            if (ex.hour !== undefined) params.push('hour=' + ex.hour);
            if (ex.minute !== undefined) params.push('minute=' + ex.minute);
            var modeParam = ex.mode || ex.practiceType || 'simran';
            params.push('mode=' + modeParam);
            return basePath + '?' + params.join('&');
        }

        // ═══ COLD-START BRIDGE ═══
        // On cold start, Capacitor fires this listener but the WebView may not be
        // on the right page yet. Store the intent in localStorage so the target
        // page can pick it up when it loads.
        function storePendingNaamLaunch(ex) {
            var manager = getNaamManager();
            if (manager && typeof manager.storeLaunchIntent === 'function') {
                manager.storeLaunchIntent(ex || {});
                return;
            }
            try {
                var targetMode = (ex && (ex.mode || ex.practiceType)) || 'simran';
                localStorage.setItem('anhad_pending_naam_launch', JSON.stringify({
                    autoStart: true,
                    hour: (ex && ex.hour) || '',
                    minute: (ex && ex.minute) || '',
                    mode: targetMode,
                    practiceType: targetMode,
                    timestamp: Date.now()
                }));
                console.log('[ANHAD] 💾 Stored pending Naam launch for cold-start pickup');
            } catch(e) {}
        }

        function resolveFrontendUrl(url) {
            if (!url) return '';
            if (/^https?:\/\//.test(url) || url.indexOf('../') === 0 || url.indexOf('./') === 0) return url;
            var p = window.location.pathname;
            if (p.indexOf('/NaamAbhyas/') !== -1 ||
                p.indexOf('/NitnemTracker/') !== -1 ||
                p.indexOf('/GurbaniRadio/') !== -1 ||
                p.indexOf('/Homepage/') !== -1 ||
                p.indexOf('/reminders/') !== -1) {
                return '../' + url;
            }
            return './' + url;
        }

        if (!window.__anhadNotifListenerRegistered) {
            window.__anhadNotifListenerRegistered = true;
            LN.addListener('localNotificationActionPerformed', function(data) {
            var ex = data.notification && data.notification.extra;
            if (!ex) return;
            console.log('[ANHAD] Notification clicked:', JSON.stringify(ex));
            if (ex.action === 'show_alarm') {
                showAlarmPopup(ex.alarmLabel, ex.alarmTime, ex.alarmIcon, ex.alarmTone);
            } else if (ex.action === 'auto_start_naam' || ex.action === 'show_naam') {
                // ═══ CRITICAL FIX: Prevent app hang when notification clicked while app is open ═══
                // If we're ALREADY on the Naam Abhyas page, don't reload (causes freeze)
                // Instead, just trigger the session directly
                var currentPath = window.location.pathname;
                var isOnNaamPage = currentPath.indexOf('/NaamAbhyas/naam-abhyas.html') !== -1;
                var m = ex.mode || ex.practiceType || 'simran';
                
                if (isOnNaamPage) {
                    // ✅ Already on the page - trigger session directly (no reload)
                    console.log('[ANHAD] 🎯 Already on Naam Abhyas page, triggering session directly');
                    storePendingNaamLaunch(ex);
                    
                    // Try to trigger via NaamAbhyasManager first
                    var manager = getNaamManager();
                    if (manager && typeof manager.handleNotificationLaunch === 'function') {
                        manager.handleNotificationLaunch();
                    } 
                    // Direct execution on naam-abhyas instance
                    else if (window.naamAbhyas && typeof window.naamAbhyas.executeAutoStart === 'function') {
                        window.naamAbhyas.executeAutoStart(ex);
                    }
                    // Dispatch custom events for listeners
                    else {
                        window.dispatchEvent(new CustomEvent('naamAbhyasLaunchReady', {
                            detail: { hour: ex.hour, minute: ex.minute, mode: m, practiceType: m, autoStart: true }
                        }));
                        window.dispatchEvent(new CustomEvent('naamAbhyasNotificationClick', {
                            detail: { hour: ex.hour, minute: ex.minute, mode: m, practiceType: m, autoStart: true }
                        }));
                    }
                } else {
                    // ✅ On different page - navigate to Naam Abhyas (safe)
                    console.log('[ANHAD] 🚀 Navigating to Naam Abhyas page');
                    storePendingNaamLaunch(ex);
                    var url = resolveNaamUrl(ex);
                    console.log('[ANHAD] Navigating to:', url);
                    window.location.href = url;
                }
            }
            else if (ex.action === 'show_tracker') {
                var trackerPath = window.location.pathname.includes('/NitnemTracker/') ? '' : resolveFrontendUrl('NitnemTracker/nitnem-tracker.html');
                if (trackerPath) window.location.href = trackerPath;
            }
            else if (ex.action === 'show_streak_saver') {
                // ═══ AUTO-PERSIST STREAK CHECK: Run inline before navigating ═══
                // This ensures streak data is saved even if the user only taps the notification
                // briefly. The streak saver page will pick up the persisted state.
                try {
                    var _streakRaw = localStorage.getItem('anhad_streak_data') || localStorage.getItem('nitnemTracker_streakData');
                    var _streakObj = _streakRaw ? JSON.parse(_streakRaw) : {};
                    var _today = new Date().toLocaleDateString('en-CA');
                    var _amritLog = JSON.parse(localStorage.getItem('nitnemTracker_amritvelaLog') || '{}');
                    if (!_amritLog[_today] && (_streakObj.current || _streakObj.currentStreak || 0) > 0) {
                        _streakObj.lastAutoSaveCheck = _today;
                        _streakObj.autoSaveTriggered = true;
                        localStorage.setItem('anhad_streak_data', JSON.stringify(_streakObj));
                        console.log('[StreakSaver] Auto-persisted streak check for', _today);
                    }
                } catch(streakErr) { console.warn('[StreakSaver] Auto-persist failed:', streakErr); }
                var trackerPath = window.location.pathname.includes('/NitnemTracker/') ? 'nitnem-tracker.html' : resolveFrontendUrl('NitnemTracker/nitnem-tracker.html');
                if (trackerPath) window.location.href = trackerPath + '?streakSaver=activate';
            }
            // ═══ SPIRITUAL NOTIFICATION ACTIONS ═══
            else if (window.SpiritualNotifications) {
                window.SpiritualNotifications.handleNotificationAction(ex.action, ex.target, ex.url);
            }
            else if (ex.url) {
                window.location.href = resolveFrontendUrl(ex.url);
            }
            });
        }
        // ═══ FOREGROUND: Smart popup when Naam notification arrives (Fix 4) ═══
        LN.addListener('localNotificationReceived', function(n) {
            var ex = n.extra;
            if (!ex) return;
            if (ex.action === 'show_alarm') {
                showAlarmPopup(ex.alarmLabel, ex.alarmTime, ex.alarmIcon, ex.alarmTone);
            } else if (ex.action === 'auto_start_naam' || ex.action === 'show_naam') {
                storePendingNaamLaunch(ex);
                showNaamAbhyasPopup(ex.hour, ex.minute);
            }
        });
    }

    // ═══ FOREGROUND ALARM CHECK — pass tone ═══
    var lastCheckedMin = -1;
    function checkAlarms() {
        var now = new Date();
        var ct = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        var dow = now.getDay();
        var mk = now.getHours() * 60 + now.getMinutes();
        if (mk === lastCheckedMin) return;

        // 1. Check Smart Reminders
        var sr = null;
        try { sr = JSON.parse(localStorage.getItem('sr_reminders_v7')); } catch(e) {}
        if (sr) {
            var all = [];
            if (sr.core) { Object.keys(sr.core).forEach(function(k) { var r = sr.core[k]; if (r && r.enabled) all.push(r); }); }
            if (sr.custom) { sr.custom.forEach(function(r) { if (r && r.enabled) all.push(r); }); }
            for (var i = 0; i < all.length; i++) {
                if (all[i].time === ct && (!all[i].days || all[i].days.indexOf(dow) !== -1)) {
                    lastCheckedMin = mk;
                    showAlarmPopup(all[i].label || all[i].title || 'Alarm', all[i].time, all[i].icon || '🔔', all[i].tone || 'audio1');
                    return;
                }
            }
        }

        // 2. Check Naam Abhyas foreground reminder
        try {
            var naamConfig = JSON.parse(localStorage.getItem('naam_abhyas_config') || '{}');
            var isNaamEnabled = naamConfig.enabled !== false;
            var isNaamPage = window.location.pathname.toLowerCase().includes('naamabhyas');
            if (isNaamEnabled) {
                var sched = getNaamScheduleMap();
                var curH = now.getHours();
                var curM = now.getMinutes();
                var item = sched ? sched[curH] : null;
                if (item && item.status !== 'completed' && item.status !== 'skipped') {
                    var sMin = (typeof item.startMinute === 'number') ? item.startMinute : (typeof item.minute === 'number' ? item.minute : 0);
                    if (sMin === curM) {
                        lastCheckedMin = mk;
                        if (isNaamPage) {
                            window.dispatchEvent(new CustomEvent('naamAbhyasDueNow', {
                                detail: { hour: curH, minute: curM, item: item }
                            }));
                        } else if (!document.getElementById('anhadNaamPopup')) {
                            showNaamAbhyasPopup(curH, curM);
                        }
                        return;
                    }
                }
            }
        } catch(e) {
            console.warn('[ANHAD] Foreground alarm check error:', e);
        }
    }

    function getNaamScheduleMap() {
        try {
            var raw = JSON.parse(localStorage.getItem('naam_abhyas_schedule'));
            if (!raw) return {};
            if (raw._schedule && typeof raw._schedule === 'object') return raw._schedule;
            return raw;
        } catch(e) {
            return {};
        }
    }

    // ═══ HARDWARE BACK BUTTON HANDLER ═══
    var lastBackPress = 0;
    function setupBackButton() {
        if (!isNative()) return;
        // Retry until App plugin is available
        var appPlugin = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
        if (!appPlugin) {
            setTimeout(setupBackButton, 500);
            return;
        }
        appPlugin.addListener('backButton', function(data) {
            // 1. Close alarm popup if open
            var overlay = document.getElementById('anhadAlarmOverlay');
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(function() { overlay.remove(); }, 300);
                var a = document.getElementById('anhadAlarmAudio');
                if (a) { a.pause(); a.remove(); }
                return;
            }

            // 2. Close any open modal/bottom-sheet/overlay
            var modals = document.querySelectorAll('.modal.active, .bottom-sheet.active, .alarm-modal.active, .penalty-modal-overlay.active, .side-panel.active, .overlay.active, [class*="modal"].active');
            if (modals.length > 0) {
                modals.forEach(function(m) { m.classList.remove('active'); m.style.display = 'none'; });
                var backdrop = document.querySelectorAll('.modal-backdrop, .overlay-backdrop');
                backdrop.forEach(function(b) { b.classList.remove('active'); b.style.display = 'none'; });
                return;
            }

            // 2.5. Check if page overrides back button
            if (window.__anhadBackOverride && typeof window.__anhadBackOverride === 'function') {
                window.__anhadBackOverride();
                return;
            }

            // 3. If WebView has history (navigated within app), go back
            if (data.canGoBack) {
                window.history.back();
                return;
            }

            // 4. If on a subpage, navigate to main index
            var path = window.location.pathname.toLowerCase();
            if (path.includes('/reminders/') || path.includes('/nitnemtracker/') ||
                path.includes('/naamabhyas/') || path.includes('/gurbaniradio/') ||
                path.includes('/homepage/') || path.includes('/insights/') ||
                path.includes('/guru') || path.includes('/bani')) {
                window.location.href = '../index.html';
                return;
            }

            // 5. Double-press to exit on main page
            var now = Date.now();
            if (now - lastBackPress < 2000) {
                window.Capacitor.Plugins.App.exitApp();
            } else {
                lastBackPress = now;
                showToast('Press back again to exit');
            }
        });
        console.log('[ANHAD] Back button handler registered');
    }

    // ═══ OFFLINE BANNER ═══
    function setupOfflineBanner() {
        window.addEventListener('offline', function() {
            if (document.getElementById('anhadOffline')) return;
            var b = document.createElement('div');
            b.id = 'anhadOffline';
            b.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:8px;background:#ff3b30;color:#fff;text-align:center;font-size:13px;font-weight:600;z-index:999998;font-family:-apple-system,sans-serif;';
            b.textContent = '⚠️ You are offline';
            document.body.appendChild(b);
        });
        window.addEventListener('online', function() {
            var b = document.getElementById('anhadOffline');
            if (b) b.remove();
        });
    }

    // ═══ CHECK BOOT FLAG FOR STREAK SAVER SCHEDULE ═══
    async function checkBootFlag() {
        if (!isNative()) return;
        try {
            // Check if StreakSaverPlugin is available
            if (window.Capacitor.Plugins && window.Capacitor.Plugins.StreakSaverPlugin) {
                var result = await window.Capacitor.Plugins.StreakSaverPlugin.checkNeedsSchedule();
                if (result.needsSchedule) {
                    console.log('[StreakSaver] Boot flag set, scheduling notification');
                    await window.Capacitor.Plugins.StreakSaverPlugin.clearScheduleFlag();
                    // Schedule will happen in the next scheduleAll() call
                }
            }
        } catch(e) {
            console.log('[StreakSaver] Plugin not available or error:', e);
        }
    }

    // ═══ BOOT ═══
    function boot() {
        ensureNaamManagerLoaded();
        injectCSS();
        setupOfflineBanner();
        setupBackButton();
        checkPendingAlarm();
        setInterval(checkAlarms, 10000);
        checkAlarms();

        // ═══ FULLSCREEN: Hide status bar completely when app opens ═══
        if (isNative() && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
            try {
                window.Capacitor.Plugins.StatusBar.hide();
                window.Capacitor.Plugins.StatusBar.setOverlaysWebView({ overlay: true });
            } catch(e) {}
        }
        if (isNative() && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
            checkBootFlag();
            scheduleAll();
            setupListeners();
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'visible') { scheduleAll(); checkAlarms(); checkPendingAlarm(); }
            });
            if (window.Capacitor.Plugins.App) {
                window.Capacitor.Plugins.App.addListener('appStateChange', function(s) {
                    if (s.isActive) { scheduleAll(); checkAlarms(); checkPendingAlarm(); }
                });
            }
        } else {
            var retries = 0;
            var iv = setInterval(function() {
                if (++retries > 25) { clearInterval(iv); return; }
                if (isNative() && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
                    clearInterval(iv);
                    checkBootFlag();
                    scheduleAll();
                    setupListeners();
                    setupBackButton();
                }
            }, 400);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

    // Global API
    window.AnhadShowReminderPopup = showAlarmPopup;
    window._anhadAlarmPopup = showAlarmPopup;
    window._anhadRecordAlarmResponse = recordAlarmResponse;
    window.AnhadShowNaamPopup = showNaamAbhyasPopup;
    window.CapacitorNotifications = {
        scheduleAll: scheduleAll,
        rescheduleAll: scheduleAll
    };
    window.__anhadGlobalScheduler = {
        scheduleAll: scheduleAll,
        rescheduleAll: scheduleAll
    };
})();
