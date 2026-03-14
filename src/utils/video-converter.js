const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const { UPLOADS_DIR, OUTPUT_DIR } = require('../config/constants');

ffmpeg.setFfmpegPath(ffmpegPath);

const convertToHLS = (fileName, customThumbnailName, callback) => {
    const inputPath = path.join(UPLOADS_DIR, fileName);
    const folderName = path.parse(fileName).name;
    const outputDir = path.join(OUTPUT_DIR, folderName);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const startTranscoding = () => {
        console.log(`Started transcoding: ${fileName}`);
        ffmpeg(inputPath)
            .outputOptions([
                '-preset fast',
                '-g 48', '-sc_threshold 0',
                '-map 0:v:0', '-map 0:a:0?', '-map 0:v:0', '-map 0:a:0?',
                '-c:v:0 libx264', '-b:v:0 2000k', '-s:v:0 1280x720', '-profile:v:0 main',
                '-c:v:1 libx264', '-b:v:1 800k', '-s:v:1 854x480', '-profile:v:1 baseline',
                '-c:a aac', '-b:a 128k',
                '-var_stream_map', 'v:0,a:0,stream:0 v:1,a:1,stream:1',
                '-master_pl_name master.m3u8',
                '-f hls',
                '-hls_time 10',
                '-hls_list_size 0',
                '-hls_segment_filename', path.join(outputDir, 'v%v_fileSequence%d.ts')
            ])
            .output(path.join(outputDir, 'v%v_prog.m3u8'))
            .on('progress', (progress) => {
                if (progress.percent) {
                    console.log(`Processing ${folderName}: ${Math.floor(progress.percent)}% done`);
                }
            })
            .on('end', () => {
                console.log(`Transcoding finished for ${folderName}!`);
                if (callback) callback(null);
            })
            .on('error', (err) => {
                console.error('Error in multi-quality HLS conversion:', err.message);
                console.log('Falling back to single quality HLS conversion...');
                ffmpeg(inputPath)
                    .outputOptions([
                        '-profile:v baseline',
                        '-level 3.0',
                        '-start_number 0',
                        '-hls_time 10',
                        '-hls_list_size 0',
                        '-f hls'
                    ])
                    .output(path.join(outputDir, 'master.m3u8'))
                    .on('end', () => {
                        if (callback) callback(null);
                    })
                    .on('error', (e) => {
                        if (callback) callback(e);
                    })
                    .run();
            })
            .run();
    };

    if (customThumbnailName) {
        // Use custom thumbnail
        const thumbPath = path.join(UPLOADS_DIR, customThumbnailName);
        if (fs.existsSync(thumbPath)) {
            fs.copyFileSync(thumbPath, path.join(outputDir, 'thumbnail.jpg'));
        }
        startTranscoding();
    } else {
        // Extract thumbnail automatically
        ffmpeg(inputPath)
            .screenshots({
                timestamps: ['00:00:01.000'],
                filename: 'thumbnail.jpg',
                folder: outputDir,
                size: '320x240'
            })
            .on('end', () => {
                startTranscoding();
            })
            .on('error', (err) => {
                console.error('Thumbnail extraction error:', err);
                // Proceed with transcoding even if thumbnail fails
                startTranscoding();
            });
    }
};

module.exports = convertToHLS;
