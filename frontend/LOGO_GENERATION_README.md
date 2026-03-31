# 🎨 ANHAD Logo Generation Guide

This guide explains how to generate all required logo sizes and formats from the new logo (`newlogo-removebg-preview.png`).

## 📋 What Gets Generated

The script will create logos in the following sizes and formats:

### Favicons
- `favicon-16x16.png` (16×16)
- `favicon-32x32.png` (32×32)
- `favicon.ico` (multi-size: 16, 32, 48)

### App Icons
- `app-logo.png` (512×512) - Main app logo
- `app-logo.webp` (512×512) - WebP version
- `app-logo-96.png` (96×96)
- `app-logo-128.png` (128×128)
- `app-logo-144.png` (144×144)
- `app-logo-384.png` (384×384)

### PWA Icons
- `pwa-icon-192.png` (192×192)
- `pwa-icon-512.png` (512×512)

### Apple Touch Icon
- `apple-touch-icon.png` (180×180)

### Pure Logo (Transparent)
- `pure-logo.png` (512×512)
- `pure-logo.webp` (512×512)

## 🚀 Quick Start

### Option 1: Using Python (Recommended)

1. **Double-click** `GENERATE_LOGOS.bat`
   - The script will automatically check for Python and Pillow
   - If Pillow is missing, it will install it automatically
   - Logos will be generated in the `assets` folder

### Option 2: Manual Python Command

```bash
cd frontend
python generate-logos-simple.py
```

### Option 3: Using Node.js (requires sharp)

```bash
cd frontend
npm install sharp
node generate-logos.js
```

## 📁 Output Locations

Generated logos will be placed in:
- `frontend/assets/` - Main assets directory
- `android/app/src/main/assets/public/assets/` - Android app assets (if exists)

## ✅ Verification

After generation, verify that:
1. All files are created in `frontend/assets/`
2. Files have proper transparency (PNG/WebP)
3. Icons look sharp at all sizes
4. Android assets are updated (if applicable)

## 🔧 Troubleshooting

### Python not found
- Install Python from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

### Pillow installation fails
```bash
pip install --upgrade pip
pip install Pillow
```

### Logo looks blurry
- Ensure `newlogo-removebg-preview.png` is high resolution (at least 512×512)
- The script uses LANCZOS resampling for best quality

## 📝 Notes

- The original logo should have a transparent background
- All generated logos maintain transparency
- WebP format provides better compression for web use
- The script preserves aspect ratio and centers the logo

## 🎯 Next Steps

After generating logos:
1. Clear browser cache to see new logos
2. Test PWA installation with new icons
3. Rebuild Android app if needed
4. Verify all pages show the correct logo

## 📱 Where Logos Are Used

- **Favicon**: Browser tabs, bookmarks
- **Apple Touch Icon**: iOS home screen
- **PWA Icons**: Installed app icon on mobile/desktop
- **App Logo**: Throughout the application UI
- **Pure Logo**: Splash screens, loading states
