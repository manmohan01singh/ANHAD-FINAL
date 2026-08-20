# ANHAD — work log (local only, not committed)

Running summary of this session's work. Commit hashes are on `main`, pushed to GitHub.

## Commits, in order

| Commit | What |
|---|---|
| `1826950` | Repair mobile navigation, scrolling, rendering, Home state (earlier session) |
| `7e03d46` | Kirtan now resumes after a network drop (9 audio-recovery defects) |
| `c25207b` | Campaign engine consumption layer; Chaliya ships disabled |
| `5726894` | Durable config store (file/KV) + in-app admin write path + green test gate |
| `f677307` | Cloudflare KV setup documentation |
| `37eafd4` | Blank-greeting fix, mini-player z-index layering, bottom-padding reservation |
| `ab2bc3d` | Favicon 121KB→2.5KB, test-suite flake fix |
| `01c65ab` | Sync iOS/Android mirrors |

## 1. Audio network recovery (`7e03d46`)

**Symptom:** kirtan stops on a network drop and never resumes — not in the mini
player, not on the radio page.

**Root cause (9 defects, `frontend/lib/anhad-audio-singleton.js`):** the engine
had zero `online` event handling; a fatal `MediaError` never cleared
`isPlaying`, so both retry paths (gated on `!isPlaying`) never fired while the
attempt counter still burned to a terminal "failed"; an errored `<audio>`
element was never reset (`src` only reassigned when the URL changed — stable
for virtual-live tracks); the radio page hard-paused on `offline` and just
toasted on `online` with no actual resume; the stall watchdog was one-shot;
drift correction kept running against a dead element and masked its own signal.

**Fix:** `wantsPlayback` tracks intent separately from `isPlaying`; error
handler clears `isPlaying` and defers (not retries) while offline; `online`
handler resets the retry budget and resumes; errored elements are forced
through a real reload; stall watchdog re-arms; UI (mini player) now shows
"Reconnecting…" / "Tap to retry" instead of a pause icon over silence.

**Test:** `tests/audio/network-recovery.test.js` (7 cases) — fires `error`
*without* a synthetic `pause` and simulates offline→online, the exact
combination no prior test covered. Verified to fail 4/7 against the pre-fix
code, pass 7/7 after.

## 2. Campaign engine consumption + admin write path (`c25207b`, `5726894`)

**Finding:** `frontend/lib/remote-config.js` already fully resolved schedule/
platform/priority with a remote→cache→built-in fallback chain — nothing
consumed it. Also found the Cloudflare Worker scaffold (`worker/`) is broken by
construction (`handleRadioLive(request)` called with one arg, function reads
`env.CACHE` — both routes 500 unconditionally) and never deployed. Used KV's
REST API directly instead — no Worker deploy needed.

**Built:**
- `frontend/js/campaign-renderer.js` + `frontend/css/campaign.css` — renders
  campaign hero/banner/announcement/CTA into `#campaignMount` on Home. DOM-API
  built, never `innerHTML` (no sanitiser exists elsewhere in the app).
  Additive only — no active campaign renders nothing.
- `backend/lib/config-store.js` — one `read()`/`write()` interface, two
  backends (Cloudflare KV via REST, or a JSON file) chosen by env vars.
- `backend/server.js` — `GET /api/config/campaigns` now reads through the
  store with `no-cache` + `ETag` (was `max-age=300`, fighting the 15s poll).
  New: `GET/PUT/PATCH /api/config/admin/*`, gated by the existing
  `requireAdminToken` (X-Admin-Token header, timing-safe compare, fails closed
  503 when unset).
- `frontend/Admin/` — unlisted operator page (`/Admin/`, no link anywhere in
  the UI, not precached, `noindex`). Token entry, campaign list with a toggle,
  schedule/content editor, Preview (renders through the real
  `campaign-renderer.js`, not a lookalike), Publish.

**Chaliya ships `active: false`** in both the client built-in default and the
server const — the stored dates span all of 2026 and are placeholders. Enable
it with the real 40-day window from `/Admin/`, not from source.

**Cross-device test** (3 concurrent CDP browser contexts): admin publishes →
already-open device receives it in **5.1s**, no reload; offline device stays
healthy on cached config; disabling reverts in **14.8s**. Re-run against
current HEAD with identical results.

**Verified live on the deployed stack** (2026-08-19, via direct curl):
- Render: new admin routes exist (`503` = present-but-unconfigured, not 404),
  new `no-cache`/`ETag` headers live, Chaliya confirmed `active:false`.
- Vercel: `/Admin/` returns 200.
- **Not yet done: `ADMIN_API_TOKEN` is unset on Render.** This is a manual
  step in Render's dashboard — a git push cannot set it. Until it's set, the
  admin write API 503s and `/Admin/` shows "Admin API is not configured on the
  server" on unlock.

Setup guide: `backend/lib/CONFIG_STORE_SETUP.md`. KV read/write itself was
**not** verified end-to-end — no real Cloudflare account/namespace was
available to test against; the file backend was proven to survive a full
process restart instead, and the KV code path was checked with deliberately
invalid credentials to confirm it fails safely (`read()`→null, `write()`→throws).

## 3. Blank-greeting regression (`37eafd4`) — my own regression from `1826950`

**Root cause:** `1826950` replaced a correct-but-flawed debounce with a
*time-based* one (`trendora-app.js`). Two problems: the `anhad_page_changed`
listener had no "am I on Home?" check, so *leaving* Home stamped the same
clock a fast return read, and returning within 500ms (trivial — PAGE_CACHE
makes SPA swaps instant) skipped the only code that repopulates the greeting
and Gurpurab card; separately, any arrival in the first 2.5s of a session
bailed against a boot-stamp windows that no longer matched the current DOM.

**Fix:** `smooth-navigation.js` now bumps `window.__anhadNavEpoch` once per
navigation; `trendora-app.js` dedupes per-epoch instead of per-elapsed-time,
adds the missing on-Home check, and moves the "handled" stamp to *after* the
work actually runs (so a dropped frame doesn't falsely mark an arrival done).

**Verified:** hard load, SPA return, sub-500ms fast return, arrival inside the
old 2.5s boot window, hard-reload-elsewhere-then-SPA-to-Home, and 10 repeated
round trips — greeting and event card populated in every case.

## 4. Mini-player layering (`37eafd4`)

**Root cause:** no explicit layering contract. `#gmp` sat at `z-index:9000`,
above the Insights modal (2000), the Favorites note modal (1000), and Home's
radio sheet (1000/999) — it painted over all of them. Separately, Home only
ever reserved 110px of bottom scroll space (sized for the nav pill alone), so
the mini player's real 132–200px footprint buried the Gurbani GPT card ~82%.

**Fix:** one documented z-index scale (`trendora-premium.css`) — content < fab
< sticky < nav < mini-player < sheet-overlay < sheet < modal < banner < toast
< system < critical. `body.has-mini-player` (set by `overlay-player.js`,
the single place visibility is decided) extends Home's bottom padding to 216px
*only* while the player is visible. `body.modal-open` now also hides `#gmp`
visually (Home's sheet controller and Favorites' note modal now set that class
too, matching Insights).

**Verified:** Gurbani GPT card 0px overlap / hit-testable at 390px and 430px;
Home radio sheet and Insights modal both render and hit-test above the player;
Favorites FAB (Notes tab) hit-testable, lifted clear; padding 216px with
player / 110px without, no leftover gap.

## 5. Performance (`ab2bc3d`)

Lighthouse's Lantern trace failed with `NO_LCP` in this environment (headless
`--disable-gpu` doesn't produce real paint/compositor events) across every
throttling-method combination tried — not a code bug, and not papered over.
Substituted direct Performance API measurement (real FCP/DOMContentLoaded/
resource data) via CDP.

**Finding:** a fresh browser profile *always* redirects `index.html` →
`Homepage/ios-homepage.html` (the "Enter ANHAD" splash) — meaning the
session's original Lighthouse baseline (86 / LCP 4.1s) was measuring the
splash screen, not Home. Documented, not fixed this pass (a first-load UX
decision, not a pure performance one).

**Measured (390×844, 4x CPU throttle, ~1.6Mbps):** Home cold load (returning
user) ~4.0s DOMContentLoaded / 1.8s FCP, 2.3MB / 61 resources across 19
stylesheets — genuinely heavy. Insights/Favorites/GurbaniRadio are all
~500–1100ms — comparatively lean. SPA transitions ~1.3–1.5s.

**Applied:** replaced a 121KB `favicon.ico` (Chrome's own implicit fetch,
sourced from a 342KB `app-logo.png` via `png-to-ico`) with a hand-built 2.5KB
ICO wrapping the existing small PNG. Verified: HTTP 200, correct MIME, 718
bytes on the wire. Confirmed no duplicate audio/campaign script injection or
extra campaign fetches across 6 SPA round trips.

**Not done, documented as findings for a dedicated pass:** the 2.3MB/19-sheet
Home payload, and the double page-load every first-time visitor experiences
(splash → tap "Enter ANHAD" → real Home). Explicitly out of scope this pass
per "do not unnecessarily refactor a stable foundation."

## 6. Test suite (`ab2bc3d`)

Was 8 failed files / 48 failed tests of 347, non-deterministic. Now
**27/27 files, 285/285 tests**, confirmed clean across 15+ consecutive runs
(including the mid-session flake that was caught, root-caused, and fixed —
`collage-cache-manager.test.js`'s order-independence property used duplicate
channel IDs against a sort with no tiebreaker, plus an unseeded
`Math.random()` shuffle; fixed with `fc.uniqueArray` + a deterministic
reverse). Two `fc.float()`-without-`noNaN` flakes fixed earlier. Excluded the
deliberately-failing `*bug-exploration*` suites from the default gate (moved
to `npm run test:explore`). Added `jest.config.js` ignore patterns (was
collecting the Android/iOS mirrors as duplicate suites) and a GitHub Actions
workflow.

## 7. Real-browser regression (this pass, not yet committed as a separate step)

Hard-refresh vs SPA parity: **zero structural differences** on Home, Insights,
Favorites (card counts, fonts, colors, radius, padding, header, theme — all
identical). 20 repeated navigation round trips (two different patterns): zero
failures, zero duplicate script tags, zero duplicate PWAManager init, DOM node
count stable. Zero console errors, zero network 404s across the whole session.
One extra full-page reload was observed during initial setup — traced to
`pwa-register.js`'s standard one-time service-worker `controllerchange`
reload (fires once per fresh profile when the SW first takes control) — not a
bug, and it does not appear anywhere in the 20 SPA round trips. Gurbani Radio:
card navigation, hero play button (`data-stream="darbar"`), dedicated page,
and actual audio playback (`isPlaying` confirmed true) all verified; mini
player correctly does not exist on its own page at all (stronger than merely
hidden).

## 8. Android — in progress

SDK confirmed present (`ANDROID_HOME=C:\AndroidSdk`, platform-tools, two AVDs
including `Pixel_7_API35` = genuine Android 15). `npx cap sync android` was
interrupted mid-run when this file was requested. Not yet completed: fresh
APK build, install, launch, crash/reminder/audio/campaign/UI verification on
the emulator.

## Outstanding before "production ready"

1. **Set `ADMIN_API_TOKEN` on Render** — the one manual step blocking the
   admin write path on the live deployed site.
2. Android fresh-build verification (in progress).
3. Cloudflare KV itself was never verified end-to-end (no real account
   available) — currently running on the file backend in production, which
   does not survive a Render restart.
4. Final production audit (dead code, hardcoded URLs, secrets scan) not yet
   run as an explicit pass.
