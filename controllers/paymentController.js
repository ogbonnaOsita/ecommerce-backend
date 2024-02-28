const User = require('../models/userModel');
const Payment = require('../models/paymentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { paystackConnect } = require('../utils/paymentHandlers');
const factory = require('./handlerFactory');

exports.acceptPayment = catchAsync(async (req, res, next) => {
  // Ensure user is authenticated and retrieve user details
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Validate input amount
  const amount = Number(req.body.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    return next(new AppError('Invalid amount', 400));
  }

  const data = {
    email: user.email,
    amount: amount * 100,
  };

  if (req.body.metadata) data.metadata = { data: req.body.metadata };
  if (req.body.callback_url) data.callback_url = req.body.callback_url;

  await paystackConnect
    .post('/transaction/initialize', data)
    .then((resData) => {
      res.status(201).json({
        status: 'success',
        data: {
          data: resData.data,
        },
      });
    })
    .catch((error) => next(new AppError(error.message, 500)));
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
  await paystackConnect
    .get(`/transaction/verify/${req.params.reference}`)
    .then(async (responseData) => {
      const paymentData = {};
      paymentData.user = req.user.id;
      paymentData.paymentID = responseData.data.data.id;
      paymentData.customerID = responseData.data.data.customer.id;
      paymentData.amount = responseData.data.data.amount / 100;
      paymentData.reference = responseData.data.data.reference;
      paymentData.status = responseData.data.data.status;
      paymentData.createdAt = responseData.data.data.created_at;

      const payment = await Payment.findOne({
        paymentID: responseData.data.data.id,
      });

      if (!payment) {
        await Payment.create(paymentData);
      } else if (payment.status !== responseData.data.data.status) {
        payment.status = responseData.data.data.status;
        payment.save();
      }
      res.status(200).json({
        status: 'success',
        data: {
          data: responseData.data,
        },
      });
    })
    .catch((err) => next(new AppError(err.message, 500)));
});

exports.getAllTransactionsPaystack = catchAsync(async (req, res, next) => {
  await paystackConnect
    .get('/transaction')
    .then((responseData) => {
      res.status(200).json({
        status: 'success',
        count: responseData.data.data.length,
        data: {
          data: responseData.data,
        },
      });
    })
    .catch((err) => next(new AppError(err.message, 500)));
});

exports.getTransactionPaystack = catchAsync(async (req, res, next) => {
  await paystackConnect
    .get(`/transaction/${req.params.id}`)
    .then((responseData) => {
      res.status(200).json({
        status: 'success',
        data: responseData.data,
      });
    })
    .catch((err) => next(new AppError(err.message, 500)));
});

exports.getAllUserTransactions = catchAsync(async (req, res, next) => {
  const payments = await Payment.find({ user: req.user.id });
  if (!payments) return next(new AppError('No transaction found', 404));
  res.status(200).json({
    status: 'success',
    count: payments.length,
    data: {
      data: payments,
    },
  });
});

exports.getUserTransaction = catchAsync(async (req, res, next) => {
  const payment = await Payment.findOne({
    user: req.user.id,
    paymentID: req.params.paymentID,
  });

  if (!payment) return next(new AppError('No transaction found', 404));
  res.status(200).json({
    status: 'success',
    data: {
      data: payment,
    },
  });
});

exports.getAllTransactions = factory.getAll(Payment);
exports.getTransaction = factory.getOne(Payment);
