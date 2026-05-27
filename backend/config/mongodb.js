import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected', { type: 'system', event: 'db_connected' });
    });

    mongoose.connection.on('disconnected', () => {
      logger.error('MongoDB disconnected', { type: 'system', event: 'db_disconnected' });
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB error', { type: 'system', event: 'db_error', error: err.message });
    });

    await mongoose.connect(`${process.env.MONGODB_URI}/ecommerce`);
  } catch (error) {
    logger.error('MongoDB connection failed', {
      type: 'system',
      event: 'db_connection_failed',
      error: error.message,
    });
    // Don't exit — let Kubernetes readiness probe handle this
    // Server stays up but /health/ready returns 503
  }
};

export default connectDB;
