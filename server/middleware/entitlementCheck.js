const { CentralConfig } = require('../models');

let cachedSuspension = null;
let lastCheckTime = 0;
const CACHE_TTL_MS = 3000; // 3 seconds TTL for fast response without overloading DB

/**
 * Entitlement and Application-Level Suspension Middleware
 * 
 * Enforces remote suspension without risking or modifying underlying school data.
 * When suspended:
 * - All normal operations for students, teachers, parents, and public are blocked (HTTP 423 Locked).
 * - Central platform endpoints (/api/central/*) ALWAYS remain active to receive reactivation commands.
 * - Admin credentials and settings routes remain accessible so school administrators can view status and contact support.
 */
async function entitlementCheck(req, res, next) {
  const path = req.path || '';

  // 1. Whitelisted routes that MUST always be accessible
  if (
    path.startsWith('/api/central') ||
    path.startsWith('/api/health') ||
    path.startsWith('/api/db-check') ||
    path === '/api/auth/login' ||
    path === '/api/auth/logout' ||
    path === '/api/auth/csrf-token'
  ) {
    return next();
  }

  // 2. Query suspension state (cached with short TTL)
  const now = Date.now();
  if (!cachedSuspension || (now - lastCheckTime) > CACHE_TTL_MS) {
    try {
      const config = await CentralConfig.findOne();
      cachedSuspension = {
        is_suspended: config ? !!config.is_suspended : false,
        reason: config?.suspension_reason || 'This school management service is temporarily inactive. Please contact the platform administrator.',
        suspended_at: config?.suspended_at || null,
        support_email: config?.support_contact || 'support@centralplatform.local',
      };
      lastCheckTime = now;
    } catch (err) {
      // In case of error reading DB config, fail open to avoid downtime
      return next();
    }
  }

  if (cachedSuspension.is_suspended) {
    // If the request is from an authenticated admin, allow them to view settings / admin panel
    if (req.user && req.user.role === 'admin') {
      res.setHeader('X-ERP-Suspension-Notice', 'Active - Super Admin Emergency Access Only');
      return next();
    }

    return res.status(423).json({
      status: 'suspended',
      error: 'SERVICE_SUSPENDED',
      message: cachedSuspension.reason,
      suspended_at: cachedSuspension.suspended_at,
      support_email: cachedSuspension.support_email,
      reassurance: 'All school academic, student, and teacher records remain securely preserved and untouched.',
    });
  }

  next();
}

/**
 * Invalidate cached suspension state immediately upon remote command execution.
 */
function invalidateSuspensionCache() {
  cachedSuspension = null;
  lastCheckTime = 0;
}

module.exports = {
  entitlementCheck,
  invalidateSuspensionCache,
};
