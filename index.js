require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');

// Import config
const { PORT, PUBLIC_DIR, OUTPUT_DIR, UPLOADS_DIR } = require('./src/config/constants');

// Import middleware
const { securityHeaders, corsOptions } = require('./src/middleware/security.middleware');
const { logging, errorLogging } = require('./src/middleware/logging.middleware');
const { errorHandler } = require('./src/middleware/error.middleware');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const subscriptionRoutes = require('./src/routes/subscription.routes');
const videoRoutes = require('./src/routes/video.routes');

const app = express();

// ============ MIDDLEWARE ============

// Security headers
app.use(securityHeaders);

// Logging
app.use(logging);

// CORS
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Ensure upload directories exist
[UPLOADS_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============ STATIC FILES ============

// Serve frontend
app.use(express.static(PUBLIC_DIR));

// Serve HLS streams
app.use('/stream', express.static(OUTPUT_DIR));

// ============ API DOCUMENTATION ============

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'VideoStream API Documentation',
}));

// Postman collection endpoint
app.get('/api/postman-collection', (req, res) => {
  const collection = require('./src/config/postman-collection.json');
  res.json(collection);
});

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// User management routes
app.use('/api/users', userRoutes);

// Subscription routes
app.use('/api/subscriptions', subscriptionRoutes);

// Video routes
app.use('/api/videos', videoRoutes);

// ============ LEGACY ROUTES ============

// Dedicated Watch/Play Route
app.get('/watch/:id', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'watch.html'));
});

// Embed Route
app.get('/embed/:id', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'Embed.html'));
});

// ============ ERROR HANDLING ============

// Error logging
app.use(errorLogging);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global error handler
app.use(errorHandler);

// ============ SERVER START ============

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`VideoStream API Server`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✓ Server running at http://localhost:${PORT}`);
    console.log(`✓ API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`✓ Health Check: http://localhost:${PORT}/api/health`);
    console.log(`${'='.repeat(60)}\n`);
  });
}

module.exports = app;
