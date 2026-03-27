const db = require('../services/database.service');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * Subscription Management Controller
 */
class SubscriptionController {
  /**
   * Get subscription plans
   * GET /api/subscriptions/plans
   */
  getPlans = asyncHandler(async (req, res) => {
    const plans = {
      free: {
        name: 'Free',
        price: 0,
        billingCycle: 'monthly',
        features: {
          maxVideos: 5,
          maxStorageGB: 1,
          maxResolutions: 1,
          maxUploadSizeMB: 100,
          supportLevel: 'community',
          analytics: false,
          customBranding: false,
        },
      },
      premium: {
        name: 'Premium',
        price: 9.99,
        billingCycle: 'monthly',
        features: {
          maxVideos: 100,
          maxStorageGB: 100,
          maxResolutions: 3,
          maxUploadSizeMB: 2000,
          supportLevel: 'email',
          analytics: true,
          customBranding: false,
        },
      },
      enterprise: {
        name: 'Enterprise',
        price: 99.99,
        billingCycle: 'monthly',
        features: {
          maxVideos: 'unlimited',
          maxStorageGB: 'unlimited',
          maxResolutions: 'unlimited',
          maxUploadSizeMB: 'unlimited',
          supportLevel: 'priority',
          analytics: true,
          customBranding: true,
        },
      },
    };

    res.status(200).json({
      success: true,
      data: plans,
    });
  });

  /**
   * Get user subscription
   * GET /api/subscriptions/me
   */
  getUserSubscription = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const user = db.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isActive = user.isSubscriptionActive();

    res.status(200).json({
      success: true,
      data: {
        plan: user.subscription,
        isActive,
        expiryDate: user.subscriptionExpiry,
        createdAt: user.createdAt,
      },
    });
  });

  /**
   * Upgrade subscription
   * POST /api/subscriptions/upgrade
   */
  upgradeSubscription = asyncHandler(async (req, res) => {
    const { plan } = req.body;
    const userId = req.user.userId;

    if (!['free', 'premium', 'enterprise'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan',
      });
    }

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    user.updateSubscription(plan, expiryDate);

    res.status(200).json({
      success: true,
      message: `Subscription upgraded to ${plan}`,
      data: {
        plan: user.subscription,
        expiryDate: user.subscriptionExpiry,
      },
    });
  });

  /**
   * Downgrade subscription
   * POST /api/subscriptions/downgrade
   */
  downgradeSubscription = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.updateSubscription('free', null);

    res.status(200).json({
      success: true,
      message: 'Subscription downgraded to free',
      data: {
        plan: user.subscription,
        expiryDate: user.subscriptionExpiry,
      },
    });
  });

  /**
   * Cancel subscription
   * POST /api/subscriptions/cancel
   */
  cancelSubscription = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.updateSubscription('free', null);

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled',
      data: {
        plan: user.subscription,
        expiryDate: user.subscriptionExpiry,
      },
    });
  });

  /**
   * Renew subscription
   * POST /api/subscriptions/renew
   */
  renewSubscription = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.subscription === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Cannot renew free subscription',
      });
    }

    // Extend expiry by 30 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    user.updateSubscription(user.subscription, expiryDate);

    res.status(200).json({
      success: true,
      message: 'Subscription renewed',
      data: {
        plan: user.subscription,
        expiryDate: user.subscriptionExpiry,
      },
    });
  });

  /**
   * Get subscription usage
   * GET /api/subscriptions/usage
   */
  getUsage = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const user = db.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const userVideos = db.getVideosByUserId(userId);
    const totalSize = userVideos.reduce((sum, v) => sum + (v.fileSize || 0), 0);
    const totalSizeGB = (totalSize / 1024 / 1024 / 1024).toFixed(2);

    // Get plan limits
    const plans = {
      free: { maxVideos: 5, maxStorageGB: 1 },
      premium: { maxVideos: 100, maxStorageGB: 100 },
      enterprise: { maxVideos: Infinity, maxStorageGB: Infinity },
    };

    const planLimits = plans[user.subscription];

    res.status(200).json({
      success: true,
      data: {
        subscription: user.subscription,
        usage: {
          videos: userVideos.length,
          storageGB: parseFloat(totalSizeGB),
        },
        limits: planLimits,
        percentageUsed: {
          videos: planLimits.maxVideos === Infinity 
            ? 0 
            : Math.round((userVideos.length / planLimits.maxVideos) * 100),
          storage: planLimits.maxStorageGB === Infinity 
            ? 0 
            : Math.round((parseFloat(totalSizeGB) / planLimits.maxStorageGB) * 100),
        },
      },
    });
  });

  /**
   * Get all subscriptions (admin only)
   * GET /api/subscriptions
   */
  getAllSubscriptions = asyncHandler(async (req, res) => {
    const users = db.getAllUsers();
    const subscriptions = users.map(u => ({
      userId: u.id,
      email: u.email,
      name: u.name,
      plan: u.subscription,
      isActive: u.isSubscriptionActive(),
      expiryDate: u.subscriptionExpiry,
      createdAt: u.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: subscriptions,
      total: subscriptions.length,
    });
  });
}

module.exports = new SubscriptionController();
