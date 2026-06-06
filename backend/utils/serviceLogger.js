import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';

// Generate a short spanId
const createSpanId = (prefix) => `${prefix}-${uuidv4().substring(0, 8)}`;

// Track span counters per trace
const spanCounters = {};

const getSpanId = (traceId, prefix) => {
  const key = `${traceId}:${prefix}`;
  spanCounters[key] = (spanCounters[key] || 0) + 1;
  const id = `${prefix}-${spanCounters[key]}`;

  // Clean up old counters after 60 seconds
  setTimeout(() => delete spanCounters[key], 60000);

  return id;
};

const serviceLogger = {
  // MongoDB operations
  db: async (traceId, operation, collection, fn) => {
    const spanId = getSpanId(traceId, 'db');
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      logger.debug('MongoDB query', {
        traceId,
        spanId,
        type: 'db',
        operation,
        collection,
        duration: `${duration}ms`,
        success: true,
        ...(Array.isArray(result) && { resultCount: result.length }),
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('MongoDB query failed', {
        traceId,
        spanId,
        type: 'db',
        operation,
        collection,
        duration: `${duration}ms`,
        success: false,
        error: error.message,
      });
      throw error;
    }
  },

  // Redis operations
  cache: async (traceId, command, key, fn) => {
    const spanId = getSpanId(traceId, 'cache');
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      logger.debug('Redis command', {
        traceId,
        spanId,
        type: 'cache',
        command,
        key,
        hit: command === 'GET' ? result !== null : undefined,
        duration: `${duration}ms`,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Redis command failed', {
        traceId,
        spanId,
        type: 'cache',
        command,
        key,
        duration: `${duration}ms`,
        error: error.message,
      });
      throw error;
    }
  },

  // External API calls (Paystack, Stripe)
  external: async (traceId, service, endpoint, fn, meta = {}) => {
    const spanId = getSpanId(traceId, 'ext');
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      logger.info('External API call', {
        traceId,
        spanId,
        type: 'external',
        service,
        endpoint,
        duration: `${duration}ms`,
        status: 'success',
        ...meta,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('External API call failed', {
        traceId,
        spanId,
        type: 'external',
        service,
        endpoint,
        duration: `${duration}ms`,
        status: 'failed',
        error: error.message,
        ...meta,
      });
      throw error;
    }
  },

  // Cloudinary operations
  cloudinary: async (traceId, operation, fn, meta = {}) => {
    const spanId = getSpanId(traceId, 'cloud');
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      logger.info('Cloudinary API call', {
        traceId,
        spanId,
        type: 'external',
        service: 'cloudinary',
        operation,
        duration: `${duration}ms`,
        success: true,
        url: result?.secure_url || null,
        ...meta,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Cloudinary API call failed', {
        traceId,
        spanId,
        type: 'external',
        service: 'cloudinary',
        operation,
        duration: `${duration}ms`,
        success: false,
        error: error.message,
        ...meta,
      });
      throw error;
    }
  },

  // Email operations (direct send, not via queue)
  email: async (traceId, to, subject, fn, meta = {}) => {
    const spanId = getSpanId(traceId, 'email');
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      logger.info('Email sent', {
        traceId,
        spanId,
        type: 'email',
        to,
        subject,
        duration: `${duration}ms`,
        success: true,
        ...meta,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Email send failed', {
        traceId,
        spanId,
        type: 'email',
        to,
        subject,
        duration: `${duration}ms`,
        success: false,
        error: error.message,
        ...meta,
      });
      throw error;
    }
  },

  // Internal operations (bcrypt, JWT, etc)
  internal: async (traceId, operation, fn) => {
    const spanId = getSpanId(traceId, 'int');
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      logger.debug('Internal operation', {
        traceId,
        spanId,
        type: 'internal',
        operation,
        duration: `${duration}ms`,
        success: true,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Internal operation failed', {
        traceId,
        spanId,
        type: 'internal',
        operation,
        duration: `${duration}ms`,
        success: false,
        error: error.message,
      });
      throw error;
    }
  },
};

export default serviceLogger;
