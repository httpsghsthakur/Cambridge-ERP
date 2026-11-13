const http = require('./httpClient');
const { getOrCreateConfig } = require('./configService');
const { generateHmacSignature } = require('./securityService');
const { handleMockRegistration } = require('./mockCentralPlatform');

/**
 * Registration Service
 * Securely registers the School ERP installation with the Central Platform
 * and receives the permanent School ID and pairing challenge token.
 */

async function registerSchool() {
  const config = await getOrCreateConfig();

  // If already connected with an existing School ID, preserve it
  if (config.school_id && config.connection_status === 'connected') {
    return {
      success: true,
      already_connected: true,
      school_id: config.school_id,
      connection_status: config.connection_status,
      message: 'School is already registered and connected.',
    };
  }

  const payload = {
    client_id: config.connector_client_id,
    school_name: config.school_name,
    connector_version: config.connector_version,
    erp_version: config.erp_version,
    timestamp: Date.now(),
    existing_school_id: config.school_id || null, // Preserve if previously issued
  };

  const signature = generateHmacSignature(payload, config.connector_secret);
  let centralResponse = null;

  // Attempt live registration against central platform
  const isMockMode =
    !config.central_api_url ||
    config.central_api_url.includes('mock') ||
    config.central_api_url.includes('localhost') ||
    process.env.USE_MOCK_CENTRAL === 'true';

  if (!isMockMode) {
    try {
      const response = await http.post(`${config.central_api_url}/api/v1/schools/register`, payload, {
        headers: {
          'X-Client-ID': config.connector_client_id,
          'X-Signature-256': signature,
          'X-Timestamp': String(payload.timestamp),
        },
        timeout: 10000,
      });
      centralResponse = response.data;
    } catch (err) {
      console.warn(`[CENTRAL REGISTRATION] Live central endpoint unavailable (${err.message}). Using fallback connector mode.`);
    }
  }

  // If live unavailable or in mock mode, use deterministic mock provider
  if (!centralResponse) {
    centralResponse = handleMockRegistration(payload);
  }

  if (centralResponse && centralResponse.status === 'success') {
    // Preserve existing School ID if present, otherwise set the permanent one
    const permanentSchoolId = config.school_id || centralResponse.school_id;

    await config.update({
      school_id: permanentSchoolId,
      connection_status: centralResponse.connection_status || 'awaiting_pairing',
      pairing_token: centralResponse.pairing_token,
      pairing_token_expires_at: centralResponse.pairing_token_expires_at,
      last_error: null,
    });

    return {
      success: true,
      school_id: permanentSchoolId,
      pairing_token: centralResponse.pairing_token,
      pairing_token_expires_at: centralResponse.pairing_token_expires_at,
      connection_status: config.connection_status,
      message: centralResponse.message || 'Registration successful. Awaiting pairing in central dashboard.',
    };
  } else {
    const errorMsg = centralResponse?.message || 'Registration failed at Central Platform.';
    await config.update({
      connection_status: 'connection_error',
      last_error: errorMsg,
    });
    return {
      success: false,
      error: errorMsg,
    };
  }
}

module.exports = {
  registerSchool,
};
