import { publisher, subscriber } from '../config/redis.js';
import { CHANNELS } from './cache.js';
import logger from './logger.js';

// Publish a message to a channel
export const publish = async (channel, data) => {
  try {
    await publisher.publish(channel, JSON.stringify(data));
    logger.debug('Published to channel', { channel, data });
  } catch (err) {
    logger.error('Publish error', { channel, error: err.message });
  }
};

// Subscribe to channels and handle messages
export const initSubscriber = (handlers) => {
  const channels = Object.values(CHANNELS);

  subscriber.subscribe(...channels, (err, count) => {
    if (err) {
      logger.error('Subscriber error', { error: err.message });
      return;
    }
    logger.info('Redis subscriber ready', {
      type: 'system',
      event: 'redis_subscriber_ready',
      channels: count,
    });
  });

  subscriber.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);
      logger.debug('Received pub/sub message', { channel, data });

      if (handlers[channel]) {
        handlers[channel](data);
      }
    } catch (err) {
      logger.error('Subscriber message error', { channel, error: err.message });
    }
  });
};
