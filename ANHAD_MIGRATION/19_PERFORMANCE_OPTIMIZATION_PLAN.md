# ANHAD Performance & Mobile Engineering Optimization Plan
**Document:** `ANHAD_MIGRATION/19_PERFORMANCE_OPTIMIZATION_PLAN.md`  
**Version:** 1.0.0  

---

## 1. Baseline Performance Bottlenecks in the Original Web App

1. **Massive Initial DOM Footprint:** `frontend/index.html` contains 6,978 lines of HTML with hundreds of inline SVGs, modals, and hidden elements, causing high memory usage and slow initial paint.
2. **Synchronous JSON Parsing:** Fetching and parsing 17 MB `popular-banis.json` or 9 MB `nitnem-banis.json` freezes the JavaScript thread on mobile devices for 400-800ms.
3. **Heavy DOM Manipulation During Navigation:** `smooth-navigation.js` parses entire HTML documents via `DOMParser` on every link click, destroying and recreating DOM nodes.
4. **WebView Audio CPU Overhead:** Running HTML5 audio inside an Android WebView requires keeping the entire Chromium render process alive in background, draining 3-4x more battery than native ExoPlayer.

---

## 2. React Native Performance Objectives & Budgets

| Performance Metric | Original Web/Capacitor App | Target in `ANHADIN-REACT` | Optimization Mechanism |
|---|---|---|---|
| **Cold Startup Time (TTR)** | ~2,800 ms | < 1,000 ms | Hermes engine bytecode pre-compilation, zero raw JSON parsing at launch |
| **Warm Startup Time** | ~1,200 ms | < 400 ms | State restored instantly from MMKV memory-mapped storage |
| **Screen Navigation Latency** | 300 - 600 ms (DOM swap) | < 50 ms (instant) | Native stack navigation (`react-native-screens`), zero HTML parsing |
| **Scroll Frame Rate** | 40 - 55 fps (occasional stutter) | Solid 60 / 120 fps | Shopify `FlashList` for verse and channel lists |
| **Scripture Verse Load Time** | 200 - 800 ms | < 15 ms | Pre-indexed local SQLite database (`op-sqlite`) via C++ TurboModule |
| **Background Audio Battery Drain** | ~8% - 12% per hour | < 2% - 3% per hour | Native ExoPlayer / AVPlayer background service without WebView |
| **App Bundle Size** | ~120 MB (with raw JSON) | < 35 MB | SQLite database compressed, images converted to optimized WebP |

---

## 3. Targeted Mobile Engineering Optimizations

### 3.1 List Virtualization (`@shopify/flash-list`)
- Standard React Native `FlatList` suffers from memory growth on long scripture texts (e.g. Sukhmani Sahib with 24 Ashtpadis or Sri Guru Granth Sahib Angs).
- Use `FlashList`: recycles native cell views rather than creating new ones; reduces blank scroll spaces; renders thousands of Gurbani verses with a constant ~25 MB memory footprint.

### 3.2 High-Performance Image Pipeline (`expo-image`)
- Replace standard `<Image />` with `expo-image` (built on Glide for Android and SDWebImage for iOS).
- Progressive blur-hash loading for Guru Sahib portraits and hero banners.
- Aggressive disk caching prevents duplicate network requests for remote channel thumbnails.

### 3.3 Zero-Cost State Reads with MMKV
- Replaces asynchronous `AsyncStorage` and browser `localStorage`.
- Synchronous C++ memory-mapped file access allows immediate retrieval of user font size, theme, and reading progress during component render without layout shift.

### 3.4 JS Thread Offloading with Reanimated v3
- All gesture animations (breathing ring in Naam Abhyas, bottom sheet expansion, mini-player gestures) run on the Native UI thread via `react-native-reanimated`.
- Heavy scripture computations or search filtering execute on background threads without causing dropped UI frames.
