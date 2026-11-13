const { CentralConfig, Setting } = require('../../models');
const { generateSecureToken } = require('./securityService');

/**
 * Configuration Service for Central Platform Integration
 * Manages permanent School ID, connector credentials, connection statuses,
 * and commercial subscription state.
 */

async function getOrCreateConfig() {
  let config = await CentralConfig.findOne({ order: [['id', 'DESC']] });

  // Read school info and connector credentials from settings or env
  let schoolName = 'International Cambridge School Kishtwar';
  let settingSchoolId = null;
  let settingUrl = null;
  let settingApiKey = null;
  let settingHmacSecret = null;

  try {
    const nameSetting = await Setting.findOne({ where: { key: 'school_name' } });
    if (nameSetting && nameSetting.value) schoolName = nameSetting.value;

    const idSetting = await Setting.findOne({ where: { key: 'school_id' } });
    if (idSetting && idSetting.value) settingSchoolId = idSetting.value;

    const urlSetting = await Setting.findOne({ where: { key: 'central_erp_url' } });
    if (urlSetting && urlSetting.value) settingUrl = urlSetting.value;

    const keySetting = await Setting.findOne({ where: { key: 'central_api_key' } });
    if (keySetting && keySetting.value) settingApiKey = keySetting.value;

    const secSetting = await Setting.findOne({ where: { key: 'central_hmac_secret' } });
    if (secSetting && secSetting.value) settingHmacSecret = secSetting.value;
  } catch (e) {}

  const isTest = process.env.NODE_ENV === 'test' || process.env.USE_MOCK_CENTRAL === 'true';

  const defaultUrl = settingUrl || process.env.CENTRAL_ERP_URL || process.env.CENTRAL_PLATFORM_URL || (isTest ? 'https://central.schoolplatform.net' : 'https://wws.ktwr.in');
  const defaultSchoolId = settingSchoolId || process.env.CENTRAL_SCHOOL_ID || (isTest ? null : 'SCH-B0E1B');
  const defaultApiKey = settingApiKey || process.env.CENTRAL_API_KEY || (isTest ? `ERP-CONN-${generateSecureToken(8).toUpperCase()}` : 'cc_live_pk_05b30262475f599e500ea4f5');
  const defaultSecret = settingHmacSecret || process.env.CENTRAL_HMAC_SECRET || (isTest ? generateSecureToken(32) : 'cc_sec_live_12af5e17caea7f904921bd489184dd3b6267514f3191a7d1');

  if (!config) {
    config = await CentralConfig.create({
      school_name: schoolName,
      school_id: defaultSchoolId,
      connection_status: isTest ? 'not_registered' : 'connected',
      central_api_url: defaultUrl,
      connector_client_id: defaultApiKey,
      connector_secret: defaultSecret,
      connector_version: '1.0.0',
      erp_version: '2.4.0',
      sync_interval_minutes: 60,
      approved_permissions: JSON.stringify([
        'sync:operational_stats',
        'health:heartbeat',
        'remote:management',
      ]),
    });
  } else if (!isTest) {
    // If live configuration values are present, keep config synchronized
    const updates = {};
    if (settingSchoolId && config.school_id !== settingSchoolId) updates.school_id = settingSchoolId;
    if (settingUrl && config.central_api_url !== settingUrl) updates.central_api_url = settingUrl;
    if (settingApiKey && config.connector_client_id !== settingApiKey) updates.connector_client_id = settingApiKey;
    if (settingHmacSecret && config.connector_secret !== settingHmacSecret) updates.connector_secret = settingHmacSecret;
    if (Object.keys(updates).length > 0) {
      await config.update(updates);
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
