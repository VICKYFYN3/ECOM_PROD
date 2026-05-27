import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, json, colorize, printf } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`;
});

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'http',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    json()
  ),
  defaultMeta: {
    service: 'commerce-backend',
    environment: process.env.NODE_ENV || 'production',
  },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: 'logs/http-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
  ],
});

export default logger;
