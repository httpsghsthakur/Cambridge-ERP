const multer = require('multer');

// Use memory storage — file stays in RAM buffer
// Sharp will process it before writing to disk
const storage = multer.memoryStorage();

// Only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload an image file (jpg, jpeg, png, webp).'), false);
  }
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max upload
  },
}).single('avatar'); // field name expected from frontend

module.exports = { uploadAvatar };
