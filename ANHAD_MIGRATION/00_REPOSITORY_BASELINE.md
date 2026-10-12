# ANHAD Migration Baseline: Repository Safety & Audit Foundation
**Document:** ANHAD_MIGRATION/00_REPOSITORY_BASELINE.md  
**Version:** 1.0.0  
**Date:** March 2026 / October 2026  
**Status:** Approved & Verified Baseline  

---

## 1. Executive Summary

This document establishes the official engineering baseline for migrating **ANHAD** (Sri Harmandir Sahib Gurbani & Nitnem application) from its legacy Vanilla JavaScript / Capacitor / Electron architecture to a production-grade, greenfield **React Native** application located in ANHADIN-REACT.

The original ANHAD repository (c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL) represents the **single source of truth** for all visual assets, design tokens, business logic, religious maryada configurations, audio streaming endpoints, and prayer reader behaviors. **Under no circumstances will any file within ANHAD-FINAL be modified, moved, renamed, or deleted during this audit.**

---

## 2. Repository Identification & Root Structure

- **Repository Root:** c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL
- **Destination Project Directory:** c:\Users\Manmohan Singh\converttoApp\ANHADIN-REACT (verified not yet existing; isolated sibling directory)
- **Primary Branch:** main
- **Git Status:** Working tree clean (
othing to commit, working tree clean)
- **Latest Commit:** 5c86042 ? *feat(chaliya-broadcast-insights): restore chaliya 2026 hero image, fix push broadcast unexpected token T, decouple broadcast from spiritual settings, and redesign insights into khalsa library with real listening hours (v1.1.22)*
- **Upstream:** Synced with origin/main

### Repository Top-Level Structure
`
ANHAD-FINAL/
??? frontend/                  # Core client application (747 files: HTML, CSS, JS, assets)
??? backend/                   # Express API & stream proxy (54 files, Node.js server.js)
??? android/                   # Capacitor Android wrapper (462 files, Java plugins)
??? ios/                       # Capacitor iOS wrapper (740 files, Swift widgets)
??? tests/                     # Vitest devotional, audio & security test suites (41 files)
??? scripts/                   # Icon generation & build automation utilities (44 files)
??? scratch/                   # Investigation scripts & temporary test artifacts (12 files)
??? artifacts/                 # Test logs, coverage outputs, and audit summaries (192 files)
??? package.json               # Root npm manifest (name: "gurbani-radio", v1.1.16)
??? capacitor.config.ts        # Capacitor configuration (appId: "com.anhad.app")
??? electron-main.js           # Desktop Electron entry point
??? firestore.rules            # Firebase Cloud Firestore security rules
??? storage.rules              # Firebase Cloud Storage security rules
`

---

## 3. Runtime Requirements, Package Managers & Commands

### 3.1 Runtime Environment
- **Node.js:** v18.0.0+ required (uses modern fetch, crypto, ES modules)
- **Python:** Python 3.11.4 available on developer environment
- **Package Manager:** npm (with package-lock.json lockfile v2)

### 3.2 Root Development Commands (package.json)
- npm run start / npm run dev: Executes node backend/server.js (Express on port 3000)
- npm run build: Generates build metadata via node scripts/generate-version.js
- npm test: Runs test suite via vitest run
- npm run test:explore: Runs exploration tests via vitest.explore.config.js
- npm run electron: Launches desktop Electron wrapper (electron .)
- npm run cap:sync: Synchronizes web assets to native Android/iOS wrappers (npx cap sync)
- npm run cap:open:android: Opens native Android project in Android Studio

---

## 4. Environment Variables, Secrets & Security Boundaries

### 4.1 Root .env.example
`env
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
`

### 4.2 Backend .env.example (backend/.env.example)
Contains critical service configurations that must be safely ported into mobile environment configs (e.g. react-native-config or Expo Secrets):
- R2_BASE_URL: Cloudflare R2 audio storage endpoint (https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev)
- FIREBASE_PROJECT_ID: anhad-4bf78
- FIREBASE_CLIENT_EMAIL: Service account email
- FIREBASE_PRIVATE_KEY: RSA private key for Firebase Admin Auth
- FIREBASE_WEB_API_KEY: Web API key for Google Sign-In and anonymous user tracking
- ADMIN_API_TOKEN: 256-bit bearer token for admin routes (/api/admin/*, /api/sadhsangat/admin/*)
- CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_API_TOKEN: Cloudflare KV campaign storage

**Strict Rule:** No API secrets or private keys are exposed in client-facing bundles or public reports. For React Native, public client credentials (e.g. Firebase Client API Key) will use standard mobile configuration files (google-services.json and GoogleService-Info.plist), while administrative credentials remain strictly backend-only.

---

## 5. Repository Safety Boundaries & Constraints

1. **No Source Modifications:** Zero edits to any file in ANHAD-FINAL.
2. **Dedicated Documentation Folder:** All audit reports reside inside ANHAD-FINAL/ANHAD_MIGRATION/.
3. **Safe Target Location:** The new application will be initialized inside c:\Users\Manmohan Singh\converttoApp\ANHADIN-REACT only after architectural approval.
4. **No Destructive npm Operations:** No npm install, npm audit fix --force, or package upgrades on ANHAD-FINAL.
5. **Asset Preservation:** High-resolution Guru Sahib artwork, audio tracks, Gurmukhi fonts, and JSON prayer data chunks will be copied (never moved) into the new project.
