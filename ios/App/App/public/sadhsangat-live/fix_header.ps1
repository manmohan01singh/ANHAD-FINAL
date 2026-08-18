$content = [System.IO.File]::ReadAllText('index.html', [System.Text.Encoding]::UTF8)

# Fix the malformed header - replace the broken header section
$oldHeader = @'
    <header class="header">
      <button class="hdr-menu-btn" id="openDrawerBtn" title="Navigation Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      
      <a href="#" class="hdr-logo-area" id="logoLink">
        <div class="hdr-logo-icon">
          <img src="../assets/app-logo-384.avif" alt="ANHAD Logo" class="app-logo" style="width: 32px; height: 32px; border-radius: 8px;">
        </div>
        <div class="hdr-logo-text">
          <span style="font-family:'Cinzel Decorative', display; font-size:20px; font-weight:600;">Sadhsangat</span>
          </svg>
        </button>
      </div>
    </header>
'@

$newHeader = @'
    <header class="header">
      <button class="hdr-menu-btn" id="openDrawerBtn" title="Navigation Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      
      <a href="#" class="hdr-logo-area" id="logoLink" style="gap:7px; text-decoration:none;">
        <div class="hdr-logo-icon">
          <img src="../assets/app-logo-384.avif" alt="ANHAD Logo" class="app-logo" style="width:30px; height:30px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.15);">
        </div>
        <div class="hdr-logo-text" style="display:flex; align-items:center; gap:3px;">
          <span style="font-family:'Noto Sans Gurmukhi',sans-serif; font-size:17px; font-weight:700; color:var(--gold-accent); -webkit-text-fill-color:var(--gold-accent); filter:drop-shadow(0 0 5px rgba(255,179,0,0.4));">&#x0A74;</span>
          <span style="font-family:'Cinzel Decorative',display; font-size:17px; font-weight:700; letter-spacing:-0.5px;">Sadhsangat</span>
        </div>
      </a>
      
      <div class="hdr-actions">
        <button class="hdr-action-btn-circle" id="openSearchBtn" title="Search Channel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        
        <button class="hdr-action-btn-circle" id="openNotifBtn" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span class="hdr-notif-badge" id="notifBadge">2</span>
        </button>
        
        <button class="hdr-action-btn-circle" id="bgPlayBtn" title="Background Play">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="16" height="16" rx="2"/><line x1="2" y1="10" x2="18" y2="10"/><line x1="7" y1="15" x2="7" y2="15.01"/><line x1="11" y1="15" x2="13" y2="15"/>
          </svg>
        </button>
      </div>
    </header>
'@

$content = $content.Replace($oldHeader, $newHeader)
[System.IO.File]::WriteAllText('index.html', $content, [System.Text.Encoding]::UTF8)
Write-Host "Header fixed. File size: $((Get-Item 'index.html').Length) bytes"
