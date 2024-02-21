const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Cart = require('../models/cartModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // CREATE COOKIE
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure: true,
    httpOnly: true,
  };

  if ((process.env.NODE_ENV || '').trim() === 'production')
    cookieOptions.secure = true;
  // SEND COOKIE
  res.cookie('jwt', token, cookieOptions);

  // remove password from response
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //   const newUser = await User.create({
  //     firstName: req.body.firstName,
  //     lastName: req.body.lastName,
  //     email: req.body.email,
  //     password: req.body.password,
  //     passwordConfirm: req.body.passwordConfirm,
  //   });

  const url = `${req.protocol}://${req.get('host')}/api/v1/users/me`;
  await new Email(req.body, url).sendWelcome();
  const newUser = await User.create(req.body);
  // createSendToken(newUser, 201, res);

  const activationToken = newUser.createEmailActivationToken();
  await newUser.save({ validateBeforeSave: false });

  try {
    const activationURL = `${req.protocol}://${req.get('host')}/api/v1/users/accountActivation/${activationToken}`;
    await new Email(newUser, activationURL).sendWelcome();

    res.status(200).json({
      status: 'success',
      message: 'Account verification link has been sent to your email',
    });
  } catch (err) {
    newUser.emailActivationToken = undefined;
    newUser.emailActivationTokenExpires = undefined;
    await newUser.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error while sending the email. Try again later',
      ),
      500,
    );
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (user && user.accountActivated !== true)
    return next(new AppError('Your account has not yet been activated', 401));

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.resendEmailActivation = catchAsync(async (req, res, next) => {
  if (!req.body.email)
    return next(new AppError('Please provide an email address', 401));

  const user = await User.findOne({ email: req.body.email });
  if (user && user.accountActivated !== false)
    return next(new AppError('Your account is already activated', 401));

  const activationToken = user.createEmailActivationToken();
  await user.save({ validateBeforeSave: false });

  try {
    const activationURL = `${req.protocol}://${req.get('host')}/api/v1/users/accountActivation/${activationToken}`;
    await new Email(user, activationURL).sendWelcome();

    res.status(200).json({
      status: 'success',
      message: 'Account verification link has been sent to your email',
    });
  } catch (err) {
    user.emailActivationToken = undefined;
    user.emailActivationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error while sending the email. Try again later',
      ),
      500,
    );
  }
});

exports.activateUserAccount = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailActivationToken: hashedToken,
    emailActivationTokenExpires: { $gt: Date.now() },
  });

  // if token has not expired and there is user set the new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.emailActivationToken = undefined;
  user.emailActivationTokenExpires = undefined;
  user.accountActivated = true;
  await user.save({ validateBeforeSave: false });

  // login the user
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in', 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user with this token no longer exist', 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('User changed password recently, please login again.', 401),
    );
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  // Get Cart for logged in user
  if (!req.cart) {
    await Cart.create({ user: req.user.id });
  }
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = await Cart.create({ user: req.user.id });
  }
  req.cart = cart;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action'),
        403,
      );
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError(`No user with this email: ${req.body.email} found`, 404),
    );

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error while sending the email. Try again later',
      ),
      500,
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // if token has not expired and there is user set the new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  // update changePasswordAt property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // login the user
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // get the user from the db
  const user = await User.findById(req.user.id).select('+password');
  // check if the posted password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password)))
    return next(new AppError('Incorrect password', 401));
  // update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // log the user in
  createSendToken(user, 200, res);
});
