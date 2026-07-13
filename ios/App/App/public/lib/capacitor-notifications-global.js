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
            '.anhad-alarm-btn.complete:active,.anhad-naam-btn:active{transform:scale(.95)}',
            // Naam Abhyas specific popup
            '#anhadNaamPopup{position:fixed;inset:0;z-index:9999999;display:flex;align-items:flex-end;padding:0;opacity:0;visibility:hidden;transition:all .35s cubic-bezier(.4,0,.2,1)}',
            '#anhadNaamPopup.active{opacity:1;visibility:visible}',
            '.anhad-naam-sheet{width:100%;background:linear-gradient(175deg,#0d0d1a 0%,#1a0a00 100%);border-radius:24px 24px 0 0;padding:28px 24px 36px;position:relative;box-shadow:0 -24px 60px rgba(0,0,0,.7);animation:anhadSheetIn .4s cubic-bezier(.4,0,.2,1)}',
            '@keyframes anhadSheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}',
            '.anhad-naam-handle{width:40px;height:4px;background:rgba(255,255,255,.2);border-radius:2px;margin:0 auto 20px;display:block}',
            '.anhad-naam-header{display:flex;align-items:center;gap:12px;margin-bottom:16px}',
            '.anhad-naam-emoji{font-size:40px;filter:drop-shadow(0 0 12px rgba(255,149,0,.5))}',
            '.anhad-naam-title{font-size:22px;font-weight:700;color:#fff;margin-bottom:2px}',
            '.anhad-naam-subtitle{font-size:13px;color:rgba(255,255,255,.5)}',
            '.anhad-naam-quote-g{font-size:18px;color:#ffb347;margin-bottom:4px;line-height:1.6}',
            '.anhad-naam-quote-e{font-size:13px;color:rgba(255,255,255,.6);font-style:italic;margin-bottom:22px;line-height:1.5}',
            '.anhad-naam-btn{width:100%;padding:18px;background:linear-gradient(135deg,#ff9500,#e65c00);color:#fff;font-size:17px;font-weight:700;border:none;border-radius:16px;cursor:pointer;box-shadow:0 8px 24px rgba(255,100,0,.4);margin-bottom:10px;letter-spacing:.3px}',
            '.anhad-naam-skip{width:100%;padding:12px;background:transparent;color:rgba(255,255,255,.4);font-size:14px;border:none;cursor:pointer;border-radius:12px}',
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
        var naamUrl;
        if (path.includes('/NaamAbhyas/')) {
            naamUrl = 'naam-abhyas.html';
        } else if (path.indexOf('/nitnem/category/') !== -1) {
            naamUrl = '../../NaamAbhyas/naam-abhyas.html';
        } else if (path.includes('/reminders/') || path.includes('/Homepage/') || path.includes('/NitnemTracker/') ||
                   path.includes('/GurbaniRadio/') || path.includes('/Calendar/') || path.includes('/Hukamnama/') ||
                   path.includes('/GurbaniKhoj/') || path.includes('/SehajPaath/') || path.includes('/Favorites/') ||
                   path.includes('/Notes/') || path.includes('/Insights/') || path.includes('/Profile/') ||
                   path.includes('/ShabadVichar/') || path.includes('/RandomShabad/') || path.includes('/nitnem/')) {
            naamUrl = '../NaamAbhyas/naam-abhyas.html';
        } else {
            naamUrl = 'NaamAbhyas/naam-abhyas.html';
        }
        naamUrl += '?autoStart=true&hour=' + h + '&minute=' + m;

        var el = document.createElement('div');
        el.id = 'anhadNaamPopup';
        el.innerHTML =
            '<div style="position:absolute;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(6px)" id="anhadNaamBd"></div>' +
            '<div class="anhad-naam-sheet">' +
            '  <span class="anhad-naam-handle"></span>' +
            '  <div class="anhad-naam-header">' +
            '    <span class="anhad-naam-emoji">🙏</span>' +
            '    <div><div class="anhad-naam-title">ਨਾਮ ਅਭਿਆਸ — ' + esc(timeStr) + '</div>' +
            '      <div class="anhad-naam-subtitle">Naam Abhyas · 2 min session</div>' +
            '    </div>' +
            '  </div>' +
            '  <div class="anhad-naam-quote-g">' + esc(quote.g) + '</div>' +
            '  <div class="anhad-naam-quote-e">' + esc(quote.e) + '</div>' +
            '  <button class="anhad-naam-btn" id="anhadNaamStartBtn">🙏 Start Simran Now</button>' +
            '  <button class="anhad-naam-skip" id="anhadNaamSkipBtn">Not now</button>' +
            '</div>';

        document.body.appendChild(el);
        requestAnimationFrame(function() { el.classList.add('active'); });

        // Play audio softly
        var audio = document.createElement('audio');
        audio.id = 'anhadNaamAudio'; audio.loop = false; audio.volume = 0.7;
        audio.src = getAudioBasePath() + 'audio1.mp3';
        document.body.appendChild(audio);
        audio.play().catch(function() {});

        function closePopup() {
            el.classList.remove('active');
            setTimeout(function() { el.remove(); }, 350);
            var a = document.getElementById('anhadNaamAudio');
            if (a) { a.pause(); a.remove(); }
        }

        document.getElementById('anhadNaamStartBtn').onclick = function() {
            closePopup();
            // Store pending launch for cold-start bridge
            try {
                localStorage.setItem('anhad_pending_naam_launch', JSON.stringify({
                    autoStart: true, hour: String(h), minute: String(m), timestamp: Date.now()
                }));
            } catch(e) {}
            window.location.href = naamUrl;
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
            // Delete old channel (may have wrong importance locked from earlier builds)
            try { await LN.deleteChannel({ id: 'naam_abhyas' }); } catch(e) {}
            // Create fresh channel with guaranteed IMPORTANCE_HIGH for heads-up popup
            try { await LN.createChannel({ id: 'naam_abhyas_v2', name: 'Naam Abhyas Reminders', description: 'Hourly reminders for Naam Simran', importance: 4, visibility: 1, vibration: true, sound: 'default', lights: true, lightColor: '#f7c634' }); } catch(e) {}
            try { await LN.createChannel({ id: 'spiritual_reminders', name: 'Spiritual Reminders', importance: 4, visibility: 1, vibration: true, sound: 'default', lights: true, lightColor: '#f7c634' }); } catch(e) {}
            await ensureAndroidAlarmReliability();
            await cancelManagedNotifications(LN);

            var notifs = [];
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
                            (function(lbl, alTime, ts, hourStr, minStr, dayIdx) {
                                reliabilityPlugin.scheduleFullScreenAlarm({
                                    id: hash('fs_' + (alarm.id || 'a') + '_d' + dayIdx),
                                    timestamp: ts,
                                    title: lbl,
                                    message: alTime + ' \u2014 Tera alarm aa gya! \ud83d\ude4f',
                                    hour: hourStr,
                                    minute: minStr
                                }).catch(function(e) {
                                    console.warn('[ANHAD] FS alarm failed:', e);
                                });
                            })(alarmLabel, alarmTime, st.getTime(), tp[0], tp[1], d);
                        }
                    }
                });
            }

            // NaamAbhyas
            var nc = null;
            try { nc = JSON.parse(localStorage.getItem('naam_abhyas_config')); } catch(e) {}
            if (nc && nc.enabled) {
                var sh = (nc.activeHours && nc.activeHours.start) || 5;
                var eh = (nc.activeHours && nc.activeHours.end) || 22;
                var auto = nc.autoStartTimer || false;
                
                // ═══ BUG 1/2 FIX: Read from DEDICATED schedule key, then history fallback ═══
                var scheduleData = null;
                try { scheduleData = JSON.parse(localStorage.getItem('naam_abhyas_schedule')); } catch(e) {}
                if (!scheduleData) {
                    try {
                        var history = JSON.parse(localStorage.getItem('naam_abhyas_history') || '{}');
                        var today = new Date().toLocaleDateString('en-CA');
                        scheduleData = history.scheduleHistory && history.scheduleHistory[today];
                    } catch(e) {}
                }
                
                // ═══ FIX 2: Richer bilingual Naam Abhyas notification messages ═══
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
                    for (var nh = sh; nh <= eh; nh++) {
                        // ═══ PRODUCTION FIX: ONLY schedule for hours with actual session data ═══
                        // No more fallback hash — if schedule doesn't have this hour, skip it.
                        // This eliminates the :58 minute bug completely.
                        var session = scheduleData && scheduleData[nh];
                        if (!session || typeof session.startMinute !== 'number') continue;
                        var sessionMinute = session.startMinute;
                        
                        var ndt = new Date(now); 
                        ndt.setDate(ndt.getDate() + nd); 
                        ndt.setHours(nh, sessionMinute, 0, 0);
                        
                        // PRECISION FIX: Fire at exact session time (no 30s early offset)
                        // The previous 30s offset compounded with Android's Doze-mode batching,
                        // causing notifications to fire 1-7 minutes late.
                        var alertTime = new Date(ndt.getTime());
                        if (ndt <= now) continue;
                        if (alertTime <= now) alertTime = new Date(now.getTime() + 1000);
                        
                        // Deterministic message selection (consistent per hour)
                        var msgIdx = (nh + nd * 7) % spiritualMessages.length;
                        var message = spiritualMessages[msgIdx];
                        var bodyText = message.gurmukhi && message.english 
                            ? message.gurmukhi + ' — ' + message.english 
                            : message.english || message.gurmukhi;
                        
                        // ═══ FIX 2: Include session time in notification title ═══
                        var sessionH12 = (function(h, m) {
                            var per = h >= 12 ? 'PM' : 'AM';
                            var hh = h % 12 || 12;
                            return hh + ':' + (m < 10 ? '0' + m : m) + ' ' + per;
                        })(nh, sessionMinute);
                        var naamTitle = '\ud83d\ude4f Naam Abhyas — ' + sessionH12;

                        // ═══ FIX 3: Add launchUrl for reliable cold-start navigation ═══
                        var naamLaunchUrl = 'NaamAbhyas/naam-abhyas.html?autoStart=true&hour=' + nh + '&minute=' + sessionMinute;

                        notifs.push({
                            id: 90000 + (nd * 24) + nh,
                            title: naamTitle,
                            body: bodyText,
                            schedule: { at: alertTime, allowWhileIdle: true, exact: true },
                            channelId: 'naam_abhyas_v2',
                            sound: 'default',
                            smallIcon: 'ic_stat_notify',
                            extra: {
                                action: 'auto_start_naam',
                                autoStart: 'true',
                                hour: String(nh),
                                minute: String(sessionMinute),
                                url: 'NaamAbhyas/naam-abhyas.html',
                                launchUrl: naamLaunchUrl,
                                type: 'naam_abhyas'
                            }
                        });

                        // ═══ FIX 5: Native full-screen alarm for locked screen (Naam Abhyas) ═══
                        // Extended to days 0-2 for better coverage when app isn't opened daily.
                        // ~18 hours × 3 days = ~54 alarms, within Android's 50+ exact alarm quota.
                        if (reliabilityPlugin && nd <= 2) {
                            (function(lbl, alTime, ts, hStr, mStr, dayIdx) {
                                reliabilityPlugin.scheduleFullScreenAlarm({
                                    id: hash('fs_naam_' + nh + '_d' + dayIdx),
                                    timestamp: ts,
                                    title: lbl,
                                    message: alTime + ' \u2014 ' + bodyText,
                                    hour: hStr,
                                    minute: mStr
                                }).catch(function(e) {
                                    console.warn('[ANHAD] FS alarm failed:', e);
                                });
                            })(naamTitle, sessionH12, alertTime.getTime(), String(nh), String(sessionMinute), nd);
                        }
                    }
                }
                console.log('[ANHAD] Naam Abhyas: scheduled ' + notifs.filter(function(n) { return n.channelId === 'naam_abhyas_v2'; }).length + ' notifications');
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

            // ═══ ADD SPIRITUAL NOTIFICATIONS ═══
            if (window.SpiritualNotifications) {
                var spiritualNotifs = await window.SpiritualNotifications.scheduleAll();
                notifs = notifs.concat(spiritualNotifs);
            }

            if (notifs.length > 0) {
                await LN.schedule({ notifications: notifs });
                saveManagedNotifications(notifs);
            } else {
                saveManagedNotifications([]);
            }
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
                localStorage.setItem('anhad_pending_naam_launch', JSON.stringify({
                    autoStart: true,
                    hour: ex.hour || '',
                    minute: ex.minute || '',
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
                
                if (isOnNaamPage) {
                    // ✅ Already on the page - trigger session directly (no reload)
                    console.log('[ANHAD] 🎯 Already on Naam Abhyas page, triggering session directly');
                    storePendingNaamLaunch(ex);
                    
                    // Try to trigger via NaamAbhyasManager first
                    var manager = getNaamManager();
                    if (manager && typeof manager.handleNotificationLaunch === 'function') {
                        manager.handleNotificationLaunch();
                    } 
                    // Fallback: dispatch event for naam-abhyas.js to pick up
                    else if (window.naamAbhyas && typeof window.naamAbhyas.executeAutoStart === 'function') {
                        window.naamAbhyas._capturedAutoStartParams = {
                            autoStart: true,
                            hour: ex.hour,
                            minute: ex.minute
                        };
                        window.naamAbhyas.executeAutoStart();
                    }
                    // Last resort: dispatch custom event
                    else {
                        window.dispatchEvent(new CustomEvent('naamAbhyasNotificationClick', {
                            detail: { hour: ex.hour, minute: ex.minute, autoStart: true }
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
                window.SpiritualNotifications.handleNotificationAction(ex.action, ex.target);
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
        var sr = null;
        try { sr = JSON.parse(localStorage.getItem('sr_reminders_v7')); } catch(e) {}
        if (!sr) return;
        var now = new Date();
        var ct = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        var dow = now.getDay();
        var mk = now.getHours() * 60 + now.getMinutes();
        if (mk === lastCheckedMin) return;

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
})();
