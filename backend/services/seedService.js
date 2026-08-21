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
      plainPassword: 'phani@2005',
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
      plainPassword: 'password123',
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
      plainPassword: 'password123',
      role: 'ADMIN',
      department: 'Cyber Crime Headquarters',
      createdAt: new Date()
    },
    {
      _id: 'off_103',
      officerId: 'OFF-103',
      name: 'SI Vikram Singh',
      badgeNumber: 'CYBER-4402',
      email: 'vikram.singh@cyber.gov.in',
      passwordHash: defaultPasswordHash,
      plainPassword: 'password123',
      role: 'INVESTIGATING_OFFICER',
      department: 'Mobile & Hardware Forensics',
      createdAt: new Date()
    },
    {
      _id: 'off_104',
      officerId: 'OFF-104',
      name: 'SI Priya Verma',
      badgeNumber: 'CYBER-6619',
      email: 'priya.verma@cyber.gov.in',
      passwordHash: defaultPasswordHash,
      plainPassword: 'password123',
      role: 'INVESTIGATING_OFFICER',
      department: 'Online Harassment & Social Media Cell',
      createdAt: new Date()
    }
  ];

  store.officers = officersData;

  if (mongoose.connection.readyState === 1) {
    for (const off of officersData) {
      await Officer.findOneAndUpdate(
        { _id: off._id },
        { ...off, password: off.passwordHash },
        { upsert: true, new: true }
      );
    }
    console.log('[Seed Service] Officer accounts seeded into MongoDB.');
  }

  console.log('[Seed Service] In-memory officer accounts initialized.');
}

function generate386Cases() {
  const categories = [
    'Financial Fraud',
    'Non-Financial Cybercrime',
    'Mobile Theft/Loss',
    'Online Harassment',
    'Social Media Crime',
    'Other Cybercrime'
  ];

  const activeStatuses = [
    'UNDER_INVESTIGATION',
    'UNDER_REVIEW',
    'SUBMITTED',
    'ASSIGNED',
    'VERIFICATION_PENDING',
    'ADDITIONAL_INFO_REQUIRED'
  ];

  const solvedStatuses = ['RESOLVED', 'CLOSED'];
  const priorities = ['HIGH', 'MEDIUM', 'LOW'];
  const officerIds = ['off_701', 'off_101', 'off_102', 'off_103', 'off_104'];

  const sampleTitles = {
    'Financial Fraud': [
      'Fake Stock Trading App Investment Fraud',
      'Corporate BEC Wire Transfer Fraud',
      'Crypto Mining Wallet Drainer Scam',
      'Illegal Instant Loan App Extortion',
      'Rental Property Advance Deposit Scam',
      'SIM Swap NetBanking Fraud',
      'EV Charging Station Deposit Scam',
      'E-Commerce Customs Duty Phishing',
      'Telegram Work From Home Task Fraud',
      'Credit Card Limit Increase Phishing'
    ],
    'Non-Financial Cybercrime': [
      'Ransomware Attack on Corporate Server',
      'Database Breach & Extortion Attempt',
      'Website Defacement & Malicious Code Injection',
      'Corporate Email Spoofing & Phishing'
    ],
    'Mobile Theft/Loss': [
      'Smartphone Stolen at Transit Station',
      'Device Loss at Shopping Center',
      'Stolen Phone Unauthorised Access Attempt'
    ],
    'Online Harassment': [
      'Cyberstalking & Deepfake Photo Extortion',
      'Defamatory Online Threats via Messaging Apps',
      'Cyberbullying & Identity Defamation'
    ],
    'Social Media Crime': [
      'Hacked E-Commerce Brand Profile',
      'Impersonation Scam on Social Media',
      'Fake Giveaways & Profile Takeover'
    ],
    'Other Cybercrime': [
      'Overseas Job & Work Visa Scam',
      'Fake Scholarship Deposit Fraud',
      'Lottery Winnings Phishing Email'
    ]
  };

  const cases = [];
  const otpRecords = [];
  const statusHistory = [];

  // Generate 118 Solved Cases + 268 Active Cases = 386 Total
  for (let i = 1; i <= 386; i++) {
    const isSolved = i <= 118; // First 118 cases are Solved/Closed
    const status = isSolved
      ? solvedStatuses[i % solvedStatuses.length]
      : activeStatuses[(i - 118) % activeStatuses.length];

    const caseNumber = `CC-20260820-${1000 + i}`;
    const category = categories[i % categories.length];
    const priority = priorities[i % priorities.length];
    const assignedOfficer = officerIds[i % officerIds.length];

    const titleList = sampleTitles[category];
    const title = titleList[i % titleList.length];

    const lossAmount = category === 'Financial Fraud'
      ? Math.floor(85000 + ((i * 185000) % 2800000))
      : (i % 4 === 0 ? Math.floor(15000 + (i * 2500) % 45000) : 0);

    const dateOffset = (386 - i) * 4;
    const createdAt = new Date(Date.now() - dateOffset * 3600 * 1000);
    const incidentDate = new Date(createdAt.getTime() - 48 * 3600 * 1000);

    const citizenPhone = `+91 ${9876500000 + i}`;
    const citizenName = `Citizen ${i}`;

    const caseObj = {
      _id: `case_${1000 + i}`,
      caseNumber,
      category,
      title,
      description: `${title}. Reported incident details logged under case number ${caseNumber}. Full investigation evidence and audit trail verified.`,
      incidentDate,
      submittedAt: createdAt,
      status,
      priority,
      lossAmount,
      assignedOfficer,
      citizenData: {
        fullName: citizenName,
        phone: citizenPhone,
        email: `citizen${i}@example.com`,
        address: `Block ${i % 20 + 1}, Sector ${i % 15 + 1}, Metro Region`,
        idProofType: i % 2 === 0 ? 'Aadhaar Card' : 'PAN Card',
        idProofNumber: `XXXX-XXXX-${1000 + i}`
      },
      suspectDetails: {
        name: `Suspect Entity ${i}`,
        phone: `+91 91234 ${10000 + i}`,
        bankDetails: `HDFC Bank A/C ${501000000000 + i}`,
        urlOrHandle: `@fraud_handle_${i}`
      },
      createdAt,
      updatedAt: createdAt
    };

    cases.push(caseObj);

    otpRecords.push({
      _id: `otp_${1000 + i}`,
      caseNumber,
      phone: citizenPhone,
      otp: String(100000 + (i * 123456) % 900000),
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      isVerified: false,
      isUsed: false,
      attempts: 0,
      createdAt
    });

    statusHistory.push({
      _id: `hist_${1000 + i}`,
      caseNumber,
      status,
      remarks: isSolved ? 'Case investigation completed and finalized.' : 'Case open under investigation.',
      updatedByRole: 'OFFICER',
      updatedByOfficer: assignedOfficer,
      timestamp: createdAt
    });
  }

  return { cases, otpRecords, statusHistory };
}

async function seedSampleCases() {
  const { cases: sampleCases, otpRecords, statusHistory } = generate386Cases();

  store.cases = sampleCases;
  store.otp_records = otpRecords;
  store.case_status_history = statusHistory;

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
    console.log('[Seed Service] 386 Sample Cybercrime Cases (268 Active, 118 Solved) seeded into MongoDB.');
  }

  console.log('[Seed Service] 386 Sample Cybercrime Cases (268 Active, 118 Solved) seeded into In-Memory Store.');
}

module.exports = {
  seedOfficers,
  seedSampleCases
};
