const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');
const IS_VERCEL = process.env.VERCEL || process.env.NOW_REGION;

const UPLOADS_DIR = IS_VERCEL ? '/tmp/uploads' : path.join(ROOT_DIR, 'uploads');
const OUTPUT_DIR = IS_VERCEL ? '/tmp/output' : path.join(ROOT_DIR, 'output');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DB_FILE = IS_VERCEL ? '/tmp/videos.json' : path.join(ROOT_DIR, 'videos.json');

module.exports = {
    ROOT_DIR,
    UPLOADS_DIR,
    OUTPUT_DIR,
    PUBLIC_DIR,
    DB_FILE,
    PORT: process.env.PORT || 3000
};
