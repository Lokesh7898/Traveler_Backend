const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { statusCodes, statusMessages } = require('../utils/apiResponse');

const uploadsDir = path.join(__dirname, '../public/uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError(statusMessages.FILE_TYPE_UNSUPPORTED, statusCodes.BAD_REQUEST), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

exports.uploadListingImages = upload.array('images', 5);

exports.resizeListingImages = catchAsync(async (req, res, next) => {
    if (!req.files || req.files.length === 0) return next();

    req.body.images = [];

    await Promise.all(
        req.files.map(async (file, i) => {
            const filename = `listing-${req.user.id}-${Date.now()}-${i + 1}.jpeg`;
            const filePath = path.join(uploadsDir, filename);

            await sharp(file.buffer)
                .resize(2000, 1333, { fit: 'cover', withoutEnlargement: true })
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(filePath);

            req.body.images.push(`/public/uploads/${filename}`);
        })
    );
    next();
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    const filePath = path.join(uploadsDir, req.file.filename);

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(filePath);

    req.body.photo = `/public/uploads/${req.file.filename}`;
    next();
});