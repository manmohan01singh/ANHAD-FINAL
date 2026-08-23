/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD — UNIVERSAL DESKTOP SIDEBAR & NAVIGATION CONTROLLER
 * High-performance desktop shell provider for all pages on screen widths >= 1024px.
 * Fully isolated from mobile screens (zero impact on mobile).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  var SIDEBAR_ID = 'desktopSidebar';

  // Navigation Items Definition with relative path resolution
  var NAV_ITEMS = [
    { id: 'home', label: 'Home', gurmukhi: 'ਮੁੱਖ ਪੰਨਾ', icon: '🏠', path: 'index.html', aliases: ['/', '/index.html', 'index.html', 'Homepage/ios-homepage.html'] },
    { id: 'hukamnama', label: 'Daily Hukamnama', gurmukhi: 'ਹੁਕਮਨਾਮਾ', icon: '📜', badge: 'Today', badgeType: 'gold', path: 'Hukamnama/daily-hukamnama.html', aliases: ['Hukamnama/daily-hukamnama.html', 'Hukamnama/'] },
    { id: 'nitnem', label: 'Nitnem Hub', gurmukhi: 'ਨਿਤਨੇਮ', icon: '📿', badge: '8 Banis', path: 'nitnem/index.html', aliases: ['nitnem/index.html', 'nitnem/', 'nitnem/category/nitnem.html'] },
    { id: 'radio', label: 'Gurbani Radio', gurmukhi: 'ਰੇਡੀਓ', icon: '📻', badge: 'LIVE', badgeType: 'live', path: 'GurbaniRadio/gurbani-radio.html', aliases: ['GurbaniRadio/gurbani-radio.html', 'GurbaniRadio/'] },
    { id: 'khoj', label: 'Gurbani Khoj', gurmukhi: 'ਖੋਜ', icon: '🔍', path: 'GurbaniKhoj/gurbani-khoj.html', aliases: ['GurbaniKhoj/gurbani-khoj.html', 'GurbaniKhoj/shabad-reader.html'] },
    { id: 'sehaj', label: 'Sehaj Paath', gurmukhi: 'ਸਹਿਜ ਪਾਠ', icon: '📖', path: 'SehajPaath/sehaj-paath.html', aliases: ['SehajPaath/sehaj-paath.html', 'SehajPaath/reader.html'] },
    { id: 'naam', label: 'Naam Abhyas', gurmukhi: 'ਨਾਮ ਅਭਿਆਸ', icon: '🙏', path: 'NaamAbhyas/naam-abhyas.html', aliases: ['NaamAbhyas/naam-abhyas.html', 'NaamAbhyas/naam-abhyas-timer.html'] },
    { id: 'sadhsangat', label: 'Sadhsangat Live', gurmukhi: 'ਸਾਧਸੰਗਤ', icon: '📡', badge: 'HD', path: 'sadhsangat-live/index.html', aliases: ['sadhsangat-live/index.html', 'sadhsangat-live/'] },
    { id: 'tracker', label: 'Nitnem Tracker', gurmukhi: 'ਟਰੈਕਰ', icon: '🔥', path: 'NitnemTracker/nitnem-tracker.html', aliases: ['NitnemTracker/nitnem-tracker.html', 'NitnemTracker/'] },
    { id: 'favorites', label: 'Favorites', gurmukhi: 'ਮਨਪਸੰਦ', icon: '❤️', path: 'Favorites/favorites.html', aliases: ['Favorites/favorites.html', 'Favorites/'] },
    { id: 'notes', label: 'Spiritual Notes', gurmukhi: 'ਨੋਟਸ', icon: '📝', path: 'Notes/notes.html', aliases: ['Notes/notes.html', 'Notes/'] },
    { id: 'learning', label: 'Learning & Library', gurmukhi: 'ਸਿੱਖਿਆ', icon: '📚', path: 'Insights/insights.html', aliases: ['Insights/insights.html', 'Insights/'] }
  ];

  var FOOTER_ITEMS = [
    { id: 'calendar', label: 'Gurpurab Calendar', icon: '📅', path: 'Calendar/GurpurabCalendar-ios.html', aliases: ['Calendar/GurpurabCalendar-ios.html'] },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: 'Settings/index.html', aliases: ['Settings/index.html', 'Settings/appearance.html', 'Settings/notifications.html'] }
  ];

  function getRootPrefix() {
    var loc = window.location.pathname;
    if (loc.indexOf('/frontend/') !== -1) {
      var sub = loc.substring(loc.indexOf('/frontend/') + 10);
      var depth = (sub.match(/\//g) || []).length;
      var prefix = '';
      for (var i = 0; i < depth; i++) prefix += '../';
      return prefix;
    }
    var depth = (loc.match(/\//g) || []).length;
    if (depth <= 1) return '';
    var prefix = '';
    for (var i = 1; i < depth; i++) prefix += '../';
    return prefix;
  }

  function resolvePath(targetRel) {
    var prefix = getRootPrefix();
    return prefix + targetRel;
  }

  function getActiveId() {
    var loc = window.location.pathname.toLowerCase();
    
    // Directory-based high-confidence route matches
    if (loc.indexOf('/hukamnama') !== -1 || loc.indexOf('daily-hukamnama') !== -1) return 'hukamnama';
    if (loc.indexOf('/nitnemtracker') !== -1 || loc.indexOf('nitnem-tracker') !== -1) return 'tracker';
    if (loc.indexOf('/nitnem') !== -1 || loc.indexOf('bani') !== -1) return 'nitnem';
    if (loc.indexOf('/gurbaniradio') !== -1 || loc.indexOf('gurbani-radio') !== -1) return 'radio';
    if (loc.indexOf('/gubanikhoj') !== -1 || loc.indexOf('/gurbanikhoj') !== -1 || loc.indexOf('shabad-reader') !== -1 || loc.indexOf('gurbani-khoj') !== -1) return 'khoj';
    if (loc.indexOf('/sehajpaath') !== -1 || loc.indexOf('sehaj-paath') !== -1) return 'sehaj';
    if (loc.indexOf('/naamabhyas') !== -1 || loc.indexOf('naam-abhyas') !== -1) return 'naam';
    if (loc.indexOf('/sadhsangat') !== -1 || loc.indexOf('sadhsangat-live') !== -1) return 'sadhsangat';
    if (loc.indexOf('/favorites') !== -1) return 'favorites';
    if (loc.indexOf('/notes') !== -1) return 'notes';
    if (loc.indexOf('/insights') !== -1 || loc.indexOf('/learning') !== -1) return 'learning';
    if (loc.indexOf('/calendar') !== -1 || loc.indexOf('gurpurab') !== -1) return 'calendar';
    if (loc.indexOf('/settings') !== -1) return 'settings';

    for (var i = 0; i < NAV_ITEMS.length; i++) {
      var item = NAV_ITEMS[i];
      for (var j = 0; j < item.aliases.length; j++) {
        var alias = item.aliases[j].toLowerCase();
        if (loc.endsWith(alias) || (alias === '/' && (loc === '/' || loc.endsWith('/index.html')))) {
          return item.id;
        }
      }
    }
    for (var k = 0; k < FOOTER_ITEMS.length; k++) {
      var fitem = FOOTER_ITEMS[k];
      for (var l = 0; l < fitem.aliases.length; l++) {
        if (loc.endsWith(fitem.aliases[l].toLowerCase())) {
          return fitem.id;
        }
      }
    }
    return 'home';
  }

  function buildSidebarHtml() {
    var activeId = getActiveId();
    var logoSrc = resolvePath('assets/app-logo.webp');
    var homeHref = resolvePath('index.html');

    var navHtml = NAV_ITEMS.map(function(item) {
      var isActive = item.id === activeId;
      var href = resolvePath(item.path);
      var badgeHtml = '';
      if (item.badge) {
        var badgeClass = item.badgeType === 'gold' ? ' desktop-sidebar__badge--gold' : (item.badgeType === 'live' ? ' desktop-sidebar__badge--live' : '');
        badgeHtml = '<span class="desktop-sidebar__badge' + badgeClass + '">' + item.badge + '</span>';
      }
      return '<a href="' + href + '" class="desktop-sidebar__link' + (isActive ? ' desktop-sidebar__link--active' : '') + '" data-route="' + item.id + '" title="' + item.label + '">' +
        '<span class="desktop-sidebar__link-icon"><span class="ios-emoji">' + item.icon + '</span></span>' +
        '<span class="desktop-sidebar__link-text">' + item.label + '</span>' +
        badgeHtml +
      '</a>';
    }).join('');

    var footerHtml = FOOTER_ITEMS.map(function(item) {
      var href = resolvePath(item.path);
      return '<a href="' + href + '" class="desktop-sidebar__footer-action" title="' + item.label + '">' +
        '<span class="ios-emoji">' + item.icon + '</span>' +
        '<span>' + item.label.split(' ')[0] + '</span>' +
      '</a>';
    }).join('') +
    '<button type="button" class="desktop-sidebar__footer-action desktop-sidebar__theme-toggle" id="desktopThemeToggle" aria-label="Toggle Theme" title="Toggle Theme">' +
      '<span class="ios-emoji" id="desktopThemeIcon">🌙</span>' +
    '</button>';

    var html = '' +
      '<aside class="desktop-sidebar" aria-label="Desktop Navigation" id="' + SIDEBAR_ID + '">' +
        '<div class="desktop-sidebar__header">' +
          '<div class="desktop-sidebar__header-top">' +
            '<a href="' + homeHref + '" class="desktop-sidebar__brand">' +
              '<div class="desktop-sidebar__logo-wrapper">' +
                '<img decoding="async" src="' + logoSrc + '" alt="ANHAD" class="desktop-sidebar__logo">' +
              '</div>' +
              '<div class="desktop-sidebar__brand-meta">' +
                '<span class="desktop-sidebar__brand-name">ANHAD</span>' +
                '<span class="desktop-sidebar__brand-gurmukhi">ਅਨਹਦ ਬਾਣੀ</span>' +
              '</div>' +
            '</a>' +
            '<button type="button" class="desktop-sidebar__collapse-btn" id="desktopSidebarCollapseBtn" aria-label="Collapse Sidebar" title="Collapse Sidebar (Ctrl+B)">' +
              '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>' +
                '<line x1="9" y1="3" x2="9" y2="21"></line>' +
              '</svg>' +
            '</button>' +
          '</div>' +
          '<div class="desktop-sidebar__status-pill">' +
            '<span class="desktop-sidebar__status-dot"></span>' +
            '<span class="desktop-sidebar__status-text">Darbar Sahib Live</span>' +
          '</div>' +
        '</div>' +

        '<div class="desktop-sidebar__nav-scroll">' +
          '<div class="desktop-sidebar__section-title">Navigation</div>' +
          '<nav class="desktop-sidebar__nav">' +
            navHtml +
          '</nav>' +
        '</div>' +

        '<div class="desktop-sidebar__footer">' +
          footerHtml +
        '</div>' +
      '</aside>' +
      '<button type="button" class="desktop-sidebar__expand-btn" id="desktopSidebarExpandBtn" aria-label="Expand Sidebar" title="Expand Sidebar (Ctrl+B)">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>' +
          '<line x1="9" y1="3" x2="9" y2="21"></line>' +
          '<polyline points="14 9 17 12 14 15"></polyline>' +
        '</svg>' +
      '</button>';

    return html;
  }

  function initSidebar() {
    if (window.innerWidth < 1024) {
      var existing = document.getElementById(SIDEBAR_ID);
      if (existing) existing.style.display = 'none';
      return;
    }

    var existing = document.getElementById(SIDEBAR_ID);
    if (!existing) {
      var div = document.createElement('div');
      div.innerHTML = buildSidebarHtml();
      while (div.firstElementChild) {
        document.body.insertBefore(div.firstElementChild, document.body.firstChild);
      }
    } else {
      var div = document.createElement('div');
      div.innerHTML = buildSidebarHtml();
      var freshSidebar = div.querySelector('#' + SIDEBAR_ID);
      if (freshSidebar) {
        existing.innerHTML = freshSidebar.innerHTML;
      }
      var expandBtn = document.getElementById('desktopSidebarExpandBtn');
      if (!expandBtn) {
        var freshExpandBtn = div.querySelector('#desktopSidebarExpandBtn');
        if (freshExpandBtn) document.body.appendChild(freshExpandBtn);
      }
      existing.style.display = 'flex';
      updateActiveItem();
    }

    // Apply saved collapsed state
    var isCollapsed = localStorage.getItem('anhad_sidebar_collapsed') === '1';
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);

    attachSidebarControls();
    attachThemeToggle();
    syncThemeIcon();
  }

  function attachSidebarControls() {
    var collapseBtn = document.getElementById('desktopSidebarCollapseBtn');
    var expandBtn = document.getElementById('desktopSidebarExpandBtn');

    if (collapseBtn && !collapseBtn._wired) {
      collapseBtn._wired = true;
      collapseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.body.classList.add('sidebar-collapsed');
        localStorage.setItem('anhad_sidebar_collapsed', '1');
      });
    }

    if (expandBtn && !expandBtn._wired) {
      expandBtn._wired = true;
      expandBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.body.classList.remove('sidebar-collapsed');
        localStorage.setItem('anhad_sidebar_collapsed', '0');
      });
    }

    if (!window._anhadSidebarKeyWired) {
      window._anhadSidebarKeyWired = true;
      document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
          e.preventDefault();
          var nowCollapsed = document.body.classList.toggle('sidebar-collapsed');
          localStorage.setItem('anhad_sidebar_collapsed', nowCollapsed ? '1' : '0');
        }
      });
    }
  }

  function updateActiveItem() {
    var activeId = getActiveId();
    var sidebar = document.getElementById(SIDEBAR_ID);
    if (!sidebar) return;
    sidebar.querySelectorAll('.desktop-sidebar__link, .desktop-sidebar__item').forEach(function(el) {
      if (el.getAttribute('data-route') === activeId || el.getAttribute('data-sidebar-id') === activeId) {
        el.classList.add('desktop-sidebar__link--active');
      } else {
        el.classList.remove('desktop-sidebar__link--active');
      }
    });
  }

  function syncThemeIcon() {
    var iconEl = document.getElementById('desktopThemeIcon');
    if (!iconEl) return;
    var theme = document.documentElement.getAttribute('data-theme') || 'light';
    iconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function attachThemeToggle() {
    var buttons = document.querySelectorAll('#sidebarThemeToggleBtn, #desktopThemeToggle');
    buttons.forEach(function(btn) {
      if (!btn || btn._themeToggleWired) return;
      btn._themeToggleWired = true;

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.AnhadTheme && typeof window.AnhadTheme.toggle === 'function') {
          window.AnhadTheme.toggle();
        } else {
          var current = document.documentElement.getAttribute('data-theme') || 'light';
          var next = current === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          document.documentElement.setAttribute('data-theme-mode', next);
          if (next === 'dark') {
            document.documentElement.classList.add('dark', 'dark-mode');
            document.body.classList.add('dark-mode');
          } else {
            document.documentElement.classList.remove('dark', 'dark-mode');
            document.body.classList.remove('dark-mode');
          }
          try { localStorage.setItem('anhad_theme', next); } catch(err) {}
        }
        syncThemeIcon();
      });
    });
  }

  // Run on DOMContentLoaded or immediately if already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }

  // Handle resize with debouncing
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initSidebar, 150);
  });

  // Export to window for SPA transitions
  window.initDesktopSidebar = initSidebar;
  window.updateDesktopSidebar = updateActiveItem;

})();
