const db = require('../services/database.service');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * User Management Controller
 */
class UserController {
  /**
   * Get all users (admin only)
   * GET /api/users
   */
  getAllUsers = asyncHandler(async (req, res) => {
    const users = db.getAllUsers();
    const usersData = users.map(u => u.getProfile());

    res.status(200).json({
      success: true,
      data: usersData,
      total: usersData.length,
    });
  });

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = db.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user.getProfile(),
    });
  });

  /**
   * Update user profile
   * PATCH /api/users/:id
   */
  updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    // Check if user exists
    const user = db.getUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      if (db.userExists(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken',
        });
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;

    const updatedUser = db.updateUser(id, updates);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser.getProfile(),
    });
  });

  /**
   * Delete user (admin only)
   * DELETE /api/users/:id
   */
  deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = db.getUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    db.deleteUser(id);
    db.clearUserSessions(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  });

  /**
   * Deactivate user account
   * POST /api/users/:id/deactivate
   */
  deactivateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = db.getUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    db.updateUser(id, { isActive: false });
    db.clearUserSessions(id);

    res.status(200).json({
      success: true,
      message: 'User account deactivated',
    });
  });

  /**
   * Activate user account
   * POST /api/users/:id/activate
   */
  activateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = db.getUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    db.updateUser(id, { isActive: true });

    res.status(200).json({
      success: true,
      message: 'User account activated',
      data: user.getProfile(),
    });
  });

  /**
   * Get user statistics
   * GET /api/users/:id/stats
   */
  getUserStats = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = db.getUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const userVideos = db.getVideosByUserId(id);
    const totalSize = userVideos.reduce((sum, v) => sum + (v.fileSize || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        userId: id,
        totalVideos: userVideos.length,
        totalStorageUsed: totalSize,
        subscription: user.subscription,
        subscriptionExpiry: user.subscriptionExpiry,
        accountCreated: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  });

  /**
   * List all users with pagination
   * GET /api/users?page=1&limit=10
   */
  listUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const allUsers = db.getAllUsers();
    const total = allUsers.length;
    const users = allUsers.slice(skip, skip + limit).map(u => u.getProfile());

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });
}

module.exports = new UserController();
