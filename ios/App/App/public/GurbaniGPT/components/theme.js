export function initTheme() {
  const STORAGE_KEY = 'anhad_theme';

  function getAutoTheme() {
    const forced = localStorage.getItem('anhad_forced_time_of_day');
    if (forced && ['morning', 'day', 'evening', 'night'].includes(forced)) {
      return (forced === 'night') ? 'dark' : 'light';
    }
    const hour = new Date().getHours();
    return (hour >= 5 && hour < 20) ? 'light' : 'dark';
  }

  function getPreferredTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'auto';
  }

  function applyTheme(theme) {
    const effectiveTheme = theme === 'auto' ? getAutoTheme() : theme;
    const isDark = effectiveTheme === 'dark';

    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.setAttribute('data-theme-mode', theme);

    document.body.classList.toggle('dark', isDark);
    document.body.classList.toggle('light', !isDark);
    document.body.classList.toggle('dark-mode', isDark);
    document.body.style.background = isDark ? '#0F0F12' : '#FFFDF9';

    localStorage.setItem(STORAGE_KEY, theme);
    updateIcon(isDark);
  }

  function updateIcon(isDark) {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    icon.innerHTML = isDark
      ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }

  function toggle() {
    const current = getPreferredTheme();
    let next;
    if (current === 'light') next = 'dark';
    else if (current === 'dark') next = 'auto';
    else next = 'light';

    applyTheme(next);

    // Dispatch custom event to notify other parts
    const eventDetail = { bubbles: true, detail: { theme: next } };
    document.dispatchEvent(new CustomEvent('themechange', eventDetail));
    document.dispatchEvent(new CustomEvent('anhadThemeChanged', eventDetail));
  }

  const theme = getPreferredTheme();
  applyTheme(theme);

  // Storage listener for cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === 'anhad_forced_time_of_day') {
      applyTheme(getPreferredTheme());
    }
  });

  // Event listener for custom theme change events
  window.addEventListener('themechange', (e) => {
    if (e.detail?.theme) {
      applyTheme(e.detail.theme);
    }
  });
  window.addEventListener('anhadThemeChanged', (e) => {
    if (e.detail?.theme) {
      applyTheme(e.detail.theme);
    }
  });

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    if (getPreferredTheme() === 'auto') {
      applyTheme('auto');
    }
  });

  return { toggle, applyTheme, getPreferredTheme };
}
