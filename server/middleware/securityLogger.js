const { SecurityLog } = require('../models');

// Basic patterns for high-level threat detection
const SQLI_PATTERN = /union\s+select|1=1|waitfor\s+delay|--|\bdrop\b\s+\btable\b/i;
const XSS_PATTERN = /<script>|javascript:|onerror=|onload=/i;
const PATH_TRAVERSAL_PATTERN = /\.\.\/|\.\.%2f/i;

const scanPayload = (data) => {
  if (!data) return null;
  const str = typeof data === 'object' ? JSON.stringify(data) : String(data);
  
  if (SQLI_PATTERN.test(str)) return { type: 'SQL_INJECTION', severity: 'red', couldHappen: 'Database dump, authentication bypass, or data destruction.' };
  if (XSS_PATTERN.test(str)) return { type: 'CROSS_SITE_SCRIPTING', severity: 'red', couldHappen: 'Stealing user sessions, redirecting users to malicious sites.' };
  if (PATH_TRAVERSAL_PATTERN.test(str)) return { type: 'PATH_TRAVERSAL', severity: 'yellow', couldHappen: 'Unauthorized access to server file system or sensitive config files.' };
  
  return null;
};

const securityLogger = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const endpoint = req.originalUrl;
  
  // Skip static files or known safe highly frequent routes
  if (endpoint.startsWith('/uploads') || endpoint.startsWith('/static')) {
    return next();
  }

  // Scan Query, Params, and Body
  const threatInQuery = scanPayload(req.query);
  const threatInParams = scanPayload(req.params);
  const threatInBody = scanPayload(req.body);

  const activeThreat = threatInQuery || threatInParams || threatInBody;

  if (activeThreat) {
    try {
      await SecurityLog.create({
        severity: activeThreat.severity,
        threat_type: activeThreat.type,
        what_happened: `Blocked malicious request containing suspicious payload.`,
        what_could_happen: activeThreat.couldHappen,
        ip_address: ip,
        endpoint: endpoint,
        user_id: req.user ? req.user.id : null,
        payload: { query: req.query, params: req.params, body: req.body }
      });
    } catch (e) {
      console.error('Failed to log security threat:', e);
    }
    
    // Block the request
    return res.status(403).json({ 
      message: 'Access Denied: Malicious activity detected and logged.' 
    });
  }

  next();
};

module.exports = securityLogger;
