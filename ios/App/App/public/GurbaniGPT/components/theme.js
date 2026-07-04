export function initTheme() {
  const STORAGE_KEY = 'gpt_theme';

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark', isDark);
    document.body.classList.toggle('light', !isDark);
    document.body.style.background = isDark ? '#0c0a09' : '#f6f4f0';
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
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(next);
  }

  const theme = getPreferredTheme();
  applyTheme(theme);

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(mq.matches ? 'dark' : 'light');
    }
  });

  return { toggle, applyTheme, getPreferredTheme };
}
