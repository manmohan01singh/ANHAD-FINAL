# Sehaj Paath Reader - Deployment Fix

## Problem
Sehaj Paath reader works on localhost but fails on deployed version (Render) with error:
"Failed to load Gurbani. Please check your connection and try again."

## Root Cause
1. **Browser Cache**: Old JavaScript files are cached, using outdated API code
2. **Backend Proxy Issue**: Old code tries to use `/api/banidb` which requires backend server
3. **Render Deployment**: Static files are cached by CDN/browser

## Solution Steps

### Step 1: Add Cache Busting to HTML
Update the script tag to force browser to load new version:

```html
<!-- OLD -->
<script src="services/banidb-api.js"></script>

<!-- NEW - Add version parameter -->
<script src="services/banidb-api.js?v=2.0"></script>
```

### Step 2: Clear Browser Cache
Users need to hard refresh:
- **Windows/Linux**: Ctrl + Shift + R or Ctrl + F5
- **Mac**: Cmd + Shift + R
- **Mobile**: Clear browser cache in settings

### Step 3: Verify Deployment
1. Check that new `banidb-api.js` is deployed to Render
2. Open browser DevTools → Network tab
3. Look for `banidb-api.js?v=2.0` request
4. Verify it's loading the new version (check file size/content)

### Step 4: Test API Directly
Open browser console and test:
```javascript
fetch('https://api.banidb.com/v2/angs/1/G')
  .then(r => r.json())
  .then(d => console.log('API works:', d))
  .catch(e => console.error('API failed:', e))
```

## Files to Deploy

### Modified Files:
1. `frontend/SehajPaath/services/banidb-api.js` - New direct API version
2. `frontend/SehajPaath/reader.html` - Add cache busting
3. `frontend/SehajPaath/reader.js` - Better error handling
4. `frontend/SehajPaath/reader-error-fix.css` - Improved error UI

## Deployment Checklist

- [ ] Deploy all modified files to Render
- [ ] Add version parameter to script tags
- [ ] Clear CDN cache (if using Cloudflare/similar)
- [ ] Test on deployed URL
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check browser console for errors
- [ ] Verify API calls go to `api.banidb.com` not `/api/banidb`

## Troubleshooting

### If still not working:

1. **Check Console Errors**
   - Open DevTools (F12)
   - Look for red errors
   - Check Network tab for failed requests

2. **Verify File Version**
   - View source of deployed page
   - Check if script has `?v=2.0` parameter
   - Verify file content matches local version

3. **Test API Endpoint**
   ```bash
   curl https://api.banidb.com/v2/angs/1/G
   ```
   Should return JSON data

4. **Check CORS**
   - BaniDB API should support CORS
   - If blocked, check browser console for CORS errors

5. **Backend Server**
   - If using backend proxy, ensure Render backend is running
   - Check backend logs for errors
   - Verify `/api/banidb` endpoint exists

## Quick Fix for Users

If users report the issue, tell them to:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Try incognito/private mode
4. If still fails, check internet connection

## Prevention

To prevent cache issues in future:
1. Always use version parameters: `?v=X.X`
2. Set proper cache headers on server
3. Use service worker cache invalidation
4. Document deployment process

## Success Criteria

✅ Reader loads without errors
✅ Ang content displays correctly
✅ Console shows: "✅ BaniDB Response received"
✅ No 404 or 500 errors in Network tab
✅ Works on both localhost and deployed version
