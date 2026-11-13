const jwt      = require('jsonwebtoken');
const { User, Student, Teacher } = require('../models');
const { PERMISSIONS, ROLE_LEVELS } = require('../config/roles');

/**
 * protect — verifies JWT and attaches req.user
 * Must be used before any permission middleware.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized. No token provided.' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'cambridge-erp-dev-secret-key-auth-32chars';
    const decoded = jwt.verify(token, jwtSecret);

    // (H2 fix) — explicitly include linked_student_id and linked_teacher_id
    // so IDOR checks in fee/attendance routes work correctly
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Student, as: 'linkedStudent', attributes: ['id', 'student_id', 'roll_number', 'first_name', 'last_name', 'class', 'section', 'date_of_birth', 'gender', 'session_id', 'parent_name', 'parent_phone', 'parent_email', 'approval_status'] },
        { model: Teacher, as: 'linkedTeacher', attributes: ['id', 'name', 'subject', 'assigned_classes'] }
      ],
    });

    if (!req.user || req.user.is_active === false) {
      return res.status(401).json({ message: 'User not found or deactivated.' });
    }

    if (req.user.role === 'student' && req.user.linkedStudent?.approval_status !== 'approved') {
      return res.status(401).json({ message: 'Student account is not approved.' });
    }

    // (M5 partial fix) — check if token was issued before a password change
    // by comparing the token iat with user's updated_at
    if (decoded.iat) {
      const tokenIssuedAt = new Date(decoded.iat * 1000);
      const rawUpdatedAt = req.user.updatedAt || req.user.updated_at;
      const userUpdatedAt = rawUpdatedAt ? new Date(rawUpdatedAt) : null;
      if (userUpdatedAt && userUpdatedAt > tokenIssuedAt) {
        // If user record was updated after token was issued,
        // and password was changed, this token should be invalid.
        // We check password_changed_at if available
        if (req.user.password_changed_at) {
          const pwChangedAt = new Date(req.user.password_changed_at);
          if (pwChangedAt > tokenIssuedAt) {
            return res.status(401).json({ message: 'Token invalidated. Please log in again.' });
          }
        }
      }
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

/**
 * authorize(...roles) — allows specific roles
 *
 * Usage:
 *   router.get('/', protect, authorize('admin', 'admin2'), handler)
 *
 * This is the core middleware. Always use PERMISSIONS constants from roles.js
 * rather than hardcoding strings.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required: [${roles.join(', ')}]. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

/**
 * hasPermission(permissionKey) — uses named permission groups from roles.js
 *
 * Usage:
 *   router.get('/teachers', protect, hasPermission('VIEW_TEACHERS'), handler)
 *
 * Cleaner than listing roles manually — permissions are defined once in roles.js
 */
const hasPermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const allowedRoles = PERMISSIONS[permissionKey];

    if (!allowedRoles) {
      console.error(`[RBAC] Unknown permission key: "${permissionKey}"`);
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Permission required: ${permissionKey}`,
      });
    }

    next();
  };
};

/**
 * hasMinimumRole(roleName) — allows this role AND any role above it in hierarchy.
 *
 * Usage:
 *   router.get('/', protect, hasMinimumRole('admin2'), handler)
 *   // Allows: admin2, admin (anything at level 4+)
 *
 * Good for "at least manager level" type checks.
 */
const hasMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const userLevel    = ROLE_LEVELS[req.user.role]    || 0;
    const minimumLevel = ROLE_LEVELS[minimumRole]       || 0;

    if (userLevel < minimumLevel) {
      return res.status(403).json({
        message: `Access denied. Minimum role required: ${minimumRole}`,
      });
    }

    next();
  };
};

// ── Convenience shorthands ────────────────────────────────────────────────────
// These replace the old "if (req.user.role !== 'admin')" pattern.

/** Allows admin only */
const isSuperAdmin = authorize('admin');

/** Allows admin OR admin2 */
const isAdmin = authorize('admin', 'admin2');

/** Allows admin, admin2, teacher */
const isStaff = authorize('admin', 'admin2', 'teacher');

/** Allows admin, admin2, fee_collector */
const isFinance = authorize('admin', 'admin2', 'fee_collector');

module.exports = {
  protect,
  authorize,
  hasPermission,
  hasMinimumRole,
  // Shorthands
  isSuperAdmin,
  isAdmin,
  isStaff,
  isFinance,
};
