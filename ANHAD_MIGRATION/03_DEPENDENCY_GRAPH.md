# ANHAD Dependency Graph & Integration Architecture
**Document:** ANHAD_MIGRATION/03_DEPENDENCY_GRAPH.md  
**Version:** 1.0.0  

---

## 1. Internal Client Module Dependency Graph

`
                                  [ index.html ]
                                         ?
                 ?????????????????????????????????????????????????
                 ?                       ?                       ?
       [ lib/global-theme.js ]   [ js/anhad-core.js ]  [ lib/smooth-navigation.js ]
                 ?                       ?                       ?
                 ?                       ?                       ?
                 ?           [ lib/home-state-manager.js ]       ?
                 ?                       ?                       ?
                 ?                       ?                       ?
     [ lib/anhad-audio-singleton.js ] ??????????????? [ lib/overlay-player.js ]
                 ?
      ???????????????????????
      ?                     ?
[ SGPC Live Stream ]  [ Virtual Live Engine ]
                            ?
                            ?
                    [ Cloudflare R2 CDN ]
`

### Module Roles & Interfaces:
- **lib/global-theme.js:** Listens for time changes, applies CSS classes (dark, 	heme-loaded), emits theme change events.
- **lib/anhad-audio-singleton.js:** Central audio authority. Exposes play(streamId), pause(), 	oggle(), getState(), on('statechange').
- **lib/overlay-player.js:** Pure UI subscriber to AnhadAudio. Updates play/pause icons, artwork, title, progress bar.
- **lib/smooth-navigation.js:** Mediates page transitions; ensures AnhadAudio instance is never destroyed on navigation.
- **lib/anhad-widget-bridge.js:** Listens to state changes and calls native Capacitor plugin WidgetDataBridge.syncWidgetData.

---

## 2. External API & CDN Integration Dependencies

| External Service | Endpoint / URL | Protocol | Role in Application | React Native Strategy |
|---|---|---|---|---|
| **SGPC Golden Temple Audio** | https://live.sgpc.net:8443/;nocache=1 | Icecast HTTP/HTTPS Audio Stream | Live 24/7 Gurbani from Sri Harmandir Sahib | Direct streaming via ExoPlayer / AVPlayer in react-native-track-player |
| **Cloudflare R2 (Amritvela)** | https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev/day-{1..40}.webm | HTTPS WebM Audio CDN | 40 days of Amritvela Kirtan recordings | Direct streaming via react-native-track-player |
| **Cloudflare R2 (Simran)** | https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev/waheguru/{track}.mp3 | HTTPS MP3 Audio CDN | 38 Waheguru Simran recordings | Direct streaming via react-native-track-player |
| **SikhNet Radio Streams** | https://radio.sikhnet.com/proxy/{channel}/live | HTTPS Icecast Streams | 5 SikhNet streams: Bangla Sahib, Sis Ganj Sahib, Hazur Sahib, Dukh Nivaran Sahib, Classical Raag Kirtan (completing the 8 total audio streams) | Direct streaming via react-native-track-player |
| **BaniDB API v2** | https://api.banidb.com/v2 | HTTPS REST JSON | Gurbani search, Shabad retrieval, Daily Hukamnama | TanStack Query client with offline SQLite cache |
| **ANHAD Production API** | https://anhad-final.onrender.com/api | HTTPS REST JSON | Campaigns, listener heartbeats, Sadhsangat YouTube live status | Axios / Fetch client with type-safe schemas |
| **Google Firebase** | Project anhad-4bf78 | HTTPS SDK / REST | Sangat user profile, Google Sign-In, sync | @react-native-firebase/app & @react-native-firebase/auth |
| **Google Fonts CDN** | fonts.googleapis.com | HTTPS CSS / Fonts | Noto Sans Gurmukhi, Inter, Cinzel | Critical offline fix: 120 HTML/CSS lines depend on fonts.googleapis.com for Cinzel and Noto Sans Gurmukhi. Neither exists in frontend local fonts (19 local font files). Must bundle Cinzel and Noto Sans Gurmukhi .ttf directly into target React Native app bundle to ensure complete offline typography. |

---

## 3. Root Package Dependencies (package.json)

### Production Dependencies
- @capacitor-community/native-audio: Native audio bridge (retire).
- @capacitor/android & @capacitor/core: Capacitor runtime (retire).
- @capacitor/local-notifications, @capacitor/haptics, @capacitor/splash-screen, @capacitor/status-bar: Capacitor plugins (replace with RN native equivalents).
- express, compression, dotenv, express-rate-limit, firebase-admin: Backend runtime (maintain on backend).
- sharp, fluent-ffmpeg, ffmpeg-static: Backend media processing (maintain on backend).

### Dev Dependencies
- electron, electron-builder: Desktop wrappers.
- jest, vitest, jsdom, fast-check: Testing libraries.
