const crypto = require('crypto');

function pad(value, size = 5) {
  return String(value).padStart(size, '0');
}

function makeStudentId(id) {
  return `STU${pad(id)}`;
}

function makeTeacherId(id) {
  return `TCH${pad(id)}`;
}

function makeStudentEmail(studentId) {
  return `${studentId.toLowerCase()}@school.local`;
}

/**
 * (M2 fix) — generate a cryptographically random temporary password
 * instead of the predictable firstName@lastFourDigits pattern.
 * 
 * Format: 16-character alphanumeric random string
 * Example: "kQ7x9mT2pL4wR8nB"
 */
function makeTemporaryPassword() {
  return crypto.randomBytes(12).toString('base64url').slice(0, 16);
}

module.exports = {
  makeStudentId,
  makeTeacherId,
  makeStudentEmail,
  makeTemporaryPassword,
};
