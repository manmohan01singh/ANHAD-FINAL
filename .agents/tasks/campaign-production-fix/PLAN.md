# Campaign Production Fix — Root Cause Analysis & Implementation Plan

## Executive Summary

**Issue**: Campaign system not rendering on production (https://anhad-final.onrender.com)  
**Root Cause**: **MISSING DOM ELEMENTS** — The campaign renderer expects `#greetingAnnounce` and `#greetingAnnounceText` divs inside `#guruSlider` to exist, but they are **completely absent** from the HTML.

**Confidence Level**: 99% — Code reading confirms the renderer calls `document.getElementById('greetingAnnounce')` and `document.getElementById('greetingAnnounceText')` but these elements do not exist anywhere in `frontend/index.html`.

---

## Investigation Findings

### 1. Backend Analysis ✅ HEALTHY

**File**: `backend/server.js` (lines 533-658)  
**Config Store**: `backend/lib/config-store.js`  
**Status**: Backend code is correct and complete.

#### Default Campaign Configuration (Line 538-571)
```javascript
const DEFAULT_CAMPAIGNS = {
  campaigns: [
    {
      id: 'chaliya-amritvela-2026',
      active: false,  // ⚠️ DELIBERATELY OFF in DEFAULT_CAMPAIGNS
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.000Z',
      // ... content fields present
    }
  ]
};
```

**Finding**: The backend default has `active: false`. This is intentional per the inline comment at line 568: _"OFF, matching SAFE_BUILTIN_CONFIG in frontend/lib/remote-config.js. These two MUST be kept in sync."_

#### Config Storage Backend (config-store.js)
- **KV Backend**: Requires `CF_ACCOUNT_ID`, `CF_KV_NAMESPACE_ID`, `CF_API_TOKEN` environment variables
- **File Backend**: Falls back to `backend/data/campaign-config.json` if KV vars are missing
- **Render Free Tier Issue**: File backend is **ephemeral** on Render — any campaign toggle via admin UI is lost on restart
- **Current Production State**: Without KV credentials, production is using the **non-durable file backend**

#### API Endpoints ✅ ALL PRESENT
- `GET /api/config/campaigns` — Public endpoint (line 603)
- `GET /api/config/admin/campaigns` — Admin read (line 620)
- `PATCH /api/config/admin/campaigns/:id/active` — **The toggle endpoint** (line 640)

**Backend Verdict**: Code is correct. The `active: false` default is intentional. Admin can toggle it via the PATCH endpoint, but **the toggle will not survive a Render restart** without KV credentials.

---

### 2. Frontend Configuration ✅ HEALTHY

**File**: `frontend/lib/remote-config.js`  
**Status**: Remote config manager is correct and functional.

#### Built-in Fallback (Line 22-81)
```javascript
const SAFE_BUILTIN_CONFIG = {
  campaigns: [{
    id: 'chaliya-amritvela-2026',
    active: true,  // ON in the frontend built-in — DELIBERATE DIVERGENCE
    // ... full content including announce{} object
  }]
};
```

**Finding**: The frontend's built-in default has `active: true`, which is different from the backend's `active: false`. This is **by design** per the comment at line 50: _"The frontend's SAFE_BUILTIN_CONFIG is only a last-resort for a device that has never reached this server at all."_

#### Fetch & Caching Logic ✅ CORRECT
- 15-second polling when page visible (line 125)
- 1-hour localStorage cache (line 11)
- Falls back to built-in only when **never reached the server** (line 283-290)
- `getSource()` method returns `'remote' | 'cache' | 'builtin'` to distinguish authoritative vs fallback config

**Frontend Config Verdict**: Logic is correct. A device that successfully fetches from the server will respect `active: false` and **will not resurrect the campaign** from the built-in default.

---

### 3. Campaign Renderer 🔴 **BROKEN — ROOT CAUSE IDENTIFIED**

**File**: `frontend/js/campaign-renderer.js`  
**Status**: **MISSING REQUIRED DOM ELEMENTS**

#### What the Renderer Expects (Lines 97-101, 202-209)
```javascript
function artPane() { return document.getElementById('greetingAnnounce'); }
function textPane() { return document.getElementById('greetingAnnounceText'); }

function paint(campaign) {
  const art = artPane();
  const txt = textPane();
  if (!art || !txt) return false; // 🔴 FAILING HERE — elements don't exist
  // ... proceeds to set textContent on child elements
}
```

The renderer needs these elements **inside `#guruSlider`**:
1. `<div id="greetingAnnounce">` — The artwork pane (portrait disc with campaign badge)
2. `<div id="greetingAnnounceText">` — The text overlay pane
3. Child elements inside each:
   - `#greetingAnnounceBadge`
   - `#greetingAnnounceTitle`
   - `#greetingAnnounceLine`
   - `#greetingAnnounceSub`
   - `#greetingAnnouncePill`
   - `#greetingAnnounceImg`

#### What Actually Exists in index.html (Line 5596)
```html
<div class="greeting__portrait-slider" id="guruSlider" aria-label="Guru Portraits Carousel">
  <div class="greeting__slider-track" id="guruSliderTrack">
    <!-- 11 Guru portrait slides -->
  </div>
</div>
```

**Finding**: `#greetingAnnounce` and `#greetingAnnounceText` **DO NOT EXIST ANYWHERE** in the HTML. The campaign renderer's `paint()` function returns `false` on line 207, so the campaign **never renders**.

#### Renderer Behavior When Elements Are Missing
1. `update()` calls `resolveCampaign()` → gets active campaign ✅
2. `startRotation(campaign)` calls `paint(campaign)` ✅
3. `paint()` checks `if (!art || !txt) return false;` → **returns false** 🔴
4. Rotation timer never starts, campaign never shows

**Campaign Renderer Verdict**: The renderer is **correct** but cannot function because the required DOM structure is missing. The HTML needs to be fixed.

---

### 4. HTML Structure Analysis 🔴 **INCOMPLETE**

**File**: `frontend/index.html`

#### What Exists (Line 5590-5676)
- ✅ `#guruSlider` with 11 Guru portrait slides
- ✅ `#campaignMount` (line 5685) — but this is the **retired standalone card slot**, not used by the current renderer
- ✅ Greeting text div below the slider (line 5676)

#### What Is Missing 🔴
The campaign announcement divs that should be **siblings** of `#guruSliderTrack` inside `#guruSlider`:

```html
<!-- MISSING: These need to be added -->
<div id="greetingAnnounce" class="greeting__announce" hidden>
  <div class="greeting__announce-disc">
    <span class="greeting__announce-ik" aria-hidden="true">ੴ</span>
    <span id="greetingAnnounceBadge" class="greeting__announce-badge"></span>
  </div>
  <img id="greetingAnnounceImg" class="greeting__announce-img" 
       src="assets/companion/chaliya-2026.webp" alt="" loading="lazy">
</div>

<div id="greetingAnnounceText" class="greeting__announce-text" hidden>
  <div id="greetingAnnounceTitle" class="greeting__announce-title"></div>
  <div id="greetingAnnounceLine" class="greeting__announce-line"></div>
  <div id="greetingAnnounceSub" class="greeting__announce-sub"></div>
  <div id="greetingAnnouncePill" class="greeting__announce-pill"></div>
</div>
```

**HTML Structure Verdict**: The greeting box exists, but the campaign announcement overlay divs are missing. This is a **code regression** — the divs were likely removed during a prior refactoring and never restored.

---

### 5. Environment Configuration ⚠️ INCOMPLETE

**File**: `.env.example`  
**Production Environment**: Render

#### Required Variables for Durable Campaign Storage
- `CF_ACCOUNT_ID` — Cloudflare account ID for KV storage
- `CF_KV_NAMESPACE_ID` — KV namespace ID
- `CF_API_TOKEN` — API token with KV write permissions

**Finding**: These are **not documented** in `.env.example` and are **likely not set** in production. Without them:
- Config store falls back to `backend/data/campaign-config.json` (file backend)
- Render free tier has **ephemeral filesystem** — file is lost on restart
- Admin campaign toggle (PATCH endpoint) works but **does not persist** across deploys/restarts

**Environment Verdict**: Non-durable storage is acceptable for development, but production needs KV credentials to make admin toggles permanent.

---

## Root Cause Summary — Ranked by Probability

### A. 🔴 **PRIMARY: Missing DOM Elements (99% confidence)**
**Evidence**: 
- `campaign-renderer.js` line 207: `if (!art || !txt) return false;`
- `grep` search confirms `#greetingAnnounce` exists **nowhere** in `index.html`
- Renderer cannot proceed without these divs — this is a **structural requirement**, not a config issue

**Impact**: Campaign system is **completely non-functional** regardless of backend config state.

### B. ⚠️ **SECONDARY: Campaign `active` Flag Is False (80% confidence)**
**Evidence**:
- `DEFAULT_CAMPAIGNS.campaigns[0].active = false` (server.js line 571)
- Without KV credentials, production serves the default config
- Frontend's `active: true` built-in **is ignored** once the device fetches from the server (per `getSource()` logic in remote-config.js line 283-290)

**Impact**: Even if DOM elements were present, campaign would not show because `getActiveCampaign()` filters by `active` flag.

**Resolution**: Admin must toggle via PATCH `/api/config/admin/campaigns/chaliya-amritvela-2026/active` with body `{"active": true}`. **But this toggle will reset to false on next Render restart** without KV storage.

### C. ❌ **RULED OUT: isHome() Check**
**Evidence**: `campaign-renderer.js` line 91-95 checks pathname. Production serves at `/` or `/frontend/`, both match.

### D. ❌ **RULED OUT: CORS / Fetch Errors**
**Evidence**: CORS middleware (server.js line 187-211) allows all origins in dev mode, and whitelists production domain. Remote-config.js has 4s timeout and graceful fallback (line 147-158).

### E. ❌ **RULED OUT: Script Load Order**
**Evidence**: `index.html` line 6143 loads `campaign-renderer.js` with `defer`, after `remote-config.js` (line 6142). Correct order.

### F. ❌ **RULED OUT: #campaignMount Missing**
**Evidence**: `#campaignMount` exists (line 5685) but is **not used** by the current renderer — it's the retired standalone card slot. The renderer uses `#greetingAnnounce` instead.

---

## Implementation Plan — Ordered by Dependency

### Phase 1: Fix Critical Blocker (DOM Structure)

#### ✅ **Step 1: Add Campaign Announcement DOM Elements to index.html**

**What to do**: Insert the two missing divs (`#greetingAnnounce` and `#greetingAnnounceText`) inside `#guruSlider`, as siblings of `#guruSliderTrack`.

**Files to modify**:
- `frontend/index.html` (insert after line 5674, before the closing `</div>` of `#guruSlider`)

**Exact HTML to insert**:
```html
<!-- Campaign Announcement Overlay — State B in the portrait rotation.
     Renderer: js/campaign-renderer.js; config: lib/remote-config.js.
     These divs are siblings of #guruSliderTrack and are shown/hidden via
     data-campaign-state attribute on #guruSlider. -->
<div id="greetingAnnounce" class="greeting__announce" hidden aria-hidden="true">
  <div class="greeting__announce-disc">
    <span class="greeting__announce-ik" aria-hidden="true">ੴ</span>
    <span id="greetingAnnounceBadge" class="greeting__announce-badge" hidden></span>
    <img id="greetingAnnounceImg" class="greeting__announce-img" 
         src="assets/companion/chaliya-2026.webp" 
         alt="" 
         loading="lazy" 
         draggable="false">
  </div>
</div>

<div id="greetingAnnounceText" class="greeting__announce-text" hidden aria-hidden="true">
  <div id="greetingAnnounceTitle" class="greeting__announce-title" hidden></div>
  <div id="greetingAnnounceLine" class="greeting__announce-line" hidden></div>
  <div id="greetingAnnounceSub" class="greeting__announce-sub" hidden></div>
  <div id="greetingAnnouncePill" class="greeting__announce-pill" hidden></div>
</div>
```

**CSS**: The styles already exist in `index.html` (inline `<style>` block and `css/greeting-*.css`). No CSS changes needed — the renderer applies `data-campaign-state="a"|"b"` to `#guruSlider` and CSS handles the rest.

**Verify**: 
1. Open `frontend/index.html` in browser (local dev server or file://)
2. Open DevTools Console
3. Run: `document.getElementById('greetingAnnounce') !== null`
4. **Expected outcome**: `true`
5. Run: `document.getElementById('greetingAnnounceText') !== null`
6. **Expected outcome**: `true`
7. Check Network tab for `/api/config/campaigns` — should return 200 with campaign config
8. Wait 20 seconds and observe the greeting box — **if campaign is active**, the announcement should fade in and rotate with the Guru portraits

---

### Phase 2: Activate Campaign in Backend

#### ✅ **Step 2: Set `active: true` in DEFAULT_CAMPAIGNS (Optional — Code Change)**

**What to do**: Change line 571 in `backend/server.js` from `active: false` to `active: true` so the campaign is ON by default on fresh deploys.

**Files to modify**:
- `backend/server.js` (line 571)

**Change**:
```javascript
// BEFORE
active: false,

// AFTER
active: true,
```

**Why this is optional**: An admin can toggle the campaign via the PATCH endpoint without changing code. However, **this toggle is not durable on Render free tier** (see Phase 3), so a code change guarantees the campaign is ON after every deploy.

**Verify**: 
1. Restart backend: `npm start` (or redeploy to Render)
2. `curl https://anhad-final.onrender.com/api/config/campaigns | jq '.campaigns[0].active'`
3. **Expected outcome**: `true`

---

#### ✅ **Step 3: Toggle Campaign via Admin API (No Code Change)**

**What to do**: Use the admin PATCH endpoint to set `active: true` for the campaign.

**Command** (requires `X-Admin-Token` header):
```bash
curl -X PATCH https://anhad-final.onrender.com/api/config/admin/campaigns/chaliya-amritvela-2026/active \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: anhad_admin_secure_secret_token_2026" \
  -d '{"active": true}'
```

**Expected response**:
```json
{
  "success": true,
  "id": "chaliya-amritvela-2026",
  "active": true,
  "config": { ... }
}
```

**Limitation**: On Render free tier without KV storage, this change is written to `backend/data/campaign-config.json`, which is **ephemeral** — it will reset to the DEFAULT_CAMPAIGNS value on the next restart/redeploy. To make it permanent, either:
- Use the code change in Step 2, OR
- Set up Cloudflare KV storage (Phase 3)

**Verify**:
1. `curl https://anhad-final.onrender.com/api/config/campaigns | jq '.campaigns[0].active'`
2. **Expected outcome**: `true`
3. Open https://anhad-final.onrender.com in browser
4. Wait 20 seconds — campaign announcement should rotate into view

---

### Phase 3: Make Campaign Toggles Durable (Production Hardening)

#### ✅ **Step 4: Set Up Cloudflare KV for Campaign Config Storage**

**What to do**: Create a Cloudflare KV namespace and set environment variables on Render so admin campaign toggles persist across restarts.

**Prerequisites**:
- Cloudflare account
- API token with KV write permissions

**Steps**:
1. **Create KV Namespace**:
   - Log into Cloudflare dashboard
   - Navigate to Workers & Pages → KV
   - Click "Create namespace"
   - Name: `anhad-campaign-config`
   - Copy the Namespace ID (e.g., `a1b2c3d4e5f6...`)

2. **Create API Token**:
   - Cloudflare dashboard → My Profile → API Tokens → Create Token
   - Use "Edit Cloudflare Workers" template
   - Scope: Account → Workers KV Storage → Edit
   - Copy the token (shown once)

3. **Set Render Environment Variables**:
   - Render dashboard → anhad-final service → Environment
   - Add:
     - `CF_ACCOUNT_ID` = your Cloudflare account ID (found in dashboard → Workers & Pages → Overview)
     - `CF_KV_NAMESPACE_ID` = the namespace ID from step 1
     - `CF_API_TOKEN` = the API token from step 2
   - Click "Save Changes" → Render will auto-redeploy

4. **Verify KV Backend Is Active**:
   - After redeploy completes, check logs:
   - **Expected log line**: `[ConfigStore] Cloudflare KV backend active — campaign config is durable.`
   - **If you see this instead**: `[ConfigStore] FILE backend active ... changes will NOT survive a restart` → KV vars are not set correctly

**Alternative — Document File Backend Limitation**:
If KV setup is not feasible, update `.env.example` to document the limitation:
```bash
# Campaign Config Storage (backend/lib/config-store.js)
# Without these, config-store uses a local file (backend/data/campaign-config.json)
# which is EPHEMERAL on Render free tier — admin toggles reset on restart.
# CF_ACCOUNT_ID=your_cloudflare_account_id
# CF_KV_NAMESPACE_ID=your_kv_namespace_id
# CF_API_TOKEN=your_api_token_with_kv_write_permission
```

**Verify**:
1. Toggle campaign off via admin API: `curl -X PATCH ... -d '{"active": false}'`
2. Check: `curl .../api/config/campaigns | jq '.campaigns[0].active'` → should be `false`
3. Restart Render service (Manual Deploy → "Clear build cache & deploy")
4. **Expected outcome with KV**: Campaign remains `false` after restart
5. **Expected outcome without KV**: Campaign resets to DEFAULT_CAMPAIGNS value (`true` if Step 2 was done, `false` otherwise)

---

### Phase 4: Verify End-to-End on Production

#### ✅ **Step 5: Full Production Test**

**What to do**: Verify the campaign system works end-to-end on https://anhad-final.onrender.com.

**Test Cases**:

1. **Campaign ON — Renders Correctly**:
   - Ensure campaign is active (Step 2 or Step 3)
   - Open https://anhad-final.onrender.com
   - Wait up to 20 seconds (rotation cycle)
   - **Expected**: Campaign announcement fades in over the Guru portraits, stays for ~8 seconds, fades back
   - Verify content matches `DEFAULT_CAMPAIGNS.campaigns[0].content.announce` fields:
     - Badge: "CHALIYA 2026"
     - Title: "Chaliya Coming Soon"
     - (Line and subtitle may be empty in current config)

2. **Campaign OFF — No Rendering**:
   - Toggle campaign off: `curl -X PATCH ... -d '{"active": false}'`
   - Refresh browser
   - **Expected**: Only Guru portraits rotate; no campaign announcement appears

3. **Cache Busting**:
   - Toggle campaign on/off via admin API
   - Browser should reflect change within 15 seconds (polling interval)
   - If not, check DevTools Network tab → `/api/config/campaigns` response

4. **Offline Fallback**:
   - Toggle campaign off
   - Disconnect network (DevTools → Network → Offline)
   - Reload page
   - **Expected**: 
     - If browser has never reached the server: built-in `active: true` is used (campaign shows)
     - If browser previously fetched config: cached `active: false` is used (campaign hidden)
   - This is **correct behavior** per remote-config.js line 283-290

**Verify**:
- All test cases pass
- No console errors in DevTools
- Campaign rotation does not fight with Guru portrait slider (both use same CSS classes but different controller attributes)

---

## Additional Recommendations

### 1. Date Range Validation
The default campaign spans all of 2026 (`startDate: '2026-01-01'`, `endDate: '2026-12-31'`). Before activating, **narrow the date range** to the actual 40-day Chaliya window. Otherwise, the campaign will show for the entire year.

**How to fix**:
- Calculate the real 40-day window (e.g., Feb 1-Mar 12, 2026)
- Update `DEFAULT_CAMPAIGNS.campaigns[0].startDate` and `endDate` in `server.js`
- OR use the admin API to PATCH the dates (if the admin UI supports it)

### 2. Admin UI Check
The repo includes `frontend/Admin/index.html` which likely has a campaign management UI. Verify:
- The admin page loads without errors
- The campaign toggle button works
- The "Preview" section uses `renderPreview()` to show a live render of the campaign

### 3. Monitoring
Add server-side logging to track campaign config fetches:
```javascript
// In server.js, line 603 (GET /api/config/campaigns)
const config = await getLiveCampaignConfig();
console.log(`[Campaign] Served config: active=${config.campaigns[0]?.active}, source=${configStore.describe().backend}`);
```

This helps diagnose whether production is serving `active: true` or `active: false`.

---

## Summary: Why the Campaign Is Not Working

1. **Primary**: The required DOM elements (`#greetingAnnounce`, `#greetingAnnounceText`) are missing from `index.html`. The renderer checks for them and exits early when they don't exist.

2. **Secondary**: The backend default has `active: false`, so even if DOM elements were present, the campaign wouldn't show until an admin toggles it on (and that toggle is non-durable on Render without KV storage).

3. **Fix Path**:
   - Add the missing DOM elements (Step 1) — **REQUIRED**
   - Toggle campaign on (Step 2 or Step 3) — **REQUIRED**
   - Set up KV storage (Step 4) — **OPTIONAL** but recommended for production

---

## Is This Purely a Config Issue?

**No.** This is **both a code issue (missing HTML elements) AND a config issue (campaign is off by default).**

The HTML fix (Step 1) is a **code change** that must be committed and deployed.  
The campaign activation (Step 2/3) is a **config change** that can be done via API or code.

Neither alone is sufficient — both are required for the campaign to work.
