const Order = require('../models/orderModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
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

exports.getAllUserOrders = catchAsync(async (req, res, next) => {
  const filter = { user: req.user.id };

  const totalCount = await Order.countDocuments(filter);

  const features = new APIFeatures(Order.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const orders = await features.query;
  if (!orders) return next(new AppError('No order found', 404));
  res.status(200).json({
    status: 'success',
    count: totalCount,
    data: {
      data: orders,
    },
  });
});

exports.getUserOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ user: req.user.id, _id: req.params.id });
  if (!order) return next(new AppError('No order found', 404));
  res.status(200).json({
    status: 'success',
    data: {
      data: order,
    },
  });
});

exports.getAllOrders = factory.getAll(Order);
exports.getOrder = factory.getOne(Order);
exports.updateOrder = factory.updateOne(Order);
exports.deleteOrder = factory.deleteOne(Order);
