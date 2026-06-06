import logger from '../utils/logger.js';
import { RC, getUserMessage } from '../utils/responseCodes.js';

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const responseCode = err.responseCode || RC.SYS_01.code;
  const responseMessage = err.responseMessage || RC.SYS_01.message;

  // Full details in logs — engineers see everything
  logger.error('Unhandled error', {
    type: 'unhandled_error',
    requestId: req.requestId,
    traceId: req.traceId,
    responseCode,
    responseMessage,
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    userId: req.body?.userId || null,
  });

  // Clean message to user — hide internals
  res.status(statusCode).json({
    success: false,
    message: getUserMessage(responseCode),
    requestId: req.requestId,
  });
};

export default errorHandler;
