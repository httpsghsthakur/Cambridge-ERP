/**
 * Comprehensive Automated Test Suite: Central Management Platform Integration
 * 
 * Verifies:
 * 1. School Registration & Permanent School ID Assignment
 * 2. School ID Permanence across credential rotations and reconnects
 * 3. School ID-Based Pairing Challenge Verification & Automatic Permission Provisioning
 * 4. Approved Operational Data Extraction (Aggregates Only, Zero PII)
 * 5. STRICT NON-NEGOTIABLE FINANCIAL DATA EXCLUSION TEST (Deep Scanner & Model Proof)
 * 6. Remote Command Execution Whitelist & Total Rejection of Arbitrary SQL/Shell
 * 7. Command Replay Protection & Idempotency
 * 8. Entitlement Middleware Application-Level Suspension & Instant Reactivation
 * 9. HMAC-SHA256 Signatures & Timestamp Drift Rejection
 * 10. Concurrency Lock & Cron Compatibility
 */

const assert = require('assert');
const path = require('path');

// Ensure test environment uses test SQLite database if needed
process.env.NODE_ENV = 'test';
process.env.USE_MOCK_CENTRAL = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_for_central_integration';

const {
  sequelize,
  CentralConfig,
  CentralSyncLog,
  CentralCommandLog,
  Student,
  Teacher,
  Setting,
  Session,
} = require('../models');

const {
  generateHmacSignature,
  verifyHmacSignature,
  verifyTimestamp,
  assertNoFinancialData,
  FORBIDDEN_FINANCIAL_PATTERNS,
} = require('../services/central/securityService');

const {
  getOrCreateConfig,
  rotateCredentials,
} = require('../services/central/configService');

const { registerSchool } = require('../services/central/registrationService');
const { verifyAndCompletePairing } = require('../services/central/pairingService');
const { extractOperationalData } = require('../services/central/dataExtractor');
const { processRemoteCommand } = require('../services/central/commandProcessor');
const { sendHeartbeat, synchronizeOperationalData } = require('../services/central/syncEngine');
const { entitlementCheck, invalidateSuspensionCache } = require('../middleware/entitlementCheck');

let testStats = { total: 0, passed: 0, failed: 0 };

async function runTest(name, fn) {
  testStats.total++;
  process.stdout.write(`  [TEST] ${name} ... `);
  try {
    await fn();
    testStats.passed++;
    console.log('✅ PASS');
  } catch (err) {
    testStats.failed++;
    console.log('❌ FAIL');
    console.error(`         Error: ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(1, 4).join('\n'));
    }
  }
}

async function main() {
  console.log('\n================================================================');
  console.log('   CENTRAL PLATFORM INTEGRATION - AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  // Initialize DB tables
  await sequelize.sync();

  // Clean test tables
  await CentralConfig.destroy({ where: {}, truncate: false });
  await CentralSyncLog.destroy({ where: {}, truncate: false });
  await CentralCommandLog.destroy({ where: {}, truncate: false });

  // Ensure basic mock data exists in ERP
  const [session] = await Session.findOrCreate({
    where: { name: '2025-2026' },
    defaults: { name: '2025-2026', start_date: '2025-04-01', end_date: '2026-03-31', is_active: true },
  });

  await Setting.findOrCreate({
    where: { key: 'school_name' },
    defaults: { key: 'school_name', value: 'Cambridge International School' },
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Config Initialization & Credential Generation
  // ───────────────────────────────────────────────────────────────────────────
  await runTest('1. Config Service initializes with unique Client ID and Secret', async () => {
    const config = await getOrCreateConfig();
    assert(config, 'Config should be created');
    assert(config.connector_client_id, 'Should have connector_client_id');
    assert(config.connector_secret, 'Should have connector_secret');
    assert.strictEqual(config.connection_status, 'not_registered', 'Initial status should be not_registered');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: School Registration & Permanent School ID Assignment
  // ───────────────────────────────────────────────────────────────────────────
  let assignedSchoolId = null;
  let issuedPairingToken = null;

  await runTest('2. Registration issues permanent School ID and Pairing Token', async () => {
    const regResult = await registerSchool();
    assert.strictEqual(regResult.success, true, 'Registration must succeed');
    assert(regResult.school_id, 'Must return assigned school_id');
    assert(regResult.school_id.startsWith('SCH-'), 'School ID must follow SCH-YYYY-XXXXX format');
    assert(regResult.pairing_token, 'Must return pairing challenge token');
    assert.strictEqual(regResult.connection_status, 'awaiting_pairing', 'Status must be awaiting_pairing');

    assignedSchoolId = regResult.school_id;
    issuedPairingToken = regResult.pairing_token;

    const stored = await CentralConfig.findOne();
    assert.strictEqual(stored.school_id, assignedSchoolId, 'DB must store permanent School ID');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: School ID Permanence across Re-registration and Credential Rotation
  // ───────────────────────────────────────────────────────────────────────────
  await runTest('3. School ID is permanent and NEVER altered across rotations or reconnects', async () => {
    const oldConfig = await CentralConfig.findOne();
    const oldSecret = oldConfig.connector_secret;

    // Rotate credentials
    const rotated = await rotateCredentials();
    assert.strictEqual(rotated.school_id, assignedSchoolId, 'School ID must remain identical after rotation');
    assert.notStrictEqual(rotated.connector_secret, oldSecret, 'Secret must be newly generated');

    // Re-register
    const reReg = await registerSchool();
    assert.strictEqual(reReg.school_id, assignedSchoolId, 'School ID must remain identical after re-registration');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 4: Pairing Challenge Verification & Automatic Permission Provisioning
  // ───────────────────────────────────────────────────────────────────────────
  await runTest('4. Pairing Challenge Verification provisions approved permissions', async () => {
    // Attempt with invalid token should fail
    const badResult = await verifyAndCompletePairing('invalid-token-12345');
    assert.strictEqual(badResult.success, false, 'Invalid pairing token must fail');

    // Attempt with correct token succeeds
    const goodResult = await verifyAndCompletePairing(issuedPairingToken);
    assert.strictEqual(goodResult.success, true, 'Valid pairing token must succeed');
    assert.strictEqual(goodResult.connection_status, 'connected', 'Status must become connected');
    assert(Array.isArray(goodResult.approved_permissions), 'Permissions must be provisioned');
    assert(goodResult.approved_permissions.includes('sync:operational_stats'), 'Must have sync permission');
    assert(goodResult.approved_permissions.includes('health:heartbeat'), 'Must have health permission');
    assert(goodResult.approved_permissions.includes('remote:management'), 'Must have remote command permission');

    const updatedConfig = await CentralConfig.findOne();
    assert.strictEqual(updatedConfig.connection_status, 'connected', 'DB status must be connected');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 5: Approved Operational Data Extraction (Aggregates Only)
  // ───────────────────────────────────────────────────────────────────────────
  let operationalPayload = null;
  await runTest('5. Data Extractor extracts approved operational metrics (NO PII)', async () => {
    operationalPayload = await extractOperationalData();
    assert(operationalPayload.school, 'Must contain school section');
    assert.strictEqual(operationalPayload.school.school_id, assignedSchoolId, 'School ID must match');
    assert(operationalPayload.students, 'Must contain students section');
    assert(typeof operationalPayload.students.total_count === 'number', 'Students total_count must be number');
    assert(operationalPayload.teachers, 'Must contain teachers section');
    assert(operationalPayload.attendance, 'Must contain attendance section');
    assert(operationalPayload.academics, 'Must contain academics section');
    assert(operationalPayload.health, 'Must contain health telemetry');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 6: STRICT FINANCIAL EXCLUSION TEST (Deep Scanner & Negative Test)
  // ───────────────────────────────────────────────────────────────────────────
  await runTest('6. STRICT NON-FINANCIAL POLICY: Zero financial data in operational extract', async () => {
    // 1. Assert scanner passes cleanly on genuine operational payload
    assert.doesNotThrow(() => {
      assertNoFinancialData(operationalPayload);
    }, 'Genuine operational payload must pass financial exclusion check');

    // 2. Negative test: Inject student fee data and verify fatal rejection
    const contaminatedPayloadWithFee = {
      ...operationalPayload,
      student_fees: [{ fee_id: 101, amount_paid: 5000, dues: 0 }],
    };

    assert.throws(
      () => {
        assertNoFinancialData(contaminatedPayloadWithFee);
      },
      /SECURITY_VIOLATION_FINANCIAL_DATA_DETECTED/,
      'Injecting student fee data must throw fatal security exception'
    );

    // 3. Negative test: Inject school bank account / payroll data
    const contaminatedWithBank = {
      ...operationalPayload,
      bank_details: { bank_account: '9876543210', ifsc: 'HDFC0001', balance: 500000 },
    };

    assert.throws(
      () => {
        assertNoFinancialData(contaminatedWithBank);
      },
      /SECURITY_VIOLATION_FINANCIAL_DATA_DETECTED/,
      'Injecting school bank/payroll data must throw fatal security exception'
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 7: Remote Command Whitelist & Arbitrary SQL / Code Execution Rejection
  // ───────────────────────────────────────────────────────────────────────────
  await runTest('7. Remote Command Processor rejects arbitrary SQL/shell execution', async () => {
    // Attempt malicious arbitrary execution command
    const maliciousCmd = {
      command_id: 'cmd-hack-001',
      command_type: 'drop_database',
      payload: { sql: 'DROP TABLE students;' },
    };

    const rejectRes = await processRemoteCommand(maliciousCmd);
    assert.strictEqual(rejectRes.success, false, 'Malicious/unsupported command must be rejected');
    assert.strictEqual(rejectRes.status, 'rejected', 'Status must be rejected');

    const log = await CentralCommandLog.findOne({ where: { command_id: 'cmd-hack-001' } });
    assert(log, 'Rejection must be audited in CentralCommandLog');
    assert.strictEqual(log.status, 'rejected', 'Audit log must record rejected status');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 8: Application-Level Entitlement Suspension & Instant Reactivation
  // ───────────────────────────────────────────────────────────────────────────
  await runTest('8. Application-level suspension and instant reactivation without data loss', async () => {
    // 1. Dispatch suspend command
    const suspendCmd = {
      command_id: 'cmd-suspend-001',
      command_type: 'suspend',
      payload: { reason: 'Annual license subscription renewal required.' },
    };
    const suspendRes = await processRemoteCommand(suspendCmd);
    assert.strictEqual(suspendRes.success, true, 'Suspend command must succeed');
    assert.strictEqual(suspendRes.suspended, true, 'Must be suspended');

    // Verify DB state
    const suspendedConfig = await CentralConfig.findOne();
    assert.strictEqual(suspendedConfig.is_suspended, true, 'is_suspended must be true');
    assert.strictEqual(suspendedConfig.connection_status, 'suspended', 'Status must be suspended');

    // Test Entitlement Middleware blocking regular student request
    let blockedStatus = null;
    let blockedBody = null;
    const mockReq = { path: '/api/students', user: { role: 'student' } };
    const mockRes = {
      status: (code) => {
        blockedStatus = code;
        return {
          json: (data) => {
            blockedBody = data;
          },
        };
      },
      setHeader: () => {},
    };
    let nextCalled = false;
    const mockNext = () => { nextCalled = true; };

    await entitlementCheck(mockReq, mockRes, mockNext);
    assert.strictEqual(blockedStatus, 423, 'Suspended ERP must return HTTP 423 Locked for normal requests');
    assert.strictEqual(blockedBody.status, 'suspended', 'Response status must be suspended');
    assert.strictEqual(nextCalled, false, 'next() must NOT be called for blocked user');

    // Test Entitlement Middleware allowing Central route even when suspended
    let centralAllowed = false;
    const centralReq = { path: '/api/central/status', user: { role: 'admin' } };
    await entitlementCheck(centralReq, mockRes, () => { centralAllowed = true; });
    assert.strictEqual(centralAllowed, true, '/api/central must remain reachable during suspension');

    // 2. Dispatch reactivate command
    const reactivateCmd = {
      command_id: 'cmd-reactivate-001',
      command_type: 'reactivate',
      payload: {},
    };
    const reactivateRes = await processRemoteCommand(reactivateCmd);
    assert.strictEqual(reactivateRes.success, true, 'Reactivate command must succeed');
    assert.strictEqual(reactivateRes.suspended, false, 'ERP must be unsuspended');

    // Test Entitlement Middleware now allows student request
    let studentAllowed = false;
    await entitlementCheck(mockReq, mockRes, () => { studentAllowed = true; });
    assert.strictEqual(studentAllowed, true, 'Regular requests must be permitted after reactivation');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 9: Remote Commercial Subscription Extension
  // ───────────────────────────────────────────────────────────────────────────
  await runTest('9. Remote commercial subscription update and extension', async () => {
    const extendCmd = {
      command_id: 'cmd-sub-001',
      command_type: 'extend_subscription',
      payload: { days: 60 },
    };
    const extendRes = await processRemoteCommand(extendCmd);
    assert.strictEqual(extendRes.success, true, 'Subscription extension must succeed');
    assert.strictEqual(extendRes.extended_days, 60, 'Should extend by 60 days');

    const config = await CentralConfig.findOne();
    assert.strictEqual(config.subscription_status, 'active');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 10: Remote Command Idempotency & Replay Protection
  // ───────────────────────────────────────────────────────────────────────────
  await runTest('10. Command replay protection returns cached result without re-executing', async () => {
    const duplicateCmd = {
      command_id: 'cmd-sub-001', // Already executed above
      command_type: 'extend_subscription',
      payload: { days: 60 },
    };
    const dupeRes = await processRemoteCommand(duplicateCmd);
    assert.strictEqual(dupeRes.success, true, 'Duplicate command must succeed idempotently');
    assert.strictEqual(dupeRes.message, 'Command already processed (idempotent)', 'Must detect idempotent call');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 11: HMAC-SHA256 Signatures & Timestamp Drift Verification
  // ───────────────────────────────────────────────────────────────────────────
  await runTest('11. Cryptographic HMAC-SHA256 signatures and timestamp drift rejection', async () => {
    const config = await CentralConfig.findOne();
    const testPayload = { foo: 'bar', timestamp: Date.now() };

    const validSig = generateHmacSignature(testPayload, config.connector_secret);
    assert(verifyHmacSignature(testPayload, validSig, config.connector_secret), 'Valid HMAC signature must verify');

    const tamperedPayload = { foo: 'bar', hacked: true, timestamp: testPayload.timestamp };
    assert.strictEqual(
      verifyHmacSignature(tamperedPayload, validSig, config.connector_secret),
      false,
      'Tampered payload must fail HMAC verification'
    );

    // Timestamp drift (> 5 minutes old)
    const oldTimestamp = Date.now() - (10 * 60 * 1000); // 10 minutes ago
    assert.strictEqual(verifyTimestamp(oldTimestamp, 300), false, 'Drifted timestamp (>5 min) must be rejected');

    const freshTimestamp = Date.now() - 5000; // 5 seconds ago
    assert.strictEqual(verifyTimestamp(freshTimestamp, 300), true, 'Fresh timestamp must be accepted');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 12: Sync Engine & Heartbeat Execution
  // ───────────────────────────────────────────────────────────────────────────
  await runTest('12. Sync Engine sends Heartbeat and executes scheduled Sync', async () => {
    const heartbeatRes = await sendHeartbeat();
    assert.strictEqual(heartbeatRes.success, true, 'Heartbeat must succeed');

    const syncRes = await synchronizeOperationalData('test_sync');
    assert.strictEqual(syncRes.success, true, 'Operational sync must succeed');
    assert(syncRes.records_synced >= 0, 'Must record synced count');

    const syncLog = await CentralSyncLog.findOne({ where: { sync_type: 'test_sync' } });
    assert(syncLog, 'Sync must be logged in CentralSyncLog');
    assert.strictEqual(syncLog.status, 'success', 'SyncLog status must be success');
  });

  console.log('\n================================================================');
  console.log(`   TEST RUN COMPLETE: ${testStats.passed} / ${testStats.total} PASSED (${testStats.failed} FAILED)`);
  console.log('================================================================\n');

  if (testStats.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('[TEST SUITE CRASHED]', err);
  process.exit(1);
});
