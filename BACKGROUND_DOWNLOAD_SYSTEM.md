# 🚀 Background Download System - Complete Guide

## Overview

The Background Download System enables users to read Gurbani online while content automatically downloads in the background for offline access. Once downloaded, content is served instantly from cache.

## ✨ Key Features

### 1. **Seamless Reading Experience**
- Users can read Gurbani immediately using internet connection
- Content downloads silently in the background
- Automatic switch to cached content once downloaded
- No interruption to reading flow

### 2. **Intelligent Caching**
- **Memory Cache**: Instant access to recently viewed content
- **IndexedDB**: Persistent storage across sessions
- **Smart Prefetching**: Predicts and downloads likely next content

### 3. **Background Download Queue**
- Queue Banis and Angs for download
- Persistent queue (survives page refresh)
- Pause/Resume/Cancel controls
- Progress tracking and notifications

### 4. **Network Awareness**
- Detects connection speed (2G/3G/4G/5G)
- Adjusts prefetch window based on speed
- Pauses on offline, resumes when online
- Rate limiting to avoid overwhelming API

## 📦 Components

### 1. **bani-cache-optimizer.js** (v2.0)
Core caching and download engine

**Key Methods:**
```javascript
// Get Bani (checks cache → downloads if needed)
await cache.getBani(baniId);

// Get Ang (checks cache → downloads if needed)
await cache.getAng(angNumber);

// Queue downloads
await cache.queueBanisForDownload([2, 4, 6, 7]);
await cache.queueAngsForDownload([1, 2, 3, 4, 5]);
await cache.queueAllAngs(); // All 1430 Angs

// Control downloads
cache.pauseBackgroundDownload();
cache.resumeBackgroundDownload();
cache.cancelBackgroundDownload();

// Monitor progress
cache.onDownloadProgress((event) => {
    console.log(event.event, event.data);
});

// Get statistics
const stats = await cache.getCacheStats();
const storage = await cache.getStorageEstimate();
```

### 2. **background-download-ui.js**
Visual progress indicator

**Features:**
- Floating progress widget
- Real-time download statistics
- Pause/Resume/Cancel buttons
- Storage usage display
- Auto-hide when complete
- Minimize/Maximize controls

### 3. **smart-prefetch.js**
Intelligent prefetching helper

**Key Methods:**
```javascript
// Prefetch around current Ang
await prefetch.prefetchAroundAng(currentAng);

// Prefetch Nitnem Banis
await prefetch.prefetchNitnemBanis();

// Prefetch popular Banis
await prefetch.prefetchPopularBanis();

// Download complete GGSJ
await prefetch.downloadCompleteGGSJ();
```

## 🔧 Integration Guide

### Step 1: Include Scripts

Add to your HTML pages:

```html
<!-- Core cache system -->
<script src="/lib/bani-cache-optimizer.js"></script>

<!-- UI component (optional but recommended) -->
<script src="/lib/background-download-ui.js"></script>

<!-- Smart prefetch helper (optional) -->
<script src="/lib/smart-prefetch.js"></script>
```

### Step 2: Use in Your Reader

**Example: Nitnem Reader Integration**

```javascript
// In reader-engine.js or similar

async function loadBani() {
    const baniId = state.baniId;
    
    try {
        // This will:
        // 1. Check memory cache (instant)
        // 2. Check IndexedDB (fast)
        // 3. Fetch from API if needed (slow)
        // 4. Cache for next time
        const data = await window.baniCacheOptimizer.getBani(baniId);
        
        // Render the bani
        renderBani(data);
        
        // Optional: Prefetch related banis in background
        if (window.smartPrefetch) {
            window.smartPrefetch.prefetchNitnemBanis();
        }
        
    } catch (error) {
        console.error('Failed to load bani:', error);
        showError('Failed to load bani');
    }
}
```

**Example: Sehaj Paath Reader Integration**

```javascript
// In reader.js or similar

async function loadAng(angNumber) {
    try {
        // Load the Ang (from cache or API)
        const data = await window.baniCacheOptimizer.getAng(angNumber);
        
        // Render the Ang
        renderAng(data);
        
        // Prefetch surrounding Angs in background
        if (window.smartPrefetch) {
            window.smartPrefetch.prefetchAroundAng(angNumber);
        }
        
    } catch (error) {
        console.error('Failed to load Ang:', error);
        showError('Failed to load Ang');
    }
}
```

### Step 3: Add Download Controls (Optional)

Add buttons to your UI:

```html
<button onclick="downloadForOffline()">
    📥 Download for Offline
</button>

<script>
async function downloadForOffline() {
    if (!window.baniCacheOptimizer) return;
    
    // Download all Nitnem Banis
    await window.baniCacheOptimizer.queueBanisForDownload([2, 4, 6, 7, 9, 10]);
    
    // Or download Ang range
    const angs = Array.from({length: 50}, (_, i) => i + 1);
    await window.baniCacheOptimizer.queueAngsForDownload(angs);
}
</script>
```

## 📊 Storage Information

### Storage Estimates

- **Single Bani**: ~50-200 KB
- **Single Ang**: ~30-100 KB
- **All Nitnem Banis**: ~1-2 MB
- **Complete GGSJ (1430 Angs)**: ~50-100 MB

### Browser Limits

- **Chrome/Edge**: ~60% of available disk space
- **Firefox**: ~50% of available disk space
- **Safari**: ~1 GB (may prompt user)

### Checking Storage

```javascript
const storage = await cache.getStorageEstimate();
console.log(`Using ${storage.usageInMB} MB of ${storage.quotaInMB} MB`);
console.log(`${storage.percentUsed}% used`);
```

## 🎯 Usage Patterns

### Pattern 1: Instant Reading with Background Download

```javascript
// User opens a Bani
async function openBani(baniId) {
    // Load immediately (from cache or API)
    const data = await cache.getBani(baniId);
    renderBani(data);
    
    // Queue related Banis for background download
    const relatedBanis = getRelatedBanis(baniId);
    cache.queueBanisForDownload(relatedBanis);
}
```

### Pattern 2: Progressive Ang Reading

```javascript
// User reads Sehaj Paath
async function readAng(angNumber) {
    // Load current Ang
    const data = await cache.getAng(angNumber);
    renderAng(data);
    
    // Prefetch next 5 Angs in background
    const nextAngs = [angNumber + 1, angNumber + 2, angNumber + 3, angNumber + 4, angNumber + 5];
    cache.queueAngsForDownload(nextAngs);
}
```

### Pattern 3: Bulk Download for Offline

```javascript
// User wants complete offline access
async function prepareOfflineMode() {
    // Show confirmation
    if (!confirm('Download all content for offline access?')) return;
    
    // Queue everything
    await cache.queueAllAngs();
    await cache.queueBanisForDownload([2, 4, 6, 7, 9, 10, 21, 23, 31, 36, 90]);
    
    // UI will show progress automatically
}
```

## 🔔 Event Handling

Listen to download events:

```javascript
cache.onDownloadProgress((event) => {
    switch (event.event) {
        case 'download_started':
            console.log('Download started');
            break;
            
        case 'progress':
            const { completed, total, percentage } = event.data;
            console.log(`Progress: ${percentage}%`);
            updateProgressBar(percentage);
            break;
            
        case 'download_completed':
            console.log('Download complete!');
            showNotification('All content downloaded');
            break;
            
        case 'download_paused':
            console.log('Download paused');
            break;
            
        case 'download_cancelled':
            console.log('Download cancelled');
            break;
            
        case 'item_failed':
            console.error('Failed:', event.data);
            break;
    }
});
```

## 🧪 Testing

### Test Page

Open `frontend/test-background-download.html` to test:

1. **Quick Actions**: Download Nitnem/Popular Banis
2. **Custom Downloads**: Specify Bani IDs or Ang ranges
3. **Complete Download**: Download all 1430 Angs
4. **Controls**: Pause/Resume/Cancel
5. **Statistics**: View cache stats and storage usage
6. **Event Log**: Monitor download events

### Manual Testing

```javascript
// Open browser console on any page

// Test Bani caching
await window.baniCacheOptimizer.getBani(2);

// Test Ang caching
await window.baniCacheOptimizer.getAng(1);

// Test queue
await window.baniCacheOptimizer.queueBanisForDownload([2, 4, 6]);

// Check stats
const stats = await window.baniCacheOptimizer.getCacheStats();
console.log(stats);

// Check storage
const storage = await window.baniCacheOptimizer.getStorageEstimate();
console.log(storage);
```

## 🐛 Troubleshooting

### Issue: Downloads not starting

**Solution:**
```javascript
// Check if cache is initialized
if (!window.baniCacheOptimizer) {
    console.error('Cache not initialized');
}

// Check online status
if (!navigator.onLine) {
    console.error('Offline - downloads paused');
}

// Check queue
const progress = cache.getDownloadProgress();
console.log('Queue:', progress);
```

### Issue: Storage quota exceeded

**Solution:**
```javascript
// Check storage
const storage = await cache.getStorageEstimate();
if (storage.percentUsed > 90) {
    console.warn('Storage almost full');
    
    // Clear old cache
    await cache.clearAllCaches();
}
```

### Issue: Slow downloads

**Solution:**
```javascript
// Check connection speed
if (navigator.connection) {
    console.log('Connection:', navigator.connection.effectiveType);
}

// Reduce prefetch window
window.smartPrefetch.prefetchWindow = 2;
```

## 🚀 Performance Tips

1. **Prioritize visible content**: Load current content first, queue background downloads
2. **Use smart prefetching**: Let the system predict what to download
3. **Monitor storage**: Check usage regularly, clear old cache if needed
4. **Rate limiting**: Built-in 300ms delay between downloads
5. **Network awareness**: System automatically adjusts to connection speed

## 📱 Mobile Considerations

- **Battery**: Downloads pause when battery is low (if Battery API available)
- **Data**: Respect user's data saver settings
- **Storage**: Mobile devices have less storage - be conservative
- **Background**: Downloads continue even when tab is in background

## 🔐 Security

- All downloads use HTTPS
- Content validated before caching
- No sensitive data stored
- User can clear cache anytime

## 📝 API Reference

See inline JSDoc comments in source files for complete API documentation.

## 🎉 Summary

The Background Download System provides:
- ✅ Seamless online reading experience
- ✅ Automatic background downloading
- ✅ Intelligent caching and prefetching
- ✅ Complete offline support
- ✅ User-friendly progress UI
- ✅ Network-aware optimization
- ✅ Persistent queue across sessions

Users can start reading immediately while the app silently prepares content for offline access!
