const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
// const factory = require('./handlerFactory');

exports.getCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findById(req.cart._id);
  res.status(200).json({
    status: 'success',
    data: {
      cart,
    },
  });
});

exports.addItemToCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findById(req.cart._id);

  //   Check if required parameters are provided
  const { product, qty } = req.body;
  if (!product)
    return next(new AppError('A product is required to be added to cart', 401));
  if (!qty) return next(new AppError('The product quantity is required', 401));

  //   Add items to cart
  // Check if the product already exists in the cart
  const existingItem = cart.items.find((cartItem) =>
    cartItem.product.equals(product),
  );
  if (existingItem) {
    existingItem.qty += qty;
  } else {
    cart.items.push({ product, qty });
  }

  //   find product
  const item = await Product.findById(product);

  cart.totalQty += qty;
  cart.totalCost += item.price * qty;

  //   update the cart
  req.cart = await cart.save();

  res.status(200).json({
    status: 'success',
    message: 'Item added to cart successfully!',
  });
});

exports.updateItemsInCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findById(req.cart._id);

  //   Check if required parameters are provided
  const { items } = req.body;

  if (!Array.isArray(items) || items.length < 1)
    return next(new AppError('Missing parameters', 404));

  items.forEach(async (updatedItem) => {
    const itemIndex = cart.items.findIndex((item) =>
      item.product.equals(updatedItem.product),
    );
    if (itemIndex !== -1 && updatedItem.qty > 0) {
      const existingItem = cart.items.find((cartItem) =>
        cartItem.product.equals(updatedItem.product),
      );
      //   update Total quantity of items in cart
      cart.totalQty = cart.totalQty - existingItem.qty + updatedItem.qty;
      //   update total price of items in cart
      cart.totalCost =
        cart.totalCost -
        existingItem.qty * existingItem.product.price +
        updatedItem.qty * existingItem.product.price;
      //   Update Item qty in cart
      cart.items[itemIndex].qty = updatedItem.qty;
    }
  });
  //   update the cart
  req.cart = await cart.save();

  res.status(200).json({
    status: 'success',
    data: {
      item: req.cart,
    },
  });
});

exports.removeItemFromCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findById(req.cart._id);
  const itemIndex = cart.items.findIndex((item) =>
    item.product.equals(req.params.id),
  );

  if (itemIndex > -1) {
    const existingItem = cart.items.find((cartItem) =>
      cartItem.product.equals(req.params.id),
    );
    //   update Total quantity of items in cart
    cart.totalQty -= existingItem.qty;
    //   update total price of items in cart
    cart.totalCost -= existingItem.qty * existingItem.product.price;
    // remove item from cart
    cart.items.splice(itemIndex, 1);

    req.cart = await cart.save();
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } else {
    return next(new AppError('Item not found in cart', 404));
  }
});

exports.emptyCart = catchAsync(async (req, res, next) => {
  await Cart.findByIdAndDelete(req.cart._id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
