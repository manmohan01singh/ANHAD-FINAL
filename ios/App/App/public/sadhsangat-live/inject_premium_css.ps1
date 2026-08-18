$cssToInject = @'

    /* ================================================================
       ANHAD SADHSANGAT LIVE - PREMIUM UI/UX OVERRIDES v3.0
       YouTube-level premium with ANHAD Gold Claymorphism
    ================================================================ */

    :root {
      --gold-glow-sm: 0 0 12px rgba(255,179,0,0.25);
      --gold-glow-md: 0 0 24px rgba(255,179,0,0.35);
      --clay-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
      --clay-shadow-lg: 0 16px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
      --card-radius: 18px;
      --spring-fast: cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* HEADER UPGRADES */
    .header {
      border-radius: 0 0 28px 28px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.04) !important;
      border-bottom: 1px solid rgba(255,179,0,0.12) !important;
    }
    .hdr-logo-text {
      font-size: 22px !important;
      letter-spacing: -1px !important;
    }
    .hdr-action-btn-circle, .hdr-menu-btn {
      width: 38px !important;
      height: 38px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
    }

    /* CHANNEL CIRCLE BAR - Instagram Stories style */
    .horizontal-channels-bar {
      padding: 16px 16px 12px !important;
      gap: 18px !important;
      background: transparent !important;
      border-bottom: none !important;
    }
    .channel-logo-item {
      width: 72px !important;
      gap: 7px !important;
      transition: transform 0.3s var(--spring-fast) !important;
    }
    .channel-logo-item:active { transform: scale(0.90) !important; }
    .channel-logo-circle-wrap { width: 64px !important; height: 64px !important; position: relative; }
    .channel-logo-circle {
      width: 64px !important;
      height: 64px !important;
      border: 2.5px solid var(--bg-tertiary) !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06) !important;
    }
    .channel-logo-item.active .channel-logo-circle {
      border-color: var(--gold-accent) !important;
      box-shadow: 0 0 0 3px rgba(255,179,0,0.25), 0 4px 20px rgba(255,179,0,0.3), 0 2px 8px rgba(0,0,0,0.1) !important;
      transform: scale(1.08) !important;
    }
    .channel-logo-live-ring { inset: -4px !important; border-width: 2.5px !important; }
    .channel-logo-live-dot { width: 14px !important; height: 14px !important; border-width: 3px !important; }
    .channel-logo-name { font-size: 10.5px !important; font-weight: 600 !important; height: 28px !important; }

    /* HERO CAROUSEL - Cinematic */
    .carousel-container {
      border-radius: 22px !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.10) !important;
      max-height: 240px !important;
    }
    .hero-live-badge {
      top: 10px !important;
      left: 10px !important;
      right: auto !important;
      background: #FF0000 !important;
      border-radius: 6px !important;
      font-size: 10px !important;
      font-weight: 900 !important;
      letter-spacing: 0.8px !important;
      box-shadow: 0 2px 10px rgba(255,0,0,0.5) !important;
      display: flex !important;
      align-items: center !important;
      gap: 5px !important;
      padding: 4px 10px !important;
    }
    .carousel-content.carousel-minimal {
      padding: 50px 14px 14px !important;
      background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 60%, transparent 100%) !important;
    }
    .carousel-channel-name { font-size: 15px !important; font-weight: 800 !important; letter-spacing: -0.3px !important; }
    .carousel-dot { width: 6px !important; height: 6px !important; }
    .carousel-dot.active { width: 22px !important; background: var(--gold-accent) !important; }

    /* VIDEO CARDS - Full YouTube quality */
    .yt-video-card { padding: 0 14px 22px !important; }
    .yt-video-thumb-wrap {
      border-radius: var(--card-radius) !important;
      box-shadow: var(--clay-shadow) !important;
    }
    .yt-video-thumb { transition: transform 0.5s var(--ease-out) !important; }
    .yt-video-card:active .yt-video-thumb { transform: scale(1.03) !important; }
    .yt-video-duration {
      bottom: 8px !important; right: 8px !important;
      background: rgba(0,0,0,0.85) !important;
      backdrop-filter: blur(8px) !important;
      font-size: 11px !important; font-weight: 700 !important;
      padding: 3px 7px !important; border-radius: 6px !important;
    }
    .yt-video-details { gap: 12px !important; padding: 12px 0 0 !important; align-items: flex-start !important; }
    .yt-video-avatar {
      width: 38px !important; height: 38px !important;
      border: 1.5px solid rgba(255,179,0,0.25) !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
      flex-shrink: 0; margin-top: 1px;
    }
    .yt-video-title { font-size: 15px !important; font-weight: 700 !important; line-height: 1.4 !important; margin-bottom: 5px !important; letter-spacing: -0.2px !important; }
    .yt-video-meta { font-size: 12.5px !important; gap: 4px !important; }
    .yt-video-more-btn {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      background: none; border: none; color: var(--text-tertiary); cursor: pointer;
      border-radius: 50%; margin-top: 4px; flex-shrink: 0; transition: background 0.15s;
    }
    .yt-video-more-btn:active { background: var(--bg-secondary); }

    /* Live chip badge on video thumbnails */
    .yt-video-live-chip {
      position: absolute; top: 8px; left: 8px;
      background: #FF0000; color: #fff; font-size: 9px; font-weight: 900;
      padding: 3px 8px; border-radius: 5px; letter-spacing: 0.7px;
      display: flex; align-items: center; gap: 4px;
      box-shadow: 0 2px 8px rgba(255,0,0,0.4); z-index: 3;
    }

    /* LIVE NOW CARDS */
    .yt-live-now-card {
      border-radius: 20px !important;
      box-shadow: var(--clay-shadow) !important;
      padding: 14px !important; gap: 14px !important;
      border: 0.5px solid rgba(255,0,0,0.08) !important;
    }
    .yt-live-now-card:active { transform: scale(0.982) !important; }
    .yt-live-now-thumb-wrap { width: 160px !important; border-radius: 14px !important; box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important; }
    .yt-live-now-badge {
      top: 7px !important; right: 7px !important; font-size: 9px !important;
      padding: 3px 7px !important; border-radius: 5px !important; box-shadow: 0 2px 8px rgba(255,0,0,0.5) !important;
    }
    .yt-live-now-title { font-size: 14.5px !important; font-weight: 700 !important; line-height: 1.4 !important; }
    .yt-live-now-channel-row { font-size: 12px !important; font-weight: 600 !important; gap: 5px !important; }
    .yt-live-now-views { font-size: 12px !important; }
    .yt-live-now-more-btn {
      right: 12px !important; width: 32px !important; height: 32px !important;
      border-radius: 50% !important; background: var(--bg-secondary) !important;
      display: flex !important; align-items: center !important; justify-content: center !important;
    }
    .yt-live-now-more-btn:active { background: var(--gold-accent) !important; color: #000 !important; }

    /* SECTION HEADERS */
    .section-header-row { padding: 22px 16px 12px !important; }
    .section-main-title { font-size: 20px !important; font-weight: 800 !important; letter-spacing: -0.5px !important; gap: 8px !important; }
    .section-subtitle { font-size: 12px !important; margin-top: 2px !important; }
    .see-all-pill-btn { font-size: 12px !important; padding: 7px 16px !important; box-shadow: 0 2px 12px rgba(255,179,0,0.25) !important; }

    /* CONTINUE WATCHING SHELF */
    .scroll-card-item { width: 175px !important; }
    .scroll-card-thumb-wrap { border-radius: 14px !important; box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important; }
    .scroll-card-duration { font-size: 10px !important; font-weight: 700 !important; padding: 3px 7px !important; border-radius: 6px !important; bottom: 7px !important; right: 7px !important; }
    .scroll-card-title { font-size: 13px !important; font-weight: 700 !important; margin-top: 10px !important; }
    .scroll-card-channel { font-size: 11px !important; font-weight: 500 !important; margin-top: 3px !important; }
    .scroll-card-progress-bar { height: 4px !important; bottom: 0 !important; }

    /* UPCOMING LIVE */
    .upcoming-card-row { border-radius: 18px !important; padding: 14px 16px !important; box-shadow: var(--clay-shadow) !important; }
    .upcoming-calendar-block { width: 54px !important; height: 54px !important; border-radius: 14px !important; background: linear-gradient(135deg, #111 0%, #1F1F1F 100%) !important; }
    .upcoming-cal-day { font-size: 18px !important; font-weight: 900 !important; }
    .upcoming-cal-month { font-size: 10px !important; font-weight: 900 !important; letter-spacing: 0.8px !important; }
    .upcoming-notify-btn { font-size: 12px !important; padding: 9px 18px !important; box-shadow: 0 3px 12px rgba(255,179,0,0.35) !important; }

    /* PREVIOUS LIVES */
    .prev-live-card-row {
      padding: 12px 16px !important; border-radius: 16px !important; border-bottom: none !important;
      margin-bottom: 10px !important; background: var(--bg-primary) !important;
      box-shadow: var(--shadow-sm) !important; border: 0.5px solid var(--border-color) !important;
    }
    .prev-live-card-row:active { transform: scale(0.985) !important; box-shadow: none !important; }
    .prev-live-thumb { width: 120px !important; height: 68px !important; border-radius: 12px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important; }
    .prev-live-title { font-size: 13.5px !important; font-weight: 700 !important; }
    .prev-live-meta { font-size: 11.5px !important; margin-top: 4px !important; }
    .prev-live-play-btn { width: 38px !important; height: 38px !important; box-shadow: 0 3px 12px rgba(255,179,0,0.3) !important; }

    /* BOTTOM NAV BAR */
    .bottom-nav {
      height: 62px !important;
      border-radius: 30px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06) !important;
      border: 0.5px solid rgba(255,255,255,0.10) !important;
      padding: 0 4px !important;
    }
    [data-theme="dark"] .bottom-nav {
      box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2) !important;
      border-color: rgba(255,255,255,0.08) !important;
    }
    .nav-tab-btn { gap: 4px !important; border-radius: 22px !important; padding: 6px 0 !important; }
    .nav-tab-btn svg { width: 23px !important; height: 23px !important; }
    .nav-tab-btn span { font-size: 10.5px !important; font-weight: 500 !important; }
    .nav-tab-btn.active { color: var(--gold-accent) !important; }
    .nav-tab-btn.active span { font-weight: 700 !important; }
    .nav-tab-btn.active svg { filter: drop-shadow(0 0 4px rgba(255,179,0,0.4)) !important; }
    .nav-tab-btn.active::after {
      content: '' !important; position: absolute !important; bottom: 5px !important;
      left: 50% !important; transform: translateX(-50%) !important;
      width: 24px !important; height: 3px !important;
      background: var(--gold-gradient) !important; border-radius: 100px !important;
      box-shadow: 0 0 8px rgba(255,179,0,0.5) !important;
    }
    .nav-spring-dot { display: none !important; }

    /* PLAYER SHEET */
    .player-sheet { border-radius: 28px 28px 0 0 !important; border-top: 0.5px solid rgba(255,179,0,0.15) !important; }
    .player-sheet-header { height: 48px !important; }
    .player-drag-handle { width: 44px !important; height: 5px !important; opacity: 0.9 !important; box-shadow: 0 0 10px rgba(255,179,0,0.4) !important; }
    .player-header-title { font-size: 11px !important; letter-spacing: 0.8px !important; font-weight: 900 !important; }
    .player-back-btn { border-radius: 100px !important; padding: 7px 16px !important; font-size: 13.5px !important; font-weight: 700 !important; }
    .player-video-viewport { box-shadow: 0 12px 48px rgba(0,0,0,0.4), 0 0 0 1.5px rgba(255,179,0,0.25) !important; }
    .player-video-title { font-size: 19px !important; font-weight: 800 !important; line-height: 1.35 !important; letter-spacing: -0.4px !important; }
    .player-channel-avatar { width: 44px !important; height: 44px !important; border: 2px solid rgba(255,179,0,0.3) !important; box-shadow: 0 2px 10px rgba(255,179,0,0.15) !important; }
    .player-channel-name { font-size: 15px !important; font-weight: 700 !important; }
    .player-sub-btn.not-monitored { padding: 9px 22px !important; font-size: 13.5px !important; box-shadow: 0 3px 16px rgba(255,179,0,0.35) !important; }
    .player-control-icon-btn.play-pause {
      width: 80px !important; height: 80px !important;
      box-shadow: 0 6px 36px rgba(255,179,0,0.5), 0 0 0 4px rgba(255,179,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3) !important;
    }
    .player-control-icon-btn { width: 52px !important; height: 52px !important; }
    input[type="range"].yt-scrubber::-webkit-slider-runnable-track { height: 5px !important; }
    input[type="range"].yt-scrubber::-webkit-slider-thumb { width: 18px !important; height: 18px !important; box-shadow: 0 0 14px rgba(255,179,0,0.6), 0 2px 6px rgba(0,0,0,0.3) !important; }
    .player-pill-btn { padding: 10px 18px !important; font-size: 13px !important; font-weight: 600 !important; border-radius: 100px !important; }
    .player-playback-controls { gap: 36px !important; margin: 16px 0 12px !important; }
    .player-details-row { border-left: 4px solid var(--gold-accent) !important; padding-left: 14px !important; margin-top: 10px !important; }

    /* LOADING SKELETON - Gold shimmer */
    .shimmer-card {
      border-radius: var(--card-radius) !important;
      background: linear-gradient(90deg, var(--bg-secondary) 25%, rgba(255,179,0,0.08) 50%, var(--bg-secondary) 75%) !important;
      background-size: 200% 100% !important;
      animation: gold-shimmer 1.8s ease-in-out infinite !important;
      height: 220px !important;
      margin: 0 14px 16px !important;
    }
    @keyframes gold-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* PREVIOUS LIVES LIST SPACING */
    .upcoming-live-list { gap: 0 !important; padding: 0 14px !important; }

    /* SEARCH PREMIUM */
    .search-input:focus { border-color: var(--gold-accent) !important; box-shadow: 0 0 0 3px rgba(255,179,0,0.15) !important; }
    .notifications-popup { border-radius: 22px !important; box-shadow: var(--clay-shadow-lg) !important; }
    .ios-sheet-group { border-radius: 18px !important; }
    .drawer { width: 290px !important; }
    .drawer-item { border-radius: 14px !important; padding: 13px 16px !important; }
    .library-card { border-radius: 20px !important; }

    /* GOLD LIVE ANIMATION */
    @keyframes live-dot-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

'@

$filePath = 'index.html'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
$newContent = $content -replace '(  </style>)', ($cssToInject + "`r`n  </style>")
[System.IO.File]::WriteAllText($filePath, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "SUCCESS: Premium CSS injected. File size: $((Get-Item $filePath).Length) bytes"
