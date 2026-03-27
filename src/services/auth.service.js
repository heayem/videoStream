const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const db = require('./database.service');

/**
 * Authentication Service
 */
class AuthService {
  /**
   * Register new user
   */
  register(email, password, name) {
    // Check if user already exists
    if (db.userExists(email)) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const user = new User(email, password, name, 'user', 'free');
    db.createUser(user);

    return user.getProfile();
  }

  /**
   * Login user
   */
  login(email, password) {
    const user = db.getUserByEmail(email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.verifyPassword(password)) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    // Record login
    user.recordLogin();

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Store session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    db.createSession(token, user.id, expiresAt);

    return {
      token,
      user: user.getProfile(),
      expiresIn: '7d',
    };
  }

  /**
   * Logout user
   */
  logout(token) {
    db.deleteSession(token);
    return true;
  }

  /**
   * Generate JWT token
   */
  generateToken(userId) {
    const payload = { userId };
    const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production_12345';
    const expiresIn = process.env.JWT_EXPIRE || '7d';

    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production_12345';
      const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get current user from token
   */
  getCurrentUser(token) {
    const decoded = this.verifyToken(token);
    const user = db.getUserById(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Change password
   */
  changePassword(userId, oldPassword, newPassword) {
    const user = db.getUserById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.verifyPassword(oldPassword)) {
      throw new Error('Current password is incorrect');
    }

    user.setPassword(newPassword);
    return user.getProfile();
  }

  /**
   * Refresh token
   */
  refreshToken(userId) {
    const user = db.getUserById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const token = this.generateToken(userId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    db.createSession(token, userId, expiresAt);

    return {
      token,
      expiresIn: '7d',
    };
  }
}

module.exports = new AuthService();
