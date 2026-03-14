const fs = require('fs');
const { DB_FILE } = require('../config/constants');

class VideoModel {
    static getVideos() {
        if (!fs.existsSync(DB_FILE)) return [];
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return data ? JSON.parse(data) : [];
    }

    static saveVideos(videos) {
        fs.writeFileSync(DB_FILE, JSON.stringify(videos, null, 2));
    }

    static findAll() {
        return this.getVideos();
    }

    static findById(id) {
        return this.getVideos().find(v => v.id === id);
    }

    static create(videoData) {
        const videos = this.getVideos();
        videos.push(videoData);
        this.saveVideos(videos);
        return videoData;
    }

    static update(id, updates) {
        const videos = this.getVideos();
        const index = videos.findIndex(v => v.id === id);
        if (index === -1) return null;

        videos[index] = { ...videos[index], ...updates };
        this.saveVideos(videos);
        return videos[index];
    }

    static delete(id) {
        const videos = this.getVideos();
        const newVideos = videos.filter(v => v.id !== id);
        this.saveVideos(newVideos);
        return true;
    }
}

module.exports = VideoModel;
