const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { rateLimit, authLimiter } = require('../middleware/ratelimit.middleware');

/**
 * Authentication Routes
 */

// Register - POST /api/auth/register
router.post('/register', 
  rateLimit(authLimiter),
  validate(schemas.register),
  authController.register
);

// Login - POST /api/auth/login
router.post('/login', 
  rateLimit(authLimiter),
  validate(schemas.login),
  authController.login
);

// Logout - POST /api/auth/logout
router.post('/logout', 
  authenticate,
  authController.logout
);

// Get current user - GET /api/auth/me
router.get('/me', 
  authenticate,
  authController.getMe
);

// Verify token - GET /api/auth/verify
router.get('/verify', 
  authenticate,
  authController.verifyToken
);

// Change password - POST /api/auth/change-password
router.post('/change-password', 
  authenticate,
  validate(schemas.changePassword),
  authController.changePassword
);

// Refresh token - POST /api/auth/refresh
router.post('/refresh', 
  authenticate,
  authController.refreshToken
);

module.exports = router;
