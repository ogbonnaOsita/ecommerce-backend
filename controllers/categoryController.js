const multer = require('multer');
const sharp = require('sharp');
const Category = require('../models/categoryModel');
const factory = require('./handlerFactory');
const cloudinary = require('../utils/cloudinary');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files can be uploaded', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadCategoryThumbnail = upload.single('thumbnail');

exports.resizeCategoryThumbnail = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  if (
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_CLOUD_NAME
  ) {
    const resizedImageBuffer = await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toBuffer();

    const cloudinaryResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: process.env.CLOUDINARY_FOLDER_CATEGORIES || 'categories',
          public_id: req.file.originalname.replace(/\.[^/.]+$/, ''),
          overwrite: true,
        },
        (err, result) => {
          if (err) {
            return reject(new AppError('Error uploading resized image', 400));
          }
          resolve(result);
        },
      );
      uploadStream.end(resizedImageBuffer);
    });
    req.file.filename = cloudinaryResult.secure_url;

    next();
  } else {
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/images/categories/${req.file.filename}`);
    next();
  }
});

exports.createCategory = catchAsync(async (req, res, next) => {
  if (req.file) req.body.thumbnail = req.file.filename;
  const newData = await Category.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      data: newData,
    },
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  if (req.file) req.body.thumbnail = req.file.filename;
  const data = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!data) {
    return next(new AppError('No data found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data,
    },
  });
});

exports.getAllCategories = factory.getAll(Category);
exports.getCategory = factory.getOne(Category);

exports.deleteCategory = factory.deleteOne(Category);
