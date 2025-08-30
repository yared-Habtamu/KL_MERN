// Centralized error handler middleware
export function errorHandler(err, req, res, next) {
  // Joi validation error
  if (err.isJoi) {
    return res.status(400).json({ message: err.details[0].message });
  }
  // Custom error with status
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  // Default: Internal server error
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
} 