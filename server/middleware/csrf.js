/**
 * CSRF Protection Middleware
 * Implements the Double Submit Cookie pattern.
 */
const csrfProtection = (req, res, next) => {
  // Safe methods that don't alter state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exclude login and register routes from CSRF
  const excludedPaths = ['/api/auth/login', '/api/auth/register'];
  const reqPath = req.originalUrl.split('?')[0].replace(/\/+$/, '');
  if (excludedPaths.includes(reqPath)) {
    return next();
  }

  const csrfCookie = req.cookies['csrf-token'];
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    console.error(`[CSRF ERROR] Invalid or missing CSRF token for ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ message: 'CSRF token validation failed.' });
  }

  next();
};

module.exports = csrfProtection;
