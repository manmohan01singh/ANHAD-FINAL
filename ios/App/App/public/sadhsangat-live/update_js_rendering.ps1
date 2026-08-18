$content = [System.IO.File]::ReadAllText('index.html', [System.Text.Encoding]::UTF8)

# 1. UPDATE: createYtVideoCard - isLiveCard branch (horizontal live card)
# Add live pulsing badge to live cards
$oldLiveCard = @'
          <div class="yt-live-now-thumb-wrap">
            <img decoding="async" class="yt-live-now-thumb" src="https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg" loading="lazy" data-tried-fallback="false">
           
          </div>
          <div class="yt-live-now-info">
            <div class="yt-live-now-title">${v.title}</div>
            <div class="yt-live-now-channel-row">
              <span>${v.channelName}</span>
              ${GOLD_CHECK_SVG}
            </div>
            <div class="yt-live-now-views">${v.views || 'Watching Live'}</div>
          </div>
          <button class="yt-live-now-more-btn" aria-label="More options">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </button>
'@

$newLiveCard = @'
          <div class="yt-live-now-thumb-wrap">
            <img decoding="async" class="yt-live-now-thumb" src="https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg" loading="lazy" data-tried-fallback="false">
            <div class="yt-live-now-badge">LIVE</div>
          </div>
          <div class="yt-live-now-info">
            <div class="yt-live-now-title">${v.title}</div>
            <div class="yt-live-now-channel-row">
              <span>${v.channelName}</span>
              ${GOLD_CHECK_SVG}
            </div>
            <div class="yt-live-now-views" style="display:flex;align-items:center;gap:5px;">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#22C55E;box-shadow:0 0 6px rgba(34,197,94,0.6);flex-shrink:0;"></span>
              <span>${v.views || 'Watching Live'}</span>
            </div>
          </div>
          <button class="yt-live-now-more-btn" aria-label="More options">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
'@

if ($content.Contains($oldLiveCard)) {
    $content = $content.Replace($oldLiveCard, $newLiveCard)
    Write-Host "Live card HTML updated"
} else {
    Write-Host "WARNING: Live card HTML not found"
}

# 2. UPDATE: Standard video card - add LIVE chip when needed
# Find the video duration section and enhance it to also add LIVE chip
$oldDurationSection = @'
      if (v.duration) {
        const duration = CE('span');
        duration.className = 'yt-video-duration';
        duration.textContent = v.duration;
        thumbWrap.appendChild(duration);
      }
'@

$newDurationSection = @'
      if (v.duration) {
        const duration = CE('span');
        duration.className = 'yt-video-duration';
        duration.textContent = v.duration;
        thumbWrap.appendChild(duration);
      }
      // Add LIVE chip for live videos that are not using isLiveCard layout
      if (v.isLive || v.liveTitle) {
        const liveChip = CE('div');
        liveChip.className = 'yt-video-live-chip';
        liveChip.innerHTML = 'LIVE';
        thumbWrap.appendChild(liveChip);
      }
'@

if ($content.Contains($oldDurationSection)) {
    $content = $content.Replace($oldDurationSection, $newDurationSection)
    Write-Host "Video card duration/LIVE chip section updated"
} else {
    Write-Host "WARNING: Duration section not found"
}

# 3. UPDATE: Home tab section headers - add emoji prefixes and enhanced titles
# Update the "Live Now" section header in renderHomeLiveTab
$oldHomeHeader1 = @'
      liveHdr.innerHTML = `
        <div class="section-title-block">
          <div class="section-main-title">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#FF0000;margin-right:8px;animation:live-pulse 1.4s ease-in-out infinite;vertical-align:middle;"></span>
            <span style="vertical-align:middle;">Live Now</span>
          </div>
          <div class="section-subtitle">Real-time Gurbani broadcasts</div>
        </div>`;
'@

$newHomeHeader1 = @'
      liveHdr.innerHTML = `
        <div class="section-title-block">
          <div class="section-main-title">
            <span style="vertical-align:middle; margin-right:4px; font-size:18px;">🔴</span>
            <span style="vertical-align:middle;">Live Now</span>
          </div>
          <div class="section-subtitle">Real-time Gurbani broadcasts · Join the sangat</div>
        </div>`;
'@

if ($content.Contains($oldHomeHeader1)) {
    $content = $content.Replace($oldHomeHeader1, $newHomeHeader1)
    Write-Host "Live Now section header updated"
} else {
    Write-Host "WARNING: Live Now section header not found"
}

# 4. UPDATE: Previous Lives section header
$oldPrevHeader = @'
      prevHdr.innerHTML = `
        <div class="section-title-block">
          <div class="section-main-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--text-secondary)" stroke-width="2.5" style="margin-right:6px;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style="vertical-align:middle;">Previous Lives</span>
          </div>
          <div class="section-subtitle">Catch up on what you missed</div>
        </div>`;
'@

$newPrevHeader = @'
      prevHdr.innerHTML = `
        <div class="section-title-block">
          <div class="section-main-title">
            <span style="vertical-align:middle; margin-right:4px; font-size:18px;">📡</span>
            <span style="vertical-align:middle;">Previous Lives</span>
          </div>
          <div class="section-subtitle">Catch up on what you missed</div>
        </div>`;
'@

if ($content.Contains($oldPrevHeader)) {
    $content = $content.Replace($oldPrevHeader, $newPrevHeader)
    Write-Host "Previous Lives section header updated"
} else {
    Write-Host "WARNING: Previous Lives header not found"
}

[System.IO.File]::WriteAllText('index.html', $content, [System.Text.Encoding]::UTF8)
Write-Host "All JS rendering updates applied. File size: $((Get-Item 'index.html').Length) bytes"
