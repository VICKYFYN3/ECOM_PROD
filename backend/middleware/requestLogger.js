import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

const SENSITIVE_FIELDS = [
  'password', 'confirmPassword', 'token', 'accessToken',
  'refreshToken', 'cardNumber', 'cvv', 'pin', 'secret'
];

const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const masked = { ...obj };
  for (const key of Object.keys(masked)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked;
};

const requestLogger = (req, res, next) => {
  // Skip health check endpoints — they log themselves at debug level
  if (req.url.startsWith('/health/')) return next();

  const requestId = uuidv4();
  const startTime = Date.now();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  logger.http('Incoming request', {
    type: 'request',
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.body?.userId || null,
    body: maskSensitiveData(req.body),
    query: req.query,
    params: req.params,
  });

  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);
  let responseBody;

  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  res.send = (body) => {
    responseBody = body;
    return originalSend(body);
  };

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'http';

    logger[level]('Request completed', {
      type: 'response',
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.body?.userId || null,
      ...(responseTime > 2000 && { slowRequest: true, threshold: '2000ms' }),
      ...(res.statusCode >= 400 && { responseBody: maskSensitiveData(responseBody) }),
    });

    if (responseTime > 2000) {
      logger.warn('Slow request detected', {
        requestId,
        url: req.originalUrl,
        method: req.method,
        responseTime: `${responseTime}ms`,
      });
    }
  });

  next();
};

export default requestLogger;
