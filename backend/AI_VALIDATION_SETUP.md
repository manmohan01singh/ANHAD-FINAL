# Sadhsangat Live - AI Channel Validation System

## Complete Setup Guide

This document explains the complete AI-powered channel validation system for Sadhsangat Live, designed to automatically reject non-spiritual/entertainment channels while approving genuine devotional content.

---

## 1. OVERVIEW

The validation system uses a **hybrid approach**:

1. **Instant Rejection List** - Obvious entertainment channels rejected immediately (no AI call needed)
2. **AI Analysis** - Groq API (Llama 3.3 70B) analyzes borderline cases
3. **Final Safety Check** - If AI approves, verifies channel actually has spiritual keywords

**Philosophy:** Default to REJECT. Only approve if clear spiritual content is detected.

---

## 2. INSTANT REJECTION KEYWORDS

These channels are rejected instantly without AI analysis:

### Music Labels
- t-series, zee music, yrf, tips music, speed records, ptc, zee

### TV Channels (Entertainment)
- set india, sony tv, sony liv, sony entertainment
- star plus, star sports, star movies, hotstar
- colors tv, colors infinity, viacom18
- zee tv, zee punjabi, zee cinema, z5
- ndtv, aaj tak, abp news, news18
- mtv, vh1, comedy central
- disney+, disney channel, hbo, netflix, amazon prime

### Entertainment Shows/Franchises
- indian idol, bigg boss, dance, dancer, idol
- comedy, laughs, circus, reality show

### Broad Categories
- entertainment, news, politics, sports, cricket
- movies, cinema, film, bollywood, hollywood

### Music/Entertainment Keywords
- songs, music video, official video, latest song
- album, track, remix, cover song
- pop star, celebrity, actor, actress, model

---

## 3. AI VALIDATION PROMPT

The AI (Llama 3.3 70B) is instructed to:

### APPROVE If:
- Channel is CLEARLY religious/devotional
- Contains: Gurbani, Kirtan, Shabad, Nitnem, Japji, Rehraas, Sukhmani, Simran, Naam
- Contains: Waheguru, Satnam, Mool Mantar, Ardas, Hukamnama
- Contains: Gurdwara, Harmandir, Darbar, Amrit Vela, Prabhat Pheri
- Contains: Sikh, Guru, Granth Sahib
- ANY Hindu/Buddhist/Christian/Islamic devotional content
- Contains: Bhajan, Aarti, Kirtan, Satsang

### REJECT If:
- PUNJABI SINGERS: Karan Aujla, Diljit Dosanjh, Jazzy B, Sidhu Moose Wala, etc.
- MUSIC ARTISTS: Any singer/musician/band without religious context
- MUSIC LABELS: T-Series, Zee Music, YRF, Tips Music, Speed Records
- ENTERTAINMENT: Comedy, fashion, lifestyle, vlogs, gaming
- SPORTS: Cricket, football, WWE, boxing
- POLITICS: Political channels, news
- TECHNOLOGY: Tech reviews, unboxing
- EDUCATION (non-spiritual): Science, math, coding tutorials

### Decision Logic:
1. Analyze channel NAME first
2. If name is a famous Punjabi singer/musician → REJECT
3. If name has religious keywords → APPROVE
4. If uncertain, analyze video titles for context
5. If videos are about songs/movies/entertainment → REJECT
6. If videos are about Kirtan/Gurbani → APPROVE
7. DEFAULT: REJECT if no clear religious content

---

## 4. FINAL SAFETY CHECK

Even if AI approves, the system performs a final verification:

```javascript
// Check if channel has ANY spiritual keyword in name or videos
const spiritualKeywords = ['gurbani', 'kirtan', 'shabad', 'nitnem', 'japji', 'simran', 
                          'waheguru', 'gurdwara', 'harmandir', 'darbar', 'amrit', 
                          'amrit vela', 'prabhat', 'sikh', 'guru', 'granth', 
                          'religious', 'devotional', 'bhajan', 'aarti', 'satsang'];

// If NO spiritual keywords found → Override AI and REJECT
if (!hasKeywordInName && !hasKeywordInVideos) {
    REJECT - "No spiritual content detected"
}
```

**This prevents AI from mistakenly approving entertainment channels.**

---

## 5. GROQ API CONFIGURATION

### API Key Setup

1. Get a free API key from: https://console.groq.com/
2. Add to `backend/server.js`:

```javascript
const CONFIG = {
    GROQ_API_KEY: 'your-groq-api-key-here',
    GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions'
};
```

### API Endpoint

The validation endpoint is:
```
POST /api/sadhsangat/validate-channel
Content-Type: application/json

{
    "channelName": "Channel Name",
    "channelId": "UC...",
    "channelHandle": "@channel"
}
```

Response:
```json
{
    "isValid": true/false,
    "reason": "Explanation",
    "category": "gurbani/sikh/hindu/devotional/music/singer/entertainment/other",
    "fromCache": false
}
```

---

## 6. VALIDATION FLOW

```
User searches for channel
    ↓
User clicks "Add" button
    ↓
[FRONTEND] Calls /api/sadhsangat/validate-channel
    ↓
[BACKEND] Check instant rejection keywords
    ↓ [Match found]
    → REJECT immediately with reason
    ↓ [No match]
    ↓
[BACKEND] Fetch channel videos (first 5 titles)
    ↓
[BACKEND] Check channel description
    ↓
[BACKEND] Call Groq AI API with:
    - Channel name
    - Video titles
    - Channel description
    ↓
[AI] Analyzes and returns decision
    ↓
[BACKEND] If AI APPROVED:
    → Check if channel has spiritual keywords
    → If NO keywords → Override to REJECT
    → If YES keywords → Keep APPROVAL
    ↓
[BACKEND] Cache result (5 minutes)
    ↓
[BACKEND] Return result to frontend
    ↓
[FRONTEND] If REJECTED:
    → Show toast error message
    → Keep "Add" button enabled
    ↓ [APPROVED]
    → Call /api/sadhsangat/my-channels to add
    → Show success message
    → Change button to "Monitored"
```

---

## 7. CACHING

Validation results are cached for 5 minutes to:
- Reduce API calls (save costs)
- Improve response time
- Prevent spam requests

Cache key: `{channelName}:{channelId}`

---

## 8. FRONTEND INTEGRATION

The frontend (`index.html`) calls validation before adding:

```javascript
btn.addEventListener('click', async () => {
    console.log('[AI Validation] User clicked Add for channel:', ch.channelName);
    btn.disabled = true;
    btn.textContent = '...';
    
    try {
        console.log('[AI Validation] Calling validation API...');
        const validateRes = await fetch('/api/sadhsangat/validate-channel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channelName: ch.channelName,
                channelId: ch.channelId,
                channelHandle: ch.channelHandle
            })
        });
        
        const validateData = await validateRes.json();
        console.log('[AI Validation] Validation result:', validateData);
        
        if (!validateData.isValid) {
            console.log('[AI Validation] Channel REJECTED:', validateData.reason);
            showToast(`⚠️ ${validateData.reason}`);
            btn.disabled = false;
            btn.textContent = 'Add';
            return;
        }
        
        // If approved, add channel
        const addRes = await fetchWithUser('/api/sadhsangat/my-channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handle: ch.channelHandle || ch.channelId, channelId: ch.channelId })
        });
        
        showToast(`✅ Added ${ch.channelName}`);
        btn.className = 'search-result-action-btn monitored';
        btn.disabled = true;
        btn.textContent = 'Monitored';
        
    } catch (err) {
        showToast('⚠️ ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Add';
    }
});
```

---

## 9. TESTING

### Should REJECT (Instant):
- SET India → "set india" in rejection list
- T-Series → "t-series" in rejection list
- Indian Idol → "indian idol" in rejection list
- Sony TV → "sony tv" in rejection list

### Should REJECT (AI Detection):
- Karan Aujla → AI recognizes as Punjabi singer
- Diljit Dosanjh → AI recognizes as Punjabi singer
- Comedy channel → AI analyzes video titles
- Fashion channel → AI analyzes content

### Should APPROVE:
- Gurbani Kirtan → Has "kirtan" keyword
- Amritavela Trust → Has "amrit" keyword
- SGPC Sri Amritsar → Has "sikh" and "gurdwara" context
- Fateh TV - Gurbani → Has "gurbani" keyword
- Premanand Ji → AI recognizes as Hindu devotional

---

## 10. RESTART SERVER

After any changes to `server.js`, restart the backend:

```bash
# Stop server (Ctrl+C)
cd C:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\backend
node server.js
```

Then refresh browser (F5).

---

## 11. TROUBLESHOOTING

### Channel approved but shouldn't be?
1. Check backend console logs for validation details
2. Verify rejection keywords list
3. Check if AI is being called (look for API logs)
4. Check final safety check - does channel have spiritual keywords?

### API errors?
1. Verify Groq API key is correct
2. Check Groq API quota (free tier available)
3. Check network connectivity

### Caching issues?
- Cache expires after 5 minutes automatically
- To clear cache manually: Restart server

---

## 12. COST OPTIMIZATION

Groq API free tier: Very generous limits
- Llama 3.3 70B: Fast, high-quality
- Cost: Free for personal use
- Caching reduces API calls significantly

---

## 13. FUTURE IMPROVEMENTS

Potential enhancements:
1. User whitelist/override (for edge cases)
2. Category-specific validation (different rules per category)
3. Admin dashboard to review rejected channels
4. Machine learning model trained on user approvals/rejections

---

## 14. SUMMARY

This system provides:
- ✅ Instant rejection of obvious entertainment (no AI cost)
- ✅ AI-powered intelligent detection for borderline cases
- ✅ Final safety check to prevent false approvals
- ✅ Caching for performance and cost optimization
- ✅ Detailed logging for debugging
- ✅ User-friendly error messages

**Result:** A robust, intelligent system that protects the spiritual nature of Sadhsangat Live while being flexible enough to approve legitimate devotional content from any religion.

---

Generated by Devin AI Assistant
Date: 2025-06-14
