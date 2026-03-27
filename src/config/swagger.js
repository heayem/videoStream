/**
 * Swagger/OpenAPI Configuration
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VideoStream API',
      version: '1.0.0',
      description: 'A comprehensive video streaming platform with authentication, multi-resolution support, and subscription management',
      contact: {
        name: 'VideoStream Support',
        email: 'support@videostream.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.videostream.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            subscription: { type: 'string', enum: ['free', 'premium', 'enterprise'] },
            subscriptionExpiry: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            lastLogin: { type: 'string', format: 'date-time' },
          },
        },
        Video: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            duration: { type: 'number' },
            width: { type: 'integer' },
            height: { type: 'integer' },
            thumbnail: { type: 'string', format: 'uri' },
            resolutions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  resolution: { type: 'string' },
                  filepath: { type: 'string' },
                },
              },
            },
            views: { type: 'integer' },
            isPublic: { type: 'boolean' },
            status: { type: 'string', enum: ['uploading', 'processing', 'ready', 'failed'] },
            uploadedAt: { type: 'string', format: 'date-time' },
          },
        },
        Subscription: {
          type: 'object',
          properties: {
            plan: { type: 'string', enum: ['free', 'premium', 'enterprise'] },
            isActive: { type: 'boolean' },
            expiryDate: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
