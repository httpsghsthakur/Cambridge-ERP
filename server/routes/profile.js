const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
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

    try {
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Generate unique filename
      const fileName = `avatar-${user.id}-${Date.now()}.webp`;
      const targetPath = path.join(AVATAR_DIR, fileName);

      // Auto-compress and resize using Sharp
      await sharp(req.file.buffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center',
        })
        .toFormat('webp')
        .webp({ quality: 80 })
        .toFile(targetPath);

      // Delete old avatar file if it exists
      if (user.profile_photo) {
        const oldPath = path.join(__dirname, '..', 'public', user.profile_photo);
        if (fs.existsSync(oldPath)) {
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
