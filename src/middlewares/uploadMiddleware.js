const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/evidence');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const caseNum = req.user?.caseNumber ? req.user.caseNumber.replace(/[^a-zA-Z0-9-]/g, '') : 'CASE';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${caseNum}-${uniqueSuffix}${ext}`);
  }
});

// File filter (MIME & Extension Whitelist)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'video/mp4',
    'text/plain'
  ];

  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Allowed files: JPG, PNG, PDF, MP4, TXT.'), false);
  }
};

// Multer upload middleware (Max 10MB per file, max 5 files per request)
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: fileFilter
});

module.exports = upload;
