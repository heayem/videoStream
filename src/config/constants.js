const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const OUTPUT_DIR = path.join(ROOT_DIR, 'output');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DB_FILE = path.join(ROOT_DIR, 'videos.json');

module.exports = {
    ROOT_DIR,
    UPLOADS_DIR,
    OUTPUT_DIR,
    PUBLIC_DIR,
    DB_FILE,
    PORT: process.env.PORT || 3000
};
