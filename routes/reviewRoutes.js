const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// restrict review routes to only logged in users
router.use(authController.protect);

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setProductUserIds,
    reviewController.createReview,
  )
  .get(reviewController.getAllReviews);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;
