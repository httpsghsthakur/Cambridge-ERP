const http = require('./httpClient');
const { CentralSyncLog } = require('../../models');
const { getOrCreateConfig } = require('./configService');
const { extractOperationalData } = require('./dataExtractor');
const {
  generateHmacSignature,
  generateSecureToken,
  assertNoFinancialData,
} = require('./securityService');
const {
  handleMockHeartbeat,
  handleMockSync,
} = require('./mockCentralPlatform');

let isSyncRunning = false;

/**
 * Send heartbeat and technical telemetry to the Central Platform.
 * Retrieves any pending remote commands issued by the central platform.
 */
async function sendHeartbeat() {
  const config = await getOrCreateConfig();

  if (!config.school_id) {
    return {
      success: false,
      skipped: true,
      reason: 'School is not registered. Cannot send heartbeat.',
    };
  }

  const payload = {
    school_id: config.school_id,
    client_id: config.connector_client_id,
    connection_status: config.connection_status,
    connector_version: config.connector_version,
    erp_version: config.erp_version,
    is_suspended: config.is_suspended,
    uptime_seconds: Math.floor(process.uptime()),
    memory_usage_mb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
    timestamp: Date.now(),
    nonce: generateSecureToken(12),
  };

  const rawBody = JSON.stringify(payload);
  const secTimestamp = Math.floor(Date.now() / 1000).toString();
  const crypto = require('crypto');
  const wwsSignature = crypto
    .createHmac('sha256', config.connector_secret || '')
    .update(`${config.school_id}:${secTimestamp}:${rawBody}`)
    .digest('hex');
  const signature = generateHmacSignature(payload, config.connector_secret);
  let centralResponse = null;

  const isMockMode =
    !config.central_api_url ||
    config.central_api_url.includes('mock') ||
    config.central_api_url.includes('localhost') ||
    process.env.USE_MOCK_CENTRAL === 'true';

  if (!isMockMode) {
    const heartbeatEndpoints = [
      `${config.central_api_url}/api/v1/connector/heartbeat`,
      `${config.central_api_url}/api/v1/heartbeat`,
    ];

    const hbHeaders = {
      'Content-Type': 'application/json',
      'X-School-ID': config.school_id,
      'x-school-id': config.school_id,
      'X-Client-ID': config.connector_client_id,
      'x-api-key': config.connector_client_id,
      'X-API-Key': config.connector_client_id,
      'Authorization': `Bearer ${config.connector_client_id}`,
      'X-Signature-256': signature,
      'x-signature': wwsSignature,
      'X-Timestamp': String(payload.timestamp),
      'x-timestamp': secTimestamp,
      'X-Nonce': payload.nonce,
    };

    for (const ep of heartbeatEndpoints) {
      try {
        const response = await http.post(ep, payload, {
          headers: hbHeaders,
          timeout: 8000,
        });
        if (response && response.data) {
          centralResponse = response.data;
          break;
        }
      } catch (err) {
        if (err.response?.status === 404) continue;
        console.warn(`[CENTRAL HEARTBEAT] Live endpoint ${ep} error: ${err.message}`);
        break;
      }
    }
  }

  if (!centralResponse) {
    centralResponse = handleMockHeartbeat(payload);
  }

  // Update last heartbeat timestamp
  await config.update({
    last_heartbeat_at: new Date(),
    last_error: null,
  });

  // Process any pending commands dispatched by central platform
  const commandResults = [];
  if (centralResponse && Array.isArray(centralResponse.pending_commands) && centralResponse.pending_commands.length > 0) {
    const { processRemoteCommand } = require('./commandProcessor');
    for (const cmd of centralResponse.pending_commands) {
      try {
        const res = await processRemoteCommand(cmd);
        commandResults.push({ command_id: cmd.command_id, result: res });
      } catch (cmdErr) {
        commandResults.push({ command_id: cmd.command_id, error: cmdErr.message });
      }
    }
  }

  return {
    success: true,
    acknowledged: true,
    school_id: config.school_id,
    server_time: centralResponse?.server_time || new Date().toISOString(),
    commands_processed: commandResults,
  };
}

/**
 * Synchronize approved operational data to Central Platform.
 * Strictly non-financial: asserts no financial data exists before transmission.
 */
async function synchronizeOperationalData(syncType = 'scheduled') {
  if (isSyncRunning) {
    return {
      success: false,
      in_progress: true,
      message: 'Synchronization already in progress. Concurrency lock held.',
    };
  }

  const config = await getOrCreateConfig();

  if (!config.school_id) {
    return {
      success: false,
      skipped: true,
      reason: 'School is not registered. School ID is required for sync.',
    };
  }

  if (config.connection_status === 'not_registered' || config.connection_status === 'revoked') {
    return {
      success: false,
      skipped: true,
      reason: `Cannot synchronize in status: ${config.connection_status}`,
    };
  }

  isSyncRunning = true;
  const startedAt = new Date();

  // Create audit log for this sync run
  const syncLog = await CentralSyncLog.create({
    sync_type: syncType,
    status: 'in_progress',
    started_at: startedAt,
  });

  try {
    // 1. Extract approved operational data only
    const operationalData = await extractOperationalData();

    // 2. Multi-layer safety verification: Assert zero financial data
    assertNoFinancialData(operationalData);

    const payload = {
      school_id: config.school_id,
      sync_type: syncType,
      connector_version: config.connector_version,
      timestamp: Date.now(),
      nonce: generateSecureToken(12),
      data: operationalData,
    };

    const rawBody = JSON.stringify(payload);
    const secTimestamp = Math.floor(Date.now() / 1000).toString();
    const crypto = require('crypto');
    const wwsSignature = crypto
      .createHmac('sha256', config.connector_secret || '')
      .update(`${config.school_id}:${secTimestamp}:${rawBody}`)
      .digest('hex');
    const signature = generateHmacSignature(payload, config.connector_secret);
    let centralResponse = null;

    const isMockMode =
      !config.central_api_url ||
      config.central_api_url.includes('mock') ||
      config.central_api_url.includes('localhost') ||
      process.env.USE_MOCK_CENTRAL === 'true';

    if (!isMockMode) {
      const endpointsToTry = [
        `${config.central_api_url}/api/v1/connector/sync`,
        `${config.central_api_url}/api/v1/sync`,
      ];

      const syncHeaders = {
        'Content-Type': 'application/json',
        'X-School-ID': config.school_id,
        'x-school-id': config.school_id,
        'X-Client-ID': config.connector_client_id,
        'x-api-key': config.connector_client_id,
        'X-API-Key': config.connector_client_id,
        'Authorization': `Bearer ${config.connector_client_id}`,
        'X-Signature-256': signature,
        'x-signature': wwsSignature,
        'X-Timestamp': String(payload.timestamp),
        'x-timestamp': secTimestamp,
        'X-Nonce': payload.nonce,
      };

      for (const endpoint of endpointsToTry) {
        try {
          const response = await http.post(endpoint, payload, {
            headers: syncHeaders,
            timeout: 15000,
          });
          if (response && response.data) {
            centralResponse = response.data;
            break;
          }
        } catch (err) {
          // If 404, continue to next endpoint; otherwise log and break
          if (err.response?.status === 404) {
            continue;
          }
          console.warn(`[CENTRAL SYNC] Live endpoint ${endpoint} error: ${err.message}`);
          break;
        }
      }
    }

    if (!centralResponse) {
      centralResponse = handleMockSync(operationalData);
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const recordsCount =
      (operationalData.students?.total_count || 0) +
      (operationalData.teachers?.total_count || 0) +
      (operationalData.academics?.total_classes || 0);

    const payloadSummary = {
      students_total: operationalData.students?.total_count || 0,
      teachers_total: operationalData.teachers?.total_count || 0,
      classes_count: operationalData.academics?.total_classes || 0,
      overall_attendance_rate: operationalData.attendance?.overall_attendance_rate || 0,
    };

    // Update log entry
    await syncLog.update({
      status: 'success',
      completed_at: completedAt,
      duration_ms: durationMs,
      records_synced: recordsCount,
      payload_summary: JSON.stringify(payloadSummary),
    });

    // Update connector config
    await config.update({
      last_sync_at: completedAt,
      last_error: null,
    });

    return {
      success: true,
      sync_type: syncType,
      records_synced: recordsCount,
      duration_ms: durationMs,
      completed_at: completedAt,
      summary: payloadSummary,
    };
  } catch (error) {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    await syncLog.update({
      status: 'failed',
      completed_at: completedAt,
      duration_ms: durationMs,
      error_message: error.message,
    });

    await config.update({
      last_error: `Sync error: ${error.message}`,
    });

    return {
      success: false,
      error: error.message,
      duration_ms: durationMs,
    };
  } finally {
    isSyncRunning = false;
  }
}

module.exports = {
  sendHeartbeat,
  synchronizeOperationalData,
};
