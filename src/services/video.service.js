const path = require('path');
const fs = require('fs');
const VideoModel = require('../models/video.model');
const convertToHLS = require('../utils/video-converter');
const { UPLOADS_DIR, OUTPUT_DIR } = require('../config/constants');

class VideoService {
    async getAllVideos() {
        return VideoModel.findAll();
    }

    async getVideoById(id) {
        const video = VideoModel.findById(id);
        if (!video) throw new Error('Video not found');
        return video;
    }

    async createVideo(files, title) {
        let videoFile = null;
        let thumbnailFile = null;
        
        if (Array.isArray(files)) {
            videoFile = files.find(f => f.fieldname === 'video');
            thumbnailFile = files.find(f => f.fieldname === 'thumbnail');
        } else if (files) {
            videoFile = files.video ? files.video[0] : null;
            thumbnailFile = files.thumbnail ? files.thumbnail[0] : null;
        }

        if (!videoFile) throw new Error('No video file provided');

        const videoId = path.parse(videoFile.filename).name;
        const newVideo = {
            id: videoId,
            title: title || videoFile.originalname,
            originalName: videoFile.originalname,
            filename: videoFile.filename,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        const createdVideo = VideoModel.create(newVideo);

        // Trigger conversion asynchronously
        this.processVideo(videoFile.filename, thumbnailFile ? thumbnailFile.filename : null, videoId);

        return createdVideo;
    }

    async processVideo(filename, customThumbnailName, videoId) {
        convertToHLS(filename, customThumbnailName, (err) => {
            const status = err ? 'error' : 'ready';
            VideoModel.update(videoId, { status });
        });
    }

    async updateVideoTitle(id, title) {
        const video = await this.getVideoById(id);
        return VideoModel.update(id, { title });
    }

    async deleteVideo(id) {
        const video = await this.getVideoById(id);

        // Remove files
        const uploadPath = path.join(UPLOADS_DIR, video.filename);
        if (fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);

        const hlsPath = path.join(OUTPUT_DIR, video.id);
        if (fs.existsSync(hlsPath)) fs.rmSync(hlsPath, { recursive: true, force: true });

        return VideoModel.delete(id);
    }

    async getStreamUrl(id) {
        const video = await this.getVideoById(id);
        if (video.status !== 'ready') {
            throw new Error(`Video is not ready for streaming (status: ${video.status})`);
        }
        return `/stream/${video.id}/master.m3u8`;
    }
}

module.exports = new VideoService();
