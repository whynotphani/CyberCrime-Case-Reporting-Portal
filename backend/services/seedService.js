const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Officer = require('../models/Officer');
const Case = require('../models/Case');
const Citizen = require('../models/Citizen');
const CaseStatusHistory = require('../models/CaseStatusHistory');
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

  // Seed 1 Cybercrime Case
  await seedSampleCases();
}

async function seedSampleCases() {
  const sampleCases = [
    {
      _id: 'case_1001',
      caseNumber: 'CC-20260820-1001',
      category: 'Financial Fraud',
      title: 'UPI Phishing Scam via Fake Banking KYC Link',
      description: 'Received SMS claiming HDFC account would be blocked unless KYC updated immediately via link. Clicked link and entered UPI PIN. Lost ₹65,000.',
      lossAmount: 65000,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-18'),
      submittedAt: new Date('2026-08-18T10:30:00Z'),
      createdAt: new Date('2026-08-18T10:30:00Z'),
      updatedAt: new Date('2026-08-19T14:20:00Z'),
      suspectDetails: {
        name: 'Rakesh Kumar (Fake Executive)',
        phone: '+91 91234 56789',
        bankDetails: 'ICICI A/C 9940192830 (IFSC ICIC0001029)',
        urlOrHandle: 'https://hdfc-kyc-verify.site',
        otherInfo: 'UPI Ref UTR: 423910293019'
      },
      citizenData: {
        fullName: 'Aarav Patel',
        phone: '+91 98765 11001',
        email: 'aarav.patel@gmail.com'
      }
    }
  ];

  store.cases = sampleCases;
  store.otp_records = [
    {
      _id: 'otp_1001',
      caseNumber: 'CC-20260820-1001',
      phone: '+91 98765 11001',
      otp: '123456',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isVerified: false,
      isUsed: false,
      attempts: 0,
      createdAt: new Date()
    }
  ];

  store.case_status_history = [
    {
      _id: 'hist_1001',
      caseNumber: 'CC-20260820-1001',
      status: 'UNDER_INVESTIGATION',
      remarks: 'Case assigned to Inspector Phanindra (CYBER-2005) for priority investigation.',
      updatedByRole: 'OFFICER',
      updatedByOfficer: 'off_701',
      timestamp: new Date('2026-08-19T14:20:00Z')
    }
  ];

  if (mongoose.connection.readyState === 1) {
    await Case.deleteMany({});

    for (const c of sampleCases) {
      let citizenDoc = await Citizen.findOne({ phone: c.citizenData.phone });
      if (!citizenDoc) {
        citizenDoc = await Citizen.create({
          fullName: c.citizenData.fullName,
          phone: c.citizenData.phone,
          email: c.citizenData.email,
          caseNumber: c.caseNumber
        });
      }

      let officerDoc = null;
      if (c.assignedOfficer) {
        officerDoc = await Officer.findById(c.assignedOfficer);
      }

      await Case.findOneAndUpdate(
        { caseNumber: c.caseNumber },
        {
          caseNumber: c.caseNumber,
          citizen: citizenDoc._id,
          category: c.category,
          title: c.title,
          description: c.description,
          lossAmount: c.lossAmount,
          priority: c.priority,
          status: c.status,
          assignedOfficer: officerDoc ? officerDoc._id : null,
          incidentDate: c.incidentDate,
          submittedAt: c.submittedAt,
          suspectDetails: c.suspectDetails,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        },
        { upsert: true, new: true }
      );
    }
    console.log('[Seed Service] 1 Cybercrime Case seeded into MongoDB.');
  }

  console.log('[Seed Service] 1 Cybercrime Case seeded into In-Memory Store.');
}

module.exports = {
  seedOfficers,
  seedSampleCases
};
