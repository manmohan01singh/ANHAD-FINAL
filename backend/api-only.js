const express = require('express');
const app = express();
const PORT = 3000;
const path = require('path');

// Serve static files from frontend directory
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API routes
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
    console.log('Server running on http://localhost:' + PORT);
    console.log('Serving static files from:', frontendPath);
    console.log('Test: http://localhost:' + PORT + '/api/radio/live');
});
