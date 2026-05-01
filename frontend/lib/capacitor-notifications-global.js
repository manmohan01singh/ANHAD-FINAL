/**
 * ANHAD GLOBAL ALARM + NOTIFICATION + BACK BUTTON ENGINE
 * Correct keys: sr_reminders_v7, naam_abhyas_config
 * Uses Smart Reminder v7 minimalistic popup on ALL pages
 * Plays the correct selected tone per alarm
 * Hardware back button handler
 * Alarm response recording for obedience tracking
 */
(function() {
    'use strict';
    var EXPIRY_MS = 5 * 60 * 1000;
    var MANAGED_NOTIFICATION_IDS_KEY = 'anhad_managed_notification_ids_v2';

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
            '.anhad-alarm-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
            '.anhad-alarm-card{position:relative;background:var(--card-bg,#fff);border-radius:24px;padding:36px 28px;text-align:center;width:100%;max-width:340px;box-shadow:0 24px 48px rgba(0,0,0,.4);animation:anhadModalIn .4s cubic-bezier(.175,.885,.32,1.275)}',
            '@keyframes anhadModalIn{from{opacity:0;transform:scale(.9) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}',
            '.anhad-alarm-visual{position:relative;margin-bottom:20px}',
            '.anhad-alarm-ripple{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80px;height:80px;border-radius:50%;border:2px solid #ff9500;animation:anhadRipple 2s ease-out infinite}',
            '.anhad-alarm-ripple:nth-child(2){animation-delay:.5s}',
            '@keyframes anhadRipple{0%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-50%) scale(2);opacity:0}}',
            '.anhad-alarm-icon{position:relative;font-size:56px;z-index:1}',
            '.anhad-alarm-time{font-size:42px;font-weight:300;color:var(--text-primary,#1a1a2e);margin-bottom:4px;font-variant-numeric:tabular-nums}',
            '.anhad-alarm-label{font-size:18px;color:var(--text-secondary,#666);margin-bottom:28px}',
            '.anhad-alarm-actions{display:flex;gap:12px}',
            '.anhad-alarm-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px;border-radius:16px;border:none;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s ease}',
            '.anhad-alarm-btn svg{width:28px;height:28px}',
            '.anhad-alarm-btn.snooze{background:var(--bg-tertiary,#f0f0f5);color:var(--text-primary,#1a1a2e)}',
            '.anhad-alarm-btn.complete{background:linear-gradient(135deg,#ff9500,#ff6600);color:#fff;box-shadow:0 4px 12px rgba(255,149,0,.3)}',
            '.anhad-alarm-btn.complete:active{transform:scale(.95)}',
            '[data-theme="dark"] .anhad-alarm-card{background:#1c1c1e}',
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

    // ═══ CHECK PENDING ALARM (with expiry) ═══
    function checkPendingAlarm() {
        try {
            var raw = localStorage.getItem('anhad_pending_alarm');
            if (!raw) return;
            var data = JSON.parse(raw);
            if (Date.now() - data.ts > EXPIRY_MS) {
                localStorage.removeItem('anhad_pending_alarm');
                return;
            }
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
                try { streakData = JSON.parse(localStorage.getItem('nitnemTracker_streakData') || '{}'); } catch(e) {}
                var hasStreak = streakData && streakData.current > 0;

                if (hasStreak) {
                    notifs.push({
                        id: 70001 + d,
                        title: '⚡ Streak Saver Check',
                        body: 'Your streak needs protection. Open the app to check your Amritvela status.',
                        schedule: { at: scheduleDate, allowWhileIdle: true, exact: true },
                        channelId: 'anhad_alarms', sound: 'default', smallIcon: 'ic_stat_notify',
                        extra: { action: 'show_streak_saver' }
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
                all.forEach(function(alarm) {
                    for (var d = 0; d < 7; d++) {
                        var dt = new Date(now); dt.setDate(dt.getDate() + d);
                        if (alarm.days && alarm.days.indexOf(dt.getDay()) === -1) continue;
                        var tp = (alarm.time || '05:00').split(':');
                        var st = new Date(dt); st.setHours(parseInt(tp[0], 10), parseInt(tp[1], 10), 0, 0);
                        if (st <= now) continue;
                        notifs.push({
                            id: hash((alarm.id || 'a') + '_d' + d),
                            title: alarm.label || alarm.title || '🙏 Reminder',
                            body: 'Alarm time ho gya hai. Open ANHAD and start now.',
                            schedule: { at: st, allowWhileIdle: true, exact: true },
                            channelId: 'anhad_reminders', sound: 'default', smallIcon: 'ic_stat_notify',
                            extra: {
                                action: 'show_alarm',
                                alarmLabel: alarm.label || alarm.title || 'Alarm',
                                alarmTime: alarm.time || '',
                                alarmIcon: alarm.icon || '🔔',
                                alarmTone: alarm.tone || 'audio1',
                                alarmId: alarm.id || ''
                            }
                        });
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
                
                // ═══ REFINED SPIRITUAL MESSAGES (24 Zomato-style creative nudges) ═══
                var spiritualMessages = [
                    { gurmukhi: 'ਵਾਹਿਗੁਰੂ ਜੀ, ਸਮਾਂ ਹੋ ਗਿਆ ਹੈ! ਕਿਰਪਾ ਕਰਕੇ 2 ਮਿੰਟ ਲਈ ਨਾਮ ਜਪੋ', english: 'Time for Naam! Leave all work for 2 minutes' },
                    { gurmukhi: 'ਸਬ ਕੰਮ ਛੱਡੋ, ਵਾਹਿਗੁਰੂ ਜੀ ਦਾ ਸਿਮਰਨ ਕਰੋ', english: 'Leave all work, remember Vaheguru Ji' },
                    { gurmukhi: 'ਜਪਿ ਮਨ ਸਤਿ ਨਾਮੁ ਸਦਾ ਸਤਿ ਨਾਮੁ', english: 'Chant the True Name always' },
                    { gurmukhi: 'ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਉ', english: 'Meditate and find peace' },
                    { gurmukhi: 'ਨਾਮ ਜਪਤ ਅਘ ਕੋਟਿ ਉਤਾਰੇ', english: 'Chanting Naam erases millions of sins' },
                    { gurmukhi: 'ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ', english: 'Recognize your divine origin' },
                    { gurmukhi: 'ਹਰਿ ਕਾ ਨਾਮੁ ਜਪਿ ਦਿਨਸੁ ਰਾਤਿ', english: 'Chant day and night' },
                    { gurmukhi: 'ਗੁਰਮੁਖਿ ਨਾਮੁ ਜਪਹੁ ਮਨ ਮੇਰੇ', english: 'O my mind, chant the Naam as Gurmukh' },
                    { gurmukhi: 'ਤੂੰ ਮੇਰਾ ਪਿਤਾ ਤੂੰਹੈ ਮੇਰਾ ਮਾਤਾ', english: 'You are my Father, You are my Mother' },
                    { english: 'Waheguru Ji, time ho gya hai! Sare kamm chhad ke 2 min Naam japo 🙏' },
                    { english: 'Your soul is calling. Take 2 minutes for Naam Simran.' },
                    { english: 'Be still. Breathe. Remember Vaheguru.' },
                    { english: 'Phone pocket vich rakh lo, akhan band kro, Waheguru japo 🙏' },
                    { english: 'Discipline compounds. Every session brings you closer.' },
                    { english: '2 minutes. Close your eyes. Remember Waheguru.' },
                    { english: 'In the noise of life, find the silence of Naam.' },
                    { english: 'The universe awaits your meditation. Begin now.' },
                    { english: 'Your higher self is waiting. Connect through Simran.' },
                    { english: 'This moment is sacred. Pause and connect with the Divine.' },
                    { english: 'Kirpa karke sare kamm chhad ke Naam simran karo 🙏' },
                    { english: 'Waheguru Waheguru Waheguru... bas 2 min 🙏' },
                    { english: 'Tera schedule ho gya. Chal 2 min Waheguru bol 🙏' },
                    { english: 'Drop everything. Your appointment with the Divine is now.' },
                    { english: 'Naam da time aa gya! Har kise nu wait kra, Waheguru nu nahi 🙏' }
                ];
                spiritualMessages.push(
                    { english: 'Naam japn da time ho gya hai, 2 min layi sare kamm chhaddo.' },
                    { english: '2-minute Simran break: kaam pause, Waheguru play.' },
                    { english: 'Naam Abhyas slot live hai. Hun bas 120 seconds Rab naal.' }
                );

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
                        
                        if (ndt <= now) continue;
                        
                        // Deterministic message selection (consistent per hour)
                        var msgIdx = (nh + nd * 7) % spiritualMessages.length;
                        var message = spiritualMessages[msgIdx];
                        var bodyText = message.gurmukhi && message.english 
                            ? message.gurmukhi + ' — ' + message.english 
                            : message.english || message.gurmukhi;
                        
                        notifs.push({
                            id: 90000 + (nd * 24) + nh,
                            title: '🙏 ਨਾਮ ਅਭਿਆਸ | Naam Abhyas',
                            body: bodyText,
                            schedule: { at: ndt, allowWhileIdle: true, exact: true },
                            channelId: 'naam_abhyas_v2', 
                            sound: 'default', 
                            smallIcon: 'ic_stat_notify',
                            extra: { 
                                action: 'auto_start_naam',
                                autoStart: 'true',
                                hour: String(nh),
                                minute: String(sessionMinute),
                                url: 'NaamAbhyas/naam-abhyas.html',
                                type: 'naam_abhyas'
                            }
                        });
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
                    extra: { action: 'show_tracker' }
                });
            }

            // ═══ ADD STREAK SAVER NOTIFICATION ═══
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

        LN.addListener('localNotificationActionPerformed', function(data) {
            var ex = data.notification && data.notification.extra;
            if (!ex) return;
            console.log('[ANHAD] Notification clicked:', JSON.stringify(ex));
            if (ex.action === 'show_alarm') {
                showAlarmPopup(ex.alarmLabel, ex.alarmTime, ex.alarmIcon, ex.alarmTone);
            } else if (ex.action === 'auto_start_naam' || ex.action === 'show_naam') {
                // ═══ COLD-START FIX: Store launch data BEFORE navigating ═══
                // If the app was killed, the WebView loads index.html first.
                // The navigation below will redirect, but the target page needs
                // to know it was launched from a notification.
                storePendingNaamLaunch(ex);
                var url = resolveNaamUrl(ex);
                console.log('[ANHAD] Navigating to:', url);
                window.location.href = url;
            }
            else if (ex.action === 'show_tracker') {
                var trackerPath = window.location.pathname.includes('/NitnemTracker/') ? '' : './NitnemTracker/nitnem-tracker.html';
                if (trackerPath) window.location.href = trackerPath;
            }
            else if (ex.action === 'show_streak_saver') {
                var trackerPath = window.location.pathname.includes('/NitnemTracker/') ? '' : './NitnemTracker/nitnem-tracker.html';
                if (trackerPath) window.location.href = trackerPath + '?streakSaver=activate';
            }
            // ═══ SPIRITUAL NOTIFICATION ACTIONS ═══
            else if (window.SpiritualNotifications) {
                window.SpiritualNotifications.handleNotificationAction(ex.action, ex.target);
            }
        });
        // ═══ FOREGROUND: Show popup when Naam notification arrives while app is open ═══
        LN.addListener('localNotificationReceived', function(n) {
            var ex = n.extra;
            if (!ex) return;
            if (ex.action === 'show_alarm') {
                showAlarmPopup(ex.alarmLabel, ex.alarmTime, ex.alarmIcon, ex.alarmTone);
            } else if (ex.action === 'auto_start_naam' || ex.action === 'show_naam') {
                var now = new Date();
                var h12 = ((now.getHours() % 12) || 12) + ':' + now.getMinutes().toString().padStart(2, '0') + ' ' + (now.getHours() >= 12 ? 'PM' : 'AM');
                showAlarmPopup('🙏 Naam Abhyas — ' + (n.body || 'Time for Naam Simran'), h12, '🙏', 'audio1');
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
})();
