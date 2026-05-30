import Bull from 'bull';
import transporter from '../config/nodemailer.js';
import logger from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis-service:6379';

const emailQueue = new Bull('email', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Process email jobs
emailQueue.process(async (job) => {
  const { to, subject, html, type } = job.data;
  try {
    await transporter.sendMail({
      from: `"FYN3" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    logger.info('Email sent', {
      type: 'system',
      event: 'email_sent',
      emailType: type,
      to,
      jobId: job.id,
    });
  } catch (err) {
    logger.error('Email send failed', {
      type: 'system',
      event: 'email_failed',
      emailType: type,
      to,
      error: err.message,
      jobId: job.id,
      attempt: job.attemptsMade,
    });
    throw err;
  }
});

emailQueue.on('failed', (job, err) => {
  logger.error('Email job failed permanently', {
    type: 'system',
    event: 'email_job_failed',
    jobId: job.id,
    to: job.data.to,
    attempts: job.attemptsMade,
    error: err.message,
  });
});

// Helper to add email to queue
export const sendEmail = async (to, subject, html, type = 'general') => {
  try {
    const job = await emailQueue.add({ to, subject, html, type });
    logger.debug('Email queued', { to, type, jobId: job.id });
    return job;
  } catch (err) {
    logger.error('Failed to queue email', { to, type, error: err.message });
    // Fallback — send directly if queue fails
    await transporter.sendMail({
      from: `"FYN3" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
  }
};

export default emailQueue;
