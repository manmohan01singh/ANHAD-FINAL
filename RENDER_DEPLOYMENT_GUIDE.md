# Render Deployment Guide for ANHAD Backend

## Prerequisites
- GitHub repository with your code
- Render account (free tier works)
- Vercel deployment for frontend (already done)

## Step 1: Prepare Backend for Deployment

### ✅ Already Fixed:
1. Removed Windows-specific hardcoded paths
2. Added environment variable support
3. Updated CORS configuration
4. Made paths relative and cross-platform

### Verify package.json

Make sure `backend/package.json` has the correct start script:

```json
{
  "name": "anhad-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.0.3",
    "express-rate-limit": "^6.7.0"
  }
}
```

## Step 2: Create Render Web Service

1. Go to https://render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

### Basic Settings:
- **Name**: `anhad-backend` (or your choice)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Instance Type:
- **Free** tier is sufficient for testing
- Upgrade to **Starter** ($7/month) for production (no sleep, better performance)

## Step 3: Configure Environment Variables

In Render dashboard, go to "Environment" tab and add:

### Required Variables:

```
NODE_ENV=production
PORT=3000
```

### CORS Configuration (CRITICAL):

```
ALLOWED_ORIGINS=https://anhadnaam.vercel.app,capacitor://localhost,ionic://localhost
```

**Important**: Replace `anhadnaam.vercel.app` with your actual Vercel domain!

### Optional Variables (use defaults if not set):

```
R2_BASE_URL=https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev
DEFAULT_TRACK_DURATION=3600
LISTENER_TTL=60000
STATE_SAVE_INTERVAL=30000
```

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Run `npm install`
   - Start the server with `npm start`
3. Wait for deployment to complete (2-5 minutes)

## Step 5: Get Your Backend URL

After deployment, Render will give you a URL like:
```
https://anhad-backend.onrender.com
```

## Step 6: Update Frontend Configuration

Update your frontend to use the new Render backend URL.

### In `frontend/lib/persistent-audio.js`:

Find the `PA_API_BASE` constant and update the fallback:

```javascript
const PA_API_BASE = (() => {
    try {
        const port = window.location.port;
        const host = window.location.hostname;
        if (port === '3000' || port === '3001') return 'http://localhost:3000';
        if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
        if (host.match(/^[0-9]+(\.[0-9]+){3}$/)) return `http://${host}:3000`;
    } catch (e) {}
    return 'https://anhad-backend.onrender.com'; // ← Update this!
})();
```

### In `frontend/lib/global-mini-player.js`:

Find the `API_BASE` constant and update:

```javascript
const API_BASE = (() => {
    try {
        const host = window.location.hostname;
        const port = window.location.port;
        if (port === '3000' || port === '3001') return '';
        if (host.match(/^[0-9]+(\.[0-9]+){3}$/)) return `http://${host}:3000`;
        return 'https://anhad-backend.onrender.com'; // ← Update this!
    } catch(e){}
    return 'https://anhad-backend.onrender.com'; // ← Update this!
})();
```

## Step 7: Test the Deployment

### Test API Endpoints:

1. **Health Check**:
   ```
   https://anhad-backend.onrender.com/api/radio/status
   ```
   Should return JSON with broadcast status

2. **Live Position**:
   ```
   https://anhad-backend.onrender.com/api/radio/live
   ```
   Should return current track and position

3. **Audio Proxy**:
   ```
   https://anhad-backend.onrender.com/audio/day-1.webm
   ```
   Should stream audio file

### Test from Frontend:

1. Deploy updated frontend to Vercel
2. Open your site: `https://anhadnaam.vercel.app`
3. Try playing Amritvela Kirtan
4. Check browser console for errors
5. Verify audio plays and syncs correctly

## Step 8: Monitor and Debug

### View Logs:
- Go to Render dashboard → Your service → "Logs" tab
- Watch for errors or issues

### Common Issues:

#### Issue: CORS Errors
**Solution**: Make sure `ALLOWED_ORIGINS` includes your Vercel domain

#### Issue: Audio Not Playing
**Solution**: Check that R2_BASE_URL is correct and audio files are accessible

#### Issue: Service Sleeps (Free Tier)
**Solution**: 
- Free tier sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- Upgrade to Starter plan ($7/month) to prevent sleeping

#### Issue: 503 Errors
**Solution**: Service might be starting up or crashed. Check logs.

## Step 9: Persistent Data

### Radio State File:
- Render's filesystem is ephemeral (resets on deploy)
- `radio-state.json` will be recreated on each deploy
- This is OK - the epoch will reset but sync will still work

### Sehaj Paath Progress:
- User progress is stored in `data/sehaj-progress/` directory
- This will be lost on redeploy
- For production, consider using:
  - Render Persistent Disks (paid feature)
  - External database (MongoDB, PostgreSQL)
  - Cloud storage (S3, R2)

## Step 10: Production Checklist

- [ ] Backend deployed to Render
- [ ] Environment variables configured
- [ ] CORS allows your Vercel domain
- [ ] Frontend updated with Render backend URL
- [ ] Frontend redeployed to Vercel
- [ ] Amritvela Kirtan plays correctly
- [ ] Darbar Sahib Live plays correctly
- [ ] Only one audio plays at a time (mutual exclusion)
- [ ] Audio syncs across devices
- [ ] Logs show no errors

## Render Free Tier Limitations

- **Sleep after 15 min inactivity**: First request takes 30-60s to wake
- **750 hours/month**: Enough for testing, not 24/7 uptime
- **Ephemeral filesystem**: Data lost on redeploy
- **Shared CPU**: Performance may vary

## Upgrade to Starter Plan ($7/month) for:

- ✅ No sleep - always on
- ✅ Better performance
- ✅ More consistent response times
- ✅ 24/7 uptime for radio station

## Support

If you encounter issues:
1. Check Render logs for errors
2. Verify environment variables
3. Test API endpoints directly
4. Check browser console for CORS errors
5. Ensure frontend has correct backend URL
