const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';

  // Log full error server-side (L7 — in production, consider a structured logger)
  if (!isProd) {
    console.error(err.stack);
  } else {
    console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({ message: 'Validation Error', errors: messages });
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ message: 'Duplicate entry. Record already exists.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired. Please log in again.' });
  }

  // (M10) In production, never leak internal error messages
  const statusCode = err.status || 500;
  const message = isProd && statusCode === 500
    ? 'An unexpected error occurred.'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;