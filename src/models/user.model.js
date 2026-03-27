const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * User Model - In-memory storage (can be replaced with MongoDB/PostgreSQL)
 */
class User {
  constructor(email, password, name, role = 'user', subscription = 'free') {
    this.id = uuidv4();
    this.email = email;
    this.passwordHash = null;
    this.name = name;
    this.role = role; // 'admin', 'user'
    this.subscription = subscription; // 'free', 'premium', 'enterprise'
    this.subscriptionExpiry = null;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.lastLogin = null;
    this.setPassword(password);
  }

  /**
   * Hash and set password
   */
  setPassword(password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || 10);
    this.passwordHash = bcrypt.hashSync(password, rounds);
  }

  /**
   * Verify password
   */
  verifyPassword(password) {
    return bcrypt.compareSync(password, this.passwordHash);
  }

  /**
   * Get public profile (without sensitive data)
   */
  getProfile() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      subscription: this.subscription,
      subscriptionExpiry: this.subscriptionExpiry,
      isActive: this.isActive,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin,
    };
  }

  /**
   * Update user subscription
   */
  updateSubscription(plan, expiryDate) {
    this.subscription = plan;
    this.subscriptionExpiry = expiryDate;
    this.updatedAt = new Date();
  }

  /**
   * Check if subscription is active
   */
  isSubscriptionActive() {
    if (this.subscription === 'free') return true;
    if (!this.subscriptionExpiry) return false;
    return new Date() < new Date(this.subscriptionExpiry);
  }

  /**
   * Update last login timestamp
   */
  recordLogin() {
    this.lastLogin = new Date();
    this.updatedAt = new Date();
  }
}

module.exports = User;
