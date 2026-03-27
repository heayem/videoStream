const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

/**
 * Subscription Management Routes
 */

// Get subscription plans - GET /api/subscriptions/plans
router.get('/plans',
  subscriptionController.getPlans
);

// Get user subscription - GET /api/subscriptions/me
router.get('/me',
  authenticate,
  subscriptionController.getUserSubscription
);

// Get subscription usage - GET /api/subscriptions/usage
router.get('/usage',
  authenticate,
  subscriptionController.getUsage
);

// Get all subscriptions (admin only) - GET /api/subscriptions
router.get('/',
  authenticate,
  authorize('admin'),
  subscriptionController.getAllSubscriptions
);

// Upgrade subscription - POST /api/subscriptions/upgrade
router.post('/upgrade',
  authenticate,
  validate(schemas.updateSubscription),
  subscriptionController.upgradeSubscription
);

// Downgrade subscription - POST /api/subscriptions/downgrade
router.post('/downgrade',
  authenticate,
  subscriptionController.downgradeSubscription
);

// Cancel subscription - POST /api/subscriptions/cancel
router.post('/cancel',
  authenticate,
  subscriptionController.cancelSubscription
);

// Renew subscription - POST /api/subscriptions/renew
router.post('/renew',
  authenticate,
  subscriptionController.renewSubscription
);

module.exports = router;
