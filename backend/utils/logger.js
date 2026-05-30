import winston from 'winston';
import os from 'os';

const { combine, timestamp, json, printf } = winston.format;

// Pod identity — injected by Kubernetes downward API
const podName    = process.env.HOSTNAME    || os.hostname();
const nodeName   = process.env.NODE_NAME   || 'local';
const podIp      = process.env.POD_IP      || 'unknown';
const appVersion = process.env.APP_VERSION || '1.0.0';

// Log levels
const levels = {
  error: 0,
  warn:  1,
  info:  2,
  http:  3,
  debug: 4,
};

winston.addColors({
  error: 'red',
  warn:  'yellow',
  info:  'green',
  http:  'magenta',
  debug: 'white',
});

// Base metadata stamped on every single log
const baseMeta = {
  service:     'commerce-backend',
  version:     appVersion,
  environment: process.env.NODE_ENV || 'production',
  pod:         podName,
  node:        nodeName,
  podIp:       podIp,
};

const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'http',
  defaultMeta: baseMeta,

  // Single stdout transport — JSON format
  // kubectl logs reads this
  // Promtail will collect this → Loki → Grafana
  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        json()
      ),
    }),
  ],
});

export default logger;
