const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const cloudinary = require('../utils/cloudinary');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files can be uploaded', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
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
          folder: process.env.CLOUDINARY_FOLDER_USERS || 'users',
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
      .toFile(`public/images/users/${req.file.filename}`);
    next();
  }
});

// FUNCTION TO FILTER OBJECTS
const filteredObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError('You cannot update your password using this route', 400),
    );

  const filteredData = filteredObj(
    req.body,
    'firstName',
    'lastName',
    'email',
    'phone',
    'shippingAddress',
    'postalCode',
    'city',
    'state',
  );
  if (req.file) filteredData.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);
// Do NOT update passwords with this
exports.updateUser = factory.updateOne(User);
exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteOne(User);
