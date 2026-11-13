const express = require('express');
const router = express.Router();
const { Setting } = require('../models');
const { protect, authorize } = require('../middleware/auth');

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
    
    // Provide defaults if not set
    const defaultSettings = {
      school_name: 'EduSmart',
      school_subtitle: 'Public School',
      school_address: '123 Education Lane, City, Country',
      school_phone: '+1 234 567 890',
      school_email: 'info@edusmart.com',
      receipt_footer: 'This is a computer-generated receipt. No signature required.',
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
    const updates = req.body; // e.g., { school_name: 'New Name', school_address: 'New Addr' }
    
    for (const [key, value] of Object.entries(updates)) {
      await Setting.upsert({
        key,
        value: String(value)
      });
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('[PUT /settings]', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Configure multer for logo uploads (memory storage for base64)
const multer = require('multer');

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
