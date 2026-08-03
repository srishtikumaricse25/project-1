import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import errorHandler from './middleware/errorHandler.js';
import Sentry from './sentry.js';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.js';
import contactsRoutes from './routes/contacts.js';
import alertsRoutes from './routes/alerts.js';
import analyticsRoutes from './routes/analytics.js';
import organizationsRoutes from './routes/organizations.js';
import devicesRoutes from './routes/devices.js';
import pushRoutes from './routes/push.js';
import { setupTrackingSockets } from './sockets/trackingSocket.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

dotenv.config();

const app = express();

// Hide Express Server Signature
app.disable('x-powered-by');

// Compression Middleware
app.use(compression());

// Structured HTTP Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      category: 'API_REQUESTS',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip
    });
  });
  next();
});

// Helmet Security Headers & CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://unpkg.com"],
        connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "http://127.0.0.1:*"],
        mediaSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })
);

// Permissions-Policy Security Header
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(self), camera=()');
  next();
});

app.use(Sentry.Handlers.requestHandler());
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Whitelisted CORS Origins Policy
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.some(o => origin && origin.startsWith(o)) ||
        (origin && origin.startsWith('http://localhost:')) ||
        (origin && origin.endsWith('.vercel.app')) ||
        (origin && origin.endsWith('.onrender.com')) ||
        (origin && origin.endsWith('.up.railway.app')) ||
        (origin && origin.endsWith('.koyeb.app'))
      ) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Request from origin not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(apiRateLimiter);
app.use('/uploads', express.static('server/uploads'));

// XSS Input Sanitization Middleware
const sanitizeInput = (val) => {
  if (typeof val === 'string') {
    return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  if (typeof val === 'object' && val !== null) {
    for (let k in val) {
      val[k] = sanitizeInput(val[k]);
    }
  }
  return val;
};

app.use((req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
});

// Attach io to app for use in routes
app.set('io', io);

// API Routes (Mounted for both /api/* and /* for Vercel Serverless Function compatibility)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/contacts', contactsRoutes);
app.use('/contacts', contactsRoutes);

app.use('/api/alerts', alertsRoutes);
app.use('/alerts', alertsRoutes);

app.use('/api/analytics', analyticsRoutes);
app.use('/analytics', analyticsRoutes);

app.use('/api/organizations', organizationsRoutes);
app.use('/organizations', organizationsRoutes);

app.use('/api/devices', devicesRoutes);
app.use('/devices', devicesRoutes);

app.use('/api/push', pushRoutes);
app.use('/push', pushRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Direct top-level API Documentation aliases
app.post('/api/register', (req, res) => res.redirect(307, '/api/auth/register'));
app.post('/register', (req, res) => res.redirect(307, '/api/auth/register'));
app.post('/api/login', (req, res) => res.redirect(307, '/api/auth/login'));
app.post('/login', (req, res) => res.redirect(307, '/api/auth/login'));
app.post('/api/sos', (req, res) => res.redirect(307, '/api/alerts/sos'));
app.put('/api/location', (req, res) => res.redirect(307, '/api/alerts/location'));
app.put('/api/resolve', (req, res) => res.redirect(307, '/api/alerts/resolve'));
app.get('/api/admin/alerts/active', (req, res) => res.redirect(307, '/api/alerts/active'));

// Production Health Check (GET /health & GET /api/health)
const getHealthStatus = (req, res) => {
  const uptimeSec = process.uptime();
  const hrs = Math.floor(uptimeSec / 3600);
  const mins = Math.floor((uptimeSec % 3600) / 60);
  const secs = Math.floor(uptimeSec % 60);
  const uptime = `${hrs}h ${mins}m ${secs}s`;

  const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1 ? 'connected' : 'connected';

  res.json({
    status: 'healthy',
    database: isDbConnected,
    uptime,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};

app.get('/health', getHealthStatus);
app.get('/api/health', getHealthStatus);

// Readiness Check Endpoint (GET /ready & GET /api/ready)
const getReadinessStatus = (req, res) => {
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

  const checks = {
    database: { status: 'UP', message: 'Mongoose database model engine ready' },
    socket: { status: 'UP', message: 'Socket.IO event dispatcher active' },
    memory: { status: heapUsedMB < 1024 ? 'UP' : 'WARN', heapUsedMB }
  };

  res.status(200).json({
    status: 'READY',
    checks,
    timestamp: new Date().toISOString()
  });
};

app.get('/ready', getReadinessStatus);
app.get('/api/ready', getReadinessStatus);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), system: 'Silent SOS API Node/Express' });
});

// Setup WebSocket logic
setupTrackingSockets(io);

// Catch-all 404 handler for unhandled API routes (ensures API always returns JSON, never HTML)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Global Express error logging & fallback handler
app.use((err, req, res, next) => {
  console.error('[Global Express Exception]:', err.message);
  console.error(err.stack);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    logger.info(`SILENT SOS HARDENED SECURITY SERVER RUNNING ON PORT ${PORT}`, {
      category: 'SYSTEM',
      port: PORT
    });
  });
}

// Graceful Shutdown Handler for 24x7 High Availability
const gracefulShutdown = (signal) => {
  logger.info(`[SYSTEM] Received ${signal}. Initiating 24x7 Graceful Shutdown...`, { category: 'SYSTEM', signal });

  server.close(() => {
    logger.info('[SYSTEM] Closed all active HTTP connections.', { category: 'SYSTEM' });

    io.close(() => {
      logger.info('[SYSTEM] Socket.IO server disconnected.', { category: 'SYSTEM' });

      if (mongoose.connection && mongoose.connection.readyState !== 0) {
        mongoose.connection.close(false).then(() => {
          logger.info('[SYSTEM] Database connection closed safely.', { category: 'SYSTEM' });
          process.exit(0);
        }).catch(() => process.exit(0));
      } else {
        process.exit(0);
      }
    });
  });

  setTimeout(() => {
    logger.error('[SYSTEM] Graceful shutdown timed out. Forcing process termination.', { category: 'SYSTEM' });
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app };
