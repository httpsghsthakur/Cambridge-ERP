const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { User, Student, Teacher } = require('../models');
const { protect, authorize, isSuperAdmin } = require('../middleware/auth');
const { validateLogin, validateRegister, validateChangePassword } = require('../middleware/validator');

// (M7 fix) — all roles including student and parent can change their own password
const PASSWORD_CHANGE_ROLES = ['admin', 'admin2', 'teacher', 'fee_collector', 'student', 'parent'];

// Detect if the deployment uses HTTPS (from CLIENT_URL or NODE_ENV)
const isSecure = process.env.NODE_ENV === 'production'
  || (process.env.CLIENT_URL || '').startsWith('https');

const buildCookieOptions = () => ({
  expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: isSecure,
  sameSite: isSecure ? 'none' : 'lax'
});

// (L1 fix) — rate limit login to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per window
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// (L2 fix) — rate limit registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // 5 attempts per window
  message: { message: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-change-me', { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/login
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    // Try with full includes first, fall back to basic query if columns are missing
    let user;
    try {
      user = await User.findOne({
        where: { email },
        include: [
          { model: Student, as: 'linkedStudent', attributes: ['id', 'student_id', 'roll_number', 'first_name', 'last_name', 'class', 'section', 'date_of_birth', 'gender', 'session_id', 'parent_name', 'parent_phone', 'parent_email', 'approval_status'] },
          { model: Teacher, as: 'linkedTeacher', attributes: ['id', 'name', 'subject', 'assigned_classes', 'staff_type'] }
        ]
      });
    } catch (includeErr) {
      console.warn('[LOGIN] Include query failed, retrying without includes:', includeErr.message);
      user = await User.findOne({ where: { email } });
    }

    if (!user) {
      console.log(`[LOGIN FAILED] Email not found in DB: "${email}"`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      console.log(`[LOGIN FAILED] User is disabled in DB: "${email}"`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // (S1 fix) — Check if account is locked
    if (user.lock_until && user.lock_until > Date.now()) {
      console.log(`[LOGIN FAILED] Account locked: "${email}"`);
      return res.status(403).json({ message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log(`[LOGIN FAILED] Password mismatch for: "${email}"`);
      // Increment login attempts (safe even if column doesn't exist yet)
      try {
        user.login_attempts = (user.login_attempts || 0) + 1;
        if (user.login_attempts >= 5) {
          user.lock_until = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
        }
        await user.save();
      } catch (saveErr) {
        console.warn('[LOGIN] Could not update login_attempts:', saveErr.message);
      }
      
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Reset login attempts on successful login
    try {
      if ((user.login_attempts || 0) > 0 || user.lock_until) {
        user.login_attempts = 0;
        user.lock_until = null;
        await user.save();
      }
    } catch (saveErr) {
      console.warn('[LOGIN] Could not reset login_attempts:', saveErr.message);
    }

    if (user.role === 'student' && user.linkedStudent?.approval_status !== 'approved') {
      return res.status(403).json({ message: 'Student account is pending approval.' });
    }

    const token = signToken(user.id);

    // Set JWT in HttpOnly cookie
    const cookieOptions = buildCookieOptions();
    res.cookie('jwt', token, cookieOptions);

    // Set CSRF token cookie (Not HttpOnly, so JS can read it and send it in header)
    const csrfToken = require('crypto').randomUUID();
    res.cookie('csrf-token', csrfToken, {
      ...cookieOptions,
      httpOnly: false
    });

    res.json({
      token, // Kept for backward compatibility during migration, frontend will stop using it
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile_photo: user.profile_photo,
        linkedStudent: user.linkedStudent || null,
        linkedTeacher: user.linkedTeacher || null
      }
    });
  } catch (err) {
    console.error('[LOGIN CRASH]', err.message, err.stack);
    res.status(500).json({ message: 'Login failed: ' + err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const logoutExpiry = new Date(Date.now() + 10 * 1000);
  res.cookie('jwt', 'none', {
    expires: logoutExpiry,
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax'
  });
  res.cookie('csrf-token', 'none', {
    expires: logoutExpiry,
    httpOnly: false,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax'
  });
  res.status(200).json({ success: true, message: 'User logged out successfully' });
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// (C2 fix) — POST /api/auth/register is now protected. Only admin can create new users.
// The role field is restricted — admin cannot create another 'admin' via this endpoint.
router.post('/register', protect, isSuperAdmin, registerLimiter, validateRegister, async (req, res) => {
  try {
    const { name, email, password, role, linked_student_id, linked_teacher_id } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // Whitelist allowed roles for registration (prevent self-escalation)
    const ALLOWED_REGISTER_ROLES = ['admin2', 'teacher', 'student', 'parent', 'fee_collector'];
    if (role && !ALLOWED_REGISTER_ROLES.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Allowed: ${ALLOWED_REGISTER_ROLES.join(', ')}` });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'parent',
      linked_student_id: linked_student_id || null,
      linked_teacher_id: linked_teacher_id || null,
    });

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      message: 'User created successfully.',
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// PUT /api/auth/change-password — (M7 fix) all authenticated users can change password
router.put('/change-password', protect, authorize(...PASSWORD_CHANGE_ROLES), validateChangePassword, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Current password and a 6+ character new password are required.' });
    }

    const user = await User.findByPk(req.user.id);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    // (M5 fix) — track when password was changed so tokens issued before this are invalidated
    user.password_changed_at = new Date();
    await user.save();

    // Issue a new token so the user stays logged in
    const token = signToken(user.id);
    
    // Set JWT in HttpOnly cookie
    const cookieOptions = buildCookieOptions();
    res.cookie('jwt', token, cookieOptions);

    // Set CSRF token cookie (Not HttpOnly, so JS can read it and send it in header)
    const csrfToken = require('crypto').randomUUID();
    res.cookie('csrf-token', csrfToken, {
      ...cookieOptions,
      httpOnly: false
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Password change failed. Please try again.' });
  }
});

module.exports = router;
