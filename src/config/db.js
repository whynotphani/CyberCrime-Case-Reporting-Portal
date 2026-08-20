const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Officer = require('../models/Officer');
const { seedMemoryOfficers } = require('./memoryDb');

// Disable Mongoose command buffering when DB is offline so it doesn't hang requests
mongoose.set('bufferCommands', false);

const seedDefaultOfficers = async () => {
  try {
    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const officersData = [
      {
        officerId: 'OFF-101',
        name: 'Inspector Rajesh Kumar',
        badgeNumber: 'CYBER-8841',
        email: 'rajesh.kumar@cyber.gov.in',
        passwordHash: passwordHash,
        role: 'INVESTIGATING_OFFICER',
        department: 'Financial Fraud Cell'
      },
      {
        officerId: 'OFF-102',
        name: 'ACP Anita Sharma',
        badgeNumber: 'CYBER-9912',
        email: 'anita.sharma@cyber.gov.in',
        passwordHash: passwordHash,
        role: 'ADMIN',
        department: 'Cyber Crime Headquarters'
      },
      {
        officerId: 'OFF-103',
        name: 'Sub-Inspector Vikram Singh',
        badgeNumber: 'CYBER-7734',
        email: 'vikram.singh@cyber.gov.in',
        passwordHash: passwordHash,
        role: 'HELPLINE_OPERATOR',
        department: '1930 Helpline Desk'
      },
      {
        officerId: 'OFF-104',
        name: 'Sub-Inspector Priya Verma',
        badgeNumber: 'CYBER-6621',
        email: 'priya.verma@cyber.gov.in',
        passwordHash: passwordHash,
        role: 'INVESTIGATING_OFFICER',
        department: 'Social Media & Harassment Cell'
      }
    ];

    for (const data of officersData) {
      await Officer.findOneAndUpdate(
        { officerId: data.officerId },
        data,
        { upsert: true, new: true }
      );
    }
    console.log('[Database Seed] Default cybercrime officer accounts seeded in MongoDB.');
  } catch (err) {
    console.error('[Seed Error]', err.message);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybercrime_db';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}`);
    await seedDefaultOfficers();
  } catch (error) {
    console.log(`\n[MongoDB Offline / Notice] ${error.message}`);
    console.log(`  Application running in high-performance In-Memory Mode.`);
    console.log(`  To connect to persistent MongoDB, start local MongoDB or add Atlas URI to .env.\n`);
    // Ensure in-memory officers are seeded
    await seedMemoryOfficers();
  }
};

module.exports = connectDB;
