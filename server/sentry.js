import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN || 'https://mock-dsn@sentry.io/1234567',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
});

// Capture Unhandled Promise Rejections & Uncaught Exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Sentry] Unhandled Promise Rejection:', reason);
  Sentry.captureException(reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Sentry] Uncaught Exception crash captured:', error);
  Sentry.captureException(error);
});

export default Sentry;
