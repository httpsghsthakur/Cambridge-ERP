const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { CentralConfig, Setting } = require('../models');
const { getOrCreateConfig } = require('../services/central/configService');
const { extractOperationalData } = require('../services/central/dataExtractor');
const { synchronizeOperationalData, sendHeartbeat } = require('../services/central/syncEngine');

/**
 * Remote School ERP Connector Routes
 * These endpoints handle incoming handshakes, probes, and telemetry requests
 * dispatched by Central Platforms (e.g., https://wws.ktwr.in).
 */

// POST /api/v1/connector/approval-request
// Dispatched by Central Platform (WWS) when an admin in WWS initiates pairing or clicks "Send Approval Request"
router.post('/approval-request', async (req, res) => {
  try {
    const {
      school_id,
      api_key,
      hmac_secret,
      action = 'REQUEST_DATA_ACCESS_APPROVAL',
      requested_scopes = ['census', 'faculty', 'attendance', 'finance', 'telemetry'],
      timestamp
    } = req.body || {};

    const cleanSchoolId = (school_id || '').trim().toUpperCase();
    if (!cleanSchoolId) {
      return res.status(400).json({ success: false, error: 'school_id is required.' });
    }

    const config = await getOrCreateConfig();

    // Persist incoming credentials
    const updates = {
      school_id: cleanSchoolId,
      central_api_url: 'https://wws.ktwr.in',
      last_error: null,
    };
    if (api_key) updates.connector_client_id = api_key.trim();
    if (hmac_secret) updates.connector_secret = hmac_secret.trim();

    await config.update(updates);

    // Save into Setting table
    await Setting.upsert({ key: 'school_id', value: cleanSchoolId });
    if (api_key) await Setting.upsert({ key: 'central_api_key', value: api_key.trim() });
    if (hmac_secret) await Setting.upsert({ key: 'central_hmac_secret', value: hmac_secret.trim() });

    // Check if this school has already been approved by an ERP admin
    const approvalSetting = await Setting.findOne({ where: { key: 'central_approval_status' } });
    const isAlreadyApproved = approvalSetting?.value === 'APPROVED' || config.connection_status === 'connected';

    // Store pending approval request record for ERP admin dashboard
    const approvalRequestData = {
      school_id: cleanSchoolId,
      api_key: api_key ? api_key.trim() : config.connector_client_id,
      hmac_secret: hmac_secret ? hmac_secret.trim() : config.connector_secret,
      action,
      requested_scopes,
      requested_at: timestamp || new Date().toISOString(),
      requester: 'WWS Central ERP Command (https://wws.ktwr.in)',
      status: isAlreadyApproved ? 'APPROVED' : 'PENDING'
    };

    await Setting.upsert({
      key: 'pending_approval_request',
      value: JSON.stringify(approvalRequestData)
    });

    // Extract real census data directly from database
    const operationalData = await extractOperationalData();
    const studentCount = operationalData.students?.total_count || 0;
    const activeStudents = operationalData.students?.active_count || 0;
    const teacherCount = operationalData.teachers?.total_count || 0;
    const attendanceRate = operationalData.attendance?.overall_attendance_rate || 95.0;
    const classDistribution = operationalData.students?.class_wise_distribution || {};

    const censusData = {
      schoolId: cleanSchoolId,
      erpUrl: 'https://cambridge-erp.ktwr.in',
      approvalStatus: isAlreadyApproved ? 'APPROVED' : 'PENDING_ADMIN_APPROVAL',
      totalStudents: studentCount,
      activeStudents: activeStudents,
      teachers: teacherCount,
      staff: 0,
      attendanceRate: parseFloat(attendanceRate),
      classDistribution: classDistribution,
      source: 'LIVE_CAMBRIDGE_ERP'
    };

    if (isAlreadyApproved) {
      return res.json({
        success: true,
        approvalStatus: 'APPROVED',
        message: `Remote ERP administrator has pre-authorized data sharing for School ID: ${cleanSchoolId}!`,
        data: censusData
      });
    }

    // Return pending state with census structure so WWS can parse
    res.json({
      success: true,
      approvalStatus: 'PENDING_ADMIN_APPROVAL',
      message: `Approval request received for School ID ${cleanSchoolId}. Waiting for ERP administrator confirmation.`,
      data: censusData
    });
  } catch (err) {
    console.error('[CONNECTOR /approval-request]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/connector/census
// Dispatched by Central Platform to probe or retrieve live census statistics
router.get('/census', async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    const operationalData = await extractOperationalData();

    const studentCount = operationalData.students?.total_count || 0;
    const activeStudents = operationalData.students?.active_count || 0;
    const teacherCount = operationalData.teachers?.total_count || 0;
    const attendanceRate = operationalData.attendance?.overall_attendance_rate || 95.0;
    const classDistribution = operationalData.students?.class_wise_distribution || {};

    res.json({
      success: true,
      schoolId: config.school_id || 'SCH-B0E1B',
      source: 'LIVE_CAMBRIDGE_ERP',
      totalStudents: studentCount,
      activeStudents: activeStudents,
      teachers: teacherCount,
      staff: 0,
      attendanceRate: parseFloat(attendanceRate),
      classDistribution: classDistribution
    });
  } catch (err) {
    console.error('[CONNECTOR /census]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/connector/heartbeat - Heartbeat ping
router.post('/heartbeat', async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    res.json({
      success: true,
      school_id: config.school_id,
      status: config.connection_status,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
