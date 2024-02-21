const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config();

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then((con) => {
  console.log('DB connection successful');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App running on ${PORT}`);
});
