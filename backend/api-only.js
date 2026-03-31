const express = require('express');
const app = express();
const PORT = 3000;

// API ONLY - no static files for now
app.get('/api/radio/live', (req, res) => {
    res.json({
        trackIndex: 25,
        trackTitle: 'Day 25 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ',
        trackPosition: 123.45,
        listenersCount: 1,
        serverTime: Date.now()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 for everything else
app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path });
});

app.listen(PORT, () => {
    console.log('API-only server running on http://localhost:' + PORT);
    console.log('Test: http://localhost:' + PORT + '/api/radio/live');
});
