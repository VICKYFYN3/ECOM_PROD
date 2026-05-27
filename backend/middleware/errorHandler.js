import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  logger.error('Unhandled error', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userId: req.body?.userId || null,
    error: err.message,
    stack: err.stack,
    statusCode,
    type: 'unhandled_error',
  });

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An error occurred. Please try again.'
      : err.message,
    requestId: req.requestId,
  });
};

export default errorHandler;
