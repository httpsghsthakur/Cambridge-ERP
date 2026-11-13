const multer = require('multer');

// Use memory storage — file stays in RAM buffer
// Sharp will process it before writing to disk
const storage = multer.memoryStorage();

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Validate MIME type
const fileFilter = (req, file, cb) => {
  const ext = file.originalname ? file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase() : '';
  if (file.mimetype.startsWith('image/') && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Please upload a valid image file (jpg, jpeg, png, webp).'), false);
  }
};

/**
 * Validates the true binary magic numbers of an image buffer.
 * Defends against MIME-spoofing and executable polyglots.
 */
function validateImageMagicBytes(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true;

  return false;
}

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max upload
    files: 1,
  },
}).single('avatar');

module.exports = {
  uploadAvatar,
  validateImageMagicBytes,
};
