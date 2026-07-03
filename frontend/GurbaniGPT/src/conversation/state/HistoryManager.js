/* ── HistoryManager ──
   Handles persistence, session storage, reading history, and bookmarks. */

const HISTORY_KEY = 'anhad_v1__history';
const SESSIONS_KEY = 'anhad_v1__sessions';
const READING_KEY = 'anhad_v1__reading';

export function createHistoryManager() {
  /* ── Conversation history ── */
  function loadHistory() {
    try {
      const s = localStorage.getItem(HISTORY_KEY);
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  }

  function saveHistory(history) {
    if (history.length > 40) history = history.slice(-40);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
  }

  /* ── Sessions ── */
  function getSessions() {
    try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); } catch { return []; }
  }

  function saveSessions(arr) {
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(arr)); } catch {}
  }

  function saveSession(sessionId, history) {
    if (!history.length) return;
    const all = getSessions();
    const i = all.findIndex(function(s) { return s.id === sessionId; });
    const first = history.find(function(m) { return m.role === 'user'; });
    const title = first ? first.content.slice(0, 48) + (first.content.length > 48 ? '\u2026' : '') : 'Conversation';
    const entry = {
      id: sessionId,
      title: title,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      ts: Date.now(),
      messages: history.slice(-40),
    };
    if (i >= 0) all[i] = entry; else all.unshift(entry);
    if (all.length > 30) all.splice(30);
    saveSessions(all);
    return all;
  }

  function deleteSession(id) {
    const all = getSessions().filter(function(s) { return s.id !== id; });
    saveSessions(all);
    return all;
  }

  function loadSession(s) {
    if (s && s.messages) return s.messages;
    return [];
  }

  /* ── Reading history ── */
  function getReadingHistory() {
    try { return JSON.parse(localStorage.getItem(READING_KEY) || '[]'); } catch { return []; }
  }

  function saveReadingHistory(arr) {
    if (arr.length > 50) arr = arr.slice(-50);
    try { localStorage.setItem(READING_KEY, JSON.stringify(arr)); } catch {}
  }

  function addReadingEntry(entry) {
    const all = getReadingHistory();
    all.unshift({
      shabadId: entry.shabadId || entry.verseId || '',
      ang: entry.pageNo || '',
      writer: entry.writer || '',
      preview: (entry.unicode || '').slice(0, 80),
      ts: Date.now(),
    });
    saveReadingHistory(all);
    return all;
  }

  function clearReadingHistory() {
    try { localStorage.setItem(READING_KEY, '[]'); } catch {}
  }

  return {
    loadHistory, saveHistory,
    getSessions, saveSessions, saveSession, deleteSession, loadSession,
    getReadingHistory, saveReadingHistory, addReadingEntry, clearReadingHistory,
  };
}
