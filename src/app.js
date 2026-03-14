const express = require('express');
const fs = require('fs');
const path = require('path');
const { PUBLIC_DIR, OUTPUT_DIR, UPLOADS_DIR } = require('./config/constants');
const videoRoutes = require('./routes/video.routes');

const app = express();

app.use(express.json());

// Ensure directories exist
[UPLOADS_DIR, OUTPUT_DIR, PUBLIC_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Serve frontend
app.use(express.static(PUBLIC_DIR));

// Serve HLS streams
app.use('/stream', express.static(OUTPUT_DIR));

// API Routes
app.use('/api/videos', videoRoutes);

// Dedicated Watch/Play Route 
app.get('/watch/:id', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'watch.html'));
});

// Embed Route
app.get('/embed/:id', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'Embed.html'));
});

module.exports = app;
