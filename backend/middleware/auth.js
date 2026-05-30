import jwt from 'jsonwebtoken';
import sessionModel from '../models/sessionModel.js';
import { redis } from '../config/redis.js';
import { KEYS, TTL, cacheGet, cacheSet } from '../utils/cache.js';
import logger from '../utils/logger.js';

const authUser = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.json({ success: false, message: 'Not Authorized login again' });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    // Check Redis cache first
    const sessionKey = KEYS.session(token);
    let session = await cacheGet(sessionKey);

    if (session) {
      // Session found in Redis — no MongoDB hit needed
      logger.debug('Session cache hit', {
        type: 'auth',
        event: 'session_cache_hit',
        userId: token_decode.id,
      });

      // Update last activity in background (non-blocking)
      sessionModel.findByIdAndUpdate(session._id, {
        lastActivity: new Date()
      }).catch(err => logger.error('Session activity update failed', { error: err.message }));

    } else {
      // Cache miss — check MongoDB
      logger.debug('Session cache miss', {
        type: 'auth',
        event: 'session_cache_miss',
        userId: token_decode.id,
      });

      session = await sessionModel.findOne({ token, isActive: true });

      if (!session) {
        return res.status(401).json({ success: false, message: 'Session expired. Please login again' });
      }

      // Cache session in Redis for future requests
      await cacheSet(sessionKey, session, TTL.SESSION);

      // Update last activity
      await sessionModel.findByIdAndUpdate(session._id, {
        lastActivity: new Date()
      });
    }

    if (!req.body) req.body = {};
    req.body.userId = token_decode.id;
    next();

  } catch (error) {
    logger.warn('Auth failed', {
      type: 'auth',
      event: 'auth_failed',
      error: error.message,
      ip: req.ip,
    });
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export default authUser;
