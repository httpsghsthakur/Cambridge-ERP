const { generateSecureToken } = require('./securityService');

/**
 * Mock / Sandbox Central Management Platform Service
 * Enables testing, local development, and end-to-end verification
 * of the entire integration lifecycle without requiring an external server.
 */

// In-memory central platform database for mock mode
const centralRegistry = {
  schools: new Map(),
  pendingCommands: new Map(),
  counter: 1001,
};

function handleMockRegistration(body) {
  const { client_id, school_name, connector_version } = body;

  // Check if school already exists by client_id to prevent duplicates
  for (const [id, record] of centralRegistry.schools.entries()) {
    if (record.client_id === client_id) {
      return {
        status: 'success',
        school_id: record.school_id,
        pairing_token: record.pairing_token,
        pairing_token_expires_at: record.pairing_token_expires_at,
        connection_status: record.connection_status,
        message: 'Existing registration found. School ID preserved.',
      };
    }
  }

  // Issue permanent globally unique School ID
  const year = new Date().getFullYear();
  const schoolId = `SCH-${year}-${String(centralRegistry.counter++).padStart(5, '0')}`;
  const pairingToken = generateSecureToken(16);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const record = {
    school_id: schoolId,
    client_id,
    school_name,
    connector_version,
    connection_status: 'awaiting_pairing',
    pairing_token: pairingToken,
    pairing_token_expires_at: expiresAt,
    registered_at: new Date().toISOString(),
    approved_permissions: [
      'sync:operational_stats',
      'health:heartbeat',
      'remote:management',
    ],
  };

  centralRegistry.schools.set(schoolId, record);

  return {
    status: 'success',
    school_id: schoolId,
    pairing_token: pairingToken,
    pairing_token_expires_at: expiresAt,
    connection_status: 'awaiting_pairing',
    message: 'School successfully registered with Central Platform.',
  };
}

function handleMockPairingVerification(body) {
  const { school_id, pairing_token } = body;
  const school = centralRegistry.schools.get(school_id);

  if (!school) {
    return {
      status: 'error',
      code: 'SCHOOL_NOT_FOUND',
      message: `No pending registration found for School ID: ${school_id}`,
    };
  }

  if (school.pairing_token !== pairing_token) {
    return {
      status: 'error',
      code: 'INVALID_PAIRING_TOKEN',
      message: 'Pairing challenge token verification failed.',
    };
  }

  if (new Date(school.pairing_token_expires_at) < new Date()) {
    return {
      status: 'error',
      code: 'TOKEN_EXPIRED',
      message: 'Pairing challenge token has expired. Please re-register or reconnect.',
    };
  }

  school.connection_status = 'connected';
  school.paired_at = new Date().toISOString();

  return {
    status: 'success',
    school_id,
    connection_status: 'connected',
    approved_permissions: school.approved_permissions,
    message: 'School successfully verified and paired with Central Platform.',
  };
}

function handleMockHeartbeat(body) {
  const { school_id, status } = body;
  const school = centralRegistry.schools.get(school_id);

  if (school) {
    school.last_heartbeat = new Date().toISOString();
  }

  const commands = centralRegistry.pendingCommands.get(school_id) || [];
  centralRegistry.pendingCommands.set(school_id, []);

  return {
    status: 'success',
    acknowledged: true,
    server_time: new Date().toISOString(),
    pending_commands: commands,
  };
}

function handleMockSync(body) {
  const { school, students, teachers, academics, attendance, health } = body;
  const schoolId = school?.school_id;

  return {
    status: 'success',
    synced: true,
    school_id: schoolId,
    records_processed: {
      students_total: students?.total_count || 0,
      teachers_total: teachers?.total_count || 0,
      attendance_rate: attendance?.overall_attendance_rate || 0,
      classes_count: academics?.total_classes || 0,
    },
    processed_at: new Date().toISOString(),
  };
}

function queueMockCommand(schoolId, command) {
  if (!centralRegistry.pendingCommands.has(schoolId)) {
    centralRegistry.pendingCommands.set(schoolId, []);
  }
  centralRegistry.pendingCommands.get(schoolId).push(command);
}

module.exports = {
  handleMockRegistration,
  handleMockPairingVerification,
  handleMockHeartbeat,
  handleMockSync,
  queueMockCommand,
  centralRegistry,
};
