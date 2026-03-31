const express = require('express');
const app = express();
const PORT = 3000;

// Simple API test
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

// Serve frontend files
app.use(express.static('c:\\right\\ANHAD\\frontend'));

app.listen(PORT, () => {
    console.log('Test server running on http://localhost:' + PORT);
    console.log('API test: http://localhost:' + PORT + '/api/radio/live');
});
