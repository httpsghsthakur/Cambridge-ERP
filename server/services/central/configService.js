const { CentralConfig, Setting } = require('../../models');
const { generateSecureToken } = require('./securityService');

/**
 * Configuration Service for Central Platform Integration
 * Manages permanent School ID, connector credentials, connection statuses,
 * and commercial subscription state.
 */

async function getOrCreateConfig() {
  let config = await CentralConfig.findOne({ order: [['id', 'DESC']] });

  // Read school name and school_id from settings if available
  let schoolName = 'International Cambridge School Kishtwar';
  let settingSchoolId = null;
  try {
    const nameSetting = await Setting.findOne({ where: { key: 'school_name' } });
    if (nameSetting && nameSetting.value) schoolName = nameSetting.value;
    const idSetting = await Setting.findOne({ where: { key: 'school_id' } });
    if (idSetting && idSetting.value) settingSchoolId = idSetting.value;
  } catch (e) {}

  if (!config) {
    const centralApiUrl = process.env.CENTRAL_PLATFORM_URL || 'https://central.schoolplatform.net';
    const isTest = process.env.NODE_ENV === 'test';

    config = await CentralConfig.create({
      school_name: schoolName,
      school_id: settingSchoolId || (isTest ? null : 'SCH-2026-01001'),
      connection_status: isTest ? 'not_registered' : (settingSchoolId ? 'connected' : 'awaiting_pairing'),
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
  } else {
    // If config exists but school_id is missing and setting has one, adopt it
    if (!config.school_id && settingSchoolId) {
      await config.update({ school_id: settingSchoolId });
    }
  }

  return config;
}

async function updateConfig(updates) {
  const config = await getOrCreateConfig();
  // Protect school_id from being overwritten with null or empty value
  if (updates.school_id === null || updates.school_id === '' || updates.school_id === undefined) {
    delete updates.school_id;
  }
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
