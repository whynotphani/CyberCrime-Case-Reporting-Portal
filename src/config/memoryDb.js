/**
 * CyberCrime Portal - Hybrid In-Memory & MongoDB Store
 * Ensures the college mini-project runs seamlessly whether MongoDB service is running or offline!
 */

const bcrypt = require('bcryptjs');

// In-Memory Data Store Collections
const store = {
  citizens: [],
  cases: [],
  officers: [],
  otp_records: [],
  evidence: [],
  case_status_history: []
};

// Seed default officers into in-memory store
async function seedMemoryOfficers() {
  if (store.officers.length > 0) return;

  const defaultPassword = 'password123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  store.officers = [
    {
      _id: 'off_101',
      officerId: 'OFF-101',
      name: 'Inspector Rajesh Kumar',
      badgeNumber: 'CYBER-8841',
      email: 'rajesh.kumar@cyber.gov.in',
      passwordHash: passwordHash,
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
      passwordHash: passwordHash,
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
      passwordHash: passwordHash,
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
      passwordHash: passwordHash,
      role: 'INVESTIGATING_OFFICER',
      department: 'Social Media & Harassment Cell',
      createdAt: new Date()
    }
  ];
}

// Auto-seed in-memory store on module load
seedMemoryOfficers();

module.exports = {
  store,
  seedMemoryOfficers
};

