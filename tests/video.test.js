/** @jest-environment node */
const request = require('supertest');
const app = require('../index');
const path = require('path');
const fs = require('fs');
const { DB_FILE } = require('../src/config/constants');

describe('Video API', () => {
    let testVideoId;

    beforeAll(() => {
        // Reset DB or use a test DB if possible
        if (fs.existsSync(DB_FILE)) {
            fs.renameSync(DB_FILE, `${DB_FILE}.bak`);
        }
        fs.writeFileSync(DB_FILE, JSON.stringify([]));
    });

    afterAll(() => {
        // Restore DB
        if (fs.existsSync(`${DB_FILE}.bak`)) {
            fs.renameSync(`${DB_FILE}.bak`, DB_FILE);
        }
    });

    it('should list all videos (initially empty)', async () => {
        const res = await request(app).get('/api/videos');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(0);
    });

    // Note: Testing upload requires a real file or a mock
    // For this demonstration, we'll check the GET and DELETE if we had an ID
    
    it('should return 404 for non-existent video', async () => {
        const res = await request(app).get('/api/videos/non-existent-id');
        expect(res.statusCode).toEqual(404);
    });
});
