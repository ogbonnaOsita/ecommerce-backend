const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    new mongoose.Schema({
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      qty: {
        type: Number,
        default: 0,
      },
    }),
  ],

  totalQty: {
    type: Number,
    default: 0,
    required: true,
  },
  totalCost: {
    type: Number,
    default: 0,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

cartSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName email photo',
  }).populate({
    path: 'items',
    populate: {
      path: 'product',
      model: 'Product',
      select: 'title price thumbnail',
    },
  });
  next();
});
cartSchema.post(/^find/, (doc) => {
  let cost = 0;
  doc.items.forEach(async (item) => {
    cost += item.product.price * item.qty;
  });

  doc.totalCost = cost;
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
