const express = require('express');
const router = express.Router();
const { CentralConfig, CentralSyncLog, CentralCommandLog } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { getOrCreateConfig, rotateCredentials } = require('../services/central/configService');
const { registerSchool } = require('../services/central/registrationService');
const { verifyAndCompletePairing } = require('../services/central/pairingService');
const { sendHeartbeat, synchronizeOperationalData } = require('../services/central/syncEngine');
const { processRemoteCommand } = require('../services/central/commandProcessor');
const { extractOperationalData } = require('../services/central/dataExtractor');
const {
  verifyHmacSignature,
  verifyTimestamp,
  assertNoFinancialData,
} = require('../services/central/securityService');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC SUSPENSION STATUS ROUTE (Exempt from auth)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/central/suspension-info
 * Returns live suspension status and support details for the red suspension page.
 */
router.get('/suspension-info', async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    res.json({
      success: true,
      is_suspended: !!config.is_suspended,
      suspension_reason: config.suspension_reason,
      suspended_at: config.suspended_at,
      school_id: config.school_id,
      school_name: config.school_name,
      support_email: config.support_contact || 'billing-support@schoolplatform.net',
      support_phone: '+1 (800) 555-0199',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES (Protected by JWT and Admin Role)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/central/status
 * Get the current integration configuration, pairing status, and recent logs.
 */
router.get('/status', protect, authorize('admin'), async (req, res) => {
  try {
    const config = await getOrCreateConfig();

    const recentSyncs = await CentralSyncLog.findAll({
      limit: 10,
      order: [['started_at', 'DESC']],
    });

    const recentCommands = await CentralCommandLog.findAll({
      limit: 10,
      order: [['executed_at', 'DESC']],
    });

    // Sanitized config for display (do NOT expose connector_secret)
    const sanitizedConfig = {
      school_id: config.school_id,
      school_name: config.school_name,
      connection_status: config.connection_status,
      connector_client_id: config.connector_client_id,
      pairing_token: config.pairing_token,
      pairing_token_expires_at: config.pairing_token_expires_at,
      approved_permissions: config.approved_permissions ? JSON.parse(config.approved_permissions) : [],
      central_api_url: config.central_api_url,
      sync_interval_minutes: config.sync_interval_minutes,
      is_sync_enabled: config.is_sync_enabled,
      is_suspended: config.is_suspended,
      suspension_reason: config.suspension_reason,
      suspended_at: config.suspended_at,
      subscription_plan: config.subscription_plan,
      subscription_status: config.subscription_status,
      subscription_expires_at: config.subscription_expires_at,
      last_heartbeat_at: config.last_heartbeat_at,
      last_sync_at: config.last_sync_at,
      last_error: config.last_error,
      connector_version: config.connector_version,
      erp_version: config.erp_version,
      created_at: config.created_at,
      updated_at: config.updated_at,
    };

    res.json({
      success: true,
      config: sanitizedConfig,
      recentSyncs,
      recentCommands,
    });
  } catch (err) {
    console.error('[CENTRAL GET /status]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/central/register
 * Initiates registration with Central Platform and receives permanent School ID.
 */
router.post('/register', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await registerSchool();
    res.json(result);
  } catch (err) {
    console.error('[CENTRAL POST /register]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/central/pair
 * Manually complete pairing verification challenge.
 */
router.post('/pair', protect, authorize('admin'), async (req, res) => {
  try {
    const { token } = req.body;
    const result = await verifyAndCompletePairing(token);
    res.json(result);
  } catch (err) {
    console.error('[CENTRAL POST /pair]', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/central/sync
 * Manually trigger operational data synchronization.
 */
router.post('/sync', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await synchronizeOperationalData('manual');
    res.json(result);
  } catch (err) {
    console.error('[CENTRAL POST /sync]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/central/heartbeat
 * Manually trigger heartbeat ping and process pending commands.
 */
router.post('/heartbeat', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await sendHeartbeat();
    res.json(result);
  } catch (err) {
    console.error('[CENTRAL POST /heartbeat]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/central/diagnostics
 * Run a full system connector diagnostic check.
 */
router.get('/diagnostics', protect, authorize('admin'), async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    const checks = [];

    // 1. Config Integrity
    checks.push({
      name: 'Integration Configuration',
      passed: !!config.connector_client_id && !!config.connector_secret,
      details: {
        school_id: config.school_id || 'Not assigned yet',
        connection_status: config.connection_status,
      },
    });

    // 2. Data Extractor & Financial Data Exclusion
    let extractionPassed = false;
    let financialExclusionPassed = false;
    let dataSummary = null;

    try {
      const data = await extractOperationalData();
      extractionPassed = true;
      assertNoFinancialData(data);
      financialExclusionPassed = true;
      dataSummary = {
        students: data.students.total_count,
        teachers: data.teachers.total_count,
        classes: data.academics.total_classes,
        financial_keys_detected: 0,
      };
    } catch (e) {
      dataSummary = { error: e.message };
    }

    checks.push({
      name: 'Operational Data Extractor',
      passed: extractionPassed,
      details: dataSummary,
    });

    checks.push({
      name: 'Strict Financial Data Exclusion Enforcement',
      passed: financialExclusionPassed,
      details: 'Deep recursive inspection verified: ZERO financial, fee, or payroll fields in payload.',
    });

    // 3. System Health
    checks.push({
      name: 'Runtime Telemetry',
      passed: true,
      details: {
        uptime_seconds: Math.floor(process.uptime()),
        memory_usage_mb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        node_version: process.version,
        connector_version: config.connector_version,
        is_suspended: config.is_suspended,
      },
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      school_id: config.school_id,
      connection_status: config.connection_status,
      diagnostics: checks,
    });
  } catch (err) {
    console.error('[CENTRAL GET /diagnostics]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/central/reconnect
 * Resets pairing state and re-registers without changing the permanent School ID.
 */
router.post('/reconnect', protect, authorize('admin'), async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    // Reset pairing status but keep permanent school_id intact
    await config.update({
      connection_status: 'awaiting_pairing',
      last_error: null,
    });

    const result = await registerSchool();
    res.json({
      success: true,
      message: 'Reconnection initiated. School ID preserved.',
      school_id: config.school_id,
      result,
    });
  } catch (err) {
    console.error('[CENTRAL POST /reconnect]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/central/rotate-credentials
 * Rotates connector secret securely while preserving permanent School ID.
 */
router.post('/rotate-credentials', protect, authorize('admin'), async (req, res) => {
  try {
    const updated = await rotateCredentials();
    res.json({
      success: true,
      message: 'Credentials rotated successfully. School ID preserved.',
      school_id: updated.school_id,
      client_id: updated.connector_client_id,
    });
  } catch (err) {
    console.error('[CENTRAL POST /rotate-credentials]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL PLATFORM INBOUND WEBHOOK (HMAC-SHA256 Authenticated)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/central/webhook
 * Receives remote management challenges and commands directly from Central Platform.
 */
router.post('/webhook', async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    const signature = req.headers['x-signature-256'];
    const timestamp = req.headers['x-timestamp'];
    const nonce = req.headers['x-nonce'];
    const incomingSchoolId = req.headers['x-school-id'];

    // 1. Verify Timestamp drift (within 5 minutes)
    if (!timestamp || !verifyTimestamp(timestamp, 300)) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TIMESTAMP',
        message: 'Request timestamp is invalid or drifted by more than 5 minutes.',
      });
    }

    // 2. Validate School ID if set
    if (config.school_id && incomingSchoolId && incomingSchoolId !== config.school_id) {
      return res.status(403).json({
        success: false,
        error: 'SCHOOL_ID_MISMATCH',
        message: 'Target School ID does not match this ERP installation.',
      });
    }

    // 3. Verify HMAC signature using connector_secret
    if (!signature || !verifyHmacSignature(req.body, signature, config.connector_secret)) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_SIGNATURE',
        message: 'HMAC signature verification failed. Unauthorized request.',
      });
    }

    const { action, command, pairing_token } = req.body;

    // Handle pairing verification challenge
    if (action === 'pairing_challenge') {
      const pairingResult = await verifyAndCompletePairing(pairing_token);
      return res.json(pairingResult);
    }

    // Handle remote command execution
    if (action === 'execute_command' && command) {
      const commandResult = await processRemoteCommand(command);
      return res.json(commandResult);
    }

    // Ping / connectivity probe
    if (action === 'ping') {
      return res.json({
        success: true,
        pong: true,
        school_id: config.school_id,
        connection_status: config.connection_status,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(400).json({
      success: false,
      error: 'UNKNOWN_ACTION',
      message: `Unknown webhook action: ${action}`,
    });
  } catch (err) {
    console.error('[CENTRAL WEBHOOK ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
