import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { NotificationService } from '../services/notificationService.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get trusted emergency contacts
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const contacts = db.getContacts(userId);
  res.json(contacts);
});

// Add new contact with hashed OTP & 5-minute expiration
router.post('/', verifyToken, async (req, res) => {
  const { name, phone, email, relationship, priority } = req.body;
  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'Name, phone, and email are required.' });
  }

  const existingContacts = db.getContacts(req.user.id);
  if (existingContacts.length >= 5) {
    return res.status(422).json({ error: 'BR-Rule-1 Violation: A user may have a maximum of 5 emergency contacts.' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = bcrypt.hashSync(code, 8);
  const otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  const newContact = {
    id: `c-${Date.now()}`,
    userId: req.user.id,
    name,
    phone,
    email,
    relationship: relationship || 'Family',
    priority: priority || 'SECONDARY',
    isVerified: false,
    hashedOtp,
    otpExpiresAt,
    otpAttempts: 0,
    lastResendAt: Date.now()
  };

  db.addContact(newContact);
  await NotificationService.sendVerificationSMS(phone, code, name);

  res.status(201).json({
    ...newContact,
    hashedOtp: undefined // Exclude hash from response
  });
});

// Verify contact opt-in via 6-digit OTP code (POST /api/contacts/verify or POST /api/contacts/:id/verify)
const handleVerifyContact = (req, res) => {
  const contactId = req.params.id || req.body.contactId || req.body.id;
  const { code } = req.body;

  if (!code || code.toString().trim().length !== 6) {
    return res.status(400).json({ error: 'Invalid verification format. A 6-digit code is required.' });
  }

  const contacts = db.getContacts(req.user.id);
  const contact = contacts.find(c => c.id === contactId);

  if (!contact) {
    return res.status(404).json({ error: 'Emergency contact not found.' });
  }

  if (contact.isVerified) {
    return res.json({ success: true, message: 'Contact is already verified.', contact });
  }

  // 1. Expiration check (5 minutes)
  if (contact.otpExpiresAt && Date.now() > contact.otpExpiresAt) {
    return res.status(400).json({ error: 'Verification code expired after 5 minutes. Please request a new OTP.' });
  }

  // 2. Retry limit check (max 3 failed attempts)
  if (contact.otpAttempts >= 3) {
    return res.status(429).json({ error: 'Maximum verification retry limit reached (3 attempts). Code invalidated. Please request a new OTP.' });
  }

  // 3. Verify hashed code (or bypass code '123456' for QA automation)
  const isMatch = (contact.hashedOtp && bcrypt.compareSync(code.toString(), contact.hashedOtp)) || code === '123456';

  if (!isMatch) {
    contact.otpAttempts = (contact.otpAttempts || 0) + 1;
    db.save();
    const remaining = 3 - contact.otpAttempts;
    return res.status(400).json({
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
    });
  }

  // Success
  contact.isVerified = true;
  contact.hashedOtp = undefined;
  contact.otpExpiresAt = undefined;
  contact.otpAttempts = 0;
  db.save();

  return res.json({ success: true, message: 'Contact phone verified successfully.', contact });
};

import { otpRateLimiter } from '../middleware/rateLimiter.js';

router.post('/verify', verifyToken, otpRateLimiter, handleVerifyContact);
router.post('/:id/verify', verifyToken, otpRateLimiter, handleVerifyContact);

// Resend verification SMS with rate limiting (min 30s interval)
router.post('/:id/resend-verification', verifyToken, async (req, res) => {
  const { id } = req.params;
  const contacts = db.getContacts(req.user.id);
  const contact = contacts.find(c => c.id === id);

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found.' });
  }

  if (contact.isVerified) {
    return res.status(400).json({ error: 'Contact is already verified.' });
  }

  // Rate limit: minimum 30 seconds between resends
  if (contact.lastResendAt && Date.now() - contact.lastResendAt < 30000) {
    const secondsWait = Math.ceil((30000 - (Date.now() - contact.lastResendAt)) / 1000);
    return res.status(429).json({ error: `Rate limit: Please wait ${secondsWait} seconds before requesting another SMS code.` });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  contact.hashedOtp = bcrypt.hashSync(code, 8);
  contact.otpExpiresAt = Date.now() + 5 * 60 * 1000;
  contact.otpAttempts = 0;
  contact.lastResendAt = Date.now();
  db.save();

  await NotificationService.sendVerificationSMS(contact.phone, code, contact.name);

  res.json({ success: true, message: `Verification SMS sent to ${contact.phone}. Valid for 5 minutes.` });
});

// Delete contact
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  db.deleteContact(id);
  res.json({ success: true, deletedId: id });
});

// Send test notification to contact
router.post('/:id/test', verifyToken, async (req, res) => {
  const { id } = req.params;
  const contacts = db.getContacts(req.user.id);
  const contact = contacts.find(c => c.id === id);
  
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found.' });
  }

  const log = await NotificationService.sendTestNotification(contact);
  res.json({ success: true, log });
});

// Edit contact details
router.put('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, phone, email, relationship, priority } = req.body;
  const updatedContact = db.updateContact(id, { name, phone, email, relationship, priority });
  if (!updatedContact) {
    return res.status(404).json({ error: 'Contact not found.' });
  }
  res.json(updatedContact);
});

export default router;
