# ANHAD Dependency, Security & Operational Audit
**Document:** `ANHAD_MIGRATION/20_DEPENDENCY_AND_SECURITY_AUDIT.md`  
**Version:** 1.0.0  

---

## 1. Dependency Security & Package Audit

### 1.1 Original Repository Dependencies Audit (`package.json`)
- **Capacitor Packages:** `@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/local-notifications`, `@capacitor/haptics`.
  - *Audit Finding:* Capacitor packages are tied to v6.2.x. Completely retiring Capacitor for React Native eliminates native WebView security vulnerabilities and cross-origin security quirks.
- **Backend Packages:** `express`, `firebase-admin`, `fluent-ffmpeg`, `sharp`.
  - *Audit Finding:* Retained strictly in the backend repository. No Node.js backend packages are included in the React Native mobile client bundle.

### 1.2 Target React Native Dependencies License & Compatibility Matrix

| Package Name | Recommended Version | License | Maintenance & Platform Support | Security & Health Check |
|---|---|---|---|---|
| `react-native` | `0.76+` | MIT | Active (Meta / Core Community) | Modern New Architecture (Fabric) |
| `expo` | `~52.0.0` | MIT | Active (Expo / 670k+ weekly DL) | Long-term support, Android 15 & iOS 18 ready |
| `react-native-track-player` | `^4.1.1` | Apache-2.0 | Active (Doublesymmetry / 120k+ weekly) | Battle-tested, zero known CVEs |
| `@react-navigation/native` | `^7.0.0` | MIT | Active (Software Mansion / Callstack) | Primary navigation standard |
| `zustand` | `^5.0.0` | MIT | Active (Pmndrs / 4M+ weekly) | Lightweight, zero dependency tree |
| `react-native-mmkv` | `^3.1.0` | MIT | Active (Marc Rousavy / 300k+ weekly) | C++ TurboModule, encryption supported |
| `@tanstack/react-query` | `^5.60.0` | MIT | Active (Tanner Linsley / 5M+ weekly) | Clean cache invalidation, zero CVEs |
| `@notifee/react-native` | `^9.1.0` | Apache-2.0 | Active (Invertase / 200k+ weekly) | Production notification/alarm standard |
| `@shopify/flash-list` | `^1.7.0` | MIT | Active (Shopify / 400k+ weekly) | High-performance recycling list |
| `op-sqlite` | `^10.0.0` | MIT | Active (OP Engineering / 150k+ weekly) | C++ SQLite bindings with FTS5 |

---

## 2. Secrets Management & Credential Protection

1. **No Hard-coded Secrets in Source Code:**
   - The original frontend occasionally exposed backend fallback tokens or API keys.
   - In `ANHADIN-REACT`, all client environment variables (such as backend API URLs) are managed through `react-native-dotenv` or Expo Environment Variables (`EXPO_PUBLIC_*`).
   - Administrative tokens (`ADMIN_API_TOKEN`) and Firebase Admin private keys remain exclusively on the backend server. Under no circumstances will admin credentials ever be packaged into mobile application bundles or APK/IPA archives.
2. **Firebase Client Configuration:**
   - Android: `google-services.json` placed in `android/app/` with restricted SHA-256 fingerprint restrictions enabled in the Firebase Console.
   - iOS: `GoogleService-Info.plist` placed in `ios/` with iOS bundle identifier restrictions.

---

## 3. Platform Permissions & Operational Security

### 3.1 Android Permissions Required (`AndroidManifest.xml`)
- `android.permission.INTERNET`: For streaming audio, BaniDB API, and backend sync.
- `android.permission.FOREGROUND_SERVICE` & `android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK`: Required on Android 14+ (API 34+) for background audio playback.
- `android.permission.SCHEDULE_EXACT_ALARM`: Required for Amritvela alarms.
- `android.permission.USE_EXACT_ALARM`: Granted for alarm clock and devotional reminder applications.
- `android.permission.POST_NOTIFICATIONS`: Required on Android 13+ (API 33+) for notifications and lockscreen media player controls.
- `android.permission.WAKE_LOCK`: For alarm firing and uninterrupted audio initialization.
- `android.permission.RECEIVE_BOOT_COMPLETED`: For rescheduling Amritvela alarms and Nitnem streak reminders after device reboot.

*Unnecessary permissions avoided:* No location permissions, no camera permissions, no contact read permissions.

### 3.2 iOS Capabilities Required (`Info.plist`)
- `UIBackgroundModes`:
  - `audio`: Background audio streaming.
  - `fetch`: Periodic background content refresh.
- `NSMicrophoneUsageDescription`: Optional, requested only if the user explicitly uses voice search in Gurbani Khoj.
