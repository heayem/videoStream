const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced Video Model
 */
class Video {
  constructor(userId, filename, fileSize, mimeType) {
    this.id = uuidv4();
    this.userId = userId;
    this.filename = filename;
    this.fileSize = fileSize;
    this.mimeType = mimeType;
    this.title = filename.replace(/\.[^/.]+$/, '');
    this.description = '';
    this.duration = null;
    this.width = null;
    this.height = null;
    this.thumbnail = null;
    this.resolutions = [];
    this.isPublic = false;
    this.views = 0;
    this.uploadedAt = new Date();
    this.updatedAt = new Date();
    this.status = 'uploading'; // uploading, processing, ready, failed
    this.error = null;
  }

  /**
   * Get public data
   */
  getPublicData() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      duration: this.duration,
      width: this.width,
      height: this.height,
      thumbnail: this.thumbnail,
      resolutions: this.resolutions,
      views: this.views,
      uploadedAt: this.uploadedAt,
      isPublic: this.isPublic,
      status: this.status,
    };
  }

  /**
   * Get full data (for owner)
   */
  getFullData() {
    return {
      ...this.getPublicData(),
      userId: this.userId,
      filename: this.filename,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      updatedAt: this.updatedAt,
      error: this.error,
    };
  }

  /**
   * Update video metadata
   */
  updateMetadata(metadata) {
    if (metadata.duration) this.duration = metadata.duration;
    if (metadata.width) this.width = metadata.width;
    if (metadata.height) this.height = metadata.height;
    if (metadata.thumbnail) this.thumbnail = metadata.thumbnail;
    this.updatedAt = new Date();
  }

  /**
   * Add resolution
   */
  addResolution(resolution, filepath) {
    if (!this.resolutions.find(r => r.resolution === resolution)) {
      this.resolutions.push({
        resolution,
        filepath,
        addedAt: new Date(),
      });
      this.updatedAt = new Date();
    }
  }

  /**
   * Set status
   */
  setStatus(status, error = null) {
    this.status = status;
    if (error) this.error = error;
    this.updatedAt = new Date();
  }

  /**
   * Increment views
   */
  incrementViews() {
    this.views++;
    this.updatedAt = new Date();
  }
}

module.exports = Video;
