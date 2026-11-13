const { SecurityLog } = require('../models');

// Enterprise WAF Signature Patterns
const SQLI_PATTERN = /union\s+(?:all\s+)?select|['"]\s*or\s+['"]?1['"]?\s*=\s*['"]?1|waitfor\s+delay|benchmark\s*\(|pg_sleep\s*\(|sleep\s*\(|;\s*drop\s+table|;\s*insert\s+into|;\s*delete\s+from/i;
const XSS_PATTERN = /<script\b[^>]*>|javascript:\s*[\w\d(]|on(?:error|load|click|mouseover|focus|blur|submit)\s*=|<svg\b[^>]*onload|document\.cookie|<iframe\b/i;
const PATH_TRAVERSAL_PATTERN = /(?:\.\.[\\/]|%2e%2e[%2f\\|/])|(?:etc[\\/]passwd|win\.ini|boot\.ini)/i;
const COMMAND_INJECTION_PATTERN = /;\s*(?:rm\s+-rf|curl\s+|wget\s+|cat\s+\/etc|powershell|cmd\.exe|nc\s+-l)|\|\s*(?:bash|sh|powershell)|`[^`]*`|\$\([^)]+\)/i;
const PROTOTYPE_POLLUTION_PATTERN = /__proto__|constructor\s*\[\s*['"]prototype['"]\s*\]|prototype\s*\.\s*polluted/i;
const SCANNER_BOT_PATTERN = /sqlmap|nikto|acunetix|masscan|gobuster|dirbuster|wpscan|openvas/i;

/**
 * Recursively scans payload objects, arrays, and strings for malicious attack signatures.
 * Automatically attempts URL decoding to detect obfuscated attacks.
 */
const scanPayload = (data, depth = 0) => {
  if (!data || depth > 8) return null;

  let str = '';
  if (typeof data === 'object') {
    // Check object keys for prototype pollution
    const ownKeys = Object.getOwnPropertyNames(data);
    for (const key of ownKeys) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return {
          type: 'PROTOTYPE_POLLUTION',
          severity: 'red',
          couldHappen: 'Global prototype pollution, remote code execution, or property hijacking.',
        };
      }
    }
    str = JSON.stringify(data);
  } else {
    str = String(data);
  }

  // Attempt URL decode to unmask encoded payloads (e.g. %3Cscript%3E)
  let decodedStr = str;
  try {
    decodedStr = decodeURIComponent(str);
  } catch (e) {
    // If malformed URI, continue scanning raw string
  }

  const targetStr = `${str} ${decodedStr}`;

  if (PROTOTYPE_POLLUTION_PATTERN.test(targetStr)) {
    return {
      type: 'PROTOTYPE_POLLUTION',
      severity: 'red',
      couldHappen: 'Prototype tampering and unauthorized parameter injection.',
    };
  }

  if (COMMAND_INJECTION_PATTERN.test(targetStr)) {
    return {
      type: 'COMMAND_INJECTION',
      severity: 'red',
      couldHappen: 'Arbitrary server shell command execution and remote server compromise.',
    };
  }

  if (SQLI_PATTERN.test(targetStr)) {
    return {
      type: 'SQL_INJECTION',
      severity: 'red',
      couldHappen: 'Database dump, authentication bypass, data exfiltration, or table drop.',
    };
  }

  if (XSS_PATTERN.test(targetStr)) {
    return {
      type: 'CROSS_SITE_SCRIPTING',
      severity: 'red',
      couldHappen: 'Session token hijacking, malicious script execution, or unauthorized UI manipulation.',
    };
  }

  if (PATH_TRAVERSAL_PATTERN.test(targetStr)) {
    return {
      type: 'PATH_TRAVERSAL',
      severity: 'yellow',
      couldHappen: 'Arbitrary local file reading, system credential disclosure, or configuration theft.',
    };
  }

  return null;
};

/**
 * Enterprise Security Logger & WAF Middleware
 * Intercepts requests, inspects telemetry, blocks known threat vectors,
 * and maintains auditable forensic logs in the database.
 */
const securityLogger = async (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const endpoint = req.originalUrl || req.path || '';
  const userAgent = req.headers['user-agent'] || '';

  // Skip static assets
  if (endpoint.startsWith('/uploads') || endpoint.startsWith('/static') || endpoint.endsWith('.ico') || endpoint.endsWith('.png')) {
    return next();
  }

  // 1. Check for Automated Vulnerability Scanner User-Agents
  if (userAgent && SCANNER_BOT_PATTERN.test(userAgent)) {
    try {
      await SecurityLog.create({
        severity: 'red',
        threat_type: 'AUTOMATED_SCANNER_PROBE',
        what_happened: `Blocked automated security scanning tool probe: "${userAgent}"`,
        what_could_happen: 'Automated vulnerability reconnaissance and attack exploitation.',
        ip_address: ip,
        endpoint: endpoint,
        user_id: req.user ? req.user.id : null,
        payload: { userAgent, query: req.query, params: req.params },
      });
    } catch (e) {}

    return res.status(403).json({
      message: 'Access Denied: Automated vulnerability scanner activity blocked.',
    });
  }

  // 2. Scan Query, Route Params, and Request Body
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
        payload: { query: req.query, params: req.params, body: req.body },
      });
    } catch (e) {
      console.error('[WAF LOG ERROR]', e.message);
    }

    return res.status(403).json({
      message: 'Access Denied: Malicious activity detected and logged.',
      threat_type: activeThreat.type,
    });
  }

  next();
};

module.exports = securityLogger;
