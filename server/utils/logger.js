import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.join(__dirname, '../../logs');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Custom format for JSON logging with ISO timestamps
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create Winston Logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'silent-sos-backend' },
  transports: [
    // 1. Error Logs File
    new winston.transports.File({
      filename: path.join(LOGS_DIR, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB rotation
      maxFiles: 5
    }),
    // 2. Combined Logs File
    new winston.transports.File({
      filename: path.join(LOGS_DIR, 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ]
});

// Console logging format for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `[${timestamp}] [${level}]: ${message} ${metaStr}`;
        })
      )
    })
  );
}

// Helper methods for categorized structured logging
export const logAuth = (action, userId, meta = {}) => {
  logger.info(`[AUTH] ${action}`, { category: 'AUTHENTICATION', userId, ...meta });
};

export const logAlert = (action, alertId, meta = {}) => {
  logger.info(`[ALERT] ${action}`, { category: 'ALERTS', alertId, ...meta });
};

export const logNotification = (channel, recipient, status, meta = {}) => {
  logger.info(`[NOTIFICATION] ${channel} -> ${recipient} (${status})`, {
    category: 'NOTIFICATIONS',
    channel,
    recipient,
    status,
    ...meta
  });
};

export const logSecurity = (event, ipAddress, meta = {}) => {
  logger.warn(`[SECURITY] ${event}`, { category: 'SECURITY', ipAddress, ...meta });
};

export default logger;
