import * as Sentry from '@sentry/node';

const sentryDsn = process.env.SENTRY_DSN;
const isSentryEnabled = Boolean(sentryDsn && sentryDsn.startsWith('http') && !sentryDsn.includes('mock-dsn'));

if (isSentryEnabled) {
  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
    });
  } catch (err) {
    console.warn('[Sentry] Initialization skipped:', err.message);
  }
}

// Capture Unhandled Promise Rejections & Uncaught Exceptions
process.on('unhandledRejection', (reason) => {
  console.error('[Sentry] Unhandled Promise Rejection:', reason);
  if (isSentryEnabled) {
    try { Sentry.captureException(reason); } catch {}
  }
});

process.on('uncaughtException', (error) => {
  console.error('[Sentry] Uncaught Exception crash captured:', error);
  if (isSentryEnabled) {
    try { Sentry.captureException(error); } catch {}
  }
});

export default {
  captureException: (err) => {
    if (isSentryEnabled) {
      try { Sentry.captureException(err); } catch {}
    }
  }
};
