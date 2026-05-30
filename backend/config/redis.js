import Redis from 'ioredis';
import logger from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis-service:6379';

// Main Redis client — for cache, sessions, OTP
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error('Redis connection failed after 3 retries', {
        type: 'system',
        event: 'redis_connection_failed',
      });
      return null;
    }
    return Math.min(times * 200, 1000);
  },
  lazyConnect: true,
});

// Subscriber client — for pub/sub (separate connection required)
const subscriber = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
  lazyConnect: true,
});

// Publisher client — for pub/sub
const publisher = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('Redis connected', { type: 'system', event: 'redis_connected' });
});

redis.on('error', (err) => {
  logger.error('Redis error', { type: 'system', event: 'redis_error', error: err.message });
});

redis.on('close', () => {
  logger.warn('Redis connection closed', { type: 'system', event: 'redis_disconnected' });
});

export { redis, subscriber, publisher };
export default redis;
