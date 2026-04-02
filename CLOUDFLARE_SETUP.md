# Cloudflare Deployment Guide for ANHAD

## Overview
This guide sets up **zero-cost CDN + DDoS protection** in front of your Render backend using Cloudflare's free tier.

## Benefits
- **DDoS Protection**: Automatic mitigation of attacks
- **CDN Caching**: Faster global load times, reduced bandwidth on Render
- **SSL/TLS**: Free SSL certificates
- **Rate Limiting**: Enhanced with CF-Connecting-IP header (already configured in server.js)

## Setup Steps

### 1. Sign Up & Add Domain
1. Go to [cloudflare.com](https://cloudflare.com) and create a free account
2. Click "Add a Site" and enter your domain (e.g., `anhad.com`)
3. Select the **Free Plan**
4. Follow DNS scanning instructions

### 2. Update DNS Records
Replace your current A/CNAME records with Cloudflare proxy (orange cloud icon):

```
Type: CNAME
Name: api
Target: anhad-final.onrender.com
Proxy Status: Proxied (orange cloud)
TTL: Auto
```

For root domain:
```
Type: CNAME
Name: @
Target: anhad-final.onrender.com
Proxy Status: Proxied (orange cloud)
```

### 3. Update Frontend API Base URL
Change from Render direct to your Cloudflare-proxied domain:

```javascript
// frontend/js/config.js or wherever API_BASE is defined
const API_BASE = 'https://api.yourdomain.com';  // Cloudflare-proxied
// Instead of: 'https://anhad-final.onrender.com'
```

### 4. SSL/TLS Settings
In Cloudflare dashboard:
1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS**

### 5. Caching Configuration
1. Go to **Caching** → **Configuration**
2. Set **Browser Cache TTL**: 4 hours (for static assets)
3. Set **Edge Cache TTL**: 4 hours
4. Enable **Always Online**

### 6. Page Rules (Create 3 rules)

**Rule 1 - API Rate Limiting:**
- URL: `api.yourdomain.com/api/*`
- Settings:
  - Security Level: High
  - Browser Integrity Check: On
  - Disable Apps

**Rule 2 - Static Assets Cache:**
- URL: `yourdomain.com/*.js` and `yourdomain.com/*.css`
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month

**Rule 3 - Audio Files (R2 already handles these, but good for safety):**
- URL: `pub-525228169e0c44e38a67c306ba1a458c.r2.dev/*`
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 7 days

### 7. Security Settings
1. **Security** → **Bots**: Enable Bot Fight Mode
2. **Security** → **DDoS**: Default protection level
3. **Security** → **WAF**: Create rule to block threats score > 50

## Backend Changes (Already Done)

The backend server.js has been updated:

```javascript
// Rate limiting now uses CF-Connecting-IP for accurate client IP
keyGenerator: (req) => {
    return req.headers['cf-connecting-ip'] || 
           req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           req.ip;
}
```

## Verification

After setup, verify with:

```bash
# Check Cloudflare headers
curl -I https://api.yourdomain.com/api/radio/live

# Look for:
cf-cache-status: HIT|MISS
server: cloudflare
```

## Architecture

```
[User] → [Cloudflare CDN/DNS] → [Render Backend]
                ↓
         [R2 Audio CDN] (direct)
```

- **API calls**: Route through Cloudflare for protection
- **Audio streaming**: Direct to R2 (bypasses all proxies for zero-cost bandwidth)
- **Static assets**: Served via Cloudflare cache

## Monitoring

In Cloudflare dashboard:
- **Analytics**: Traffic, threats blocked, cache hit ratio
- **Security Events**: Blocked requests, challenge solves
- **Speed**: Performance metrics

## Free Tier Limits
- **Bandwidth**: Unlimited
- **Requests**: No hard limit (soft at ~1M/day)
- **DDoS**: Always on, unlimited
- **Page Rules**: 3 included (we use all 3)

## Next Steps

1. Point your actual domain to Cloudflare
2. Update frontend to use new API URL
3. Monitor analytics for first week
4. Consider Cloudflare Workers for edge functions if needed

## Troubleshooting

**Issue**: API returns 520/521 errors
**Fix**: Check SSL mode is "Full (strict)" in Cloudflare

**Issue**: Client IP shows Cloudflare IP
**Fix**: Already handled in server.js with `cf-connecting-ip` header

**Issue**: WebSocket not working
**Fix**: Cloudflare supports WebSockets on free plan - ensure your DNS is proxied
