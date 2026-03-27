const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Video = require('../models/video.model');
const db = require('../services/database.service');
const resolutionService = require('../services/resolution.service');
const { asyncHandler } = require('../middleware/error.middleware');
const { UPLOADS_DIR, OUTPUT_DIR } = require('../config/constants');

/**
 * Enhanced Video Controller with Resolution Management
 */
class VideoController {
  /**
   * List all videos
   * GET /api/videos
   */
  list = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let videos = db.getAllVideos();

    // Filter by user if not admin
    if (req.user && req.user.role !== 'admin') {
      videos = videos.filter(v => v.userId === req.user.userId || v.isPublic);
    }

    // Filter by status
    if (req.query.status) {
      videos = videos.filter(v => v.status === req.query.status);
    }

    const total = videos.length;
    const paginatedVideos = videos.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginatedVideos.map(v => v.getPublicData()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  /**
   * Get video by ID
   * GET /api/videos/:id
   */
  get = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const video = db.getVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    // Check access permissions
    if (!video.isPublic && req.user?.userId !== video.userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const data = req.user?.userId === video.userId || req.user?.role === 'admin' 
      ? video.getFullData() 
      : video.getPublicData();

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * Upload video
   * POST /api/videos
   */
  upload = asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const file = req.files[0];
    const { title, description, isPublic, resolutions } = req.body;

    // Create video record
    const video = new Video(req.user.userId, file.filename, file.size, file.mimetype);
    
    if (title) video.title = title;
    if (description) video.description = description;
    if (isPublic) video.isPublic = isPublic === 'true';

    video.setStatus('processing');
    db.createVideo(video);

    // Process video asynchronously
    setImmediate(async () => {
      try {
        // Get video info
        const videoInfo = await resolutionService.getVideoInfo(file.path);
        video.updateMetadata(videoInfo);

        // Generate thumbnail
        const thumbnailPath = path.join(OUTPUT_DIR, video.id, 'thumbnail.jpg');
        await resolutionService.generateThumbnail(file.path, thumbnailPath);
        video.thumbnail = `/stream/${video.id}/thumbnail.jpg`;

        // Determine resolutions to generate
        const targetResolutions = resolutions 
          ? resolutions.split(',') 
          : resolutionService.getRecommendedResolutions(videoInfo);

        // Generate HLS stream
        await resolutionService.generateHLSStream(file.path, OUTPUT_DIR, video.id, targetResolutions);

        targetResolutions.forEach(res => {
          video.addResolution(res, `/stream/${video.id}/${res}.mp4`);
        });

        video.setStatus('ready');
        db.updateVideo(video.id, video);

        // Clean up uploaded file
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error('Video processing error:', error);
        video.setStatus('failed', error.message);
        db.updateVideo(video.id, video);
      }
    });

    res.status(202).json({
      success: true,
      message: 'Video uploaded and processing',
      data: video.getFullData(),
    });
  });

  /**
   * Update video metadata
   * PATCH /api/videos/:id
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, isPublic } = req.body;

    const video = db.getVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    // Check ownership
    if (req.user?.userId !== video.userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (isPublic !== undefined) updates.isPublic = isPublic;

    const updatedVideo = db.updateVideo(id, updates);

    res.status(200).json({
      success: true,
      message: 'Video updated',
      data: updatedVideo.getFullData(),
    });
  });

  /**
   * Delete video
   * DELETE /api/videos/:id
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const video = db.getVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    // Check ownership
    if (req.user?.userId !== video.userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Delete video files
    const videoDir = path.join(OUTPUT_DIR, id);
    if (fs.existsSync(videoDir)) {
      fs.rmSync(videoDir, { recursive: true });
    }

    db.deleteVideo(id);

    res.status(200).json({
      success: true,
      message: 'Video deleted',
    });
  });

  /**
   * Stream video
   * GET /api/videos/:id/stream
   */
  stream = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const video = db.getVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    // Check access
    if (!video.isPublic && req.user?.userId !== video.userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Increment views
    video.incrementViews();

    // Return stream info
    res.status(200).json({
      success: true,
      data: {
        id: video.id,
        title: video.title,
        duration: video.duration,
        resolutions: video.resolutions,
        thumbnail: video.thumbnail,
        streamUrl: `/stream/${video.id}/master.m3u8`,
      },
    });
  });

  /**
   * Get video resolutions
   * GET /api/videos/:id/resolutions
   */
  getResolutions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const video = db.getVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        available: video.resolutions,
        recommended: resolutionService.getRecommendedResolutions({
          height: video.height,
        }),
      },
    });
  });

  /**
   * Get user videos
   * GET /api/videos/user/me
   */
  getUserVideos = asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const videos = db.getVideosByUserId(req.user.userId);

    res.status(200).json({
      success: true,
      data: videos.map(v => v.getFullData()),
      total: videos.length,
    });
  });

  /**
   * Get available resolutions
   * GET /api/videos/resolutions/available
   */
  getAvailableResolutions = asyncHandler(async (req, res) => {
    const resolutions = resolutionService.getAvailableResolutions();

    res.status(200).json({
      success: true,
      data: resolutions.map(r => ({
        name: r,
        config: resolutionService.getResolutionConfig(r),
      })),
    });
  });
}

module.exports = new VideoController();
