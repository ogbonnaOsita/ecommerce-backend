const multer = require('multer');
const sharp = require('sharp');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
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

exports.uploadProductImages = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images' },
]);

exports.resizeProductImages = catchAsync(async (req, res, next) => {
  if (!req.files.images) return next();

  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `product-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      if (
        process.env.CLOUDINARY_API_SECRET &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_CLOUD_NAME
      ) {
        const resizedImageBuffer = await sharp(file.buffer)
          .resize(500, 500)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toBuffer();

        const cloudinaryResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: process.env.CLOUDINARY_FOLDER_PRODUCTS || 'products',
              public_id: file.originalname.replace(/\.[^/.]+$/, ''),
              overwrite: true,
            },
            (err, result) => {
              if (err) {
                return reject(
                  new AppError('Error uploading resized image', 400),
                );
              }
              resolve(result);
            },
          );
          uploadStream.end(resizedImageBuffer);
        });
        req.body.images.push(cloudinaryResult.secure_url);
      } else {
        await sharp(file.buffer)
          .resize(500, 500)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/images/products/${filename}`);

        req.body.images.push(filename);
      }
    }),
  );
  next();
});

exports.getProductsByCategory = catchAsync(async (req, res, next) => {
  const categoryId = await Category.findOne({ slug: req.params.slug }, '_id');
  const totalCount = await Product.countDocuments({
    category: categoryId,
  });
  // To allow for nested GET reviews on product
  const features = new APIFeatures(
    Product.find({
      category: categoryId,
    }),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const products = await features.query;

  res.status(200).json({
    status: 'success',
    totalCount,
    data: {
      data: products,
    },
  });
});

exports.getAllProducts = factory.getAll(Product);
exports.createProduct = factory.createOne(Product);
exports.getProduct = factory.getOne(Product, { path: 'reviews' });
exports.getProductBySlug = factory.getOneBySlug(Product, { path: 'reviews' });
exports.updateProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);

// exports.deleteProduct = catchAsync(async (req, res, next) => {
//   const product = await Product.findByIdAndDelete(req.params.id);
//   if (!product) {
//     return next(new AppError('No product found', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

// exports.getProductStats = async (req, res) => {
//   try {
//     const stats = await Product.aggregate([
//       // {
//       //   $match: { ratingsAverage: { $gte: 4.5 } },
//       // },
//       {
//         $group: {
//           _id: '$category',
//           numProducts: { $sum: 1 },
//           numRatings: { $sum: '$ratingsQuantity' },
//           avgRating: { $avg: '$ratingsAverage' },
//           avgPrice: { $avg: '$price' },
//           minPrice: { $min: '$price' },
//           maxPrice: { $max: '$price' },
//         },
//       },
//     ]);

//     res.status(200).json({
//       status: 'success',
//       data: {
//         stats,
//       },
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'failed',
//       message: err.message,
//     });
//   }
// };
