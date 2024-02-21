const mongoose = require('mongoose');
const slugify = require('slugify');
// const { v4: uuidv4 } = require('uuidv4');

const categorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A category must have a title'],
    unique: true,
  },
  thumbnail: {
    type: String,
    required: [true, 'A category must have an image'],
  },
  slug: String,
});

//Middlewares
categorySchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
