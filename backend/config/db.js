const mongoose = require('mongoose');
const { seedOfficers } = require('../services/seedService');

mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybercrime_db';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}`);
    await seedOfficers();
  } catch (error) {
    console.log(`\n[Database Status] MONGODB_OFFLINE (${error.message})`);
    console.log(`  Falling back to high-performance In-Memory Mode.`);
    console.log(`  To connect to persistent MongoDB, start local MongoDB or update .env.\n`);
    await seedOfficers();
  }
};

module.exports = connectDB;
