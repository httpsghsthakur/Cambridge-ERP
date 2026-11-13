const { AuditLog } = require('../models');

/**
 * Sanitizer helper to redact passwords and secrets from audit payloads.
 */
const sanitizePayload = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  if (Array.isArray(body)) {
    return body.map(item => sanitizePayload(item));
  }

  const copy = { ...body };
  const sensitiveKeys = ['password', 'currentPassword', 'newPassword', 'token'];
  
  for (const key in copy) {
    if (sensitiveKeys.includes(key)) {
      copy[key] = '[REDACTED]';
    } else if (typeof copy[key] === 'object' && copy[key] !== null) {
      copy[key] = sanitizePayload(copy[key]);
    }
  }
  return copy;
};

/**
 * Maps request context to descriptive action names and target tables.
 */
const parseAuditDetails = (req) => {
  const method = req.method;
  const url = req.originalUrl;
  
  let action = `${method} ${url}`;
  let targetType = 'system';
  
  if (url.startsWith('/api/auth/login')) {
    action = 'USER_LOGIN';
    targetType = 'auth';
  } else if (url.startsWith('/api/auth/register')) {
    action = 'USER_REGISTER';
    targetType = 'auth';
  } else if (url.startsWith('/api/auth/change-password')) {
    action = 'PASSWORD_CHANGE';
    targetType = 'auth';
  } else if (url.startsWith('/api/students')) {
    targetType = 'student';
    if (url.includes('/approval')) {
      action = 'STUDENT_APPROVAL';
    } else {
      action = method === 'POST' ? 'STUDENT_CREATE' : method === 'PUT' ? 'STUDENT_UPDATE' : 'STUDENT_DEACTIVATE';
    }
  } else if (url.startsWith('/api/teachers')) {
    targetType = 'teacher';
    action = method === 'POST' ? 'TEACHER_CREATE' : method === 'PUT' ? 'TEACHER_UPDATE' : 'TEACHER_DEACTIVATE';
  } else if (url.startsWith('/api/fees')) {
    targetType = 'fees';
    if (url.includes('/collect')) {
      action = 'FEE_COLLECTION';
    } else if (url.includes('/structure')) {
      action = method === 'POST' ? 'FEE_STRUCTURE_CREATE' : 'FEE_STRUCTURE_UPDATE';
    } else {
      action = 'FEE_RECORD_CREATE';
    }
  } else if (url.startsWith('/api/results')) {
    targetType = 'result';
    if (url.includes('/incharge-review')) {
      action = 'RESULT_INCHARGE_REVIEW';
    } else if (url.includes('/submit')) {
      action = 'RESULT_SUBMISSION';
    } else if (url.includes('/bulk-admin2-review')) {
      action = 'RESULT_ADMIN2_REVIEW';
    } else if (url.includes('/bulk-publish-class') || url.includes('/bulk-publish')) {
      action = 'RESULT_PUBLISH';
    } else {
      action = method === 'POST' ? 'RESULT_CREATE' : method === 'PUT' ? 'RESULT_UPDATE' : 'RESULT_ACTION';
    }
  } else if (url.startsWith('/api/session')) {
    targetType = 'session';
    action = 'SESSION_CREATE';
  } else if (url.startsWith('/api/timetable')) {
    targetType = 'timetable';
    action = method === 'POST' ? 'TIMETABLE_CREATE' : 'TIMETABLE_UPDATE';
  } else if (url.startsWith('/api/class-fees')) {
    targetType = 'class_fees';
    action = 'CLASS_FEES_UPDATE';
  } else if (url.startsWith('/api/class-incharge')) {
    targetType = 'class_incharge';
    action = 'CLASS_INCHARGE_UPDATE';
  }
  
  return { action, targetType };
};

/**
 * Express middleware to capture and log administrative actions.
 */
const auditLogger = async (req, res, next) => {
  // Only capture mutations: POST, PUT, DELETE
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Intercept the outgoing json response to audit successful updates
  const originalJson = res.json;
  res.json = function (data) {
    res.json = originalJson;
    
    // Log asynchronously so we do not block client latency
    const recordAudit = async () => {
      try {
        // Skip logging if the request failed (non-2xx responses)
        if (res.statusCode < 200 || res.statusCode >= 300) return;

        const { action, targetType } = parseAuditDetails(req);
        
        // Find target ID from parameters, body, or response
        let targetId = null;
        if (req.params.id) {
          targetId = parseInt(req.params.id, 10) || null;
        } else if (data && data.id) {
          targetId = parseInt(data.id, 10) || null;
        } else if (data && data.student && data.student.id) {
          targetId = parseInt(data.student.id, 10) || null;
        } else if (data && data.teacher && data.teacher.id) {
          targetId = parseInt(data.teacher.id, 10) || null;
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        
        await AuditLog.create({
          user_id: req.user ? req.user.id : null,
          action,
          target_type: targetType,
          target_id: targetId,
          new_values: sanitizePayload(req.body),
          ip_address: ip,
          user_agent: userAgent
        });
      } catch (err) {
        console.error('[AUDIT LOGGER ERROR]:', err.message);
      }
    };

    recordAudit();
    return originalJson.call(this, data);
  };

  next();
};

module.exports = auditLogger;
