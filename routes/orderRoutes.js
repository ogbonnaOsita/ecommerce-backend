const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), orderController.getAllOrders)
  .post(authController.restrictTo('user'), orderController.createOrder);

router.get(
  '/userOrders',
  authController.restrictTo('user'),
  orderController.getAllUserOrders,
);
router.get(
  '/userOrders/:id',
  authController.restrictTo('user'),
  orderController.getUserOrder,
);

router.use(authController.restrictTo('admin'));
router
  .route('/:id')
  .get(orderController.getOrder)
  .patch(orderController.updateOrder)
  .delete(orderController.deleteOrder);

module.exports = router;
