import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
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

const app = express();
const port = process.env.PORT || 4001;

// Connect to services
connectDB()
  .then(() => eventLogger.system.dbConnected())
  .catch((err) => eventLogger.system.dbError({ error: err.message }));

connectCloudinary();

// Middlewares
app.use(express.json());
app.use(cors());

// Request/Response logging — must be before routes
app.use(requestLogger);

// Health check endpoints for Kubernetes
// Logged at debug level — won't appear unless LOG_LEVEL=debug
app.get('/health/live', (req, res) => {
  logger.debug('Liveness probe hit', { type: 'probe', probe: 'liveness', ip: req.ip });
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
  try {
    const mongoose = await import('mongoose');
    const dbState = mongoose.default.connection.readyState;
    if (dbState !== 1) {
      logger.debug('Readiness probe - not ready', { type: 'probe', probe: 'readiness', dbState });
      return res.status(503).json({ status: 'not ready', db: 'disconnected' });
    }
    logger.debug('Readiness probe - ready', { type: 'probe', probe: 'readiness', dbState });
    res.status(200).json({ status: 'ready', db: 'connected', timestamp: new Date().toISOString() });
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

// Global error handler — must be last
app.use(errorHandler);

app.listen(port, () => {
  eventLogger.system.serverStarted({ port, timestamp: new Date().toISOString() });
});
