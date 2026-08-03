import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.join(__dirname, '../../logs');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Custom format for JSON logging with ISO timestamps
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${metaStr}`;
      })
    )
  })
];

// Add file transports only if NOT in serverless environment and directory writable
if (!isServerless) {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    transports.push(
      new winston.transports.File({
        filename: path.join(LOGS_DIR, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: path.join(LOGS_DIR, 'combined.log'),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5
      })
    );
  } catch (err) {
    console.warn('[Logger] File logging disabled (read-only filesystem):', err.message);
  }
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'silent-sos-backend' },
  transports
});

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
