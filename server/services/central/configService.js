const { CentralConfig, Setting } = require('../../models');
const { generateSecureToken } = require('./securityService');

/**
 * Configuration Service for Central Platform Integration
 * Manages permanent School ID, connector credentials, connection statuses,
 * and commercial subscription state.
 */

async function getOrCreateConfig() {
  let config = await CentralConfig.findOne();

  if (!config) {
    // Read school name from settings if available
    let schoolName = 'International Cambridge School Kishtwar';
    try {
      const nameSetting = await Setting.findOne({ where: { key: 'school_name' } });
      if (nameSetting && nameSetting.value) schoolName = nameSetting.value;
    } catch (e) {}

    const centralApiUrl = process.env.CENTRAL_PLATFORM_URL || 'https://central.schoolplatform.net';

    config = await CentralConfig.create({
      school_name: schoolName,
      connection_status: 'not_registered',
      central_api_url: centralApiUrl,
      connector_client_id: `ERP-CONN-${generateSecureToken(8).toUpperCase()}`,
      connector_secret: generateSecureToken(32),
      connector_version: '1.0.0',
      erp_version: '2.4.0',
      sync_interval_minutes: 60,
      approved_permissions: JSON.stringify([
        'sync:operational_stats',
        'health:heartbeat',
        'remote:management',
      ]),
    });
  }

  return config;
}

async function updateConfig(updates) {
  const config = await getOrCreateConfig();
  await config.update(updates);
  return config;
}

/**
 * Rotates the connector secret
 */
async function rotateCredentials() {
  const config = await getOrCreateConfig();
  const newSecret = generateSecureToken(32);
  await config.update({
    connector_secret: newSecret,
    last_error: null,
  });
  return {
    school_id: config.school_id,
    connector_client_id: config.connector_client_id,
    connector_secret: newSecret,
    secret_rotated_at: new Date(),
  };
}

/**
 * Resets pairing state for safe reconnection without changing permanent School ID
 */
async function resetPairing() {
  const config = await getOrCreateConfig();
  await config.update({
    connection_status: config.school_id ? 'awaiting_pairing' : 'not_registered',
    pairing_token: generateSecureToken(16),
    pairing_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    last_error: null,
  });
  return config;
}

module.exports = {
  getOrCreateConfig,
  updateConfig,
  rotateCredentials,
  resetPairing,
};
