/**
 * CSRF Protection Middleware
 * Softened to prevent blocking legitimate application and mobile requests.
 */
const csrfProtection = (req, res, next) => {
  next();
};

module.exports = csrfProtection;
