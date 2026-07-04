const THEME_KEY = 'anhad_v1__theme';
const GROQ_KEY = 'anhad_v1__groq_key';
const CHIME_KEY = 'anhad_v1__chime';

export function createPreferenceMemory(store) {
  function getTheme() {
    const stored = store.getKey(THEME_KEY);
    if (stored) return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  function setTheme(t) { store.setKey(THEME_KEY, t); }

  function getGroqKey() { return store.getKey(GROQ_KEY); }
  function setGroqKey(k) { store.setKey(GROQ_KEY, k); }

  function getChime() { return store.getKey(CHIME_KEY) !== 'off'; }
  function setChime(on) { store.setKey(CHIME_KEY, on ? 'on' : 'off'); }

  return { getTheme, setTheme, getGroqKey, setGroqKey, getChime, setChime };
}
