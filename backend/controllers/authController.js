const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const OtpRecord = require('../models/OtpRecord');
const Case = require('../models/Case');
const Officer = require('../models/Officer');
const { store } = require('../config/memoryDb');

const JWT_SECRET = process.env.JWT_SECRET || 'cybercrime_super_secret_jwt_key_2026';

/**
 * STAGE 2: Citizen Authentication via Case Registration Number & OTP
 * POST /api/auth/citizen/verify-otp
 */
exports.verifyCitizenOtp = async (req, res, next) => {
  try {
    const { caseNumber, otp } = req.body;

    // Validation
    if (!caseNumber || !otp || typeof caseNumber !== 'string' || typeof otp !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid Case Registration Number and OTP code strings are required.'
      });
    }

    const trimmedCaseNo = caseNumber.trim();
    const trimmedOtp = otp.trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    let caseDoc;
    let otpRecord;

    if (isMongoConnected) {
      // 1. Find Case
      caseDoc = await Case.findOne({ caseNumber: trimmedCaseNo }).populate('citizen', 'fullName phone email');
      if (!caseDoc) {
        return res.status(404).json({
          success: false,
          message: 'Case Registration Number not found in system. Please verify your registration.'
        });
      }

      // 2. Find OTP Record
      otpRecord = await OtpRecord.findOne({ caseNumber: trimmedCaseNo }).sort({ createdAt: -1 });
      if (!otpRecord) {
        return res.status(404).json({
          success: false,
          message: 'No OTP record found for this Case Registration Number.'
        });
      }

      // 3. Prevent OTP Reuse
      if (otpRecord.isUsed || otpRecord.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'This OTP has already been used. Please request a new OTP via Helpline 1930.'
        });
      }

      // 4. Check OTP Expiration
      if (new Date() > new Date(otpRecord.expiresAt)) {
        return res.status(400).json({
          success: false,
          message: 'OTP has expired (10-minute validity). Please request a new verification code.'
        });
      }

      // 5. Prevent Unlimited Attempts (Max 3)
      if (otpRecord.attempts >= 3) {
        return res.status(400).json({
          success: false,
          message: 'Maximum OTP verification attempts (3) exceeded. Please contact Helpline 1930.'
        });
      }

      // 6. Verify OTP Match
      if (otpRecord.otp !== trimmedOtp) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remaining = 3 - otpRecord.attempts;
        return res.status(401).json({
          success: false,
          message: `Invalid OTP code. ${remaining > 0 ? remaining + ' attempt(s) remaining.' : 'Attempts exhausted.'}`
        });
      }

      // 7. Mark as verified & used to prevent reuse
      otpRecord.isVerified = true;
      otpRecord.isUsed = true;
      await otpRecord.save();

      // 8. Generate Citizen JWT Session
      const token = jwt.sign(
        {
          caseNumber: caseDoc.caseNumber,
          caseId: caseDoc._id,
          citizenId: caseDoc.citizen?._id || caseDoc.citizen,
          role: 'citizen'
        },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Stage 2 Completed: Citizen Authentication successful!',
        token,
        data: {
          caseNumber: caseDoc.caseNumber,
          status: caseDoc.status,
          citizenName: caseDoc.citizen?.fullName || 'Citizen',
          phone: caseDoc.citizen?.phone || '',
          role: 'citizen'
        }
      });

    } else {
      // In-Memory Operation Fallback
      caseDoc = store.cases.find(c => c.caseNumber === trimmedCaseNo);
      if (!caseDoc) {
        return res.status(404).json({
          success: false,
          message: 'Case Registration Number not found in system. Please verify your registration.'
        });
      }

      otpRecord = store.otp_records.filter(r => r.caseNumber === trimmedCaseNo).slice(-1)[0];
      if (!otpRecord) {
        return res.status(404).json({
          success: false,
          message: 'No OTP record found for this Case Registration Number.'
        });
      }

      // Prevent OTP Reuse
      if (otpRecord.isUsed || otpRecord.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'This OTP has already been used. Please request a new OTP via Helpline 1930.'
        });
      }

      // Check OTP Expiration
      if (new Date() > new Date(otpRecord.expiresAt)) {
        return res.status(400).json({
          success: false,
          message: 'OTP has expired (10-minute validity). Please request a new verification code.'
        });
      }

      // Max Attempts Check
      if (otpRecord.attempts >= 3) {
        return res.status(400).json({
          success: false,
          message: 'Maximum OTP verification attempts (3) exceeded. Please contact Helpline 1930.'
        });
      }

      // Verify OTP Match
      if (otpRecord.otp !== trimmedOtp) {
        otpRecord.attempts += 1;
        const remaining = 3 - otpRecord.attempts;
        return res.status(401).json({
          success: false,
          message: `Invalid OTP code. ${remaining > 0 ? remaining + ' attempt(s) remaining.' : 'Attempts exhausted.'}`
        });
      }

      // Mark verified & used
      otpRecord.isVerified = true;
      otpRecord.isUsed = true;

      const token = jwt.sign(
        {
          caseNumber: caseDoc.caseNumber,
          caseId: caseDoc._id,
          citizenId: caseDoc.citizen,
          role: 'citizen'
        },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Stage 2 Completed: Citizen Authentication successful!',
        token,
        data: {
          caseNumber: caseDoc.caseNumber,
          status: caseDoc.status,
          citizenName: caseDoc.citizenData?.fullName || 'Citizen',
          phone: caseDoc.citizenData?.phone || '',
          role: 'citizen'
        }
      });
    }

  } catch (error) {
    next(error);
  }
};

/**
 * Officer Authentication via Badge Number or Email + Password
 * POST /api/auth/officer/login
 */
exports.officerLogin = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password || typeof identifier !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Badge Number / Email and Password are required strings.'
      });
    }

    const cleanId = identifier.trim().toLowerCase();
    const searchBadge = identifier.trim().toUpperCase();
    const isMongoConnected = mongoose.connection.readyState === 1;

    let officer;
    if (isMongoConnected) {
      officer = await Officer.findOne({
        $or: [
          { badgeNumber: searchBadge },
          { badgeNumber: identifier.trim() },
          { email: cleanId }
        ]
      });
    } else {
      officer = store.officers.find(o => 
        (o.badgeNumber && o.badgeNumber.toUpperCase() === searchBadge) || 
        (o.email && o.email.toLowerCase() === cleanId)
      );
    }

    if (!officer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Cybercrime Officer credentials.'
      });
    }

    const isMatch = await bcrypt.compare(password, officer.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Cybercrime Officer credentials.'
      });
    }

    const token = jwt.sign(
      {
        officerId: officer.officerId,
        id: officer._id,
        name: officer.name,
        badgeNumber: officer.badgeNumber,
        email: officer.email,
        role: 'officer',
        officerRole: officer.role,
        department: officer.department
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Officer Login Successful!',
      token,
      data: {
        officerId: officer.officerId,
        name: officer.name,
        badgeNumber: officer.badgeNumber,
        email: officer.email,
        role: 'officer',
        officerRole: officer.role,
        department: officer.department
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Verify Current Session Token
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
      return res.status(200).json({
        success: true,
        user: {
          role: 'citizen',
          caseNumber: req.user.caseNumber,
          citizen: caseDoc?.citizenData || caseDoc?.citizen,
          caseStatus: caseDoc?.status
        }
      });
    } else if (req.user.role === 'officer') {
      let officer;
      if (isMongoConnected) {
        officer = await Officer.findById(req.user.id).select('-passwordHash');
      } else {
        officer = store.officers.find(o => o._id === req.user.id || o.officerId === req.user.officerId);
      }
      return res.status(200).json({
        success: true,
        user: {
          role: 'officer',
          officer
        }
      });
    }
    return res.status(400).json({ success: false, message: 'Unknown role session.' });
  } catch (error) {
    next(error);
  }
};
