import express from 'express';
import { db } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/devices (My Devices)
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const devices = db.getDevices(userId);
  res.json(devices);
});

// POST /api/devices (Register/Heartbeat current device)
router.post('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { deviceName, browser, os, ipAddress } = req.body;

  const device = {
    id: `dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    deviceName: deviceName || 'Chrome Browser',
    browser: browser || 'Chrome',
    os: os || 'Windows',
    ipAddress: ipAddress || req.ip || '127.0.0.1',
    lastLogin: new Date(),
    isTrusted: true
  };

  db.addDevice(device);
  res.status(201).json(device);
});

// DELETE /api/devices/:id (Remove trusted device)
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  db.removeDevice(id, req.user.id);
  res.json({ success: true, removedId: id });
});

// POST /api/devices/logout-others (Logout all other devices)
router.post('/logout-others', verifyToken, (req, res) => {
  const userId = req.user.id;
  db.removeAllOtherDevices(userId, req.headers.authorization);
  res.json({ success: true, message: 'All other session devices logged out successfully.' });
});

export default router;
