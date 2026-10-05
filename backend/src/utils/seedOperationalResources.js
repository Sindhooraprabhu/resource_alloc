const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { seedOperationalResources } = require('./operationalResourceSeeder');

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink_ai');
  await seedOperationalResources();
  await mongoose.disconnect();
};

run().catch(async error => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});