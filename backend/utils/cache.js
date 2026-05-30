import { redis } from '../config/redis.js';
import logger from './logger.js';

// TTL constants (in seconds)
export const TTL = {
  SESSION:        60 * 60 * 24 * 7,  // 7 days
  OTP:            60 * 20,            // 20 minutes
  RESET_TOKEN:    60,                 // 60 seconds
  PRODUCT_LIST:   60 * 10,           // 10 minutes
  SINGLE_PRODUCT: 60 * 10,           // 10 minutes
  CART:           60 * 60 * 24,      // 24 hours
  RATE_LIMIT:     60 * 15,           // 15 minutes
};

// Cache keys
export const KEYS = {
  session:       (token) => `session:${token}`,
  otp:           (email) => `otp:${email}`,
  resetToken:    (email) => `reset:${email}`,
  productList:   ()      => `products:list`,
  product:       (id)    => `product:${id}`,
  cart:          (userId)=> `cart:${userId}`,
  rateLimit:     (key)   => `ratelimit:${key}`,
};

// Channels for pub/sub
export const CHANNELS = {
  STOCK_UPDATED:    'stock:updated',
  PRODUCT_UPDATED:  'product:updated',
  PRODUCT_DELETED:  'product:deleted',
  CART_CLEARED:     'cart:cleared',
  ORDER_NEW:        'order:new',
  CACHE_INVALIDATE: 'cache:invalidate',
};

// Get from cache
export const cacheGet = async (key) => {
  try {
    const data = await redis.get(key);
    if (data) {
      logger.debug('Cache hit', { key });
      return JSON.parse(data);
    }
    logger.debug('Cache miss', { key });
    return null;
  } catch (err) {
    logger.error('Cache get error', { key, error: err.message });
    return null;
  }
};

// Set in cache
export const cacheSet = async (key, value, ttl) => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    logger.debug('Cache set', { key, ttl });
  } catch (err) {
    logger.error('Cache set error', { key, error: err.message });
  }
};

// Delete from cache
export const cacheDel = async (key) => {
  try {
    await redis.del(key);
    logger.debug('Cache deleted', { key });
  } catch (err) {
    logger.error('Cache delete error', { key, error: err.message });
  }
};

// Delete multiple keys by pattern
export const cacheDelPattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug('Cache pattern deleted', { pattern, count: keys.length });
    }
  } catch (err) {
    logger.error('Cache pattern delete error', { pattern, error: err.message });
  }
};
