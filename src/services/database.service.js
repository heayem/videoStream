/**
 * In-Memory Database Service
 * In production, replace with MongoDB, PostgreSQL, or other database
 */
class DatabaseService {
  constructor() {
    this.users = new Map();
    this.videos = new Map();
    this.sessions = new Map();
  }

  // ============ USER OPERATIONS ============

  /**
   * Create user
   */
  createUser(user) {
    this.users.set(user.id, user);
    return user;
  }

  /**
   * Get user by ID
   */
  getUserById(userId) {
    return this.users.get(userId);
  }

  /**
   * Get user by email
   */
  getUserByEmail(email) {
    for (const [, user] of this.users) {
      if (user.email === email) return user;
    }
    return null;
  }

  /**
   * Get all users
   */
  getAllUsers() {
    return Array.from(this.users.values());
  }

  /**
   * Update user
   */
  updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) return null;
    Object.assign(user, updates, { updatedAt: new Date() });
    return user;
  }

  /**
   * Delete user
   */
  deleteUser(userId) {
    return this.users.delete(userId);
  }

  /**
   * User exists check
   */
  userExists(email) {
    return this.getUserByEmail(email) !== null;
  }

  // ============ VIDEO OPERATIONS ============

  /**
   * Create video
   */
  createVideo(video) {
    this.videos.set(video.id, video);
    return video;
  }

  /**
   * Get video by ID
   */
  getVideoById(videoId) {
    return this.videos.get(videoId);
  }

  /**
   * Get videos by user ID
   */
  getVideosByUserId(userId) {
    const userVideos = [];
    for (const [, video] of this.videos) {
      if (video.userId === userId) userVideos.push(video);
    }
    return userVideos;
  }

  /**
   * Get all videos
   */
  getAllVideos() {
    return Array.from(this.videos.values());
  }

  /**
   * Update video
   */
  updateVideo(videoId, updates) {
    const video = this.videos.get(videoId);
    if (!video) return null;
    Object.assign(video, updates, { updatedAt: new Date() });
    return video;
  }

  /**
   * Delete video
   */
  deleteVideo(videoId) {
    return this.videos.delete(videoId);
  }

  // ============ SESSION OPERATIONS ============

  /**
   * Create session
   */
  createSession(userId, token, expiresAt) {
    this.sessions.set(token, { userId, expiresAt, createdAt: new Date() });
  }

  /**
   * Get session
   */
  getSession(token) {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (new Date() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  /**
   * Delete session
   */
  deleteSession(token) {
    return this.sessions.delete(token);
  }

  /**
   * Clear all sessions for user
   */
  clearUserSessions(userId) {
    for (const [token, session] of this.sessions) {
      if (session.userId === userId) {
        this.sessions.delete(token);
      }
    }
  }
}

module.exports = new DatabaseService();
