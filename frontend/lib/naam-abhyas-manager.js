/*
 * Naam Abhyas Manager
 * Single owner for notification launch intents and completion records.
 */
(function () {
  'use strict';

  if (window.NaamAbhyasManager && window.NaamAbhyasManager._singleton) return;

  const KEYS = {
    pendingLaunch: 'anhad_pending_naam_launch',
    schedule: 'naam_abhyas_schedule',
    config: 'naam_abhyas_config',
    history: 'naam_abhyas_history',
    records: 'naam_abhyas_completion_records_v1',
    extras: 'naam_abhyas_extra_sessions_v1'
  };

  const SESSION_TOLERANCE_MS = 60 * 1000;

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function localDate(date) {
    return date.toLocaleDateString('en-CA');
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function buildScheduledId(date, hour, minute) {
    return `${localDate(date)}T${pad2(hour)}:${pad2(minute)}`;
  }

  function readSchedule() {
    const schedule = readJson(KEYS.schedule, null);
    if (Array.isArray(schedule)) return schedule;
    if (schedule && Array.isArray(schedule.sessions)) return schedule.sessions;

    const config = readJson(KEYS.config, null);
    if (config && Array.isArray(config.sessions)) return config.sessions;
    if (config && config.activeHours) {
      const start = Number(config.activeHours.start);
      const end = Number(config.activeHours.end);
      if (Number.isFinite(start) && Number.isFinite(end)) {
        const sessions = [];
        for (let hour = start; hour <= end; hour += 1) {
          sessions.push({ hour, minute: Number(config.minute) || 0, enabled: true });
        }
        return sessions;
      }
    }
    return [];
  }

  function findScheduledSession(input) {
    const now = input && input.now ? new Date(input.now) : new Date();
    const hour = Number(input && input.hour);
    const minute = Number(input && input.minute);

    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      return {
        kind: 'scheduled',
        id: buildScheduledId(now, hour, minute),
        date: localDate(now),
        hour,
        minute
      };
    }

    const currentMinute = now.getHours() * 60 + now.getMinutes();
    const match = readSchedule().find((session) => {
      if (session && session.enabled === false) return false;
      const sessionMinute = Number(session.hour) * 60 + Number(session.minute || 0);
      return Math.abs(sessionMinute - currentMinute) <= 1;
    });

    if (!match) return null;

    return {
      kind: 'scheduled',
      id: buildScheduledId(now, Number(match.hour), Number(match.minute || 0)),
      date: localDate(now),
      hour: Number(match.hour),
      minute: Number(match.minute || 0)
    };
  }

  function storeLaunchIntent(extra) {
    const now = new Date();
    const scheduled = findScheduledSession({
      hour: extra && extra.hour,
      minute: extra && extra.minute,
      now
    });
    const intent = {
      autoStart: true,
      source: 'notification',
      timestamp: Date.now(),
      session: scheduled,
      hour: scheduled ? scheduled.hour : (extra && extra.hour),
      minute: scheduled ? scheduled.minute : (extra && extra.minute)
    };
    writeJson(KEYS.pendingLaunch, intent);
    return intent;
  }

  function consumeLaunchIntent(maxAgeMs) {
    const intent = readJson(KEYS.pendingLaunch, null);
    if (!intent) return null;
    const age = Date.now() - Number(intent.timestamp || 0);
    if (age > (maxAgeMs || 10 * 60 * 1000)) {
      localStorage.removeItem(KEYS.pendingLaunch);
      return null;
    }
    localStorage.removeItem(KEYS.pendingLaunch);
    return intent;
  }

  function getLaunchUrl(extra, currentPath) {
    const intent = storeLaunchIntent(extra || {});
    const path = currentPath || window.location.pathname;
    let basePath = 'NaamAbhyas/naam-abhyas.html';
    if (path.indexOf('/NaamAbhyas/') !== -1) basePath = 'naam-abhyas.html';
    else if (path.indexOf('/nitnem/category/') !== -1) basePath = '../../NaamAbhyas/naam-abhyas.html';
    else if (/\/(reminders|Homepage|NitnemTracker|GurbaniRadio|Calendar|Hukamnama|GurbaniKhoj|SehajPaath|Favorites|Notes|Insights|Profile|ShabadVichar|RandomShabad|nitnem)\//.test(path)) {
      basePath = '../NaamAbhyas/naam-abhyas.html';
    }

    const params = new URLSearchParams({ autoStart: 'true' });
    if (intent.session && intent.session.id) params.set('sessionId', intent.session.id);
    if (intent.hour !== undefined && intent.hour !== '') params.set('hour', intent.hour);
    if (intent.minute !== undefined && intent.minute !== '') params.set('minute', intent.minute);
    return `${basePath}?${params.toString()}`;
  }

  function readLaunchContextFromUrl() {
    try {
      const url = new URL(window.location.href);
      const autoStart = url.searchParams.get('autoStart') === 'true';
      if (!autoStart) return null;
      const hour = url.searchParams.get('hour');
      const minute = url.searchParams.get('minute');
      const sessionId = url.searchParams.get('sessionId');
      const scheduled = sessionId
        ? { id: sessionId, kind: 'scheduled' }
        : findScheduledSession({
            hour: hour === null ? null : Number(hour),
            minute: minute === null ? null : Number(minute),
            now: Date.now()
          });
      return {
        autoStart: true,
        source: 'url',
        timestamp: Date.now(),
        hour: hour === null ? null : Number(hour),
        minute: minute === null ? null : Number(minute),
        session: scheduled
      };
    } catch (e) {
      return null;
    }
  }

  function resolveLaunchContext() {
    const urlIntent = readLaunchContextFromUrl();
    if (urlIntent) return urlIntent;
    return consumeLaunchIntent();
  }

  function getLaunchContext() {
    return resolveLaunchContext();
  }

  function completeSession(input) {
    const endedAt = input && input.endedAt ? new Date(input.endedAt) : new Date();
    const durationSeconds = Math.max(0, Math.round(Number(input && input.durationSeconds) || 0));
    const scheduled = input && input.sessionId
      ? { id: input.sessionId, kind: 'scheduled', date: localDate(endedAt) }
      : findScheduledSession({ hour: input && input.hour, minute: input && input.minute, now: endedAt });

    if (scheduled && scheduled.id) {
      const records = readJson(KEYS.records, {});
      if (records[scheduled.id]) return { recorded: false, kind: 'scheduled', id: scheduled.id };
      records[scheduled.id] = {
        id: scheduled.id,
        kind: 'scheduled',
        completedAt: endedAt.toISOString(),
        durationSeconds
      };
      writeJson(KEYS.records, records);

      const history = readJson(KEYS.history, {});
      const dateKey = scheduled.date || localDate(endedAt);
      history[dateKey] = history[dateKey] || {};
      history[dateKey][scheduled.id] = true;
      writeJson(KEYS.history, history);

      return { recorded: true, kind: 'scheduled', id: scheduled.id };
    }

    const extras = readJson(KEYS.extras, []);
    const id = `extra-${endedAt.getTime()}`;
    extras.push({
      id,
      kind: 'extra',
      completedAt: endedAt.toISOString(),
      durationSeconds
    });
    writeJson(KEYS.extras, extras);
    return { recorded: true, kind: 'extra', id };
  }

  function dispatchLaunchReady() {
    const context = resolveLaunchContext();
    if (!context) return null;
    window.dispatchEvent(new CustomEvent('naamAbhyasLaunchReady', { detail: context }));
    return context;
  }

  function installAutoBridge() {
    if (window.__naamAbhyasLaunchBridgeInstalled) return;
    window.__naamAbhyasLaunchBridgeInstalled = true;

    const fire = () => {
      if (!/naamabhyas/i.test(window.location.pathname)) return;
      dispatchLaunchReady();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fire, { once: true });
    } else {
      setTimeout(fire, 0);
    }
  }

  window.NaamAbhyasManager = {
    _singleton: true,
    KEYS,
    SESSION_TOLERANCE_MS,
    findScheduledSession,
    storeLaunchIntent,
    consumeLaunchIntent,
    getLaunchUrl,
    getLaunchContext,
    resolveLaunchContext,
    dispatchLaunchReady,
    installAutoBridge,
    completeSession
  };

  installAutoBridge();
})();
