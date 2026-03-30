/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD Shared Navigation Component v3 — iOS Emoji Edition
 * Consistent floating pill nav with Apple emojis across all pages
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Determine current page to set active state
  const path = window.location.pathname.toLowerCase();

  // Calculate relative path back to root
  const isRoot = path.endsWith('/index.html') || path.endsWith('/frontend/') || !path.includes('.html');
  const basePath = isRoot ? '' : '../';

  let activeTab = 'home';
  if (path.includes('/insights/')) activeTab = 'insights';
  else if (path.includes('/favorites/')) activeTab = 'favorites';
  else if (path.includes('/profile/') || path.includes('/dashboard/')) activeTab = 'profile';

  // Emoji nav items — matching index.html nav bar
  const navItems = [
    { id: 'home', emoji: '🏠', label: 'Home', href: `${basePath}${isRoot ? '#' : 'index.html'}` },
    { id: 'insights', emoji: '📚', label: 'Learning', href: `${basePath}Insights/insights.html` },
    { id: 'favorites', emoji: '❤️', label: 'Favorites', href: `${basePath}Favorites/favorites.html` },
    { id: 'profile', emoji: '📊', label: 'Dashboard', href: `${basePath}Dashboard/dashboard.html` }
  ];

  // Build nav HTML
  const navHTML = `
    <nav class="nav-pill shared-nav-pill" id="main-nav" aria-label="Main Navigation">
      ${navItems.map(item => `
        <a href="${item.href}" class="nav-item ${activeTab === item.id ? 'active' : ''}" data-tab="${item.id}" aria-label="${item.label}"${activeTab === item.id ? ' aria-current="page"' : ''}>
          <span class="nav-emoji" role="img" aria-label="${item.label}">${item.emoji}</span>
          <span class="nav-label">${item.label}</span>
        </a>
      `).join('')}
    </nav>
  `;

  // Inject Styles — iOS 18 frosted glass pill with emoji icons
  const navStyles = `
    .shared-nav-pill {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 100px;
      z-index: 9999;
      backdrop-filter: blur(50px) saturate(200%);
      -webkit-backdrop-filter: blur(50px) saturate(200%);
      background: rgba(249, 249, 249, 0.92);
      border: 0.5px solid rgba(0, 0, 0, 0.08);
      box-shadow:
        0 8px 40px rgba(0, 0, 0, 0.08),
        0 1px 2px rgba(0, 0, 0, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.8),
        inset 0 -0.5px 0 rgba(0, 0, 0, 0.03);
      transition: transform 0.3s ease, opacity 0.25s ease;
      padding-bottom: calc(6px + env(safe-area-inset-bottom, 0px));
    }

    .shared-nav-pill.hidden {
      transform: translateX(-50%) translateY(120px);
      opacity: 0;
      pointer-events: none;
    }

    .shared-nav-pill .nav-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      cursor: pointer;
      position: relative;
      text-decoration: none;
      flex-shrink: 0;
      transition: width 0.3s ease, background 0.25s ease, border-radius 0.3s ease;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }

    .shared-nav-pill .nav-emoji {
      font-size: 1.4rem;
      line-height: 1;
      font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
      text-rendering: auto;
      opacity: 0.45;
      transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      flex-shrink: 0;
    }

    .shared-nav-pill .nav-item:hover .nav-emoji {
      opacity: 0.7;
    }

    .shared-nav-pill .nav-item.active .nav-emoji {
      opacity: 1;
      transform: scale(1.1);
    }

    .shared-nav-pill .nav-item:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .shared-nav-pill .nav-item.active {
      width: auto;
      padding: 0 18px;
      gap: 8px;
      border-radius: 100px;
      background: rgba(0, 122, 255, 0.1);
    }

    .shared-nav-pill .nav-label {
      font-family: 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: -0.01em;
      white-space: nowrap;
      max-width: 0;
      overflow: hidden;
      opacity: 0;
      color: #007AFF;
      transition: max-width 0.3s ease, opacity 0.2s ease;
    }

    .shared-nav-pill .nav-item.active .nav-label {
      max-width: 80px;
      opacity: 1;
    }

    /* Dark mode */
    html.dark-mode .shared-nav-pill,
    body.dark-mode .shared-nav-pill {
      background: rgba(28, 28, 30, 0.88);
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    html.dark-mode .shared-nav-pill .nav-emoji,
    body.dark-mode .shared-nav-pill .nav-emoji {
      opacity: 0.4;
    }

    html.dark-mode .shared-nav-pill .nav-item:hover .nav-emoji,
    body.dark-mode .shared-nav-pill .nav-item:hover .nav-emoji {
      opacity: 0.7;
    }

    html.dark-mode .shared-nav-pill .nav-item.active .nav-emoji,
    body.dark-mode .shared-nav-pill .nav-item.active .nav-emoji {
      opacity: 1;
    }

    html.dark-mode .shared-nav-pill .nav-item:hover,
    body.dark-mode .shared-nav-pill .nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    html.dark-mode .shared-nav-pill .nav-item.active,
    body.dark-mode .shared-nav-pill .nav-item.active {
      background: rgba(10, 132, 255, 0.15);
    }

    html.dark-mode .shared-nav-pill .nav-label,
    body.dark-mode .shared-nav-pill .nav-label {
      color: #0A84FF;
    }
  `;

  // Wait for body to be available
  function inject() {
    if (document.body && document.head) {
      document.head.insertAdjacentHTML('beforeend', `<style>${navStyles}</style>`);
      document.body.insertAdjacentHTML('beforeend', navHTML);
    }
  }

  if (document.body && document.head) {
    inject();
  } else {
    const observer = new MutationObserver((mutations, obs) => {
      if (document.body && document.head) {
        inject();
        obs.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true });
  }

})();
