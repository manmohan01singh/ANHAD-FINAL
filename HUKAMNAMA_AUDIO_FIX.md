# Hukamnama Audio Fix - Deployed Version

## Problem
The Hukamnama audio player was not working in the deployed version because the API base URL resolution logic was incomplete and missing proper error handling and Capacitor app detection.

## Root Cause
The `getUrls()` function in the HukamPlayer was using a simplified logic that didn't handle Capacitor apps or include proper error handling. It was different from the more robust logic used in the main `anhad-audio-singleton.js`.

## Solution Applied

### 1. Updated API Base Resolution (All 4 files)
Updated the `getUrls()` method in these files:
- `frontend/Hukamnama/daily-hukamnama.js`
- `frontend/js/daily-hukamnama.js`
- `ios/App/App/public/Hukamnama/daily-hukamnama.js`
- `ios/App/App/public/js/daily-hukamnama.js`

**Changes:**
```javascript
// OLD - Missing Capacitor detection and error handling
let apiBase;
if (port === '3000' || port === '3001') {
    apiBase = '';
} else if (host === 'localhost' || host === '127.0.0.1') {
    apiBase = 'http://localhost:3000';
} else if (host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    apiBase = `http://${host}:3000`;
} else {
    apiBase = 'https://anhad-final.onrender.com';
}

// NEW - With Capacitor detection and error handling
let apiBase;
try {
    // Capacitor app detection
    if (window.Capacitor) {
        apiBase = 'https://anhad-final.onrender.com';
    } else if (port === '3000' || port === '3001') {
        apiBase = '';
    } else if (host === 'localhost' || host === '127.0.0.1') {
        apiBase = 'http://localhost:3000';
    } else if (host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        apiBase = `http://${host}:3000`;
    } else {
        apiBase = 'https://anhad-final.onrender.com';
    }
} catch (e) {
    apiBase = 'https://anhad-final.onrender.com';
}
```

### 2. Enhanced Debug Logging
Added comprehensive logging to track URL attempts:
- Logs all URLs being tried at the start
- Logs each individual URL attempt
- Logs success or failure for each URL with clear ✅/❌ indicators

## How It Works

The audio player now tries multiple URL sources in order:

1. **Backend proxy** - `${apiBase}/api/hukamnama/audio` (bypasses CORS, most reliable)
2. **SGPC dated URL** - `https://www.sgpc.net/hukamnama/YYYY/MM/DD/hukamnama.mp3`
3. **SGPC fallback URL** - `https://www.sgpc.net/hukamnama/hukamnama.mp3`

The backend proxy at `/api/hukamnama/audio` (in `backend/server.js`):
- Scrapes the SGPC page to get the real audio URL
- Caches the URL for 15 minutes
- Streams the audio directly to bypass CORS issues
- Handles errors gracefully with fallback URLs

## Testing Instructions

### Testing Locally
1. Start the backend: `cd backend && node server.js`
2. Start the frontend: `cd frontend && npx http-server -p 3001`
3. Open: `http://localhost:3001/Hukamnama/daily-hukamnama.html`
4. Click the audio button (speaker icon) at the bottom
5. Check browser console for logs starting with `[HukamPlayer]`

### Testing Deployed Version
1. Deploy the updated files to your hosting service
2. Open the Hukamnama page: `https://your-domain.com/Hukamnama/daily-hukamnama.html`
3. Click the audio button
4. Open browser DevTools Console (F12) to see logs
5. Look for:
   - `[HukamPlayer] Starting audio with URLs:` - Shows which URLs will be tried
   - `[HukamPlayer] Attempting URL:` - Shows current attempt
   - `[HukamPlayer] ✅ Success with URL:` - Audio loaded successfully
   - `[HukamPlayer] ❌ URL failed, trying next:` - URL failed, trying fallback

### Expected Console Output (Success)
```
[HukamPlayer] Starting audio with URLs: (3) ['https://anhad-final.onrender.com/api/hukamnama/audio', 'https://www.sgpc.net/hukamnama/2026/07/10/hukamnama.mp3', 'https://www.sgpc.net/hukamnama/hukamnama.mp3']
[HukamPlayer] Attempting URL: https://anhad-final.onrender.com/api/hukamnama/audio
[HukamPlayer] ✅ Success with URL: https://anhad-final.onrender.com/api/hukamnama/audio
```

### Troubleshooting

#### If all URLs fail:
1. **Check backend status**: Ensure `https://anhad-final.onrender.com` is running
2. **Check backend endpoint**: Try `https://anhad-final.onrender.com/api/hukamnama/audio` in browser
3. **Check SGPC source**: Visit `https://sgpc.net/hukamnama-sahib/` to see if audio exists
4. **CORS issues**: The backend proxy should handle this, but check browser console for CORS errors

#### If backend proxy fails but SGPC direct URLs work:
- Backend server might be down or experiencing cold start delay (Render free tier)
- The fallback URLs will work as backup

#### For Capacitor/Mobile App:
- Ensure `window.Capacitor` is defined
- Check the logs to confirm it's using the correct backend URL
- Test audio permissions on the device

## Backend Server Check

The backend endpoint at `/api/hukamnama/audio` (lines 985-1043 in `backend/server.js`):
- Scrapes SGPC page for MP3 URL
- Caches result for 15 minutes
- Streams audio with proper headers
- Returns 502 error on failure

You can test it directly:
```bash
curl -I https://anhad-final.onrender.com/api/hukamnama/audio
```

Expected response:
```
HTTP/1.1 200 OK
Content-Type: audio/mpeg
Accept-Ranges: bytes
```

## Files Modified
1. ✅ `frontend/Hukamnama/daily-hukamnama.js`
2. ✅ `frontend/js/daily-hukamnama.js`
3. ✅ `ios/App/App/public/Hukamnama/daily-hukamnama.js`
4. ✅ `ios/App/App/public/js/daily-hukamnama.js`

## Next Steps
1. Test locally to confirm the fix works
2. Deploy updated files to production
3. Test in deployed environment
4. Check browser console logs for any remaining issues
5. If issues persist, share the console logs for further debugging
