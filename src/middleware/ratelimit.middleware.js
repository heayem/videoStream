/**
 * Simple in-memory rate limiting middleware
 */
class RateLimiter {
  constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  /**
   * Get rate limit key (IP or user ID)
   */
  getKey(req) {
    return req.user?.userId || req.ip || req.connection.remoteAddress;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key) {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record) {
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    // Reset window if expired
    if (now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    // Check if limit exceeded
    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key) {
    const record = this.requests.get(key);
    if (!record) return this.maxRequests;

    const now = Date.now();
    if (now > record.resetTime) return this.maxRequests;

    return Math.max(0, this.maxRequests - record.count);
  }

  /**
   * Get reset time
   */
  getResetTime(key) {
    const record = this.requests.get(key);
    return record?.resetTime || Date.now();
  }
}

// Create rate limiters for different endpoints
const generalLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100)
);

const authLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes
const uploadLimiter = new RateLimiter(60 * 60 * 1000, 10); // 10 uploads per hour

/**
 * Rate limit middleware factory
 */
const rateLimit = (limiter) => {
  return (req, res, next) => {
    const key = limiter.getKey(req);

    if (!limiter.isAllowed(key)) {
      const resetTime = limiter.getResetTime(key);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter,
      });
    }

    // Add rate limit info to response headers
    res.set('X-RateLimit-Limit', limiter.maxRequests);
    res.set('X-RateLimit-Remaining', limiter.getRemaining(key));
    res.set('X-RateLimit-Reset', limiter.getResetTime(key));

    next();
  };
};

module.exports = {
  rateLimit,
  generalLimiter,
  authLimiter,
  uploadLimiter,
};
