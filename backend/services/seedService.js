const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Officer = require('../models/Officer');
const { store } = require('../config/memoryDb');

async function seedOfficers() {
  const defaultPassword = 'password123';
  const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);

  const customPassword = 'phani@2005';
  const customPasswordHash = await bcrypt.hash(customPassword, 10);

  const officersData = [
    {
      _id: 'off_701',
      officerId: 'OFF-701',
      name: 'Inspector Phanindra',
      badgeNumber: 'CYBER-2005',
      email: 'marpuphani00@gmail.com',
      passwordHash: customPasswordHash,
      role: 'ADMIN',
      department: 'Cybercrime Special Task Force',
      createdAt: new Date()
    },
    {
      _id: 'off_101',
      officerId: 'OFF-101',
      name: 'Inspector Rajesh Kumar',
      badgeNumber: 'CYBER-8841',
      email: 'rajesh.kumar@cyber.gov.in',
      passwordHash: defaultPasswordHash,
      role: 'INVESTIGATING_OFFICER',
      department: 'Financial Fraud Cell',
      createdAt: new Date()
    },
    {
      _id: 'off_102',
      officerId: 'OFF-102',
      name: 'ACP Anita Sharma',
      badgeNumber: 'CYBER-9912',
      email: 'anita.sharma@cyber.gov.in',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      department: 'Cyber Crime Headquarters',
      createdAt: new Date()
    },
    {
      _id: 'off_103',
      officerId: 'OFF-103',
      name: 'Sub-Inspector Vikram Singh',
      badgeNumber: 'CYBER-7734',
      email: 'vikram.singh@cyber.gov.in',
      passwordHash: defaultPasswordHash,
      role: 'HELPLINE_OPERATOR',
      department: '1930 Helpline Desk',
      createdAt: new Date()
    },
    {
      _id: 'off_104',
      officerId: 'OFF-104',
      name: 'Sub-Inspector Priya Verma',
      badgeNumber: 'CYBER-6621',
      email: 'priya.verma@cyber.gov.in',
      passwordHash: defaultPasswordHash,
      role: 'INVESTIGATING_OFFICER',
      department: 'Social Media & Harassment Cell',
      createdAt: new Date()
    }
  ];

  if (mongoose.connection.readyState === 1) {
    for (const data of officersData) {
      await Officer.findOneAndUpdate(
        { officerId: data.officerId },
        data,
        { upsert: true, new: true }
      );
    }
    console.log('[Seed Service] Default officers seeded into MongoDB.');
  }

  // Also seed in-memory store
  store.officers = officersData;
  console.log('[Seed Service] In-memory officer accounts initialized.');
}

module.exports = {
  seedOfficers
};
