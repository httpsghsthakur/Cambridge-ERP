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

module.exports = {
  feeCollectionLimiter,
  attendanceLimiter,
  profileUpdateLimiter,
};
