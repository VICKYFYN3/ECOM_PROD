import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import { redis, subscriber, publisher } from './config/redis.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import reviewRouter from './routes/reviewRoute.js';
import addressRouter from './routes/addressRoute.js';
import contactRouter from './routes/contactRoute.js';
import logger from './utils/logger.js';
import eventLogger from './utils/eventLogger.js';
import requestLogger from './middleware/requestLogger.js';
import errorHandler from './middleware/errorHandler.js';
import { initSubscriber } from './utils/pubsub.js';
import { CHANNELS, cacheDel, KEYS } from './utils/cache.js';

const app = express();
const port = process.env.PORT || 4001;

// Connect to services
connectDB()
  .then(() => eventLogger.system.dbConnected())
  .catch((err) => eventLogger.system.dbError({ error: err.message }));

connectCloudinary();

// Connect Redis
redis.connect().catch((err) => {
  logger.error('Redis connection failed', { type: 'system', event: 'redis_connection_failed', error: err.message });
});

// Initialize pub/sub subscribers
initSubscriber({
  // Stock updated — invalidate product cache on all pods
  [CHANNELS.STOCK_UPDATED]: async (data) => {
    await cacheDel(KEYS.product(data.productId));
    await cacheDel(KEYS.productList());
    logger.debug('Cache invalidated after stock update', { productId: data.productId });
  },

  // Product updated — invalidate product cache on all pods
  [CHANNELS.PRODUCT_UPDATED]: async (data) => {
    await cacheDel(KEYS.product(data.productId));
    await cacheDel(KEYS.productList());
    logger.debug('Cache invalidated after product update', { productId: data.productId });
  },

  // Product deleted — invalidate product cache on all pods
  [CHANNELS.PRODUCT_DELETED]: async (data) => {
    await cacheDel(KEYS.product(data.productId));
    await cacheDel(KEYS.productList());
    logger.debug('Cache invalidated after product delete', { productId: data.productId });
  },

  // Cart cleared — invalidate cart cache on all pods
  [CHANNELS.CART_CLEARED]: async (data) => {
    await cacheDel(KEYS.cart(data.userId));
    logger.debug('Cart cache invalidated', { userId: data.userId });
  },

  // New order — log for admin dashboard
  [CHANNELS.ORDER_NEW]: async (data) => {
    logger.info('New order received via pub/sub', {
      type: 'order',
      event: 'order_new_pubsub',
      orderId: data.orderId,
      userId: data.userId,
      amount: data.amount,
    });
  },
});

// Middlewares
app.use(express.json());
app.use(cors());
app.use(requestLogger);

// Health check endpoints
app.get('/health/live', (req, res) => {
  logger.debug('Liveness probe hit', { type: 'probe', probe: 'liveness', ip: req.ip });
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
  try {
    const mongoose = await import('mongoose');
    const dbState = mongoose.default.connection.readyState;
    const redisState = redis.status;

    if (dbState !== 1) {
      logger.debug('Readiness probe - not ready', { type: 'probe', dbState });
      return res.status(503).json({ status: 'not ready', db: 'disconnected' });
    }

    res.status(200).json({
      status: 'ready',
      db: 'connected',
      redis: redisState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.debug('Readiness probe - error', { type: 'probe', error: error.message });
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// API endpoints
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/review', reviewRouter);
app.use('/api/address', addressRouter);
app.use('/api/contact', contactRouter);

app.get('/', (req, res) => {
  res.send('API is running');
});

// Global error handler
app.use(errorHandler);

app.listen(port, () => {
  eventLogger.system.serverStarted({ port, timestamp: new Date().toISOString() });
});
