const express = require('express');
const categoryController = require('../controllers/categoryController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('admin', 'editor'),
    categoryController.uploadCategoryThumbnail,
    categoryController.resizeCategoryThumbnail,
    categoryController.createCategory,
  )
  .get(categoryController.getAllCategories);

router
  .route('/:id')
  .get(categoryController.getCategory)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'editor'),
    categoryController.uploadCategoryThumbnail,
    categoryController.resizeCategoryThumbnail,
    categoryController.updateCategory,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'editor'),
    categoryController.deleteCategory,
  );

module.exports = router;
