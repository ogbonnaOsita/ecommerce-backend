const dotenv = require('dotenv');
const path = require('path');
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Review = require('../models/reviewModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD,
);

console.log(DB);

async function openDB() {
  console.log('Opening Connection');
  try {
    mongoose.connect(DB).then((con) => {
      console.log('DB connection successful');
    });
  } catch (err) {
    console.log(err);
  }
}

openDB();

async function seedDB() {
  async function seedUsers() {
    try {
      const products = await Product.find().select('_id');
      const users = await User.find({ role: 'user' }).select('_id');
      for (let i = 0; i < 20; i++) {
        const review = new Review({
          review: faker.lorem.sentence(),
          rating: faker.number.int({ min: 1, max: 5 }),
          product: products[Math.floor(Math.random() * products.length)]._id,
          user: users[Math.floor(Math.random() * users.length)]._id,
        });
        await review.save();
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async function closeDB() {
    console.log('CLOSING CONNECTION');
    await mongoose.disconnect();
  }

  await seedUsers();

  await closeDB();
}

seedDB();
