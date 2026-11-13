const crypto = require('crypto');

/**
 * Security Service for Central Platform Integration Connector
 * Handles cryptographic signatures (HMAC-SHA256), replay prevention,
 * nonce validation, and STRICT financial data exclusion.
 */

// Forbidden financial keywords and concepts — NON-NEGOTIABLE POLICY
const FORBIDDEN_FINANCIAL_KEYS = [
  'fee',
  'fees',
  'amount',
  'paid_amount',
  'due_amount',
  'dues',
  'fine',
  'discount',
  'waiver',
  'receipt',
  'receipt_no',
  'salary',
  'payroll',
  'bank',
  'bank_account',
  'account_number',
  'ifsc',
  'transaction',
  'transactions',
  'transaction_id',
  'income',
  'expense',
  'expenses',
  'ledger',
  'cheque',
  'balance',
  'total_due',
  'student_fee',
  'class_fee',
];

/**
 * Asserts that a data structure contains ZERO school financial data.
 * Throws a SecurityError if any financial keyword or model data is found.
 */
function assertNoFinancialData(obj, path = '') {
  if (obj === null || obj === undefined) return;

  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => assertNoFinancialData(item, `${path}[${index}]`));
    return;
  }

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      for (const forbidden of FORBIDDEN_FINANCIAL_KEYS) {
        if (
          lowerKey === forbidden ||
          lowerKey.startsWith(`${forbidden}_`) ||
          lowerKey.endsWith(`_${forbidden}`) ||
          lowerKey.includes(`_${forbidden}_`)
        ) {
          throw new Error(
            `[SECURITY_VIOLATION_FINANCIAL_DATA_DETECTED] Financial data detected at path "${path ? `${path}.` : ''}${key}". ` +
            `Transmission of school financial records to Central Platform is strictly prohibited by policy.`
          );
        }
      }
      assertNoFinancialData(value, path ? `${path}.${key}` : key);
    }
  }
}

/**
 * Generates an HMAC-SHA256 signature for an API payload using the connector secret
 */
function generateHmacSignature(payload, secret) {
  if (!secret) throw new Error('Connector secret is required to generate signature');
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(serialized).digest('hex');
}

/**
 * Validates an HMAC-SHA256 signature using timing-safe comparison to prevent timing attacks
 */
function verifyHmacSignature(payload, signature, secret) {
  if (!payload || !signature || !secret) return false;
  try {
    const expected = generateHmacSignature(payload, secret);
    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    return false;
  }
}

/**
 * Validates request timestamp to prevent replay attacks (allowed drift: 5 minutes)
 */
function verifyTimestamp(timestamp, maxDriftSec = 300) {
  if (!timestamp) return false;
  const reqTime = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  const now = Date.now();
  const diffSec = Math.abs(now - reqTime) / 1000;
  return diffSec <= maxDriftSec;
}

/**
 * Generates a cryptographically secure random token (hex)
 */
function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = {
  assertNoFinancialData,
  generateHmacSignature,
  verifyHmacSignature,
  verifyTimestamp,
  generateSecureToken,
  FORBIDDEN_FINANCIAL_KEYS,
};
