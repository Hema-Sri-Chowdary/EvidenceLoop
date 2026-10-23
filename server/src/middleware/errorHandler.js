/**
 * Centralized Error Handling Middleware
 * Prevents leaking secrets or internal traces while returning structured error responses.
 */

export function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.url}:`, err.message);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }

  // Mongoose CastError (e.g. malformed ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for field: ${err.path}`,
    });
  }

  // Duplicate Key Error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A record with duplicate unique fields already exists',
    });
  }

  // Custom status code if provided
  const status = err.statusCode || err.status || 500;
  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error. Please try again later.'
    : err.message || 'An unexpected server error occurred';

  res.status(status).json({
    success: false,
    message,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
}
