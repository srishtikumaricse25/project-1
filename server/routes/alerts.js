import express from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { NotificationService } from '../services/notificationService.js';
import QuickLRU from 'quick-lru';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sosRateLimiter } from '../middleware/rateLimiter.js';
import { logAlert } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../uploads');

import multer from 'multer';

const AUDIO_DIR = path.join(__dirname, '../uploads/audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AUDIO_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `audio-${req.params.id}-${uniqueSuffix}.webm`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const isWebM = (file.mimetype && file.mimetype.toLowerCase().includes('webm')) ||
                   (file.originalname && file.originalname.toLowerCase().endsWith('.webm'));
    if (isWebM) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only WebM audio files are permitted.'));
    }
  }
});

const router = express.Router();

const cache = new QuickLRU({
  maxSize: 1000,
  maxAge: 5 * 60 * 1000
});

const sosSchema = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number().optional(),
    speed: z.number().optional(),
    heading: z.number().optional(),
    altitude: z.number().optional(),
    timestamp: z.number().optional(),
    address: z.string().optional()
  }).optional().nullable(),
  batteryLevel: z.number().optional().nullable(),
  ambientAudioRecorded: z.boolean().optional(),
  triggerMethod: z.string().optional()
});

// Trigger a new Emergency Alert (POST /api/alerts/trigger & POST /api/alerts/sos)
const handleAlertTrigger = async (req, res) => {
  const { location, batteryLevel, ambientAudioRecorded, triggerMethod } = req.body;
  
  const user = db.getUsers().find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const contacts = db.getContacts(user.id);

  const trackingToken = `trk-${user.name.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const alert = {
    id: `alt-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    status: 'ACTIVE',
    location: location || {
      lat: 28.6139,
      lng: 77.2090,
      accuracy: 10,
      speed: 0,
      heading: 0,
      altitude: 200,
      timestamp: Date.now(),
      address: 'Current Geolocation, New Delhi'
    },
    breadcrumbs: location ? [location] : [],
    batteryLevel: batteryLevel || 85,
    ambientAudioRecorded: ambientAudioRecorded !== undefined ? ambientAudioRecorded : true,
    contactsNotifiedCount: contacts.length,
    trackingToken,
    createdAt: new Date().toISOString(),
    dispatcherNotes: `Emergency triggered via ${triggerMethod || 'Silent SOS'}.`
  };

  db.createAlert(alert);
  logAlert('Emergency SOS Alert Triggered', alert.id, { userId: user.id, trackingToken });

  // Send notifications to emergency contacts
  await NotificationService.sendEmergencyAlerts(alert, contacts);

  // Socket broadcast
  const io = req.app.get('io');
  if (io) {
    io.emit('new-alert', alert);
  }

  res.status(201).json({ alertId: alert.id, alert, trackingToken });
};

router.post('/trigger', verifyToken, sosRateLimiter, validate(sosSchema), handleAlertTrigger);
router.post('/sos', verifyToken, sosRateLimiter, validate(sosSchema), handleAlertTrigger);

const locationUpdateSchema = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number().optional(),
    speed: z.number().optional(),
    heading: z.number().optional(),
    timestamp: z.number().optional(),
    altitude: z.number().optional(),
    address: z.string().optional()
  }).optional(),
  batteryLevel: z.number().optional()
});

// Update location of active alert
router.post('/:id/location', verifyToken, validate(locationUpdateSchema), (req, res) => {
  const { id } = req.params;
  const { location, batteryLevel } = req.body;

  const updatedAlert = db.updateAlertLocation(id, location, batteryLevel);
  if (!updatedAlert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  if (updatedAlert.trackingToken) {
    cache.delete(updatedAlert.trackingToken);
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`alert-${id}`).emit('location-updated', { alertId: id, location, batteryLevel });
    io.emit('admin-alert-updated', updatedAlert);
  }

  res.json(updatedAlert);
});

// Upload Ambient Audio Evidence Blob (POST /api/alerts/:id/audio)
router.post('/:id/audio', verifyToken, (req, res) => {
  const { id } = req.params;
  const alert = db.getAlertById(id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const uploadHandler = upload.single('audio');
  uploadHandler(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Audio file exceeds 20MB maximum size limit.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded. Send file under form-data key "audio".' });
    }

    const fileUrl = `/uploads/audio/${req.file.filename}`;
    
    // Save metadata in database using Mongoose AudioRecording model
    const metadata = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      alertId: id,
      filename: req.file.filename,
      originalName: req.file.originalname || 'ambient-audio.webm',
      mimeType: req.file.mimetype || 'audio/webm',
      size: req.file.size,
      uploadedAt: new Date(),
      filePath: req.file.path,
      fileUrl
    };

    if (db.addAudioRecording) {
      db.addAudioRecording(metadata);
    }

    alert.ambientAudioRecorded = true;
    alert.audioUrl = fileUrl;
    db.save();

    res.status(201).json({
      success: true,
      audioUrl: fileUrl,
      recording: metadata
    });
  });
});

// Update alert status (PUT /api/alerts/:id/status & PUT /api/alerts/resolve)
const handleStatusUpdate = (req, res) => {
  const alertId = req.params.id || req.body.alertId || (db.getAlerts()[0] ? db.getAlerts()[0].id : null);
  const { status, pin, notes } = req.body;
  
  const user = db.getUsers().find(u => u.id === req.user.id);

  if (!alertId) {
    return res.status(400).json({ error: 'Alert ID is required.' });
  }

  if ((status === 'RESOLVED' || status === 'FALSE_ALARM') && pin) {
    if (user.deactivationPin && pin !== user.deactivationPin) {
      return res.status(401).json({ error: 'Invalid Safety PIN' });
    }
  }

  const updatedAlert = db.updateAlertStatus(alertId, status || 'RESOLVED', notes);
  if (!updatedAlert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  if (updatedAlert.trackingToken) {
    cache.delete(updatedAlert.trackingToken);
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`alert-${alertId}`).emit('status-changed', { alertId, status });
    io.emit('admin-alert-updated', updatedAlert);
  }

  res.json(updatedAlert);
};

router.put('/:id/status', verifyToken, handleStatusUpdate);
router.put('/resolve', verifyToken, handleStatusUpdate);

// Public live tracking link endpoint by trackingToken
router.get('/track/:token', (req, res) => {
  const { token } = req.params;
  
  if (cache.has(token)) {
    return res.json(cache.get(token));
  }

  const alert = db.getAlertByToken(token);
  if (!alert) {
    return res.status(404).json({ error: 'Invalid or expired tracking token.' });
  }

  cache.set(token, alert);
  res.json(alert);
});

const parsePaginationParams = (query, defaultLimit = 20) => {
  let page = 1;
  let limit = defaultLimit;

  if (query.page !== undefined) {
    const parsedPage = Number(query.page);
    if (isNaN(parsedPage) || parsedPage < 1 || !Number.isInteger(parsedPage)) {
      return { error: 'Invalid page parameter. Page must be a positive integer starting from 1.' };
    }
    page = parsedPage;
  }

  if (query.limit !== undefined) {
    const parsedLimit = Number(query.limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100 || !Number.isInteger(parsedLimit)) {
      return { error: 'Invalid limit parameter. Limit must be an integer between 1 and 100.' };
    }
    limit = parsedLimit;
  }

  return { page, limit };
};

// Get alert history for authenticated user (with pagination validation)
router.get('/history', verifyToken, (req, res) => {
  const { page, limit, error } = parsePaginationParams(req.query, 20);
  if (error) {
    return res.status(400).json({ error });
  }

  const userId = req.user.id;
  const userAlerts = db.getAlerts().filter(a => a.userId === userId);
  const total = userAlerts.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const data = userAlerts.slice(startIndex, startIndex + limit);

  res.json({
    page,
    limit,
    total,
    totalPages,
    data
  });
});

// Get all alerts for Admin dashboard (with pagination validation)
router.get('/all', verifyToken, requireRole('ADMIN'), (req, res) => {
  const { page, limit, error } = parsePaginationParams(req.query, 20);
  if (error) {
    return res.status(400).json({ error });
  }

  const alerts = db.getAlerts();
  const total = alerts.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const data = alerts.slice(startIndex, startIndex + limit);

  res.json({
    page,
    limit,
    total,
    totalPages,
    data
  });
});

// Get active alerts only
router.get('/active', verifyToken, requireRole('ADMIN'), (req, res) => {
  const alerts = db.getAlerts().filter(a => a.status === 'ACTIVE' || a.status === 'DISPATCHED');
  res.json(alerts);
});

// Get notification dispatch logs (with pagination validation)
router.get('/logs', verifyToken, requireRole('ADMIN'), (req, res) => {
  const { page, limit, error } = parsePaginationParams(req.query, 20);
  if (error) {
    return res.status(400).json({ error });
  }

  const logs = db.getLogs();
  const total = logs.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const data = logs.slice(startIndex, startIndex + limit);

  res.json({
    page,
    limit,
    total,
    totalPages,
    data
  });
});

// Get timeline for a specific alert
router.get('/:id/timeline', verifyToken, (req, res) => {
  const { id } = req.params;
  const alert = db.getAlertById(id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  const timeline = [];
  timeline.push({ time: alert.createdAt, label: 'SOS Triggered' });
  if (alert.location && alert.location.timestamp) {
    timeline.push({ time: new Date(alert.location.timestamp).toISOString(), label: 'GPS Captured' });
  }
  const logs = db.getLogs().filter(l => l.alertId === id);
  logs.forEach(log => {
    let label = '';
    if (log.channel === 'SMS') label = 'SMS Sent';
    else if (log.channel === 'EMAIL') label = 'Email Sent';
    else if (log.channel === 'PUSH') label = 'Push Sent';
    if (label) timeline.push({ time: log.timestamp, label });
  });
  if (alert.status && ['ACTIVE', 'DISPATCHED', 'NAVIGATING', 'ARRIVED'].includes(alert.status)) {
    timeline.push({ time: alert.createdAt, label: 'Tracking Active' });
  }
  if (alert.resolvedAt) {
    timeline.push({ time: alert.resolvedAt, label: 'Resolved' });
  }
  timeline.sort((a, b) => new Date(a.time) - new Date(b.time));
  res.json(timeline);
});

// Get logs for a specific alert
router.get('/:id/logs', verifyToken, (req, res) => {
  const { id } = req.params;
  const logs = db.getLogs().filter((log) => log.alertId === id);
  res.json(logs);
});

export default router;
