const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  paymentID: {
    type: Number,
    required: [true, 'Payment ID is required'],
    unique: [true, 'Transaction already exist'],
  },
  customerID: {
    type: Number,
    required: [true, 'Customer ID is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
  },
  reference: {
    type: String,
    required: [true, 'Payment reference is required'],
  },
  status: {
    type: String,
    enum: [
      'pending',
      'success',
      'failed',
      'abandoned',
      'ongoing',
      'processing',
      'queued',
      'reversed',
    ],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
