/**
 * RBAC middleware is implemented in ./auth.js
 *
 * Available middleware exports from auth.js:
 *   - protect           — verify JWT, attach req.user
 *   - authorize(...roles) — restrict to specific roles
 *   - hasPermission(key)  — uses named permission groups from config/roles.js
 *   - hasMinimumRole(role) — allows this role and above in hierarchy
 *   - isSuperAdmin      — admin only
 *   - isAdmin           — admin + admin2
 *   - isStaff           — admin + admin2 + teacher
 *   - isFinance         — admin + admin2 + fee_collector
 *
 * Permission keys are defined in config/roles.js (PERMISSIONS object).
 */
module.exports = require('./auth');
