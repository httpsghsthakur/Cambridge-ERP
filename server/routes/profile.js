const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[Profile] sharp module not available on this Node runtime (' + e.message + '). Direct file save fallback enabled.');
}
const { protect } = require('../middleware/auth');
const { uploadAvatar, validateImageMagicBytes } = require('../middleware/upload');
const { User, Student, Teacher, Session } = require('../models');

// Ensure uploads directory exists
const AVATAR_DIR = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

// ── GET /api/profile/me ───────────────────────────────────────────────────────
// Returns full profile data for the logged-in user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Student,
          as: 'linkedStudent',
          include: [{ model: Session, as: 'session', attributes: ['id', 'name'] }],
        },
        {
          model: Teacher,
          as: 'linkedTeacher',
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (err) {
    console.error('[Profile] GET /me error:', err);
    res.status(500).json({ message: 'Failed to load profile.' });
  }
});

// ── PUT /api/profile/update ───────────────────────────────────────────────────
// Updates editable fields: name, phone
router.put('/update', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim() || null;

    await user.save();

    // Return updated user without password
    const updated = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Student,
          as: 'linkedStudent',
          include: [{ model: Session, as: 'session', attributes: ['id', 'name'] }],
        },
        {
          model: Teacher,
          as: 'linkedTeacher',
        },
      ],
    });

    res.json({ message: 'Profile updated successfully.', user: updated });
  } catch (err) {
    console.error('[Profile] PUT /update error:', err);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// ── POST /api/profile/avatar ──────────────────────────────────────────────────
// Uploads & auto-compresses profile photo
router.post('/avatar', protect, (req, res) => {
  uploadAvatar(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 5 MB.' });
      }
      return res.status(400).json({ message: err.message || 'Upload failed.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Binary Magic Number validation — strictly verify real image header
    if (!validateImageMagicBytes(req.file.buffer)) {
      return res.status(400).json({ message: 'Invalid image signature. Executable polyglot or corrupted file rejected.' });
    }

    try {
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Generate unique filename & save avatar (with sharp if available, or direct buffer write)
      let fileName, targetPath;
      if (sharp) {
        fileName = `avatar-${user.id}-${Date.now()}.webp`;
        targetPath = path.join(AVATAR_DIR, fileName);
        await sharp(req.file.buffer)
          .resize(200, 200, {
            fit: 'cover',
            position: 'center',
          })
          .toFormat('webp')
          .webp({ quality: 80 })
          .toFile(targetPath);
      } else {
        const ext = path.extname(req.file.originalname) || '.jpg';
        fileName = `avatar-${user.id}-${Date.now()}${ext}`;
        targetPath = path.join(AVATAR_DIR, fileName);
        fs.writeFileSync(targetPath, req.file.buffer);
      }

      // Path traversal defense: strictly sanitize old file basename
      if (user.profile_photo) {
        const safeBaseName = path.basename(user.profile_photo);
        const oldPath = path.join(AVATAR_DIR, safeBaseName);
        if (oldPath.startsWith(AVATAR_DIR) && fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Save the relative URL path in the database
      const photoUrl = `/uploads/avatars/${fileName}`;
      user.profile_photo = photoUrl;
      await user.save();

      res.json({
        message: 'Profile photo updated successfully.',
        profile_photo: photoUrl,
      });
    } catch (error) {
      console.error('[Profile] POST /avatar error:', error);
      res.status(500).json({ message: 'Failed to process image.' });
    }
  });
});

module.exports = router;
