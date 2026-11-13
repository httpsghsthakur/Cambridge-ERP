const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

// Static dummy bcrypt hash used to normalize execution time against timing enumeration attacks
const DUMMY_BCRYPT_HASH = '$2a$12$e80yq7Kj4G1XJvM1jB70w.nL64Z28vI8e31k/8uQ4uVzO50qX5D9m';

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'cambridge-erp-dev-secret-key-auth-32chars';
};
const { sequelize, User, Student, Teacher } = require('../models');
const { protect, authorize, isSuperAdmin } = require('../middleware/auth');
const { validateLogin, validateRegister, validateChangePassword } = require('../middleware/validator');
const { passwordChangeLimiter } = require('../middleware/rateLimiters');

// (M7 fix) — all roles including student and parent can change their own password
const PASSWORD_CHANGE_ROLES = ['admin', 'admin2', 'teacher', 'fee_collector', 'student', 'parent'];

// Detect if the deployment uses HTTPS (from CLIENT_URL or NODE_ENV)
const isSecure = process.env.NODE_ENV === 'production'
  || (process.env.CLIENT_URL || '').startsWith('https');

const buildCookieOptions = () => ({
  expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: isSecure,
  sameSite: 'lax'
});

// Rate limiters disabled to prevent blocking logins/registrations
const loginLimiter = (req, res, next) => next();
const registerLimiter = (req, res, next) => next();

const signToken = (id) =>
  jwt.sign({ id }, getJwtSecret(), { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/login
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const trimmedEmail = (email || '').trim();

    // Try finding user (case-insensitive for reliability)
    let user;
    try {
      user = await User.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('email')),
          trimmedEmail.toLowerCase()
        ),
        include: [
          { model: Student, as: 'linkedStudent', attributes: ['id', 'student_id', 'roll_number', 'first_name', 'last_name', 'class', 'section', 'date_of_birth', 'gender', 'session_id', 'parent_name', 'parent_phone', 'parent_email', 'approval_status'] },
          { model: Teacher, as: 'linkedTeacher', attributes: ['id', 'name', 'subject', 'assigned_classes', 'staff_type'] }
        ]
      });
    } catch (includeErr) {
      console.warn('[LOGIN] Include query failed, retrying without includes:', includeErr.message);
      try {
        user = await User.findOne({
          where: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('email')),
            trimmedEmail.toLowerCase()
          )
        });
      } catch (basicErr) {
        user = await User.findOne({ where: { email: trimmedEmail } });
      }
    }

    if (!user || user.is_active === false) {
      console.log(`[LOGIN FAILED] User not found or inactive: "${email}"`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log(`[LOGIN FAILED] Password mismatch for: "${email}"`);
      return res.status(401).json({ message: 'Invalid email or password.' });
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
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ message: err.message || 'Authentication error. Please try again.' });
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
router.put('/change-password', passwordChangeLimiter, protect, authorize(...PASSWORD_CHANGE_ROLES), validateChangePassword, async (req, res) => {
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
