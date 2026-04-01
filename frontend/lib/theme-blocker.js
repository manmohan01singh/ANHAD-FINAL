/**
 * CRITICAL THEME BLOCKER - MUST RUN BEFORE DOM RENDER
 * This script prevents FOUC (Flash of Unstyled Content) by applying theme
 * synchronously before the browser paints the page.
 * 
 * USAGE: Include as FIRST script in <head> with NO defer/async
 */
(function() {
  try {
    const theme = localStorage.getItem('anhad_theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {
    // Fail silently - default to light theme
  }
})();
