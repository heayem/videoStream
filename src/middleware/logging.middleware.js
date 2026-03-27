/**
 * Request Logging Middleware
 */
const logging = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.user) {
    console.log(`  User: ${req.user.userId}`);
  }

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const reset = '\x1b[0m';

    console.log(
      `  ${statusColor}${res.statusCode}${reset} - ${duration}ms`
    );
  });

  next();
};

/**
 * Error logging
 */
const errorLogging = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.userId,
  });

  next(err);
};

module.exports = {
  logging,
  errorLogging,
};
