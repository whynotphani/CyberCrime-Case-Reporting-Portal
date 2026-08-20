const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Officer = require('../models/Officer');

const seedOfficers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybercrime_db';
    await mongoose.connect(mongoUri);
    console.log('[Seed Script] Connected to MongoDB.');

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

    console.log('[Seed Script] Demo officers seeded successfully!');
    console.log('--- Demo Officer Credentials ---');
    console.log('1) Badge: CYBER-8841 | Password: password123 (Financial Fraud Specialist)');
    console.log('2) Badge: CYBER-9912 | Password: password123 (Cyber HQ Admin)');
    console.log('3) Badge: CYBER-7734 | Password: password123 (Helpline Desk Operator)');
    console.log('4) Badge: CYBER-6621 | Password: password123 (Social Media Specialist)');
    console.log('--------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedOfficers();
