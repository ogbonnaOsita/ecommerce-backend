const Order = require('../models/orderModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.createOrder = catchAsync(async (req, res, next) => {
  req.body.user = req.user.id;
  const order = await Order.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      order,
    },
  });
});

exports.getAllOrders = factory.getAll(Order);
exports.getOrder = factory.getOne(Order);
exports.updateOrder = factory.updateOne(Order);
exports.deleteOrder = factory.deleteOne(Order);
