const authService = require('../services/auth.service');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * Authentication Controller
 */
class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    const user = authService.register(email, password, name);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  });

  /**
   * Login user
   * POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = authService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    const token = req.token;

    if (token) {
      authService.logout(token);
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  });

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getMe = asyncHandler(async (req, res) => {
    const user = authService.getCurrentUser(req.token);

    res.status(200).json({
      success: true,
      data: user.getProfile(),
    });
  });

  /**
   * Change password
   * POST /api/auth/change-password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = authService.changePassword(userId, oldPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: user,
    });
  });

  /**
   * Refresh token
   * POST /api/auth/refresh
   */
  refreshToken = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const result = authService.refreshToken(userId);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  });

  /**
   * Verify token
   * GET /api/auth/verify
   */
  verifyToken = asyncHandler(async (req, res) => {
    const user = authService.getCurrentUser(req.token);

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: user.getProfile(),
    });
  });
}

module.exports = new AuthController();
