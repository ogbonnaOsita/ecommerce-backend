const express = require('express');
const cartController = require('../controllers/cartController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect, authController.restrictTo('user'));

router.get('/', cartController.getCart);
router.post('/addItemToCart', cartController.addItemToCart);
router.patch('/updateItemsInCart', cartController.updateItemsInCart);
router.delete('/removeItemFromCart/:id', cartController.removeItemFromCart);
router.delete('/emptyCart', cartController.emptyCart);

module.exports = router;
