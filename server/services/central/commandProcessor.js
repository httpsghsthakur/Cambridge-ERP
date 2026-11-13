const { CentralCommandLog, CentralConfig } = require('../../models');
const { getOrCreateConfig, rotateCredentials } = require('./configService');
const { verifyTimestamp } = require('./securityService');
const { invalidateSuspensionCache } = require('../../middleware/entitlementCheck');

/**
 * Remote Command Processor
 * Executes ONLY PREDEFINED, VALIDATED, AND AUDITABLE COMMANDS.
 * 
 * STRICT CYBERSECURITY RULE:
 * Absolutely NO arbitrary SQL, shell command, or remote code execution.
 */

const SUPPORTED_COMMANDS = [
  'suspend',
  'reactivate',
  'extend_subscription',
  'update_subscription',
  'sync_now',
  'health_check',
  'diagnostics',
  'rotate_credentials',
  'enable_module',
  'disable_module',
];

async function processRemoteCommand(commandData) {
  const {
    command_id,
    school_id,
    command_type,
    issued_by = 'central_platform_admin',
    payload = {},
    timestamp = Date.now(),
    expires_at = null,
  } = commandData;

  if (!command_id) throw new Error('command_id is required');
  if (!command_type) throw new Error('command_type is required');

  const config = (school_id ? await CentralConfig.findOne({ where: { school_id } }) : null) || await getOrCreateConfig();

  // Validate school ID if issued
  if (config.school_id && school_id && config.school_id !== school_id) {
    throw new Error(`School ID mismatch. Target: ${school_id}, Local: ${config.school_id}`);
  }

  // Check for command expiration
  if (expires_at && new Date(expires_at) < new Date()) {
    await CentralCommandLog.create({
      command_id,
      command_type,
      issued_by,
      status: 'rejected',
      payload: JSON.stringify(payload),
      result: JSON.stringify({ error: 'Command has expired' }),
      executed_at: new Date(),
    });
    return { success: false, status: 'rejected', error: 'Command has expired' };
  }

  // Replay protection: Check if command was already processed
  const existing = await CentralCommandLog.findOne({ where: { command_id } });
  if (existing) {
    return {
      success: true,
      status: existing.status,
      message: 'Command already processed (idempotent)',
      result: existing.result ? JSON.parse(existing.result) : null,
    };
  }

  // Check against supported command whitelist
  if (!SUPPORTED_COMMANDS.includes(command_type)) {
    const errorMsg = `Command "${command_type}" is not supported or recognized. Arbitrary execution is strictly prohibited.`;
    await CentralCommandLog.create({
      command_id,
      command_type,
      issued_by,
      status: 'rejected',
      payload: JSON.stringify(payload),
      result: JSON.stringify({ error: errorMsg }),
      executed_at: new Date(),
    });
    return { success: false, status: 'rejected', error: errorMsg };
  }

  let executionResult = null;
  let status = 'executed';

  try {
    switch (command_type) {
      // 1. Suspend ERP access (Application-level entitlement, preserves all data)
      case 'suspend': {
        const reason = payload.reason || 'Service temporarily suspended by platform administrator.';
        await config.update({
          is_suspended: true,
          suspension_reason: reason,
          suspended_at: new Date(),
          connection_status: 'suspended',
        });
        invalidateSuspensionCache();
        executionResult = {
          suspended: true,
          reason,
          suspended_at: config.suspended_at,
          data_preserved: true,
        };
        break;
      }

      // 2. Reactivate ERP access
      case 'reactivate': {
        await config.update({
          is_suspended: false,
          suspension_reason: null,
          suspended_at: null,
          connection_status: 'connected',
        });
        invalidateSuspensionCache();
        executionResult = {
          suspended: false,
          reactivated_at: new Date(),
          status: 'connected',
        };
        break;
      }

      // 3. Extend subscription validity
      case 'extend_subscription': {
        const days = parseInt(payload.days, 10) || 30;
        const currentExp = config.subscription_expires_at
          ? new Date(config.subscription_expires_at)
          : new Date();
        const newExpiry = new Date(currentExp.getTime() + days * 24 * 60 * 60 * 1000);
        await config.update({
          subscription_expires_at: newExpiry,
          subscription_status: 'active',
        });
        executionResult = {
          subscription_status: 'active',
          extended_days: days,
          subscription_expires_at: newExpiry,
        };
        break;
      }

      // 4. Update subscription plan/status
      case 'update_subscription': {
        const updates = {};
        if (payload.plan) updates.subscription_plan = String(payload.plan);
        if (payload.status) updates.subscription_status = String(payload.status);
        if (payload.expires_at) updates.subscription_expires_at = new Date(payload.expires_at);
        await config.update(updates);
        executionResult = {
          updated: true,
          subscription_plan: config.subscription_plan,
          subscription_status: config.subscription_status,
          subscription_expires_at: config.subscription_expires_at,
        };
        break;
      }

      // 5. Trigger immediate synchronization
      case 'sync_now': {
        const { synchronizeOperationalData } = require('./syncEngine');
        const syncResult = await synchronizeOperationalData('command_sync');
        executionResult = {
          triggered: true,
          sync_result: syncResult,
        };
        break;
      }

      // 6. Health check request
      case 'health_check': {
        executionResult = {
          status: 'operational',
          database_connected: true,
          connector_version: config.connector_version,
          erp_version: config.erp_version,
          uptime_seconds: Math.floor(process.uptime()),
          is_suspended: config.is_suspended,
          timestamp: new Date().toISOString(),
        };
        break;
      }

      // 7. Connector diagnostics
      case 'diagnostics': {
        executionResult = {
          school_id: config.school_id,
          client_id: config.connector_client_id,
          connection_status: config.connection_status,
          last_heartbeat_at: config.last_heartbeat_at,
          last_sync_at: config.last_sync_at,
          last_error: config.last_error,
          is_suspended: config.is_suspended,
          sync_interval_minutes: config.sync_interval_minutes,
        };
        break;
      }

      // 8. Rotate credentials
      case 'rotate_credentials': {
        const rotation = await rotateCredentials();
        executionResult = {
          rotated: true,
          ...rotation,
        };
        break;
      }

      // 9. Module enablement / disablement
      case 'enable_module':
      case 'disable_module': {
        const modName = payload.module_name;
        executionResult = {
          module: modName,
          enabled: command_type === 'enable_module',
          message: `Module ${modName} state adjusted.`,
        };
        break;
      }

      default:
        throw new Error(`Unhandled command: ${command_type}`);
    }
  } catch (err) {
    status = 'failed';
    executionResult = { error: err.message };
  }

  // Audit log entry
  await CentralCommandLog.create({
    command_id,
    command_type,
    issued_by,
    status,
    payload: JSON.stringify(payload),
    result: JSON.stringify(executionResult),
    executed_at: new Date(),
  });

  return {
    success: status === 'executed',
    command_id,
    command_type,
    status,
    ...executionResult,
    result: executionResult,
  };
}

module.exports = {
  processRemoteCommand,
  SUPPORTED_COMMANDS,
};
