import Sentry from '../sentry.js';
import { logger } from '../utils/logger.js';

export default function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[Express Error] ${req.method} ${req.originalUrl} -> ${status}: ${message}`, {
    category: 'EXPRESS_ERRORS',
    status,
    url: req.originalUrl,
    method: req.method,
    stack: err.stack
  });

  // Centralized Error Reporting: Report to Sentry
  Sentry.captureException(err);

  res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}
