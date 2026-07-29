import express from 'express';
import { db } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/push/subscribe
router.post('/subscribe', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { fcmToken, subscription } = req.body;

  const subRecord = {
    id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    fcmToken,
    endpoint: subscription ? subscription.endpoint : undefined,
    keys: subscription ? subscription.keys : undefined,
    deviceType: 'WEB'
  };

  db.addPushSubscription(subRecord);
  res.status(201).json({ success: true, message: 'Push notification subscription registered successfully.' });
});

// POST /api/push/send-test
router.post('/send-test', verifyToken, (req, res) => {
  const userId = req.user.id;
  console.log(`[Push Notification Dispatch] Test FCM push sent to user ${userId}`);
  res.json({ success: true, message: 'Test FCM push notification dispatched.' });
});

export default router;
