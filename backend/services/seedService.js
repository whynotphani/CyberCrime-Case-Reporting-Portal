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

  // Seed 20 Cybercrime Cases
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
      category: 'Online Harassment',
      title: 'Blackmail and Extortion via Morphed Photos',
      description: 'Victim was contacted on WhatsApp by unknown number demanding ₹50,000 threatening to leak edited morphed photographs to social contacts.',
      lossAmount: 15000,
      priority: 'HIGH',
      status: 'ASSIGNED',
      assignedOfficer: 'off_104',
      incidentDate: new Date('2026-08-19'),
      submittedAt: new Date('2026-08-19T08:15:00Z'),
      createdAt: new Date('2026-08-19T08:15:00Z'),
      updatedAt: new Date('2026-08-19T11:00:00Z'),
      suspectDetails: {
        name: 'Unknown Blackmailer',
        phone: '+91 99887 76655',
        bankDetails: '',
        urlOrHandle: 'Telegram @cyber_extort_99',
        otherInfo: 'Payment demanded via Crypto Tether USDT wallet'
      },
      citizenData: {
        fullName: 'Sanya Malhotra',
        phone: '+91 98765 11002',
        email: 'sanya.m@outlook.com'
      }
    },
    {
      _id: 'case_1003',
      caseNumber: 'CC-20260820-1003',
      category: 'Social Media Crime',
      title: 'Instagram Account Hacked and Used for Forex Scam',
      description: 'Instagram account with 25k followers hacked via phishing link. Hacker changed recovery email and started posting fake bitcoin investment stories asking followers to send money.',
      lossAmount: 0,
      priority: 'MEDIUM',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'off_104',
      incidentDate: new Date('2026-08-17'),
      submittedAt: new Date('2026-08-17T16:45:00Z'),
      createdAt: new Date('2026-08-17T16:45:00Z'),
      updatedAt: new Date('2026-08-18T09:30:00Z'),
      suspectDetails: {
        name: 'Ig Hacker Proxy',
        phone: '',
        bankDetails: '',
        urlOrHandle: '@rohan_mehta_official (Hacked Handle)',
        otherInfo: 'Attacker IP traced to Eastern Europe proxy'
      },
      citizenData: {
        fullName: 'Rohan Mehta',
        phone: '+91 98765 11003',
        email: 'rohan.mehta.creator@gmail.com'
      }
    },
    {
      _id: 'case_1004',
      caseNumber: 'CC-20260820-1004',
      category: 'Financial Fraud',
      title: 'Work From Home Telegram Task Fraud (Part-Time YouTube Like Scam)',
      description: 'Joined Telegram group promising ₹5,000/day for liking YouTube videos. Was lured into prepaid investment tasks. Deposited ₹1,85,000 but withdrawal was blocked demanding more fees.',
      lossAmount: 185000,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-15'),
      submittedAt: new Date('2026-08-15T12:00:00Z'),
      createdAt: new Date('2026-08-15T12:00:00Z'),
      updatedAt: new Date('2026-08-16T15:10:00Z'),
      suspectDetails: {
        name: 'Global Media Tasks Admin',
        phone: '+91 90123 45678',
        bankDetails: 'Federal Bank A/C 7720193821',
        urlOrHandle: 'Telegram T.me/youtube_task_reward_vip',
        otherInfo: 'Fake SEBI registration document provided'
      },
      citizenData: {
        fullName: 'Vikramaditya Rao',
        phone: '+91 98765 11004',
        email: 'vikram.rao@yahoo.com'
      }
    },
    {
      _id: 'case_1005',
      caseNumber: 'CC-20260820-1005',
      category: 'Mobile Theft/Loss',
      title: 'Stolen Smartphone Used for Unauthorized Bank Transfers',
      description: 'Mobile phone stolen on metro train. Thief bypassed lock screen, intercepted OTPs, and transferred ₹92,000 from PhonePe app.',
      lossAmount: 92000,
      priority: 'HIGH',
      status: 'ASSIGNED',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-19'),
      submittedAt: new Date('2026-08-19T14:30:00Z'),
      createdAt: new Date('2026-08-19T14:30:00Z'),
      updatedAt: new Date('2026-08-20T09:00:00Z'),
      suspectDetails: {
        name: 'Metro Thief Group',
        phone: '+91 98765 11005 (Victim SIM hijacked)',
        bankDetails: 'Beneficiary Paytm Bank A/C 919876543210',
        urlOrHandle: '',
        otherInfo: 'Device IMEI: 864920192830192'
      },
      citizenData: {
        fullName: 'Kavita Sundaram',
        phone: '+91 98765 11005',
        email: 'kavita.sun@gmail.com'
      }
    },
    {
      _id: 'case_1006',
      caseNumber: 'CC-20260820-1006',
      category: 'Non-Financial Cybercrime',
      title: 'Ransomware Cyberattack on Small Diagnostic Lab Network',
      description: 'Diagnostic center database encrypted by LockBit ransomware payload via suspicious email attachment. Hackers demanding 0.5 BTC ransom.',
      lossAmount: 0,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-16'),
      submittedAt: new Date('2026-08-16T09:00:00Z'),
      createdAt: new Date('2026-08-16T09:00:00Z'),
      updatedAt: new Date('2026-08-17T11:45:00Z'),
      suspectDetails: {
        name: 'LockBit3.0 Ransomware Group',
        phone: '',
        bankDetails: '',
        urlOrHandle: 'TOR (.onion) portal link in ransom.txt',
        otherInfo: 'Malware hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      },
      citizenData: {
        fullName: 'Dr. Suresh Nambiar',
        phone: '+91 98765 11006',
        email: 'director@citydiagnostics.org'
      }
    },
    {
      _id: 'case_1007',
      caseNumber: 'CC-20260820-1007',
      category: 'Financial Fraud',
      title: 'Fake Credit Card Reward Points Redemption Fraud',
      description: 'Received automated IVR call claiming Axis Bank credit card reward points expiring. Entered card number, CVV, and OTP on fake website. Lost ₹38,000.',
      lossAmount: 38000,
      priority: 'MEDIUM',
      status: 'SUBMITTED',
      assignedOfficer: null,
      incidentDate: new Date('2026-08-20'),
      submittedAt: new Date('2026-08-20T08:00:00Z'),
      createdAt: new Date('2026-08-20T08:00:00Z'),
      updatedAt: new Date('2026-08-20T08:00:00Z'),
      suspectDetails: {
        name: 'IVR Scam Operator',
        phone: '+91 14092 38192',
        bankDetails: '',
        urlOrHandle: 'http://axis-points-redeem.com',
        otherInfo: 'Merchant Name: PayU*GamingOnline'
      },
      citizenData: {
        fullName: 'Ananya Deshmukh',
        phone: '+91 98765 11007',
        email: 'ananya.d@gmail.com'
      }
    },
    {
      _id: 'case_1008',
      caseNumber: 'CC-20260820-1008',
      category: 'Social Media Crime',
      title: 'Corporate Facebook Page Hacking & Defacement',
      description: 'Official verified Facebook page of local retail chain compromised. Admin privileges removed and unauthorized objectionable content posted.',
      lossAmount: 0,
      priority: 'MEDIUM',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'off_104',
      incidentDate: new Date('2026-08-18'),
      submittedAt: new Date('2026-08-18T18:30:00Z'),
      createdAt: new Date('2026-08-18T18:30:00Z'),
      updatedAt: new Date('2026-08-19T10:15:00Z'),
      suspectDetails: {
        name: 'Meta Page Hacker',
        phone: '',
        bankDetails: '',
        urlOrHandle: 'facebook.com/agarwalretails',
        otherInfo: 'Hacker email added: admin_root_x@protonmail.com'
      },
      citizenData: {
        fullName: 'Manish Agarwal',
        phone: '+91 98765 11008',
        email: 'm.agarwal@agarwalretails.in'
      }
    },
    {
      _id: 'case_1009',
      caseNumber: 'CC-20260820-1009',
      category: 'Financial Fraud',
      title: 'OLX Armed Forces Officer Pre-payment Fraud',
      description: 'Buyer on OLX posing as an Army Officer agreed to purchase sofa set. Sent QR code claiming it would credit money, but it debited ₹24,000.',
      lossAmount: 24000,
      priority: 'MEDIUM',
      status: 'RESOLVED',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-14'),
      submittedAt: new Date('2026-08-14T11:20:00Z'),
      createdAt: new Date('2026-08-14T11:20:00Z'),
      updatedAt: new Date('2026-08-16T16:00:00Z'),
      suspectDetails: {
        name: 'Capt. Vikram Sharma (Fake Identity)',
        phone: '+91 97112 23344',
        bankDetails: 'Airtel Payments Bank A/C 9711223344',
        urlOrHandle: '',
        otherInfo: 'Used forged CSD Canteen ID card'
      },
      citizenData: {
        fullName: 'Deepak Joshi',
        phone: '+91 98765 11009',
        email: 'deepak.joshi88@gmail.com'
      }
    },
    {
      _id: 'case_1010',
      caseNumber: 'CC-20260820-1010',
      category: 'Online Harassment',
      title: 'Cyberstalking & Persistent Threats on LinkedIn',
      description: 'Former employee creating multiple fake LinkedIn profiles to post defamatory comments and send threatening direct messages to company executives.',
      lossAmount: 0,
      priority: 'MEDIUM',
      status: 'ADDITIONAL_INFO_REQUIRED',
      assignedOfficer: 'off_104',
      incidentDate: new Date('2026-08-15'),
      submittedAt: new Date('2026-08-15T15:00:00Z'),
      createdAt: new Date('2026-08-15T15:00:00Z'),
      updatedAt: new Date('2026-08-17T13:20:00Z'),
      suspectDetails: {
        name: 'Suspected Ex-employee',
        phone: '',
        bankDetails: '',
        urlOrHandle: 'linkedin.com/in/fake-recruiter-99',
        otherInfo: 'IP log screenshots attached'
      },
      citizenData: {
        fullName: 'Meera Sengupta',
        phone: '+91 98765 11010',
        email: 'meera.s@techinnovations.io'
      }
    },
    {
      _id: 'case_1011',
      caseNumber: 'CC-20260820-1011',
      category: 'Financial Fraud',
      title: 'Crypto Trading Platform Pig Butchering Scam',
      description: 'Victim befriended on matrimony app and convinced to invest savings in fake crypto trading exchange BitMaxFX. Deposited ₹12,50,000.',
      lossAmount: 1250000,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-10'),
      submittedAt: new Date('2026-08-10T10:00:00Z'),
      createdAt: new Date('2026-08-10T10:00:00Z'),
      updatedAt: new Date('2026-08-12T14:00:00Z'),
      suspectDetails: {
        name: 'Dr. Katherine (Fake Profile)',
        phone: '',
        bankDetails: 'Multi-tiered mule accounts in Yes Bank & HDFC',
        urlOrHandle: 'https://bitmax-fx-invest.com',
        otherInfo: 'Funds moved to Binance wallet 0x71C...3a9'
      },
      citizenData: {
        fullName: 'Praveen Kumar Reddy',
        phone: '+91 98765 11011',
        email: 'praveen.reddy@gmail.com'
      }
    },
    {
      _id: 'case_1012',
      caseNumber: 'CC-20260820-1012',
      category: 'Mobile Theft/Loss',
      title: 'SIM Swap Fraud & Unauthorized OTP Interception',
      description: 'Victim mobile network suddenly lost signal. Fraudsters executed duplicate SIM swap at retail store and siphoned ₹3,10,000 from bank account.',
      lossAmount: 310000,
      priority: 'HIGH',
      status: 'ASSIGNED',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-17'),
      submittedAt: new Date('2026-08-17T11:00:00Z'),
      createdAt: new Date('2026-08-17T11:00:00Z'),
      updatedAt: new Date('2026-08-18T16:30:00Z'),
      suspectDetails: {
        name: 'SIM Swap Syndicate',
        phone: '+91 98765 11012 (Swapped SIM)',
        bankDetails: 'Canara Bank A/C 11928301923',
        urlOrHandle: '',
        otherInfo: 'SIM swapped at local outlet without physical verification'
      },
      citizenData: {
        fullName: 'Sunil Dutt Pandey',
        phone: '+91 98765 11012',
        email: 'sunildutt@yahoo.co.in'
      }
    },
    {
      _id: 'case_1013',
      caseNumber: 'CC-20260820-1013',
      category: 'Other Cybercrime',
      title: 'Fake AnyDesk Remote Desktop Technical Support Scam',
      description: 'Called fake customer care number for broadband refund. Scam operator instructed caller to install AnyDesk and captured bank credentials. Lost ₹78,000.',
      lossAmount: 78000,
      priority: 'HIGH',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-19'),
      submittedAt: new Date('2026-08-19T17:00:00Z'),
      createdAt: new Date('2026-08-19T17:00:00Z'),
      updatedAt: new Date('2026-08-20T10:00:00Z'),
      suspectDetails: {
        name: 'Tech Support Executive',
        phone: '+91 1800-FAKE-888',
        bankDetails: '',
        urlOrHandle: '',
        otherInfo: 'AnyDesk Address: 928 301 928'
      },
      citizenData: {
        fullName: 'Geeta Ramachandran',
        phone: '+91 98765 11013',
        email: 'geeta.ram@gmail.com'
      }
    },
    {
      _id: 'case_1014',
      caseNumber: 'CC-20260820-1014',
      category: 'Social Media Crime',
      title: 'WhatsApp Loan App Nude Contact List Harassment',
      description: 'Downloaded illegal instant loan app FastCash. After 1 day delay in EMI, app agents accessed full contact list and sent morphed nude photos to family contacts.',
      lossAmount: 8000,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_104',
      incidentDate: new Date('2026-08-18'),
      submittedAt: new Date('2026-08-18T13:40:00Z'),
      createdAt: new Date('2026-08-18T13:40:00Z'),
      updatedAt: new Date('2026-08-19T11:20:00Z'),
      suspectDetails: {
        name: 'FastCash Loan Recovery Agent',
        phone: '+91 88990 11223',
        bankDetails: '',
        urlOrHandle: 'WhatsApp Business API +91 88990 11223',
        otherInfo: 'App APK downloaded from third-party link'
      },
      citizenData: {
        fullName: 'Abhinav Saxena',
        phone: '+91 98765 11014',
        email: 'abhinav.saxena@gmail.com'
      }
    },
    {
      _id: 'case_1015',
      caseNumber: 'CC-20260820-1015',
      category: 'Financial Fraud',
      title: 'E-Commerce Franchise Dealership Cyber Fraud',
      description: 'Applied for distributorship on fake website impersonating Flipkart Logistics. Paid ₹4,50,000 as security deposit & registration fee.',
      lossAmount: 450000,
      priority: 'HIGH',
      status: 'ASSIGNED',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-12'),
      submittedAt: new Date('2026-08-12T15:15:00Z'),
      createdAt: new Date('2026-08-12T15:15:00Z'),
      updatedAt: new Date('2026-08-14T09:30:00Z'),
      suspectDetails: {
        name: 'Flipkart Franchise Manager (Fake)',
        phone: '+91 93344 55667',
        bankDetails: 'Axis Bank A/C 98102938102',
        urlOrHandle: 'https://flipkart-logistics-dealership.in',
        otherInfo: ''
      },
      citizenData: {
        fullName: 'Venkatesh Iyer',
        phone: '+91 98765 11015',
        email: 'venky.iyer@gmail.com'
      }
    },
    {
      _id: 'case_1016',
      caseNumber: 'CC-20260820-1016',
      category: 'Non-Financial Cybercrime',
      title: 'Educational Institute Website Database SQL Injection & Defacement',
      description: 'College website hacked by cyber group AnonGhost. Student portal database leaked and homepage defaced with political messages.',
      lossAmount: 0,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-13'),
      submittedAt: new Date('2026-08-13T20:00:00Z'),
      createdAt: new Date('2026-08-13T20:00:00Z'),
      updatedAt: new Date('2026-08-14T14:45:00Z'),
      suspectDetails: {
        name: 'AnonGhost Hacker Group',
        phone: '',
        bankDetails: '',
        urlOrHandle: 'citycollege.edu.in',
        otherInfo: 'Defacement mirror archived on Zone-H'
      },
      citizenData: {
        fullName: 'Prof. Harish Chandra',
        phone: '+91 98765 11016',
        email: 'ithead@citycollege.edu.in'
      }
    },
    {
      _id: 'case_1017',
      caseNumber: 'CC-20260820-1017',
      category: 'Financial Fraud',
      title: 'Electricity Bill Disconnection SMS Phishing',
      description: 'Received SMS: Electricity bill unpaid. Power disconnected tonight at 9:30 PM. Call officer immediately. Paid ₹15 via link, account debited ₹52,000.',
      lossAmount: 52000,
      priority: 'MEDIUM',
      status: 'RESOLVED',
      assignedOfficer: 'off_101',
      incidentDate: new Date('2026-08-11'),
      submittedAt: new Date('2026-08-11T09:30:00Z'),
      createdAt: new Date('2026-08-11T09:30:00Z'),
      updatedAt: new Date('2026-08-13T17:00:00Z'),
      suspectDetails: {
        name: 'Power Board Officer (Fake)',
        phone: '+91 92830 19283',
        bankDetails: 'State Bank of India A/C 2019283019',
        urlOrHandle: '',
        otherInfo: 'Payment gateway link via Razorpay fake merchant'
      },
      citizenData: {
        fullName: 'Lata Bajpai',
        phone: '+91 98765 11017',
        email: 'lata.b@gmail.com'
      }
    },
    {
      _id: 'case_1018',
      caseNumber: 'CC-20260820-1018',
      category: 'Other Cybercrime',
      title: 'Matrimony Portal Fake Bride Groom Extortion',
      description: 'Victim matched on Shaadi.com with user claiming to be NRI Doctor in London. Scammer claimed custom package stuck at Delhi airport and extracted ₹2,10,000 as custom clearance fee.',
      lossAmount: 210000,
      priority: 'HIGH',
      status: 'UNDER_INVESTIGATION',
      assignedOfficer: 'off_104',
      incidentDate: new Date('2026-08-09'),
      submittedAt: new Date('2026-08-09T14:10:00Z'),
      createdAt: new Date('2026-08-09T14:10:00Z'),
      updatedAt: new Date('2026-08-11T12:00:00Z'),
      suspectDetails: {
        name: 'Dr. Alexander Wright (Fake Profile)',
        phone: '+44 7911 123456',
        bankDetails: 'Kotak Mahindra Bank A/C 5520192830',
        urlOrHandle: '',
        otherInfo: 'Custom Officer imposter phone +91 91122 33445'
      },
      citizenData: {
        fullName: 'Shruti Kulkarni',
        phone: '+91 98765 11018',
        email: 'shruti.kulkarni@gmail.com'
      }
    },
    {
      _id: 'case_1019',
      caseNumber: 'CC-20260820-1019',
      category: 'Financial Fraud',
      title: 'Fake PM-Kisan Subsidy Yojana WhatsApp Link Fraud',
      description: 'Clicking on viral WhatsApp link promising ₹6,000 government grant installed malicious APK that forwarded all SMS messages including banking OTPs. Lost ₹35,000.',
      lossAmount: 35000,
      priority: 'MEDIUM',
      status: 'SUBMITTED',
      assignedOfficer: null,
      incidentDate: new Date('2026-08-20'),
      submittedAt: new Date('2026-08-20T11:00:00Z'),
      createdAt: new Date('2026-08-20T11:00:00Z'),
      updatedAt: new Date('2026-08-20T11:00:00Z'),
      suspectDetails: {
        name: 'Subsidy Scam Link Generator',
        phone: '',
        bankDetails: '',
        urlOrHandle: 'http://pm-kisan-yojana-grant.online',
        otherInfo: 'Malicious Android package: pm_kisan_v2.apk'
      },
      citizenData: {
        fullName: 'Raghunath Yadav',
        phone: '+91 98765 11019',
        email: 'raghu.yadav@gmail.com'
      }
    },
    {
      _id: 'case_1020',
      caseNumber: 'CC-20260820-1020',
      category: 'Non-Financial Cybercrime',
      title: 'Corporate Email Compromise (BEC) Wire Transfer Attempt',
      description: 'Attacker spoofed CEO email address sending instructions to Senior Accounts Manager to urgently wire ₹8,50,000 to new vendor bank account.',
      lossAmount: 0,
      priority: 'HIGH',
      status: 'RESOLVED',
      assignedOfficer: 'off_701',
      incidentDate: new Date('2026-08-08'),
      submittedAt: new Date('2026-08-08T16:00:00Z'),
      createdAt: new Date('2026-08-08T16:00:00Z'),
      updatedAt: new Date('2026-08-10T10:15:00Z'),
      suspectDetails: {
        name: 'Spoofed CEO Alias',
        phone: '',
        bankDetails: 'IndusInd Bank A/C 1009283019',
        urlOrHandle: 'ceo-office@globa1ventures.com (Typosquatting domain)',
        otherInfo: 'Email headers reveal origin IP in West Africa'
      },
      citizenData: {
        fullName: 'Siddharth Varma',
        phone: '+91 98765 11020',
        email: 'siddharth@globalventures.com'
      }
    }
  ];

  store.cases = sampleCases;

  if (mongoose.connection.readyState === 1) {
    for (const c of sampleCases) {
      // Find or create citizen
      let citizenDoc = await Citizen.findOne({ phone: c.citizenData.phone });
      if (!citizenDoc) {
        citizenDoc = await Citizen.create({
          fullName: c.citizenData.fullName,
          phone: c.citizenData.phone,
          email: c.citizenData.email,
          caseNumber: c.caseNumber
        });
      }

      // Find officer doc
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
    console.log('[Seed Service] 20 Cybercrime Cases seeded into MongoDB.');
  }

  console.log('[Seed Service] 20 Cybercrime Cases seeded into In-Memory Store.');
}

module.exports = {
  seedOfficers,
  seedSampleCases
};
