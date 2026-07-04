/* ── WelcomeController ──
   Manages the welcome screen, greeting, suggestions, and welcome verse. */

export function createWelcomeController() {
  const WELCOME_KEY = 'anhad_v1__welcome_verse';

  function show(container, welcomeEl, suggestions, greeting) {
    if (!container || !welcomeEl) return;
    container.style.display = 'none';
    welcomeEl.style.display = 'block';

    if (greeting) {
      const g = welcomeEl.querySelector('.welcome-greeting');
      if (g) g.textContent = greeting;
    }

    if (suggestions && suggestions.length > 0) {
      const grid = welcomeEl.querySelector('.suggestion-grid');
      if (grid) {
        grid.innerHTML = '';
        for (const s of suggestions) {
          const btn = document.createElement('button');
          btn.className = 'suggestion-chip';
          btn.textContent = s;
          grid.appendChild(btn);
        }
      }
    }
  }

  function hide(welcomeEl) {
    if (welcomeEl) welcomeEl.style.display = 'none';
  }

  function cacheVerse(verse) {
    try {
      localStorage.setItem(WELCOME_KEY, JSON.stringify({
        unicode: verse.unicode || '',
        english: verse.english || '',
        source: verse.pageNo || '',
        ts: Date.now(),
      }));
    } catch {}
  }

  function getCachedVerse() {
    try {
      const raw = localStorage.getItem(WELCOME_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Date.now() - data.ts < 86400000) return data;
      }
    } catch {}
    return null;
  }

  return { show, hide, cacheVerse, getCachedVerse };
}
