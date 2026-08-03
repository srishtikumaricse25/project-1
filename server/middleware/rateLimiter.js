import rateLimit from 'express-rate-limit';

// Standard API Rate Limit Error Response Formatter
const createRateLimitMessage = (msg) => ({
  success: false,
  error: msg,
  timestamp: new Date().toISOString()
});

// 1. Auth Rate Limiter (Brute-force protection for login, register, reset-password)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP per window
  message: createRateLimitMessage('Too many authentication attempts. Please try again after 15 minutes.'),
  standardHeaders: true,
  legacyHeaders: false
});

// 2. OTP / SMS Verification Rate Limiter
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 verification attempts per window
  message: createRateLimitMessage('Too many OTP verification attempts. Please wait 15 minutes.'),
  standardHeaders: true,
  legacyHeaders: false
});

// 3. SOS Trigger Emergency Rate Limiter
export const sosRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Max 5 emergency triggers per minute
  message: createRateLimitMessage('Too many emergency requests from this IP, please try again after a minute.'),
  standardHeaders: true,
  legacyHeaders: false
});

// 4. Global API Throttling Rate Limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: createRateLimitMessage('Too many requests from this IP. Please try again later.'),
  standardHeaders: true,
  legacyHeaders: false
});
