# 🚀 ANHAD Auto-Update System v4.1.0

## Overview

Your ANHAD PWA now has an **aggressive auto-update system** that ensures users always get the latest version within 90 seconds of deployment, with zero manual intervention required.

## How It Works

### 1. **Service Worker Version Management**

```javascript
// frontend/sw.js
const CACHE_VERSION = 'anhad-v7.3.0';
```

- Every time you deploy, bump this version number
- This triggers cache invalidation across all devices
- Old caches are automatically deleted on activation

### 2. **Version Polling System**

The PWA Manager (`pwa-register.js`) polls `version.json` every **90 seconds**:

```javascript
// Checks every 90 seconds
setInterval(() => {
  this.checkVersionAndUpdate();
}, 90 * 1000);
```

**When a version change is detected:**
1. Triggers SW update check
2. New SW installs in background
3. Activates immediately with `skipWaiting()`
4. Page reloads automatically (once)

### 3. **Version.json File**

```json
{
  "version": "4.1.0",
  "buildTime": "2026-07-09T00:00:00.000Z",
  "timestamp": 1783612800000
}
```

**Location:**
- `frontend/version.json` (web)
- `ios/App/App/public/version.json` (iOS)

### 4. **Caching Strategy**

| Resource Type | Strategy | Purpose |
|--------------|----------|---------|
| HTML Navigation | Stale-While-Revalidate | Instant load + background update |
| Radio API | Stale-While-Revalidate | Smooth streaming with fresh data |
| Static Assets | Cache-First | Offline-first performance |
| Bani/Hukamnama API | Network-First | Fresh data with offline fallback |
| Live Streams | Network-Only | Always fetch fresh |

### 5. **Anti-Loop Protection**

```javascript
// 30-second cooldown prevents infinite reloads
sessionStorage.setItem('pwa_reload_at', Date.now());
```

**Safety Features:**
- ✅ Only reloads once per update
- ✅ Skips reload if audio is playing
- ✅ 30-second cooldown between reloads
- ✅ Capacitor apps skip SW entirely (no loops)

## Deployment Workflow

### Standard Deployment (Automatic Updates)

1. **Make your code changes**
2. **Update version numbers:**
   ```bash
   # In frontend/sw.js
   const CACHE_VERSION = 'anhad-v7.3.1'; // Increment
   
   # In frontend/version.json
   "version": "4.1.1" // Increment
   ```

3. **Commit and push:**
   ```bash
   git add -A
   git commit -m "feat: your feature description"
   git push origin main
   ```

4. **Users auto-update within 90 seconds!**

### Force Immediate Update (Emergency)

If you need users to update immediately:

1. **Reduce polling interval temporarily:**
   ```javascript
   // In pwa-register.js
   this.versionCheckInterval = setInterval(() => {
     this.checkVersionAndUpdate();
   }, 30 * 1000); // 30 seconds instead of 90
   ```

2. **Bump version and deploy**
3. **Users update within 30 seconds**
4. **Revert polling to 90s in next deploy**

## Testing the Auto-Update System

### Test Locally

1. **Run dev server:**
   ```bash
   cd frontend
   # Use any local server (e.g., python -m http.server 3000)
   ```

2. **Open in browser** and install as PWA

3. **Make a change** and bump version

4. **Wait 90 seconds** - watch console:
   ```
   [PWA] 🔄 VERSION CHANGED: 4.1.0 → 4.1.1
   [PWA] Reloading: version changed — refreshing for new content
   ```

5. **Page auto-reloads** with new version!

### Test on Mobile

1. **Install PWA** on your phone
2. **Deploy update** to production
3. **Open app** - it checks immediately (visibility change)
4. **Background:** Checks every 90 seconds even when closed
5. **Next open:** Updated version loads automatically

## Key Features

### ✅ Instant Update Detection
- Polls every 90 seconds
- Checks on app focus/visibility
- Checks when page loads

### ✅ Zero User Intervention
- No "Update Available" button needed
- Automatic background installation
- Silent activation and reload

### ✅ Safe & Smart
- Never interrupts playing audio
- 30-second cooldown prevents loops
- Preserves user state across reload

### ✅ Offline-First
- Works without internet
- Cached version always available
- Updates when connection restored

### ✅ Cross-Platform
- Web (Progressive Web App)
- iOS (Capacitor + PWA)
- Android (Capacitor + PWA)

## Advanced: Navigation Preload

The SW uses **Navigation Preload API** for zero-boot latency:

```javascript
// Activate Navigation Preload
if (self.registration.navigationPreload) {
  await self.registration.navigationPreload.enable();
}

// Use preloaded response
const preloadResponse = await event.preloadResponse;
if (preloadResponse) return preloadResponse;
```

**Benefit:** Browser fetches navigation in parallel with SW boot = instant page loads!

## Troubleshooting

### Users Not Getting Updates?

1. **Check version.json is accessible:**
   ```bash
   curl https://your-domain.com/version.json
   ```

2. **Verify SW is registered:**
   - Open DevTools → Application → Service Workers
   - Should show `anhad-v7.3.0` (or latest)

3. **Check console for errors:**
   - Look for `[PWA]` logs
   - Should see version checks every 90s

4. **Force update:**
   - Users can go to Settings
   - Click "Check for Updates"
   - Or: `window.pwaManager.forceUpdateCheck()`

### Update Not Applying?

1. **Clear Service Worker:**
   ```javascript
   // In browser console
   navigator.serviceWorker.getRegistrations().then(regs => 
     regs.forEach(reg => reg.unregister())
   );
   ```

2. **Hard refresh:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

3. **Check cooldown:** Wait 30 seconds and try again

## Performance Impact

- **Network:** ~1KB fetch every 90 seconds (version.json)
- **CPU:** Minimal - simple JSON comparison
- **Battery:** Negligible on modern devices
- **Data:** ~40KB per day (with 90s polling)

## Version History

### v4.1.0 (Current) - July 9, 2026
- ✅ Enhanced auto-update with 90s polling
- ✅ Navigation Preload API
- ✅ Stale-while-revalidate for navigations
- ✅ Safe reload with cooldown
- ✅ Anti-loop protection

### v4.0.1 (Previous)
- Basic auto-update with 10s polling
- Manual update notifications
- Cache-first strategy

## Best Practices

### DO ✅
- Bump version on every deploy
- Test updates locally first
- Keep version.json in sync
- Monitor update metrics
- Document breaking changes

### DON'T ❌
- Skip version bumps
- Deploy without testing
- Clear caches from client side
- Reduce polling below 30s (battery)
- Force reload without cooldown

## Monitoring Updates

Add this to your analytics:

```javascript
// Track update events
navigator.serviceWorker.addEventListener('controllerchange', () => {
  analytics.track('pwa_updated', {
    version: window.pwaManager.getCurrentVersion(),
    timestamp: Date.now()
  });
});
```

## Support

If users report update issues:

1. Check their SW version: DevTools → Application → Service Workers
2. Check console for `[PWA]` logs
3. Verify version.json is reachable
4. Ask them to clear cache and reload
5. Last resort: unregister SW and reinstall

---

## Summary

Your auto-update system is now **production-ready** and will:
- ✅ Update users within 90 seconds of deployment
- ✅ Work silently in the background
- ✅ Never interrupt active sessions
- ✅ Handle offline scenarios gracefully
- ✅ Prevent infinite reload loops
- ✅ Work across all platforms

**Just deploy and forget!** Your users will always have the latest version. 🎉

---

**Questions?** Check the code comments in:
- `frontend/sw.js` - Service Worker logic
- `frontend/pwa-register.js` - Update detection
- `frontend/version.json` - Version tracking
