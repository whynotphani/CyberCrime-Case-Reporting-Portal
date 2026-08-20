const mongoose = require('mongoose');
const Citizen = require('../models/Citizen');
const Case = require('../models/Case');
const OtpRecord = require('../models/OtpRecord');
const CaseStatusHistory = require('../models/CaseStatusHistory');
const { generateCaseId } = require('../services/caseIdService');
const { generateOtp } = require('../services/otpService');
const { store } = require('../config/memoryDb');

/**
 * Stage 1: Helpline Operator Initial Complaint Registration
 * POST /api/helpline/create-case
 */
exports.createCase = async (req, res, next) => {
  try {
    const { 
      fullName, 
      phone, 
      description, 
      initialCategory, 
      category, 
      severity, 
      priority,
      email, 
      address, 
      idProofType, 
      idProofNumber 
    } = req.body;

    // 1. Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Victim Full Name is required (minimum 2 characters).'
      });
    }

    const cleanPhone = phone ? phone.trim() : '';
    if (!cleanPhone || !/^[0-9]{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Valid 10-digit mobile number is required.'
      });
    }

    const cleanDescription = description ? description.trim() : '';
    if (!cleanDescription || cleanDescription.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Initial complaint description is required (minimum 5 characters).'
      });
    }

    const selectedCategory = category || initialCategory || 'Other Cybercrime';
    const selectedSeverity = (severity || priority || 'MEDIUM').toUpperCase();

    if (!['HIGH', 'MEDIUM', 'LOW'].includes(selectedSeverity)) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid severity level. Must be HIGH, MEDIUM, or LOW.'
      });
    }

    const cleanName = fullName.trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    // 2. Generate unique Case Registration Number & Secure OTP
    let caseNumber = generateCaseId();
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    let citizen;
    let newCase;

    if (isMongoConnected) {
      // 3. Find or create Citizen record in MongoDB
      citizen = await Citizen.findOne({ phone: cleanPhone });
      if (!citizen) {
        citizen = await Citizen.create({
          fullName: cleanName,
          phone: cleanPhone,
          email: email ? email.trim() : '',
          address: address ? address.trim() : '',
          idProofType: idProofType || 'OTHER',
          idProofNumber: idProofNumber ? idProofNumber.trim() : ''
        });
      } else {
        citizen.fullName = cleanName;
        if (email) citizen.email = email.trim();
        if (address) citizen.address = address.trim();
        await citizen.save();
      }

      // Ensure unique case number
      let existingCase = await Case.findOne({ caseNumber });
      while (existingCase) {
        caseNumber = generateCaseId();
        existingCase = await Case.findOne({ caseNumber });
      }

      // 4. Store Case in MongoDB
      newCase = await Case.create({
        caseNumber,
        citizen: citizen._id,
        category: selectedCategory,
        description: cleanDescription,
        priority: selectedSeverity,
        status: 'VERIFICATION_PENDING'
      });

      // 5. Store OTP securely with 10-minute expiration
      await OtpRecord.create({
        caseNumber,
        phone: cleanPhone,
        otp,
        expiresAt,
        isVerified: false,
        attempts: 0
      });

      // Log initial timeline history
      await CaseStatusHistory.create({
        caseNumber,
        status: 'VERIFICATION_PENDING',
        remarks: `Case registered by helpline officer. Category: ${selectedCategory}, Severity: ${selectedSeverity}.`,
        updatedByRole: 'SYSTEM'
      });

      return res.status(201).json({
        success: true,
        message: 'Stage 1 Completed: Initial complaint registered successfully.',
        data: {
          caseNumber,
          otp,
          phone: citizen.phone,
          citizenName: citizen.fullName,
          category: selectedCategory,
          severity: selectedSeverity,
          description: cleanDescription,
          expiresInMinutes: 10,
          createdAt: newCase.createdAt,
          confirmationMessage: 'The victim can now log into the Citizen Portal using the Case Registration Number and 6-digit OTP.'
        }
      });

    } else {
      // In-Memory Fallback Operation
      citizen = store.citizens.find(c => c.phone === cleanPhone);
      if (!citizen) {
        citizen = {
          _id: 'cit_' + Date.now(),
          fullName: cleanName,
          phone: cleanPhone,
          email: email ? email.trim() : '',
          address: address ? address.trim() : '',
          idProofType: idProofType || 'OTHER',
          idProofNumber: idProofNumber ? idProofNumber.trim() : '',
          createdAt: new Date()
        };
        store.citizens.push(citizen);
      }

      newCase = {
        _id: 'case_' + Date.now(),
        caseNumber,
        citizen: citizen._id,
        citizenData: citizen,
        category: selectedCategory,
        incidentDate: null,
        description: cleanDescription,
        lossAmount: 0,
        suspectDetails: { name: '', phone: '', bankDetails: '', urlOrHandle: '', otherInfo: '' },
        priority: selectedSeverity,
        status: 'VERIFICATION_PENDING',
        assignedOfficer: null,
        submittedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.cases.push(newCase);

      store.otp_records.push({
        _id: 'otp_' + Date.now(),
        caseNumber,
        phone: cleanPhone,
        otp,
        expiresAt,
        isVerified: false,
        attempts: 0,
        createdAt: new Date()
      });

      store.case_status_history.push({
        _id: 'hist_' + Date.now(),
        caseNumber,
        status: 'VERIFICATION_PENDING',
        remarks: `Case registered by helpline officer. Category: ${selectedCategory}, Severity: ${selectedSeverity}.`,
        updatedByRole: 'SYSTEM',
        updatedByOfficer: null,
        timestamp: new Date()
      });

      return res.status(201).json({
        success: true,
        message: 'Stage 1 Completed: Initial complaint registered successfully (In-Memory).',
        data: {
          caseNumber,
          otp,
          phone: citizen.phone,
          citizenName: citizen.fullName,
          category: selectedCategory,
          severity: selectedSeverity,
          description: cleanDescription,
          expiresInMinutes: 10,
          createdAt: newCase.createdAt,
          confirmationMessage: 'The victim can now log into the Citizen Portal using the Case Registration Number and 6-digit OTP.'
        }
      });
    }

  } catch (error) {
    next(error);
  }
};

/**
 * Resend / Generate fresh OTP for a registered case
 * POST /api/helpline/resend-otp
 */
exports.resendOtp = async (req, res, next) => {
  try {
    const { caseNumber } = req.body;
    if (!caseNumber || typeof caseNumber !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid Case Registration Number is required.' });
    }

    const trimmedCaseNo = caseNumber.trim();
    const isMongoConnected = mongoose.connection.readyState === 1;
    const newOtp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (isMongoConnected) {
      const caseDoc = await Case.findOne({ caseNumber: trimmedCaseNo });
      if (!caseDoc) {
        return res.status(404).json({ success: false, message: 'Case Registration Number not found.' });
      }
      await OtpRecord.create({
        caseNumber: trimmedCaseNo,
        phone: 'RESERVED',
        otp: newOtp,
        expiresAt,
        isVerified: false,
        attempts: 0
      });
    } else {
      const caseDoc = store.cases.find(c => c.caseNumber === trimmedCaseNo);
      if (!caseDoc) {
        return res.status(404).json({ success: false, message: 'Case Registration Number not found.' });
      }
      store.otp_records.push({
        _id: 'otp_' + Date.now(),
        caseNumber: trimmedCaseNo,
        otp: newOtp,
        expiresAt,
        isVerified: false,
        isUsed: false,
        attempts: 0,
        createdAt: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'New OTP generated successfully for Helpline verification.',
      caseNumber: trimmedCaseNo,
      otp: newOtp,
      expiresInMinutes: 10
    });
  } catch (error) {
    next(error);
  }
};
