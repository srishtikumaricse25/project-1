import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { logAuth, logSecurity, logger } from '../utils/logger.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'silent-sos-dev-secret-key-123!';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'silent-sos-dev-refresh-key-456!';
const BCRYPT_SALT_ROUNDS = 12;

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['USER', 'ADMIN']).optional()
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6)
});

// Helper: Generate JWT Access & Refresh Tokens
const generateTokens = (user) => {
  const payload = { id: user.id, role: user.role, email: user.email, organizationId: user.organizationId || 'org-101' };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// Helper: Create Session Record
const createSessionRecord = (userId, refreshToken, req) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = {
    id: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    refreshToken,
    ipAddress: req.ip || (req.headers && req.headers['x-forwarded-for']) || '127.0.0.1',
    userAgent: (req.headers && req.headers['user-agent']) || 'Unknown Browser',
    isRevoked: false,
    expiresAt
  };
  db.createSession(session);
  return session;
};

// 1. POST /api/auth/register
router.post('/register', authRateLimiter, validate(registerSchema), (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    
    const users = db.getUsers() || [];
    const existingUser = users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email address already exists.' });
    }

    // Senior Security Spec: bcrypt password hashing with 12 salt rounds
    const passwordHash = bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);

    const newUser = {
      id: `u-${Date.now()}`,
      organizationId: 'org-101',
      orgRole: 'USER',
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      passwordHash,
      role: 'USER',
      isVerified: true,
      deactivationPin: '1234',
      stealthCode: '9999'
    };

    db.createUser(newUser);
    db.save();

    const { accessToken, refreshToken } = generateTokens(newUser);
    createSessionRecord(newUser.id, refreshToken, req);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logAuth('REGISTER_SUCCESS', newUser.id, { email: cleanEmail });

    const { passwordHash: _ph, ...userWithoutPassword } = newUser;
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: userWithoutPassword,
      token: accessToken
    });
  } catch (err) {
    logger.error(`[Auth Register Error]: ${err.message}`, { error: err.stack });
    return res.status(500).json({
      success: false,
      error: 'Registration failed due to an internal server error. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
});

// 2. POST /api/auth/login
router.post('/login', authRateLimiter, validate(loginSchema), (req, res) => {
  try {
    const { email, role, password } = req.body;
    const users = db.getUsers() || [];
    
    let user;
    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      user = users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
    }
    
    if (!user && role === 'ADMIN') {
      user = users.find(u => u.role === 'ADMIN');
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email credentials or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email credentials or password.' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    createSessionRecord(user.id, refreshToken, req);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logAuth('LOGIN_SUCCESS', user.id, { email: user.email });

    const { passwordHash: _ph, ...userWithoutPassword } = user;
    return res.json({
      success: true,
      message: 'Signed in successfully',
      user: userWithoutPassword,
      token: accessToken
    });
  } catch (err) {
    logger.error(`[Auth Login Error]: ${err.message}`, { error: err.stack });
    return res.status(500).json({
      success: false,
      error: 'Login failed due to an internal server error. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
});

// 3. POST /api/auth/refresh (Refresh Token Rotation & Security Verification)
router.post('/refresh', (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'Refresh token is required.' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const session = db.findSession(refreshToken);

    if (!session || session.isRevoked) {
      logSecurity('Refresh Token Reuse Attempt', req.ip, { userId: decoded.id });
      db.revokeAllUserSessions(decoded.id);
      res.clearCookie('refreshToken');
      return res.status(403).json({ success: false, error: 'Security alert: Invalid or reused refresh token. Please login again.' });
    }

    db.revokeSession(refreshToken);
    const users = db.getUsers() || [];
    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer active.' });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);
    createSessionRecord(user.id, newRefreshToken, req);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ success: true, token: newAccessToken });
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Expired or invalid refresh token.' });
  }
});

// 4. POST /api/auth/forgot-password
router.post('/forgot-password', authRateLimiter, (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });

    const cleanEmail = email.trim().toLowerCase();
    const users = db.getUsers() || [];
    const user = users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(404).json({ success: false, error: 'No account registered with this email address.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000;

    if (!db.data) db.data = db.memoryData || {};
    if (!db.data.passwordResetTokens) db.data.passwordResetTokens = [];
    db.data.passwordResetTokens.push({ token: resetToken, userId: user.id, expiresAt });
    db.save();

    logger.info(`[Auth Security] Password reset token generated for ${cleanEmail}`);
    return res.json({ success: true, message: 'Password reset instructions generated.', resetToken });
  } catch (err) {
    logger.error(`[Auth Forgot-Password Error]: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to process forgot password request.' });
  }
});

// 5. POST /api/auth/reset-password
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!db.data) db.data = db.memoryData || {};
    if (!db.data.passwordResetTokens) db.data.passwordResetTokens = [];
    const record = db.data.passwordResetTokens.find(r => r.token === token && r.expiresAt > Date.now());
    
    if (!record) {
      return res.status(400).json({ success: false, error: 'Invalid or expired password reset token.' });
    }

    const users = db.getUsers() || [];
    const user = users.find(u => u.id === record.userId);
    if (!user) {
      return res.status(400).json({ success: false, error: 'Associated user account not found.' });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, BCRYPT_SALT_ROUNDS);
    db.revokeAllUserSessions(user.id);
    db.data.passwordResetTokens = db.data.passwordResetTokens.filter(r => r.token !== token);
    db.save();

    return res.json({ success: true, message: 'Password has been reset successfully. All other sessions logged out.' });
  } catch (err) {
    logger.error(`[Auth Reset-Password Error]: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
});

// 6. POST /api/auth/verify-email
router.post('/verify-email', (req, res) => {
  try {
    const { token } = req.body;
    if (!db.data) db.data = db.memoryData || {};
    if (!db.data.verificationTokens) db.data.verificationTokens = [];
    
    const record = db.data.verificationTokens.find(v => v.token === token && v.expiresAt > Date.now());
    if (!record) {
      return res.status(400).json({ success: false, error: 'Invalid or expired email verification token.' });
    }

    const users = db.getUsers() || [];
    const user = users.find(u => u.id === record.userId);
    if (user) user.isVerified = true;
    
    db.data.verificationTokens = db.data.verificationTokens.filter(v => v.token !== token);
    db.save();

    return res.json({ success: true, message: 'Email address verified successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to verify email address.' });
  }
});

// 7. GET /api/auth/me (Protected Route)
router.get('/me', verifyToken, (req, res) => {
  try {
    const users = db.getUsers() || [];
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'Authenticated user profile not found.' });
    
    const { passwordHash: _ph, ...userWithoutPassword } = user;
    return res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
  }
});

// 8. POST /api/auth/logout (Secure Logout)
router.post('/logout', (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      db.revokeSession(refreshToken);
    }
    res.clearCookie('refreshToken');
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.clearCookie('refreshToken');
    return res.json({ success: true, message: 'Logged out.' });
  }
});

// 9. POST /api/auth/logout-all (Revoke All Sessions)
router.post('/logout-all', verifyToken, (req, res) => {
  try {
    db.revokeAllUserSessions(req.user.id);
    res.clearCookie('refreshToken');
    return res.json({ success: true, message: 'All active sessions have been revoked successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to revoke sessions.' });
  }
});

export default router;
