const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      // unique: true,
    },
    title: {
      type: String,
      required: [true, 'A product must have a title'],
      unique: true,
      trim: true,
      // validate: [validator.isAlpha, 'Product title must only contain letters'],
    },
    slug: String,
    price: {
      type: Number,
      required: [true, 'A product must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        message: 'Discount Price {{VALUE}} should be less than the price value',
        validator: function (val) {
          return val < this.price;
        },
      },
    },
    description: {
      type: String,
      required: [true, 'A product must have a description'],
      trim: true,
    },
    // thumbnail: {
    //   type: String,
    //   required: [true, 'A product must have a thumbnail'],
    // },
    images: {
      type: [String],
      required: [true, 'A product must have an image'],
    },
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    stock: {
      type: Number,
      required: [true, 'A product must have a certain amount of stock'],
      min: 0,
    },
    available: {
      type: Boolean,
      default: true,
    },
    ratingsAverage: {
      type: Number,
      default: 5.0,
      min: [1, 'Rating must be greater than or equal 1.0'],
      max: [5, 'Rating must be less than or equal to 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//Middlewares
productSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  //   this.id = uuidv4();
  next();
});

productSchema.pre(/^find/, function (next) {
  this.populate({ path: 'category', select: '-__v' });
  next();
});

productSchema.post(/^find/, (doc) => {
  if (doc.stock <= 0) {
    doc.available = false;
  } else {
    doc.available = true;
  }
});

productSchema.index({ price: 1, ratingsAverage: -1 }); // indexing 1 for asc and -1 for desc

// VIRTUAL POPULATE
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
  options: { sort: { createdAt: -1 } },
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
