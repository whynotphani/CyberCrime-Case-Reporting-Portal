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

  // Seed in-memory store
  store.officers = officersData;
  console.log('[Seed Service] In-memory officer accounts initialized.');

  // Seed 20 Sample Cybercrime Cases (Total loss: ₹ 2.06 Crores)
  await seedSampleCases();
}

async function seedSampleCases() {
  const sampleCases = [
    {
      _id: 'case_1001',
      caseNumber: 'CC-20260820-1001',
      category: 'Financial Fraud',
      title: 'Fake Stock Trading App Investment Fraud',
      description: 'Lured into fake institutional trading app promising 300% weekly returns. Deposited funds across multiple unknown beneficiary accounts. Fraudsters blocked communication when withdrawal was requested. Total loss ₹ 15,00,000.',
      lossAmount: 1500000,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-10'),
      submittedAt: new Date('2026-08-10T10:30:00Z'),
      createdAt: new Date('2026-08-10T10:30:00Z'),
      updatedAt: new Date('2026-08-19T14:20:00Z'),
      suspectDetails: {
        name: 'Apex Capital Fake Executive (Vikram Shah)',
        phone: '+91 91234 56789',
        bankDetails: 'HDFC A/C 501009182736 (IFSC HDFC0001029)',
        urlOrHandle: 'https://apex-vip-trading.app',
        otherInfo: 'Telegram Group: @Apex_Institutional_VIP'
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
      category: 'Financial Fraud',
      title: 'Corporate Business Email Compromise Wire Fraud',
      description: 'Attacker spoofed Managing Director email address and instructed finance manager to execute urgent vendor invoice clearance. Transfer sent to fraudulent bank account. Total loss ₹ 28,00,000.',
      lossAmount: 2800000,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-12'),
      submittedAt: new Date('2026-08-12T09:15:00Z'),
      createdAt: new Date('2026-08-12T09:15:00Z'),
      updatedAt: new Date('2026-08-19T11:00:00Z'),
      suspectDetails: {
        name: 'Spoofed Executive (md_office@techcorp-exec.site)',
        phone: '+91 98111 22334',
        bankDetails: 'ICICI A/C 9940192830 (IFSC ICIC0001029)',
        urlOrHandle: 'https://techcorp-exec.site',
        otherInfo: 'Wire Ref UTR: 994019283019'
      },
      citizenData: {
        fullName: 'Sneha Reddy',
        phone: '+91 98765 11002',
        email: 'sneha.reddy@techcorp.in'
      }
    },
    {
      _id: 'case_1003',
      caseNumber: 'CC-20260820-1003',
      category: 'Financial Fraud',
      title: 'Fake Crypto Mining & Wallet Drainer Scam',
      description: 'Connected Web3 USDT wallet to malicious decentralized mining pool site. Smart contract permission drained USDT balance instantly. Total loss ₹ 12,00,000.',
      lossAmount: 1200000,
      priority: 'HIGH',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-14'),
      submittedAt: new Date('2026-08-14T16:45:00Z'),
      createdAt: new Date('2026-08-14T16:45:00Z'),
      updatedAt: new Date('2026-08-18T12:30:00Z'),
      suspectDetails: {
        name: 'Web3 Drainer Operator',
        phone: 'N/A',
        bankDetails: 'Crypto Wallet: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        urlOrHandle: 'https://usdt-defi-pool.xyz',
        otherInfo: 'Transaction Hash: 0x3a9b2c...'
      },
      citizenData: {
        fullName: 'Rohan Sharma',
        phone: '+91 98765 11003',
        email: 'rohan.sharma@outlook.com'
      }
    },
    {
      _id: 'case_1004',
      caseNumber: 'CC-20260820-1004',
      category: 'Financial Fraud',
      title: 'Illegal Instant Loan App Extortion Fraud',
      description: 'Downloaded unauthorized loan app from web link. App accessed contact list and gallery. After micro loan disbursement, extortionists demanded 10x repayment and shared morphed photos with contacts. Total loss ₹ 8,50,000.',
      lossAmount: 850000,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_104',
      incidentDate: new Date('2026-08-05'),
      submittedAt: new Date('2026-08-05T14:10:00Z'),
      createdAt: new Date('2026-08-05T14:10:00Z'),
      updatedAt: new Date('2026-08-20T18:00:00Z'),
      suspectDetails: {
        name: 'QuickCash Loan Recovery Desk',
        phone: '+91 91234 00099',
        bankDetails: 'UPI ID: quickcash.pay@paytm',
        urlOrHandle: 'https://quickcash-loan.apk',
        otherInfo: 'WhatsApp harassment numbers: +91 91234 00098, +91 91234 00097'
      },
      citizenData: {
        fullName: 'Meera Nair',
        phone: '+91 98765 11004',
        email: 'meera.nair@yahoo.com'
      }
    },
    {
      _id: 'case_1005',
      caseNumber: 'CC-20260820-1005',
      category: 'Financial Fraud',
      title: 'Real Estate Property Token Advance Online Scam',
      description: 'Found online luxury flat rental listing on social media. Fake owner requested token deposit and security advance before site visit. Owner disappeared after payment. Total loss ₹ 35,00,000.',
      lossAmount: 3500000,
      priority: 'HIGH',
      status: 'VERIFICATION_PENDING',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-16'),
      submittedAt: new Date('2026-08-16T11:20:00Z'),
      createdAt: new Date('2026-08-16T11:20:00Z'),
      updatedAt: new Date('2026-08-16T11:20:00Z'),
      suspectDetails: {
        name: 'Fake Property Owner (Col. Devendra Singh)',
        phone: '+91 98450 12345',
        bankDetails: 'Axis Bank A/C 91802001928374 (IFSC UTIB0000123)',
        urlOrHandle: 'https://facebook.com/marketplace/item/84729104',
        otherInfo: 'Fake Army ID provided as proof'
      },
      citizenData: {
        fullName: 'Karan Malhotra',
        phone: '+91 98765 11005',
        email: 'karan.m@gmail.com'
      }
    },
    {
      _id: 'case_1006',
      caseNumber: 'CC-20260820-1006',
      category: 'Financial Fraud',
      title: 'SIM Swap & NetBanking High-Value Transfer Fraud',
      description: 'Fraudster requested duplicate SIM from telecom kiosk using forged Aadhaar. Deactivated victim mobile connection and intercepted OTPs to execute unauthorized bank transfers. Total loss ₹ 18,00,000.',
      lossAmount: 1800000,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-11'),
      submittedAt: new Date('2026-08-11T15:30:00Z'),
      createdAt: new Date('2026-08-11T15:30:00Z'),
      updatedAt: new Date('2026-08-17T10:00:00Z'),
      suspectDetails: {
        name: 'SIM Swap Operator Group',
        phone: '+91 97000 88899',
        bankDetails: 'State Bank of India A/C 30192837465 (IFSC SBIN0001234)',
        urlOrHandle: 'N/A',
        otherInfo: 'Telecom SIM Swap Request ID: TEL-884920'
      },
      citizenData: {
        fullName: 'Pooja Hegde',
        phone: '+91 98765 11006',
        email: 'pooja.hegde@hotmail.com'
      }
    },
    {
      _id: 'case_1007',
      caseNumber: 'CC-20260820-1007',
      category: 'Financial Fraud',
      title: 'Fake Franchise Deposit & Distribution Network Scam',
      description: 'Applied online for authorized EV Charging Station distributorship. Paid registration fee, agreement stamp duty, and equipment advance. Company site domain unregistered after payment. Total loss ₹ 22,00,000.',
      lossAmount: 2200000,
      priority: 'HIGH',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-08'),
      submittedAt: new Date('2026-08-08T13:45:00Z'),
      createdAt: new Date('2026-08-08T13:45:00Z'),
      updatedAt: new Date('2026-08-15T09:30:00Z'),
      suspectDetails: {
        name: 'GreenCharge EV Fake Director (Suresh Mehta)',
        phone: '+91 99887 76655',
        bankDetails: 'PNB A/C 084920194837 (IFSC PUNB0019283)',
        urlOrHandle: 'https://greencharge-ev-franchise.com',
        otherInfo: 'Fake GST Certificate provided'
      },
      citizenData: {
        fullName: 'Vikramaditya Verma',
        phone: '+91 98765 11007',
        email: 'vikram.verma@vkinfra.com'
      }
    },
    {
      _id: 'case_1008',
      caseNumber: 'CC-20260820-1008',
      category: 'Financial Fraud',
      title: 'E-Commerce Customs Duty Deposit Scam',
      description: 'Received WhatsApp call claiming high-value gift parcel held at Indira Gandhi International Airport Customs. Paid clearance taxes and penalty charges across 4 transfers. Total loss ₹ 14,00,000.',
      lossAmount: 1400000,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-09'),
      submittedAt: new Date('2026-08-09T18:00:00Z'),
      createdAt: new Date('2026-08-09T18:00:00Z'),
      updatedAt: new Date('2026-08-14T14:15:00Z'),
      suspectDetails: {
        name: 'Fake Customs Officer (Agent Mark Taylor)',
        phone: '+91 98199 44332',
        bankDetails: 'Canara Bank A/C 48291029384 (IFSC CNRB0004829)',
        urlOrHandle: 'N/A',
        otherInfo: 'Airway Bill No: AWB-99401928'
      },
      citizenData: {
        fullName: 'Ananya Deshmukh',
        phone: '+91 98765 11008',
        email: 'ananya.d@gmail.com'
      }
    },
    {
      _id: 'case_1009',
      caseNumber: 'CC-20260820-1009',
      category: 'Financial Fraud',
      title: 'Work From Home Task-Based Prepaid Telegram Scam',
      description: 'Approached on WhatsApp for part-time YouTube video rating job. Paid small initial profits, then trapped victim into high-tier prepaid crypto evaluation tasks. Total loss ₹ 25,00,000.',
      lossAmount: 2500000,
      priority: 'HIGH',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-07'),
      submittedAt: new Date('2026-08-07T12:00:00Z'),
      createdAt: new Date('2026-08-07T12:00:00Z'),
      updatedAt: new Date('2026-08-13T16:20:00Z'),
      suspectDetails: {
        name: 'Media Task Manager (Receptionist Tina)',
        phone: '+91 91234 55443',
        bankDetails: 'Kotak Mahindra A/C 8810293847 (IFSC KKBK0000881)',
        urlOrHandle: 'https://telegram.me/task_vip_portal',
        otherInfo: 'Merchant Transaction UPI: taskpay@ybl'
      },
      citizenData: {
        fullName: 'Siddharth Rao',
        phone: '+91 98765 11009',
        email: 'siddharth.rao@gmail.com'
      }
    },
    {
      _id: 'case_1010',
      caseNumber: 'CC-20260820-1010',
      category: 'Financial Fraud',
      title: 'Credit Card Limit Increase Phishing Scam',
      description: 'Received SMS for instant credit card limit upgrade. Clicked banking phishing portal and entered CVV & OTP. Fraudulent international transactions posted immediately. Total loss ₹ 9,50,000.',
      lossAmount: 950000,
      priority: 'HIGH',
      status: 'RESOLVED',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-04'),
      submittedAt: new Date('2026-08-04T10:15:00Z'),
      createdAt: new Date('2026-08-04T10:15:00Z'),
      updatedAt: new Date('2026-08-18T17:30:00Z'),
      suspectDetails: {
        name: 'Fake Bank Credit Card Manager',
        phone: '+91 97111 33221',
        bankDetails: 'International Merchant POS Gateway',
        urlOrHandle: 'https://card-limit-upgrade.site',
        otherInfo: 'Merchant dispute chargeback processed successfully'
      },
      citizenData: {
        fullName: 'Divya Iyer',
        phone: '+91 98765 11010',
        email: 'divya.iyer@yahoo.com'
      }
    },
    {
      _id: 'case_1011',
      caseNumber: 'CC-20260820-1011',
      category: 'Financial Fraud',
      title: 'Overnight Forex Trading Deposit Fraud',
      description: 'Lured by fake online forex broker offering 50x leverage on currency pairs. Account balance manipulated to show margin call liquidation when withdrawal requested. Total loss ₹ 13,00,000.',
      lossAmount: 1300000,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-03'),
      submittedAt: new Date('2026-08-03T14:50:00Z'),
      createdAt: new Date('2026-08-03T14:50:00Z'),
      updatedAt: new Date('2026-08-12T11:10:00Z'),
      suspectDetails: {
        name: 'Global Forex Trading Ltd',
        phone: '+91 98220 55667',
        bankDetails: 'Bank of Baroda A/C 29401928374 (IFSC BARB0COLABA)',
        urlOrHandle: 'https://globalfx-trader.com',
        otherInfo: 'Offshore portal registered in Seychelles'
      },
      citizenData: {
        fullName: 'Rajesh Sen',
        phone: '+91 98765 11011',
        email: 'rajesh.sen@gmail.com'
      }
    },
    {
      _id: 'case_1012',
      caseNumber: 'CC-20260820-1012',
      category: 'Non-Financial Cybercrime',
      title: 'Ransomware Attack & Data Encryption on Hospital Database',
      description: 'Hospital patient database encrypted by BlackCat ransomware via exposed RDP port. Medical records appended with .locked extension. Extortion demand left in README.txt.',
      lossAmount: 0,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-19'),
      submittedAt: new Date('2026-08-19T09:15:00Z'),
      createdAt: new Date('2026-08-19T09:15:00Z'),
      updatedAt: new Date('2026-08-19T11:00:00Z'),
      suspectDetails: {
        name: 'Attacker Alias: Shadow_Lock',
        phone: 'N/A',
        bankDetails: 'Extortion Demand: 2.5 BTC to wallet 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        urlOrHandle: '185.220.101.5',
        otherInfo: 'Affected System: Windows Server 2022 Healthcare Vault'
      },
      citizenData: {
        fullName: 'Dr. Suresh Joshi',
        phone: '+91 98765 11012',
        email: 'suresh.joshi@carehospital.org'
      }
    },
    {
      _id: 'case_1013',
      caseNumber: 'CC-20260820-1013',
      category: 'Non-Financial Cybercrime',
      title: 'Server Intrusion & Corporate Data Leak Threat',
      description: 'Unauthorized SSH root login detected on cloud infrastructure. Attacker exfiltrated proprietary customer source code and threatened public release on darkweb forums.',
      lossAmount: 0,
      priority: 'HIGH',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-15'),
      submittedAt: new Date('2026-08-15T20:30:00Z'),
      createdAt: new Date('2026-08-15T20:30:00Z'),
      updatedAt: new Date('2026-08-16T10:00:00Z'),
      suspectDetails: {
        name: 'Hacker Handle: NullPointer_X',
        phone: 'N/A',
        bankDetails: 'Extortion Demand: 5,000 Monero (XMR)',
        urlOrHandle: '194.26.29.112',
        otherInfo: 'Server audit logs and IP packet captures uploaded'
      },
      citizenData: {
        fullName: 'Nikhil Bansal',
        phone: '+91 98765 11013',
        email: 'nikhil.b@innovatech.io'
      }
    },
    {
      _id: 'case_1014',
      caseNumber: 'CC-20260820-1014',
      category: 'Mobile Theft/Loss',
      title: 'Smartphone Theft at Railway Station Platform',
      description: 'Apple iPhone 15 Pro snatched from hand while waiting at Visakhapatnam Railway Station Platform 2. Device powered off immediately. Telecom SIM block requested.',
      lossAmount: 0,
      priority: 'MEDIUM',
      status: 'ADDITIONAL_INFO_REQUIRED',
      assignedOfficer: 'off_103',
      incidentDate: new Date('2026-08-17'),
      submittedAt: new Date('2026-08-17T16:45:00Z'),
      createdAt: new Date('2026-08-17T16:45:00Z'),
      updatedAt: new Date('2026-08-18T12:30:00Z'),
      suspectDetails: {
        name: 'Apple iPhone 15 Pro (Black Titanium)',
        phone: '+91 98765 11014 (Jio)',
        bankDetails: 'IMEI 1: 358920194820194, IMEI 2: 358920194820195',
        urlOrHandle: 'Last Location: Visakhapatnam Railway Station Platform 2',
        otherInfo: 'Box & Original Invoice attached'
      },
      citizenData: {
        fullName: 'Tarun Saxena',
        phone: '+91 98765 11014',
        email: 'tarun.saxena@gmail.com'
      }
    },
    {
      _id: 'case_1015',
      caseNumber: 'CC-20260820-1015',
      category: 'Mobile Theft/Loss',
      title: 'Stolen Flagship Smartphone at Shopping Mall',
      description: 'Samsung Galaxy S24 Ultra stolen from coat pocket while inside food court. Device last pinged at city bus terminal before location services turned off.',
      lossAmount: 0,
      priority: 'MEDIUM',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_103',
      incidentDate: new Date('2026-08-13'),
      submittedAt: new Date('2026-08-13T19:20:00Z'),
      createdAt: new Date('2026-08-13T19:20:00Z'),
      updatedAt: new Date('2026-08-14T09:00:00Z'),
      suspectDetails: {
        name: 'Samsung Galaxy S24 Ultra (Titanium Gray)',
        phone: '+91 98765 11015 (Airtel)',
        bankDetails: 'IMEI 1: 864291048573920, IMEI 2: 864291048573921',
        urlOrHandle: 'Last Location: Central Mall Food Court',
        otherInfo: 'Police Lost Article FIR registered'
      },
      citizenData: {
        fullName: 'Kavita Sharma',
        phone: '+91 98765 11015',
        email: 'kavita.sharma@yahoo.in'
      }
    },
    {
      _id: 'case_1016',
      caseNumber: 'CC-20260820-1016',
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
        fullName: 'Shruti Das',
        phone: '+91 98765 11016',
        email: 'shruti.das@gmail.com'
      }
    },
    {
      _id: 'case_1017',
      caseNumber: 'CC-20260820-1017',
      category: 'Online Harassment',
      title: 'Persistent Defamatory Abuse & Threats via Telegram',
      description: 'Targeted with abusive, defamatory messages and death threats across multiple anonymous Telegram channels. Stalker posted victim personal phone number online.',
      lossAmount: 0,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_104',
      incidentDate: new Date('2026-08-14'),
      submittedAt: new Date('2026-08-14T11:45:00Z'),
      createdAt: new Date('2026-08-14T11:45:00Z'),
      updatedAt: new Date('2026-08-17T15:30:00Z'),
      suspectDetails: {
        name: 'Telegram User ID: @anon_threat_actor',
        phone: '+91 91100 22334',
        bankDetails: 'Platform: Telegram | Sub-Type: Cyberstalking & Defamation',
        urlOrHandle: 'https://t.me/anon_threat_actor',
        otherInfo: 'Exported chat history with timestamps attached'
      },
      citizenData: {
        fullName: 'Amitabh Choudhury',
        phone: '+91 98765 11017',
        email: 'amitabh.c@outlook.com'
      }
    },
    {
      _id: 'case_1018',
      caseNumber: 'CC-20260820-1018',
      category: 'Social Media Crime',
      title: 'Impersonation Profile Fraud on Facebook',
      description: 'Fraudster created duplicate Facebook profile using victim name and pictures. Sent emergency money request messages to victim friends and relatives.',
      lossAmount: 0,
      priority: 'MEDIUM',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'off_104',
      incidentDate: new Date('2026-08-10'),
      submittedAt: new Date('2026-08-10T16:00:00Z'),
      createdAt: new Date('2026-08-10T16:00:00Z'),
      updatedAt: new Date('2026-08-12T14:00:00Z'),
      suspectDetails: {
        name: 'Victim Account: Rajesh_Kumar_Real',
        phone: 'N/A',
        bankDetails: 'Target Platform: Facebook | Incident Type: Impersonation Profile Created',
        urlOrHandle: 'https://facebook.com/profile.php?id=99401928374',
        otherInfo: 'Meta platform takedown report filed'
      },
      citizenData: {
        fullName: 'Rajesh Pillai',
        phone: '+91 98765 11018',
        email: 'rajesh.pillai@gmail.com'
      }
    },
    {
      _id: 'case_1019',
      caseNumber: 'CC-20260820-1019',
      category: 'Social Media Crime',
      title: 'Hacked Business Brand Account on Instagram',
      description: 'E-commerce brand account with 85,000 followers hacked via phishing email. Attacker changed recovery email, password, and posted fake giveaway cryptocurrency scam.',
      lossAmount: 0,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_104',
      incidentDate: new Date('2026-08-16'),
      submittedAt: new Date('2026-08-16T08:30:00Z'),
      createdAt: new Date('2026-08-16T08:30:00Z'),
      updatedAt: new Date('2026-08-18T10:15:00Z'),
      suspectDetails: {
        name: 'Hacked Handle: @luxe_craft_official',
        phone: 'N/A',
        bankDetails: 'Target Platform: Instagram | Incident Type: Account Hacked / Access Lost',
        urlOrHandle: 'https://instagram.com/luxe_craft_official',
        otherInfo: 'Original ownership documents & domain verification attached'
      },
      citizenData: {
        fullName: 'Ritu Kapoor',
        phone: '+91 98765 11019',
        email: 'ritu.k@luxecraft.com'
      }
    },
    {
      _id: 'case_1020',
      caseNumber: 'CC-20260820-1020',
      category: 'Other Cybercrime',
      title: 'Fake Overseas Job & Work Visa Scam',
      description: 'Offered software engineer job in Canada via LinkedIn. Paid medical test fees, embassy visa processing fees, and work permit charges to fake agency. Total loss ₹ 6,00,000.',
      lossAmount: 600000,
      priority: 'HIGH',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-06'),
      submittedAt: new Date('2026-08-06T15:00:00Z'),
      createdAt: new Date('2026-08-06T15:00:00Z'),
      updatedAt: new Date('2026-08-11T13:45:00Z'),
      suspectDetails: {
        name: 'Canada Careers HR Overseas Agency',
        phone: '+91 98777 44332',
        bankDetails: 'Union Bank A/C 58492019483 (IFSC UBIN0005849)',
        urlOrHandle: 'https://canada-careers-visa.site',
        otherInfo: 'Fake offer letter with forged Canadian embassy stamp'
      },
      citizenData: {
        fullName: 'Gautam Nambiar',
        phone: '+91 98765 11020',
        email: 'gautam.nambiar@gmail.com'
      }
    }
  ];

  store.cases = sampleCases;
  
  // Seed OTP records for all 20 citizens
  store.otp_records = sampleCases.map((c, idx) => ({
    _id: `otp_${1001 + idx}`,
    caseNumber: c.caseNumber,
    phone: c.citizenData.phone,
    otp: String(123456 + idx * 11111).slice(0, 6),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isVerified: false,
    isUsed: false,
    attempts: 0,
    createdAt: new Date()
  }));

  // Seed status history for all 20 cases
  store.case_status_history = sampleCases.map((c, idx) => ({
    _id: `hist_${1001 + idx}`,
    caseNumber: c.caseNumber,
    status: c.status,
    remarks: `Case status updated to ${c.status.replace(/_/g, ' ')} by assigned officer.`,
    updatedByRole: 'OFFICER',
    updatedByOfficer: c.assignedOfficer,
    timestamp: c.updatedAt
  }));

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
    console.log('[Seed Service] 20 Sample Cybercrime Cases seeded into MongoDB.');
  }

  console.log('[Seed Service] 20 Sample Cybercrime Cases seeded into In-Memory Store.');
}

module.exports = {
  seedOfficers,
  seedSampleCases
};
