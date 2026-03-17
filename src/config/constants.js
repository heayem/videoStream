const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');
const IS_VERCEL = process.env.VERCEL || process.env.NOW_REGION;
const IS_NETLIFY = process.env.NETLIFY === 'true';
const IS_LAMBDA = !!process.env.LAMBDA_TASK_ROOT || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const IS_SERVERLESS = IS_VERCEL || IS_NETLIFY || IS_LAMBDA;

const UPLOADS_DIR = IS_SERVERLESS ? '/tmp/uploads' : path.join(ROOT_DIR, 'uploads');
const OUTPUT_DIR = IS_SERVERLESS ? '/tmp/output' : path.join(ROOT_DIR, 'output');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DB_FILE = IS_SERVERLESS ? '/tmp/videos.json' : path.join(ROOT_DIR, 'videos.json');

module.exports = {
    ROOT_DIR,
    UPLOADS_DIR,
    OUTPUT_DIR,
    PUBLIC_DIR,
    DB_FILE,
    PORT: process.env.PORT || 3000
};
