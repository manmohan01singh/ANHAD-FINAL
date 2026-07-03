const STORE_KEY = 'anhad_v1__memory';

export function createMemoryStore() {
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function save(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch {}
  }

  function getKey(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function setKey(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }

  return { load, save, getKey, setKey };
}
