const rateLimit = require('express-rate-limit');

// Fee Collection Limiter: max 10 requests per minute per IP
const feeCollectionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many fee collection requests. Please try again later.' },
});

// Attendance Submission Limiter: max 30 requests per minute per IP
const attendanceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attendance submissions. Please try again later.' },
});

// Profile Update Limiter: max 10 requests per minute per IP
const profileUpdateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many profile updates. Please try again later.' },
});

// Password Change Limiter: max 5 requests per 15 minutes per IP
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password change attempts. Please try again after 15 minutes.' },
});

// Credential Management Limiter: max 15 requests per 10 minutes per IP
const credentialUpdateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many credential modifications. Please try again later.' },
});

// Administrative Sensitive Actions Limiter: max 30 requests per minute per IP
const adminSensitiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Rate limit exceeded for sensitive administrative operations.' },
});

module.exports = {
  feeCollectionLimiter,
  attendanceLimiter,
  profileUpdateLimiter,
  passwordChangeLimiter,
  credentialUpdateLimiter,
  adminSensitiveLimiter,
};
