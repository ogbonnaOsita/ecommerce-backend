const express = require('express');
const paymentController = require('../controllers/paymentController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/',
  authController.protect,
  authController.restrictTo('admin', 'editor'),
  paymentController.getAllTransactions,
);

router.get(
  '/:id',
  authController.protect,
  authController.restrictTo('admin', 'editor'),
  paymentController.getTransaction,
);

router.use(authController.protect, authController.restrictTo('user'));

router.post('/', paymentController.acceptPayment);
router.get('/verify/:reference', paymentController.verifyPayment);
router.post('/charge', paymentController.chargeCard);

module.exports = router;
