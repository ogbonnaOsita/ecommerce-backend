const express = require('express');
const paymentController = require('../controllers/paymentController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/userTransactions',
  authController.protect,
  authController.restrictTo('user'),
  paymentController.getAllUserTransactions,
);

router.get(
  '/userTransactions/:paymentID',
  authController.protect,
  authController.restrictTo('user'),
  paymentController.getUserTransaction,
);

router.get(
  '/paystack',
  authController.protect,
  authController.restrictTo('admin', 'editor'),
  paymentController.getAllTransactions,
);

router.get(
  '/paystack/:id',
  authController.protect,
  authController.restrictTo('admin', 'editor'),
  paymentController.getTransaction,
);

router.get(
  '/',
  authController.protect,
  authController.restrictTo('admin', 'editor'),
  paymentController.getAllTransactionsPaystack,
);

router.get(
  '/:id',
  authController.protect,
  authController.restrictTo('admin', 'editor'),
  paymentController.getTransactionPaystack,
);

router.use(authController.protect, authController.restrictTo('user'));

router.post('/', paymentController.acceptPayment);
router.get('/verify/:reference', paymentController.verifyPayment);

module.exports = router;
