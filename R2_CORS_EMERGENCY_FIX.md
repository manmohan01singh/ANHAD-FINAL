# 🚨 R2 CORS EMERGENCY FIX

## PROBLEM
All audio playback is broken due to CORS policy blocking R2 requests.

**Error:**
```
Access to audio at 'https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev/...' 
from origin 'https://localhost' has been blocked by CORS policy
```

---

## ✅ SOLUTION 1: Fix R2 CORS (PERMANENT - DO THIS FIRST)

### Step 1: Log into Cloudflare Dashboard
1. Go to https://dash.cloudflare.com
2. Navigate to **R2** → **Buckets**
3. Click on bucket: `pub-8bf31fc1f2a44451b40a3ded7e07fac2`

### Step 2: Configure CORS
1. Click **Settings** tab
2. Scroll to **CORS Policy**
3. Click **Add CORS Policy**
4. Paste this configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://localhost",
      "capacitor://localhost",  
      "http://localhost",
      "https://anhad-final.onrender.com",
      "https://www.anhadapp.com",
      "*"
    ],
    "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [
      "Content-Length",
      "Content-Range",
      "Accept-Ranges"
    ],
    "MaxAgeSeconds": 86400
  }
]
```

### Step 3: Save & Test
1. Click **Save**
2. Wait 2-3 minutes for propagation
3. Test audio playback in app

---

## ✅ SOLUTION 2: Use Your Backend Proxy (TEMPORARY)

If you can't access R2 dashboard immediately, route audio through your backend.

### Backend Route (Already exists?)

Check if your backend at `anhad-final.onrender.com` has a proxy route:

**File:** `backend/server.js`

Add this route if it doesn't exist:

```javascript
// R2 Audio Proxy - CORS workaround
app.get('/api/proxy/audio/*', async (req, res) => {
  try {
    const audioPath = req.params[0];
    const r2Url = `https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev/${audioPath}`;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Fetch from R2 and stream
    const response = await fetch(r2Url, {
      headers: {
        'Range': req.headers.range || ''
      }
    });
    
    // Copy headers
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Stream audio
    response.body.pipe(res);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed' });
  }
});
```

### Update Audio URLs in Frontend

**File:** `frontend/lib/anhad-audio-singleton.js`

Find the R2 URL and add proxy prefix:

```javascript
// OLD (BROKEN):
const audioUrl = `https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev/waheguru/${filename}`;

// NEW (PROXIED):
const USE_PROXY = true; // Set to false once R2 CORS is fixed
const audioUrl = USE_PROXY 
  ? `https://anhad-final.onrender.com/api/proxy/audio/waheguru/${filename}`
  : `https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev/waheguru/${filename}`;
```

---

## ✅ SOLUTION 3: Alternative CDN (NUCLEAR OPTION)

If R2 continues to have issues, migrate audio to:

1. **Cloudflare Workers** (with KV storage)
2. **Vercel Blob Storage**  
3. **AWS S3** with CloudFront
4. **Firebase Storage**

---

## 🧪 TEST CORS CONFIGURATION

Once CORS is configured, test with this command:

```bash
curl -I -X OPTIONS \
  -H "Origin: https://localhost" \
  -H "Access-Control-Request-Method: GET" \
  https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev/waheguru/01%20-%20DEENANATH%20SUNO%20WAHEGURU%20SIMRAN%20DAY%201.mp3
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: *
```

---

## 📋 VERIFICATION CHECKLIST

- [ ] R2 CORS policy configured
- [ ] Waited 2-3 minutes for propagation
- [ ] Tested with curl command above
- [ ] Tested Gurbani Radio in app
- [ ] Tested Sadhsangat player
- [ ] Tested Simran playlist
- [ ] No CORS errors in console
- [ ] Audio plays without crashes

---

## 🚨 URGENT ACTIONS

### Priority 1: Fix R2 CORS (5 minutes)
1. Log into Cloudflare Dashboard
2. Navigate to R2 bucket settings
3. Add CORS policy (use config above)
4. Save and wait

### Priority 2: Rebuild & Test (10 minutes)
```bash
cd ANHAD-FINAL
npx cap sync android
cd android
.\gradlew installRelease
```

### Priority 3: Verify All Audio Sources
- ✅ Darbar Sahib Live (YouTube)
- ⚠️ Simran Playlist (R2) - **BROKEN**
- ⚠️ Sadhsangat streams (R2) - **BROKEN**
- ⚠️ Amritvela tracks (R2) - **BROKEN**

---

## 📝 ROOT CAUSE ANALYSIS

**Why did this happen?**

1. R2 bucket created without CORS configuration
2. Web version likely works because it's same-origin
3. Capacitor uses `https://localhost` origin
4. R2 blocks cross-origin requests by default
5. Android WebView enforces CORS strictly

**Why now?**

- Likely worked before due to mixed content allowing
- Android 16 (API 36) enforces stricter security
- Or R2 CORS was accidentally removed

---

## 💡 PREVENTION

Add to your deployment checklist:

```markdown
## Audio Storage CORS Checklist
- [ ] Verify R2 CORS allows capacitor://localhost
- [ ] Verify R2 CORS allows https://localhost  
- [ ] Test audio playback on Android
- [ ] Test audio playback on iOS
- [ ] Check browser console for CORS errors
```

---

**DO THIS NOW:** Configure R2 CORS in Cloudflare Dashboard!

Without this fix, **ALL offline audio playback is broken**.
