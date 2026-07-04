import { initTheme } from './components/theme.js';
import { initBookmarks } from './components/bookmarks.js';
import { initTimer } from './components/timer.js';
import { initMemory } from './components/memory.js';
import { initChat, setToast } from './components/chat.js';

(function () {
  'use strict';

  /* ── Shared state ── */
  const state = {
    mood: '',
    length: 'brief',
  };

  const moodProxy = {
    get: () => state.mood,
    set: (val) => { state.mood = val; },
  };

  const lengthProxy = {
    get: () => state.length,
    set: (val) => { state.length = val; },
  };

  /* ── Toast system ── */
  let toastTimer = null;
  function showToast(msg, ms = 2000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
  }
  setToast(showToast);

  /* ── Init theme ── */
  const theme = initTheme();

  /* ── Init bookmarks ── */
  const bookmarks = initBookmarks();

  /* ── Init timer ── */
  const timer = initTimer();

  /* ── Init memory/learning engine ── */
  const memory = initMemory();

  /* ── Init chat ── */
  initChat({
    getTheme: () => theme,
    getBookmarks: () => bookmarks,
    getTimer: () => timer,
    getMood: () => moodProxy,
    getLength: () => lengthProxy,
    getMemory: () => memory,
  });

  /* ── Network status ── */
  function checkNet() {
    const on = navigator.onLine;
    const badge = document.getElementById('netBadge');
    if (badge) badge.classList.toggle('show', !on);
  }
  window.addEventListener('online', checkNet);
  window.addEventListener('offline', checkNet);
  checkNet();

})();
