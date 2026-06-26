const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'public/uploads/categories/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'category-' + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

exports.uploadImage = upload.single('categoryImage');

exports.handleImageUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const imageUrl = `/uploads/categories/${req.file.filename}`;
        
        res.json({
            success: true,
            imageUrl: imageUrl,
            message: 'Image uploaded successfully'
        });

    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image'
        });
    }
};