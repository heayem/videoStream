const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/video.controller');
const upload = require('../middleware/upload.middleware');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { rateLimit, uploadLimiter } = require('../middleware/ratelimit.middleware');

/**
 * Video Management Routes
 */

// List all videos - GET /api/videos
router.get('/', optionalAuth, VideoController.list);

// Get available resolutions - GET /api/videos/resolutions/available
router.get('/resolutions/available', VideoController.getAvailableResolutions);

// Get user videos - GET /api/videos/user/me
router.get('/user/me', authenticate, VideoController.getUserVideos);

// Get video by ID - GET /api/videos/:id
router.get('/:id', optionalAuth, VideoController.get);

// Get video resolutions - GET /api/videos/:id/resolutions
router.get('/:id/resolutions', optionalAuth, VideoController.getResolutions);

// Get video stream - GET /api/videos/:id/stream
router.get('/:id/stream', optionalAuth, VideoController.stream);

// Upload video - POST /api/videos
router.post('/', 
  authenticate,
  rateLimit(uploadLimiter),
  upload.any(),
  VideoController.upload
);

// Update video metadata - PATCH /api/videos/:id
router.patch('/:id', 
  authenticate,
  validate(schemas.updateVideo),
  VideoController.update
);

// Delete video - DELETE /api/videos/:id
router.delete('/:id', 
  authenticate,
  VideoController.delete
);

module.exports = router;
