const VideoService = require('../services/video.service');

class VideoController {
    async list(req, res) {
        try {
            const videos = await VideoService.getAllVideos();
            res.json(videos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async get(req, res) {
        try {
            const video = await VideoService.getVideoById(req.params.id);
            res.json(video);
        } catch (error) {
            const status = error.message === 'Video not found' ? 404 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    async upload(req, res) {
        try {
            const video = await VideoService.createVideo(req.files || {}, req.body.title);
            res.status(201).json(video);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const video = await VideoService.updateVideoTitle(req.params.id, req.body.title);
            res.json(video);
        } catch (error) {
            const status = error.message === 'Video not found' ? 404 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            await VideoService.deleteVideo(req.params.id);
            res.status(204).send();
        } catch (error) {
            const status = error.message === 'Video not found' ? 404 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    async stream(req, res) {
        try {
            const streamUrl = await VideoService.getStreamUrl(req.params.id);


            console.log(streamUrl)
            
            res.json({ streamUrl });
        } catch (error) {
            const status = error.message.includes('not ready') ? 400 : (error.message === 'Video not found' ? 404 : 500);
            res.status(status).json({ error: error.message });
        }
    }
}

module.exports = new VideoController();
