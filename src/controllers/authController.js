const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const OtpRecord = require('../models/OtpRecord');
const Case = require('../models/Case');
const Officer = require('../models/Officer');
const { store } = require('../config/memoryDb');

const JWT_SECRET = process.env.JWT_SECRET || 'cybercrime_super_secret_jwt_key_2026';

/**
 * Stage 2: Citizen Authentication via Case Number & OTP
 * POST /api/auth/citizen/verify-otp
 */
exports.verifyCitizenOtp = async (req, res, next) => {
  try {
    const { caseNumber, otp } = req.body;

    if (!caseNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Case Registration Number and OTP are required.'
      });
    }

    const trimmedCaseNo = caseNumber.trim();
    const trimmedOtp = otp.trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    let otpRecord;
    let caseDoc;

    if (isMongoConnected) {
      otpRecord = await OtpRecord.findOne({ caseNumber: trimmedCaseNo }).sort({ createdAt: -1 });
      if (!otpRecord) {
        return res.status(404).json({ success: false, message: 'No OTP record found for this Case Registration Number.' });
      }

      if (new Date() > new Date(otpRecord.expiresAt)) {
        return res.status(400).json({ success: false, message: 'OTP has expired (10 mins validity).' });
      }

      if (otpRecord.attempts >= 3) {
        return res.status(400).json({ success: false, message: 'Maximum OTP verification attempts exceeded.' });
      }

      if (otpRecord.otp !== trimmedOtp) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        return res.status(401).json({ success: false, message: `Invalid OTP code. ${3 - otpRecord.attempts} attempt(s) remaining.` });
      }

      otpRecord.isVerified = true;
      await otpRecord.save();

      caseDoc = await Case.findOne({ caseNumber: trimmedCaseNo }).populate('citizen', 'fullName phone email');
      if (!caseDoc) {
        return res.status(404).json({ success: false, message: 'Case record not found.' });
      }

      const token = jwt.sign(
        { caseNumber: caseDoc.caseNumber, caseId: caseDoc._id, citizenId: caseDoc.citizen._id, role: 'citizen' },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Stage 2 Completed: Authentication successful!',
        token,
        data: { caseNumber: caseDoc.caseNumber, status: caseDoc.status, citizenName: caseDoc.citizen.fullName, phone: caseDoc.citizen.phone, role: 'citizen' }
      });

    } else {
      // In-Memory Fallback
      otpRecord = store.otp_records.filter(r => r.caseNumber === trimmedCaseNo).slice(-1)[0];
      if (!otpRecord) {
        return res.status(404).json({ success: false, message: 'No OTP record found for this Case Registration Number.' });
      }

      if (new Date() > new Date(otpRecord.expiresAt)) {
        return res.status(400).json({ success: false, message: 'OTP has expired (10 mins validity).' });
      }

      if (otpRecord.attempts >= 3) {
        return res.status(400).json({ success: false, message: 'Maximum OTP verification attempts exceeded.' });
      }

      if (otpRecord.otp !== trimmedOtp) {
        otpRecord.attempts += 1;
        return res.status(401).json({ success: false, message: `Invalid OTP code. ${3 - otpRecord.attempts} attempt(s) remaining.` });
      }

      otpRecord.isVerified = true;
      caseDoc = store.cases.find(c => c.caseNumber === trimmedCaseNo);
      if (!caseDoc) {
        return res.status(404).json({ success: false, message: 'Case record not found.' });
      }

      const token = jwt.sign(
        { caseNumber: caseDoc.caseNumber, caseId: caseDoc._id, citizenId: caseDoc.citizen, role: 'citizen' },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Stage 2 Completed: Authentication successful!',
        token,
        data: { caseNumber: caseDoc.caseNumber, status: caseDoc.status, citizenName: caseDoc.citizenData?.fullName || 'Citizen', phone: caseDoc.citizenData?.phone || '', role: 'citizen' }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Officer Authentication
 * POST /api/auth/officer/login
 */
exports.officerLogin = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Badge Number / Email and Password are required.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const isMongoConnected = mongoose.connection.readyState === 1;

    let officer;
    if (isMongoConnected) {
      officer = await Officer.findOne({ $or: [{ badgeNumber: identifier.trim() }, { email: cleanId }] });
    } else {
      officer = store.officers.find(o => o.badgeNumber === identifier.trim() || o.email.toLowerCase() === cleanId);
    }

    if (!officer) {
      return res.status(401).json({ success: false, message: 'Invalid Cybercrime Officer credentials.' });
    }

    const isMatch = await bcrypt.compare(password, officer.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Cybercrime Officer credentials.' });
    }

    const token = jwt.sign(
      { officerId: officer.officerId, id: officer._id, name: officer.name, badgeNumber: officer.badgeNumber, role: 'officer', officerRole: officer.role, department: officer.department },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Officer Login Successful!',
      token,
      data: { officerId: officer.officerId, name: officer.name, badgeNumber: officer.badgeNumber, role: 'officer', officerRole: officer.role, department: officer.department }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get current session info
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (req.user.role === 'citizen') {
      let caseDoc;
      if (isMongoConnected) {
        caseDoc = await Case.findOne({ caseNumber: req.user.caseNumber }).populate('citizen');
      } else {
        caseDoc = store.cases.find(c => c.caseNumber === req.user.caseNumber);
      }
      return res.status(200).json({ success: true, user: { role: 'citizen', caseNumber: req.user.caseNumber, citizen: caseDoc?.citizenData || caseDoc?.citizen, caseStatus: caseDoc?.status } });
    } else if (req.user.role === 'officer') {
      let officer;
      if (isMongoConnected) {
        officer = await Officer.findById(req.user.id).select('-passwordHash');
      } else {
        officer = store.officers.find(o => o._id === req.user.id || o.officerId === req.user.officerId);
      }
      return res.status(200).json({ success: true, user: { role: 'officer', officer } });
    }
    return res.status(400).json({ success: false, message: 'Unknown role session.' });
  } catch (error) {
    next(error);
  }
};
