/**
 * GURBANI RADIO SERVER - With Sehaj Paath API
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { Readable } = require('stream');

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
    R2_BASE_URL: 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev',
    FRONTEND_ROOT: path.join(__dirname, '..', 'frontend'),
    // MAIN_UI is frontend root as MainWebPage does not exist                                                                                                                                                                                                                                                                                                                                                       
    MAIN_UI: path.join(__dirname, '..', 'frontend'),
    SEHAJ_PROGRESS_FILE: path.join(__dirname, '..', 'frontend', 'SehajPaath', 'data', 'sehaj-progress.json'),
};

const PLAYLIST = [
    { id: 1, filename: 'day-1.webm', title: 'Day 1 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 2, filename: 'day-2.webm', title: 'Day 2 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 3, filename: 'day-3.webm', title: 'Day 3 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 4, filename: 'day-4.webm', title: 'Day 4 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 5, filename: 'day-5.webm', title: 'Day 5 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 6, filename: 'day-6.webm', title: 'Day 6 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 7, filename: 'day-7.webm', title: 'Day 7 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 8, filename: 'day-8.webm', title: 'Day 8 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 9, filename: 'day-9.webm', title: 'Day 9 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 10, filename: 'day-10.webm', title: 'Day 10 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 11, filename: 'day-11.webm', title: 'Day 11 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 12, filename: 'day-12.webm', title: 'Day 12 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 13, filename: 'day-13.webm', title: 'Day 13 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 14, filename: 'day-14.webm', title: 'Day 14 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 15, filename: 'day-15.webm', title: 'Day 15 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 16, filename: 'day-16.webm', title: 'Day 16 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 17, filename: 'day-17.webm', title: 'Day 17 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 18, filename: 'day-18.webm', title: 'Day 18 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 19, filename: 'day-19.webm', title: 'Day 19 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 20, filename: 'day-20.webm', title: 'Day 20 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 21, filename: 'day-21.webm', title: 'Day 21 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 22, filename: 'day-22.webm', title: 'Day 22 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 23, filename: 'day-23.webm', title: 'Day 23 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 24, filename: 'day-24.webm', title: 'Day 24 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 25, filename: 'day-25.webm', title: 'Day 25 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 26, filename: 'day-26.webm', title: 'Day 26 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 27, filename: 'day-27.webm', title: 'Day 27 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 28, filename: 'day-28.webm', title: 'Day 28 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 29, filename: 'day-29.webm', title: 'Day 29 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 30, filename: 'day-30.webm', title: 'Day 30 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 31, filename: 'day-31.webm', title: 'Day 31 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 32, filename: 'day-32.webm', title: 'Day 32 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 33, filename: 'day-33.webm', title: 'Day 33 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 34, filename: 'day-34.webm', title: 'Day 34 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 35, filename: 'day-35.webm', title: 'Day 35 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 36, filename: 'day-36.webm', title: 'Day 36 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 37, filename: 'day-37.webm', title: 'Day 37 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 38, filename: 'day-38.webm', title: 'Day 38 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 39, filename: 'day-39.webm', title: 'Day 39 - Gurbani Kirtan', artist: 'Divine Shabad' },
    { id: 40, filename: 'day-40.webm', title: 'Day 40 - Gurbani Kirtan', artist: 'Divine Shabad' }
];

// ═══════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════

// Parse JSON body
app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

// ═══════════════════════════════════════════════════════════════════
// STATIC FILES
// ═══════════════════════════════════════════════════════════════════

// Serve entire frontend folder
app.use(express.static(CONFIG.FRONTEND_ROOT));

// Serve MainWebPage at root
app.use('/', express.static(CONFIG.MAIN_UI));

// ═══════════════════════════════════════════════════════════════════
// SEHAJ PAATH API - Progress Management
// ═══════════════════════════════════════════════════════════════════

// Helper to read progress file
async function readProgressFile() {
    try {
        const data = await fs.readFile(CONFIG.SEHAJ_PROGRESS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Return default progress if file doesn't exist
        return createDefaultProgress();
    }
}

// Helper to write progress file
async function writeProgressFile(progress) {
    try {
        await fs.writeFile(
            CONFIG.SEHAJ_PROGRESS_FILE,
            JSON.stringify(progress, null, 2),
            'utf8'
        );
        return true;
    } catch (error) {
        console.error('[Sehaj Paath] Error writing progress:', error.message);
        return false;
    }
}

// Create default progress structure
function createDefaultProgress() {
    return {
        version: 1,
        currentAng: 1,
        completedAngs: [],
        bookmarks: [],
        history: [],
        totals: {
            totalReadingSeconds: 0,
            completions: 0,
        },
        session: {
            active: false,
            startedAt: null,
            startAng: null,
            lastAng: null,
            seconds: 0,
        },
        settings: {
            theme: 'dark',
            gurmukhiFont: 'noto-sans',
            fontSize: 30,
            fontWeight: 500,
            lineSpacing: 1.9,
            larivaar: false,
            padChed: true,
            showTransliteration: true,
            showEnglish: true,
            showPunjabi: false,
            showProgress: true,
            showProgressPercent: true,
            showAngCounter: true,
            autoScrollEnabled: false,
            autoScrollSpeed: 4,
            dailyAngGoal: 5,
            reminders: {
                enabled: false,
                time: '05:00',
                days: [0, 1, 2, 3, 4, 5, 6],
            },
        },
    };
}

// GET - Fetch progress
app.get('/api/sehaj-paath/progress', async (req, res) => {
    try {
        const progress = await readProgressFile();
        res.json(progress);
    } catch (error) {
        console.error('[Sehaj Paath] Error reading progress:', error.message);
        res.status(500).json({ error: 'Failed to read progress' });
    }
});

// PUT - Save progress
app.put('/api/sehaj-paath/progress', async (req, res) => {
    try {
        const progress = req.body;
        const success = await writeProgressFile(progress);
        if (success) {
            res.json({ success: true, message: 'Progress saved' });
        } else {
            res.status(500).json({ error: 'Failed to save progress' });
        }
    } catch (error) {
        console.error('[Sehaj Paath] Error saving progress:', error.message);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// POST - Update specific fields
app.post('/api/sehaj-paath/progress', async (req, res) => {
    try {
        const updates = req.body;
        const current = await readProgressFile();
        const merged = { ...current, ...updates };
        const success = await writeProgressFile(merged);
        if (success) {
            res.json({ success: true, data: merged });
        } else {
            res.status(500).json({ error: 'Failed to update progress' });
        }
    } catch (error) {
        console.error('[Sehaj Paath] Error updating progress:', error.message);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// POST - Add bookmark
app.post('/api/sehaj-paath/bookmarks', async (req, res) => {
    try {
        const { ang, note } = req.body;
        const progress = await readProgressFile();

        const bookmark = {
            id: `${Date.now()}`,
            ang: Math.max(1, Math.min(1430, Number(ang))),
            note: note || '',
            createdAt: new Date().toISOString(),
        };

        progress.bookmarks = progress.bookmarks || [];
        progress.bookmarks.push(bookmark);

        await writeProgressFile(progress);
        res.json({ success: true, bookmark });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add bookmark' });
    }
});

// DELETE - Remove bookmark
app.delete('/api/sehaj-paath/bookmarks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const progress = await readProgressFile();

        progress.bookmarks = (progress.bookmarks || []).filter(b => b.id !== id);

        await writeProgressFile(progress);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove bookmark' });
    }
});

// ═══════════════════════════════════════════════════════════════════
// AUDIO PROXY
// ═══════════════════════════════════════════════════════════════════

app.get('/audio/:filename', async (req, res) => {
    const filename = req.params.filename;
    const r2Url = `${CONFIG.R2_BASE_URL}/${filename}`;

    console.log(`[Proxy] Fetching: ${r2Url}`);

    try {
        const fetchOptions = {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; GurbaniRadio/1.0)',
                'Accept': '*/*',
            }
        };

        if (req.headers.range) {
            fetchOptions.headers['Range'] = req.headers.range;
        }

        const r2Response = await fetch(r2Url, fetchOptions);

        if (!r2Response.ok && r2Response.status !== 206) {
            console.error(`[Proxy] R2 Error: ${r2Response.status}`);
            return res.status(r2Response.status).json({
                error: 'Audio not found',
                status: r2Response.status
            });
        }

        res.setHeader('Content-Type', r2Response.headers.get('content-type') || 'audio/webm');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        if (r2Response.headers.get('content-length')) {
            res.setHeader('Content-Length', r2Response.headers.get('content-length'));
        }

        if (r2Response.headers.get('content-range')) {
            res.setHeader('Content-Range', r2Response.headers.get('content-range'));
            res.status(206);
        }

        const stream = Readable.fromWeb(r2Response.body);
        stream.pipe(res);

        stream.on('error', (err) => console.error('[Proxy] Stream error:', err.message));
        res.on('close', () => stream.destroy());

    } catch (error) {
        console.error('[Proxy] Error:', error.message);
        res.status(500).json({ error: 'Proxy error', message: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// OTHER API ROUTES
// ═══════════════════════════════════════════════════════════════════

app.get('/api/tracks', (req, res) => {
    res.json({ tracks: PLAYLIST, baseUrl: '/audio' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/test-r2', async (req, res) => {
    const testUrl = `${CONFIG.R2_BASE_URL}/day-31.webm`;
    try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        res.json({ success: response.ok, status: response.status, url: testUrl });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Root
app.get('/', (req, res) => {
    res.sendFile(path.join(CONFIG.MAIN_UI, 'index.html'));
});

// Service Worker - serve from frontend root
app.get('/sw.js', (req, res) => {
    res.sendFile(path.join(CONFIG.FRONTEND_ROOT, 'sw.js'));
});

// Manifest
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(CONFIG.FRONTEND_ROOT, 'manifest.json'));
});

// ═══════════════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════════════

app.use((req, res) => {
    console.log(`[404] Not found: ${req.path}`);
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        hint: 'Check if the file exists and path is correct'
    });
});

// ═══════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  🙏 GURBANI RADIO SERVER');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  🌐 Home:        http://localhost:${PORT}/`);
    console.log(`  📖 Sehaj Paath: http://localhost:${PORT}/SehajPaath/sehaj-paath.html`);
    console.log(`  📿 Nitnem:      http://localhost:${PORT}/nitnem/indexbani.html`);
    console.log(`  📅 Calendar:    http://localhost:${PORT}/Calendar/Gurupurab-Calendar.html`);
    console.log(`  🎵 Audio:       http://localhost:${PORT}/audio/day-31.webm`);
    console.log('═══════════════════════════════════════════════════════');
});