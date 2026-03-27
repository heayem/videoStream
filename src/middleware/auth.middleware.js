const authService = require('../services/auth.service');

/**
 * Authentication middleware - Verify JWT token
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing',
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    const decoded = authService.verifyToken(token);
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Unauthorized',
    });
  }
};

/**
 * Authorization middleware - Check user role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const user = require('../services/database.service').getUserById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      req.user.role = user.role;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization error',
      });
    }
  };
};

/**
 * Optional authentication middleware
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      const decoded = authService.verifyToken(token);
      req.user = decoded;
      req.token = token;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};
