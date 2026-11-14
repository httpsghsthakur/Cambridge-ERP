const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Setting, User } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { getOrCreateConfig } = require('../services/central/configService');
const { synchronizeOperationalData } = require('../services/central/syncEngine');

// GET /api/settings - Public (or protected if you want only logged-in users to see)
// Since receipt generation and LoginPage needs it, it is public for all users.
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.findAll();
    // Convert array of {key, value} to an object {key: value}
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    let centralSchoolId = 'SCH-B0E1B';
    let centralStatus = 'connected';
    let centralUrl = 'https://wws.ktwr.in';
    let centralApiKey = 'cc_live_pk_05b30262475f599e500ea4f5';
    let centralHmacSecret = 'cc_sec_live_12af5e17caea7f904921bd489184dd3b6267514f3191a7d1';

    try {
      const centralConfig = await getOrCreateConfig();
      if (centralConfig?.school_id) centralSchoolId = centralConfig.school_id;
      if (centralConfig?.connection_status) centralStatus = centralConfig.connection_status;
      if (centralConfig?.central_api_url) centralUrl = centralConfig.central_api_url;
      if (centralConfig?.connector_client_id) centralApiKey = centralConfig.connector_client_id;
      if (centralConfig?.connector_secret) centralHmacSecret = centralConfig.connector_secret;
    } catch (e) {
      console.warn('[GET /settings] Could not load central config:', e.message);
    }
    
    let adminPhoto = null;
    try {
      const adminUser = await User.findOne({
        where: { role: 'admin', is_active: true },
        attributes: ['profile_photo'],
        order: [['id', 'ASC']],
      });
      if (adminUser?.profile_photo) adminPhoto = adminUser.profile_photo;
    } catch (e) {}

    // Provide defaults if not set
    const defaultSettings = {
      school_name: 'International Cambridge School Kishtwar',
      school_subtitle: 'Kishtwar, Jammu & Kashmir',
      school_address: 'Kishtwar, Jammu & Kashmir',
      school_phone: '+1 234 567 890',
      school_email: 'info@cambridgeschoolkishtwar.com',
      receipt_footer: 'This is a computer-generated receipt. No signature required.',
      school_id: settingsObj.school_id || centralSchoolId,
      school_logo_url: settingsObj.school_logo_url || adminPhoto || null,
      admin_profile_photo: adminPhoto,
      central_connection_status: centralStatus,
      central_erp_url: settingsObj.central_erp_url || centralUrl,
      central_api_key: settingsObj.central_api_key || centralApiKey,
      central_hmac_secret: settingsObj.central_hmac_secret || centralHmacSecret,
      ...settingsObj
    };

    res.json(defaultSettings);
  } catch (err) {
    console.error('[GET /settings]', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/settings - Update settings (Admin only)
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const updates = req.body; // e.g., { school_name: 'New Name', school_id: 'SCH-...' }
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== null) {
        await Setting.upsert({
          key,
          value: String(value)
        });
      }
    }

    // If central connector variables are provided, sync with CentralConfig and trigger sync
    const centralUpdates = {};
    if (updates.school_id && String(updates.school_id).trim()) centralUpdates.school_id = String(updates.school_id).trim();
    if (updates.central_erp_url && String(updates.central_erp_url).trim()) centralUpdates.central_api_url = String(updates.central_erp_url).trim();
    if (updates.central_api_key && String(updates.central_api_key).trim()) centralUpdates.connector_client_id = String(updates.central_api_key).trim();
    if (updates.central_hmac_secret && String(updates.central_hmac_secret).trim()) centralUpdates.connector_secret = String(updates.central_hmac_secret).trim();

    if (Object.keys(centralUpdates).length > 0) {
      try {
        const centralConfig = await getOrCreateConfig();
        centralUpdates.connection_status = 'connected';
        centralUpdates.last_error = null;
        await centralConfig.update(centralUpdates);

        // Trigger real operational data sync in background to send to central platform
        synchronizeOperationalData('settings_update').catch((err) => {
          console.warn('[SETTINGS] Background sync after settings update:', err.message);
        });
      } catch (centralErr) {
        console.warn('[SETTINGS] Could not update CentralConfig with settings:', centralErr.message);
      }
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('[PUT /settings]', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Configure multer for logo uploads (memory storage for base64)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and SVG are allowed.'));
    }
  }
}).single('logo');

// POST /api/settings/upload-logo - Upload logo image (Admin only)
router.post('/upload-logo', protect, authorize('admin'), (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
      // Convert to Base64 string
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Update the logo URL setting with the base64 string
      await Setting.upsert({
        key: 'school_logo_url',
        value: base64Image
      });

      res.json({ message: 'Logo uploaded successfully', url: base64Image });
    } catch (dbErr) {
      console.error('[POST /settings/upload-logo db]', dbErr);
      res.status(500).json({ message: 'Database error saving logo url.' });
    }
  });
});

module.exports = router;
