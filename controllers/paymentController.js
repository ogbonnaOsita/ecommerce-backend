const https = require('https');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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

  // Params
  const params = JSON.stringify({
    email: user.email,
    amount: amount * 100, // Convert amount to kobo (if using Naira)
  });

  // Options
  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  // Client request
  const clientReq = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => {
      data += chunk;
    });
    apiRes.on('end', () => {
      try {
        const responseData = JSON.parse(data);
        if (apiRes.statusCode === 200) {
          res.status(200).json(responseData);
        } else {
          // Handle Paystack API error response
          next(
            new AppError(
              responseData.message || 'Paystack API error',
              apiRes.statusCode,
            ),
          );
        }
      } catch (error) {
        // Handle JSON parsing error
        next(new AppError('Error parsing JSON response', 500));
      }
    });
  });

  clientReq.on('error', (error) => {
    // Handle error from the HTTPS request
    next(new AppError(error.message, 500));
  });

  clientReq.write(params);
  clientReq.end();
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: `/transaction/verify/${req.params.reference}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  };

  const apiReq = https.request(options, (apiRes) => {
    let data = '';

    apiRes.on('data', (chunk) => {
      data += chunk;
    });

    apiRes.on('end', () => {
      try {
        const responseData = JSON.parse(data);
        if (apiRes.statusCode === 200) {
          res.status(200).json(responseData);
        } else {
          // Handle Paystack API error response
          next(
            new AppError(
              responseData.message || 'Paystack API error',
              apiRes.statusCode,
            ),
          );
        }
      } catch (error) {
        // Handle JSON parsing error
        next(new AppError('Error parsing JSON response', 500));
      }
    });
  });

  apiReq.on('error', (error) => {
    // Handle error from the HTTPS request
    next(new AppError(error.message, 500));
  });

  // End the HTTPS request
  apiReq.end();
});

exports.chargeCard = catchAsync(async (req, res, next) => {
  const params = JSON.stringify({
    email: req.body.email,
    amount: req.body.amount * 100, // Assuming the amount is in kobo (100 kobo = 1 Naira)
    authorization_code: req.body.authorization_code,
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/charge_authorization',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(params), // Add Content-Length header
    },
  };

  const request = https.request(options, (apiRes) => {
    let data = '';

    apiRes.on('data', (chunk) => {
      data += chunk;
    });

    apiRes.on('end', () => {
      try {
        const responseData = JSON.parse(data);
        if (apiRes.statusCode === 200) {
          res.status(200).json({
            status: 'success',
            data: responseData,
          });
        } else {
          // Handle Paystack API error response
          next(
            new AppError(
              responseData.message || 'Paystack API error',
              apiRes.statusCode,
            ),
          );
        }
      } catch (error) {
        next(new AppError('Error parsing Paystack API response', 500));
      }
    });
  });

  request.on('error', (error) => {
    // Handle error from the HTTPS request
    next(new AppError(error.message, 500));
  });

  request.write(params);
  request.end();
});

exports.getAllTransactions = catchAsync(async (req, res, next) => {
  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  };

  const apiReq = https.request(options, (apiRes) => {
    let data = '';

    apiRes.on('data', (chunk) => {
      data += chunk;
    });

    apiRes.on('end', () => {
      try {
        const responseData = JSON.parse(data);
        if (apiRes.statusCode === 200) {
          res.status(200).json({
            status: 'success',
            data: responseData,
          });
        } else {
          // Handle Paystack API error response
          res.status(apiRes.statusCode).json({
            status: 'error',
            error: responseData.error || 'Paystack API error',
          });
        }
      } catch (error) {
        next(new AppError('Error parsing Paystack API response', 500));
      }
    });
  });

  apiReq.on('error', (error) => {
    // Handle error from the HTTPS request
    res.status(500).json({
      status: 'error',
      error: error.message || 'Internal server error',
    });
  });

  // End the HTTPS request
  apiReq.end();
});

exports.getTransaction = catchAsync(async (req, res, next) => {
  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: `/transaction/${req.params.id}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  };

  const apiReq = https.request(options, (apiRes) => {
    let data = '';

    apiRes.on('data', (chunk) => {
      data += chunk;
    });

    apiRes.on('end', () => {
      try {
        const responseData = JSON.parse(data);
        if (apiRes.statusCode === 200) {
          res.status(200).json({
            status: 'success',
            data: responseData,
          });
        } else {
          // Handle Paystack API error response
          next(
            new AppError(
              responseData.message || 'Paystack API error',
              apiRes.statusCode,
            ),
          );
        }
      } catch (error) {
        next(new AppError('Error parsing Paystack API response', 500));
      }
    });
  });

  apiReq.on('error', (error) => {
    next(new AppError(error.message, 500));
  });

  apiReq.end();
});
