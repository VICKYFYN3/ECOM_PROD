import Bull from 'bull';
import orderModel from '../models/orderModel.js';
import { sendEmail } from './emailQueue.js';
import { publish } from '../utils/pubsub.js';
import { CHANNELS, cacheDel, KEYS } from '../utils/cache.js';
import { getOrderConfirmationEmail, getAdminOrderNotificationEmail } from '../utils/emailTemplates.js';
import logger from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis-service:6379';

const orderQueue = new Bull('order', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Process order jobs
orderQueue.process(async (job) => {
  const { type, orderId, userId } = job.data;

  if (type === 'order_confirmed') {
    const order = await orderModel.findById(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    // Send confirmation email to customer
    await sendEmail(
      order.address.email,
      'Your Order is Confirmed!',
      getOrderConfirmationEmail(order),
      'order_confirmation'
    );

    // Send admin notification
    if (process.env.NOTIFY_EMAIL) {
      await sendEmail(
        process.env.NOTIFY_EMAIL,
        'New Order Received',
        getAdminOrderNotificationEmail(order),
        'admin_notification'
      );
    }

    // Clear user cart cache
    await cacheDel(KEYS.cart(userId));

    // Publish new order event for admin notifications
    await publish(CHANNELS.ORDER_NEW, {
      orderId,
      userId,
      amount: order.amount,
      paymentMethod: order.paymentMethod,
      timestamp: new Date().toISOString(),
    });

    logger.info('Order job processed', {
      type: 'order',
      event: 'order_job_processed',
      orderId,
      userId,
      jobId: job.id,
    });
  }
});

orderQueue.on('failed', (job, err) => {
  logger.error('Order job failed permanently', {
    type: 'order',
    event: 'order_job_failed',
    jobId: job.id,
    orderId: job.data.orderId,
    attempts: job.attemptsMade,
    error: err.message,
  });
});

export default orderQueue;
