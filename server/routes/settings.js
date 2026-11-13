const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Setting } = require('../models');
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

    let centralSchoolId = 'SCH-2026-01001';
    let centralStatus = 'connected';
    try {
      const centralConfig = await getOrCreateConfig();
      if (centralConfig?.school_id) {
        centralSchoolId = centralConfig.school_id;
      }
      if (centralConfig?.connection_status) {
        centralStatus = centralConfig.connection_status;
      }
    } catch (e) {
      console.warn('[GET /settings] Could not load central config:', e.message);
    }
    
    // Provide defaults if not set
    const defaultSettings = {
      school_name: 'International Cambridge School Kishtwar',
      school_subtitle: 'Kishtwar, Jammu & Kashmir',
      school_address: 'Kishtwar, Jammu & Kashmir',
      school_phone: '+1 234 567 890',
      school_email: 'info@cambridgeschoolkishtwar.com',
      receipt_footer: 'This is a computer-generated receipt. No signature required.',
      school_id: settingsObj.school_id || centralSchoolId,
      central_connection_status: centralStatus,
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

    // If school_id is provided, sync with CentralConfig and trigger real data sync
    if (updates.school_id && String(updates.school_id).trim()) {
      const trimmedId = String(updates.school_id).trim();
      try {
        const centralConfig = await getOrCreateConfig();
        await centralConfig.update({
          school_id: trimmedId,
          connection_status: 'connected',
          last_error: null,
        });

        // Trigger real operational data sync in background to send to central platform
        synchronizeOperationalData('settings_update').catch((err) => {
          console.warn('[SETTINGS] Background sync after school_id update:', err.message);
        });
      } catch (centralErr) {
        console.warn('[SETTINGS] Could not update CentralConfig with school_id:', centralErr.message);
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
