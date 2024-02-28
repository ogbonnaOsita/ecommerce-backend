const mongoose = require('mongoose');
const validator = require('validator');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [
          true,
          'The product ID is required to process the order',
          401,
        ],
      },
      qty: {
        type: Number,
        required: [true, 'The quantity for this item is required', 401],
      },
      price: {
        type: Number,
        required: [true, 'The price for this item is required', 401],
      },
    },
  ],
  totalQty: {
    type: Number,
    required: [
      true,
      'The total quantity of items for the order is required',
      401,
    ],
  },
  totalCost: {
    type: Number,
    required: [true, 'The total cost for the order is required', 401],
  },
  shippingAddress: {
    type: String,
    required: [true, 'The shipping address is required for the order', 401],
  },
  postalCode: Number,
  city: String,
  state: String,
  paymentId: {
    type: String,
    required: [true, 'The payment Id is required to complete the order'],
  },
  phone: {
    type: String,
    required: [true, 'User phone number is required'],
    validate: [validator.isMobilePhone, 'Please provide a valid phone number'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'delivered'],
    default: 'pending',
  },
});

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName email photo',
  }).populate({
    path: 'items',
    populate: {
      path: 'product',
      model: 'Product',
      select: 'title price images',
    },
  });
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
