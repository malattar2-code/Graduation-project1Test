// // utils/uploadMiddleware.js
// const multer = require("multer");
// const path = require("path");

// // Use memory storage for better handling
// const storage = multer.memoryStorage();

// const fileFilter = (req, file, cb) => {
//     if (
//         file.mimetype.startsWith("image/") ||
//         file.mimetype === "video/mp4" ||
//         file.mimetype === "application/pdf"
//     ) {
//         cb(null, true);
//     } else {
//         cb(new Error("Only images, MP4 videos, and PDF files are allowed"), false);
//     }
// };

// const upload = multer({
//     storage: storage,
//     fileFilter: fileFilter,
//     limits: {
//         fileSize: 20 * 1024 * 1024 // 5MB limit
//     }
// });

// module.exports = upload;

// utils/uploadMiddleware.js
const multer = require("multer");
const path   = require("path");

const storage = multer.memoryStorage();

// Whitelist: mimetype + valid extensions for each
const ALLOWED_TYPES = {
  "image/jpeg":      [".jpg", ".jpeg"],
  "image/png":       [".png"],
  "image/gif":       [".gif"],
  "image/webp":      [".webp"],
  "video/mp4":       [".mp4"],
  "application/pdf": [".pdf"]
};

const fileFilter = (req, file, cb) => {
  const allowedExts = ALLOWED_TYPES[file.mimetype];
  const ext         = path.extname(file.originalname).toLowerCase();

  if (allowedExts && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file "${file.originalname}". Only JPG, PNG, GIF, WebP, MP4, and PDF are allowed.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB per file
    files: 10                    // hard ceiling on total files per request
  }
});

/**
 * Wraps any multer middleware so errors are returned as clean JSON
 * instead of crashing or sending HTML stack traces.
 *
 * Usage: upload.withErrorHandling(upload.single('image'))
 *        upload.withErrorHandling(upload.fields([...]))
 */
upload.withErrorHandling = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        let message = err.message;
        if (err.code === "LIMIT_FILE_SIZE") {
          message = "File too large. Maximum allowed is 20MB per file.";
        } else if (err.code === "LIMIT_FILE_COUNT") {
          message = "Too many files uploaded in this request.";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
          message = `Unexpected file field: ${err.field}`;
        }
        return res.status(400).json({ success: false, error: message });
      }

      if (err) {
        // Custom errors thrown by fileFilter
        return res.status(400).json({ success: false, error: err.message });
      }

      next();
    });
  };
};

module.exports = upload;