/**
 * Standalone cPanel / VPS Cron Job Synchronization Script
 * 
 * Usage in cPanel Cron Jobs:
 * /usr/local/bin/node /home/username/public_html/server/scripts/cronSync.js >> /home/username/cron.log 2>&1
 * Or:
 * node server/scripts/cronSync.js
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize, CentralConfig } = require('../models');
const { sendHeartbeat, synchronizeOperationalData } = require('../services/central/syncEngine');
const { getOrCreateConfig } = require('../services/central/configService');

const LOCK_FILE = path.join(__dirname, '..', '.cron_sync.lock');
const LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes stale threshold

function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    try {
      const stats = fs.statSync(LOCK_FILE);
      const age = Date.now() - stats.mtimeMs;
      if (age < LOCK_TIMEOUT_MS) {
        console.log(`[CRON] Another sync is currently running (lock age: ${Math.round(age / 1000)}s). Exiting.`);
        return false;
      }
      console.warn(`[CRON] Stale lock file detected (age: ${Math.round(age / 1000)}s). Reclaiming lock.`);
    } catch (e) {
      // Continue and attempt to recreate lock
    }
  }

  try {
    fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, time: new Date().toISOString() }), 'utf8');
    return true;
  } catch (err) {
    console.error('[CRON] Failed to acquire lock file:', err.message);
    return false;
  }
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch (err) {
    console.error('[CRON] Error removing lock file:', err.message);
  }
}

async function runCron() {
  console.log(`=======================================================`);
  console.log(`[CRON] Central Platform Sync Starting at ${new Date().toISOString()}`);
  console.log(`=======================================================`);

  if (!acquireLock()) {
    process.exit(0);
  }

  try {
    // Authenticate database
    await sequelize.authenticate();
    const config = await getOrCreateConfig();

    if (!config.school_id) {
      console.log('[CRON] School is not yet registered with Central Platform. Run registration first.');
      return;
    }

    if (config.connection_status === 'revoked') {
      console.log('[CRON] Connection has been revoked by platform. Skipping sync.');
      return;
    }

    // 1. Send Heartbeat & check for pending remote commands
    console.log(`[CRON] Sending heartbeat for School ID: ${config.school_id}...`);
    const heartbeatResult = await sendHeartbeat();
    console.log(`[CRON] Heartbeat result:`, heartbeatResult.success ? 'SUCCESS' : 'FAILED');
    if (heartbeatResult.commands_processed?.length > 0) {
      console.log(`[CRON] Remote commands processed:`, heartbeatResult.commands_processed.length);
    }

    // 2. Synchronize approved operational data (strictly non-financial)
    if (config.is_sync_enabled !== false) {
      console.log(`[CRON] Starting operational data synchronization...`);
      const syncResult = await synchronizeOperationalData('cron');
      if (syncResult.success) {
        console.log(`[CRON] Operational sync completed successfully.`);
        console.log(`[CRON] Records synced: ${syncResult.records_synced} in ${syncResult.duration_ms}ms.`);
        console.log(`[CRON] Summary:`, syncResult.summary);
      } else {
        console.error(`[CRON] Operational sync failed:`, syncResult.error || syncResult.reason);
      }
    } else {
      console.log('[CRON] Automatic sync is currently disabled in connector configuration.');
    }

    console.log(`[CRON] Central Platform cron cycle finished at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('[CRON] Unhandled error during cron execution:', err);
  } finally {
    releaseLock();
    try {
      await sequelize.close();
    } catch (e) {
      // Ignore close error on exit
    }
  }
}

// Execute
runCron().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('[CRON FATAL]', err);
  process.exit(1);
});
