const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');

/**
 * Video Resolution Management Service
 * Handles transcoding to multiple resolutions
 */
class ResolutionService {
  constructor() {
    this.resolutions = {
      '360p': { width: 640, height: 360, bitrate: '800k' },
      '480p': { width: 854, height: 480, bitrate: '1200k' },
      '720p': { width: 1280, height: 720, bitrate: '2500k' },
      '1080p': { width: 1920, height: 1080, bitrate: '5000k' },
    };
  }

  /**
   * Get available resolutions
   */
  getAvailableResolutions() {
    return Object.keys(this.resolutions);
  }

  /**
   * Get resolution config
   */
  getResolutionConfig(resolution) {
    return this.resolutions[resolution];
  }

  /**
   * Transcode video to specific resolution
   */
  transcodeToResolution(inputPath, outputPath, resolution) {
    return new Promise((resolve, reject) => {
      const config = this.resolutions[resolution];

      if (!config) {
        return reject(new Error(`Invalid resolution: ${resolution}`));
      }

      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(`${config.width}x${config.height}`)
        .videoBitrate(config.bitrate)
        .audioBitrate('128k')
        .audioChannels(2)
        .audioFrequency(44100)
        .format('mp4')
        .on('end', () => {
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(err);
        })
        .run();
    });
  }

  /**
   * Generate HLS stream with multiple resolutions
   */
  generateHLSStream(inputPath, outputDir, videoId, resolutions = ['360p', '480p', '720p']) {
    return new Promise(async (resolve, reject) => {
      try {
        // Create video directory
        const videoDir = path.join(outputDir, videoId);
        if (!fs.existsSync(videoDir)) {
          fs.mkdirSync(videoDir, { recursive: true });
        }

        const variants = [];

        // Transcode to each resolution
        for (const resolution of resolutions) {
          const config = this.resolutions[resolution];
          const outputPath = path.join(videoDir, `${resolution}.mp4`);

          await this.transcodeToResolution(inputPath, outputPath, resolution);

          variants.push({
            resolution,
            bitrate: config.bitrate,
            file: `${resolution}.mp4`,
          });
        }

        // Generate master playlist
        const masterPlaylist = this.generateMasterPlaylist(variants);
        const masterPath = path.join(videoDir, 'master.m3u8');
        fs.writeFileSync(masterPath, masterPlaylist);

        resolve({
          videoId,
          variants,
          masterPlaylist: 'master.m3u8',
          outputDir: videoDir,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate master M3U8 playlist
   */
  generateMasterPlaylist(variants) {
    let playlist = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=';

    const lines = variants.map(v => {
      const bandwidth = this.bitrateToBandwidth(v.bitrate);
      return `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${this.resolutions[v.resolution].width}x${this.resolutions[v.resolution].height}\n${v.file}`;
    });

    return '#EXTM3U\n#EXT-X-VERSION:3\n' + lines.join('\n');
  }

  /**
   * Convert bitrate string to bandwidth number
   */
  bitrateToBandwidth(bitrate) {
    const match = bitrate.match(/(\d+)k/);
    if (match) {
      return parseInt(match[1]) * 1000;
    }
    return 0;
  }

  /**
   * Get video information
   */
  getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          return reject(err);
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        resolve({
          duration: metadata.format.duration,
          width: videoStream?.width,
          height: videoStream?.height,
          bitrate: metadata.format.bit_rate,
          codec: videoStream?.codec_name,
          audioCodec: audioStream?.codec_name,
          fps: videoStream?.r_frame_rate,
          size: metadata.format.size,
        });
      });
    });
  }

  /**
   * Generate thumbnail from video
   */
  generateThumbnail(videoPath, outputPath, timeInSeconds = 1) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', () => {
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(err);
        })
        .screenshot({
          timestamps: [timeInSeconds],
          filename: 'thumbnail.jpg',
          folder: path.dirname(outputPath),
          size: '320x240',
        });
    });
  }

  /**
   * Get recommended resolutions based on source video
   */
  getRecommendedResolutions(videoInfo) {
    const sourceHeight = videoInfo.height;
    const recommended = [];

    if (sourceHeight >= 360) recommended.push('360p');
    if (sourceHeight >= 480) recommended.push('480p');
    if (sourceHeight >= 720) recommended.push('720p');
    if (sourceHeight >= 1080) recommended.push('1080p');

    return recommended.length > 0 ? recommended : ['360p'];
  }
}

module.exports = new ResolutionService();
