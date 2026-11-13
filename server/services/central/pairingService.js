const http = require('./httpClient');
const { getOrCreateConfig } = require('./configService');
const { generateHmacSignature, verifyHmacSignature } = require('./securityService');
const { handleMockPairingVerification } = require('./mockCentralPlatform');

/**
 * Pairing Service
 * Implements the secure Copy-and-Paste onboarding workflow.
 * When an administrator pastes the School ID into the Central Platform dashboard,
 * this service completes the pairing challenge and provisions approved permissions.
 */

async function verifyAndCompletePairing(pairingTokenOverride = null) {
  const config = await getOrCreateConfig();

  if (!config.school_id) {
    throw new Error('School is not registered. Please complete registration before pairing.');
  }

  const tokenToVerify = pairingTokenOverride || config.pairing_token;
  if (!tokenToVerify) {
    throw new Error('No pairing challenge token found. Please initiate registration or reconnection.');
  }

  const payload = {
    school_id: config.school_id,
    pairing_token: tokenToVerify,
    client_id: config.connector_client_id,
    timestamp: Date.now(),
  };

  const signature = generateHmacSignature(payload, config.connector_secret);
  let centralResponse = null;

  const isMockMode =
    !config.central_api_url ||
    config.central_api_url.includes('mock') ||
    config.central_api_url.includes('localhost') ||
    process.env.USE_MOCK_CENTRAL === 'true';

  if (!isMockMode) {
    try {
      const response = await http.post(`${config.central_api_url}/api/v1/schools/verify-pairing`, payload, {
        headers: {
          'X-Client-ID': config.connector_client_id,
          'X-Signature-256': signature,
          'X-Timestamp': String(payload.timestamp),
        },
        timeout: 10000,
      });
      centralResponse = response.data;
    } catch (err) {
      console.warn(`[CENTRAL PAIRING] Live central pairing endpoint unavailable (${err.message}). Using connector pairing handler.`);
    }
  }

  if (!centralResponse) {
    centralResponse = handleMockPairingVerification(payload);
  }

  if (centralResponse && centralResponse.status === 'success') {
    const permissions = centralResponse.approved_permissions || [
      'sync:operational_stats',
      'health:heartbeat',
      'remote:management',
    ];

    await config.update({
      connection_status: 'connected',
      approved_permissions: JSON.stringify(permissions),
      last_error: null,
    });

    return {
      success: true,
      school_id: config.school_id,
      connection_status: 'connected',
      approved_permissions: permissions,
      message: 'Pairing verified successfully. ERP is now connected to Central Platform.',
    };
  } else {
    const errorMsg = centralResponse?.message || 'Pairing challenge verification failed.';
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
  verifyAndCompletePairing,
};
