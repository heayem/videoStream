const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

/**
 * User Management Routes
 */

// Get all users (admin only) - GET /api/users
router.get('/', 
  authenticate,
  authorize('admin'),
  userController.getAllUsers
);

// List users with pagination - GET /api/users/list
router.get('/list',
  authenticate,
  authorize('admin'),
  userController.listUsers
);

// Get user by ID - GET /api/users/:id
router.get('/:id', 
  authenticate,
  userController.getUserById
);

// Get user statistics - GET /api/users/:id/stats
router.get('/:id/stats',
  authenticate,
  userController.getUserStats
);

// Update user profile - PATCH /api/users/:id
router.patch('/:id', 
  authenticate,
  validate(schemas.updateProfile),
  userController.updateUser
);

// Delete user (admin only) - DELETE /api/users/:id
router.delete('/:id', 
  authenticate,
  authorize('admin'),
  userController.deleteUser
);

// Deactivate user account - POST /api/users/:id/deactivate
router.post('/:id/deactivate',
  authenticate,
  userController.deactivateUser
);

// Activate user account (admin only) - POST /api/users/:id/activate
router.post('/:id/activate',
  authenticate,
  authorize('admin'),
  userController.activateUser
);

module.exports = router;
