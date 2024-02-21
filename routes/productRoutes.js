const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router.use('/:productId/reviews', reviewRouter);

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('admin', 'editor'),
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.createProduct,
  )
  .get(productController.getAllProducts);
router
  .route('/:id')
  .get(productController.getProduct)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'editor'),
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.updateProduct,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'editor'),
    productController.deleteProduct,
  );

// router.route('/products-stat').get(productController.getProductStats);

module.exports = router;
