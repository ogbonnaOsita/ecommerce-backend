const dotenv = require('dotenv');
const path = require('path');
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const User = require('../models/userModel');

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
      const roles = ['user', 'admin', 'editor'];
      for (let i = 0; i < 20; i++) {
        const user = new User({
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: faker.internet.email(),
          password: 'test12345',
          passwordConfirm: 'test12345',
          role: roles[Math.floor(Math.random() * roles.length)],
        });
        await user.save();
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
