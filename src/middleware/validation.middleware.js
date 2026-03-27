const Joi = require('joi');

/**
 * Validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }

    req.body = value;
    next();
  };
};

/**
 * Validation schemas
 */
const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required',
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required',
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  changePassword: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),

  // User schemas
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
  }),

  // Video schemas
  updateVideo: Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().max(1000),
    isPublic: Joi.boolean(),
  }),

  // Subscription schemas
  updateSubscription: Joi.object({
    plan: Joi.string().valid('free', 'premium', 'enterprise').required(),
    expiryDate: Joi.date().iso(),
  }),
};

module.exports = {
  validate,
  schemas,
};
