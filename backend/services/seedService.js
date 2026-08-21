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
      const { _id, ...mongoData } = data;
      await Officer.findOneAndUpdate(
        { officerId: data.officerId },
        mongoData,
        { upsert: true, new: true }
      );
    }
    console.log('[Seed Service] Default officers seeded into MongoDB.');
  }

  // Also seed in-memory store
  store.officers = officersData;
  console.log('[Seed Service] In-memory officer accounts initialized.');

  // Seed 4 Sample Cybercrime Cases
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
    },
    {
      _id: 'case_1002',
      caseNumber: 'CC-20260820-1002',
      category: 'Non-Financial Cybercrime',
      title: 'Ransomware Attack & Data Encryption on Office Server',
      description: 'Windows Server encrypted by BlackCat ransomware via exposed RDP port. Database files appended with .locked extension. Ransom note demanding 0.8 BTC left in README.txt.',
      lossAmount: 0,
      priority: 'HIGH',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-19'),
      submittedAt: new Date('2026-08-19T09:15:00Z'),
      createdAt: new Date('2026-08-19T09:15:00Z'),
      updatedAt: new Date('2026-08-19T11:00:00Z'),
      suspectDetails: {
        name: 'Attacker Alias: Shadow_Lock',
        phone: 'N/A',
        bankDetails: 'Extortion Demand: 0.8 BTC to wallet 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        urlOrHandle: '185.220.101.5',
        otherInfo: 'Affected System: Windows Server 2022 Data Vault'
      },
      citizenData: {
        fullName: 'Sneha Reddy',
        phone: '+91 98765 22002',
        email: 'sneha.reddy@techcorp.in'
      }
    },
    {
      _id: 'case_1003',
      caseNumber: 'CC-20260820-1003',
      category: 'Mobile Theft/Loss',
      title: 'Smartphone Theft at Railway Station Platform',
      description: 'Apple iPhone 15 Pro snatched from hand while waiting at Visakhapatnam Railway Station Platform 2. Device powered off immediately. Telecom SIM block requested.',
      lossAmount: 0,
      priority: 'MEDIUM',
      status: 'ADDITIONAL_INFO_REQUIRED',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-17'),
      submittedAt: new Date('2026-08-17T16:45:00Z'),
      createdAt: new Date('2026-08-17T16:45:00Z'),
      updatedAt: new Date('2026-08-18T12:30:00Z'),
      suspectDetails: {
        name: 'Apple iPhone 15 Pro (Black Titanium)',
        phone: '+91 98765 33003 (Jio)',
        bankDetails: 'IMEI 1: 358920194820194, IMEI 2: 358920194820195',
        urlOrHandle: 'Last Location: Visakhapatnam Railway Station Platform 2',
        otherInfo: 'Box & Original Invoice attached'
      },
      citizenData: {
        fullName: 'Rohan Sharma',
        phone: '+91 98765 33003',
        email: 'rohan.sharma@outlook.com'
      }
    },
    {
      _id: 'case_1004',
      caseNumber: 'CC-20260820-1004',
      category: 'Online Harassment',
      title: 'Cyberstalking & Deepfake Photo Extortion on Instagram',
      description: 'Unknown stalker created fake Instagram profiles using morphed profile pictures. Demanding money via WhatsApp and threatening to circulate edited images to contacts.',
      lossAmount: 0,
      priority: 'HIGH',
      status: 'RESOLVED',
      assignedOfficer: 'off_104',
      incidentDate: new Date('2026-08-15'),
      submittedAt: new Date('2026-08-15T14:10:00Z'),
      createdAt: new Date('2026-08-15T14:10:00Z'),
      updatedAt: new Date('2026-08-20T18:00:00Z'),
      suspectDetails: {
        name: '@stalker_shadow_99',
        phone: '+91 91234 00099',
        bankDetails: 'Platform: Instagram | Sub-Type: Morphing / Deepfake Content',
        urlOrHandle: 'https://instagram.com/stalker_shadow_99',
        otherInfo: 'Cyber Cell Sub-Inspector Priya Verma issued takedown notice and tracked IP'
      },
      citizenData: {
        fullName: 'Meera Nair',
        phone: '+91 98765 44004',
        email: 'meera.nair@yahoo.com'
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
    },
    {
      _id: 'otp_1002',
      caseNumber: 'CC-20260820-1002',
      phone: '+91 98765 22002',
      otp: '234567',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isVerified: false,
      isUsed: false,
      attempts: 0,
      createdAt: new Date()
    },
    {
      _id: 'otp_1003',
      caseNumber: 'CC-20260820-1003',
      phone: '+91 98765 33003',
      otp: '345678',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isVerified: false,
      isUsed: false,
      attempts: 0,
      createdAt: new Date()
    },
    {
      _id: 'otp_1004',
      caseNumber: 'CC-20260820-1004',
      phone: '+91 98765 44004',
      otp: '456789',
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
    },
    {
      _id: 'hist_1002',
      caseNumber: 'CC-20260820-1002',
      status: 'UNDER_REVIEW',
      remarks: 'Server audit logs and ransomware payload submitted for forensic triage.',
      updatedByRole: 'OFFICER',
      updatedByOfficer: 'off_701',
      timestamp: new Date('2026-08-19T11:00:00Z')
    },
    {
      _id: 'hist_1003',
      caseNumber: 'CC-20260820-1003',
      status: 'ADDITIONAL_INFO_REQUIRED',
      remarks: 'Please upload Police Lost Article Report Copy to proceed with telecom IMEI tracking.',
      updatedByRole: 'OFFICER',
      updatedByOfficer: 'off_101',
      timestamp: new Date('2026-08-18T12:30:00Z')
    },
    {
      _id: 'hist_1004',
      caseNumber: 'CC-20260820-1004',
      status: 'RESOLVED',
      remarks: 'Fraudulent profile taken down by Instagram legal desk. Origin IP logged and perpetrator issued warning.',
      updatedByRole: 'OFFICER',
      updatedByOfficer: 'off_104',
      timestamp: new Date('2026-08-20T18:00:00Z')
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
    console.log('[Seed Service] 4 Sample Cybercrime Cases seeded into MongoDB.');
  }

  console.log('[Seed Service] 4 Sample Cybercrime Cases seeded into In-Memory Store.');
}

module.exports = {
  seedOfficers,
  seedSampleCases
};
