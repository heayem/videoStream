const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { UPLOADS_DIR } = require('../config/constants');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const isVideoMime = file.mimetype.startsWith('video/');
        const isVttMime = file.mimetype === 'text/vtt';
        const isImageMime = file.mimetype.startsWith('image/');
        const isVideoExt = file.originalname.toLowerCase().match(/\.(mp4|avi|mkv|webm|mov|flv|wmv|ts)$/);
        const isVttExt = file.originalname.toLowerCase().endsWith('.vtt');
        const isImageExt = file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/);
        
        if (isVideoMime || isVttMime || isVideoExt || isVttExt || isImageMime || isImageExt) {
            cb(null, true);
        } else {
            console.error('File rejected:', file.originalname, 'mime:', file.mimetype);
            cb(new Error(`Only video/image/vtt files are allowed. Received: ${file.mimetype} for ${file.originalname}`));
        }
    }
});

module.exports = upload;
