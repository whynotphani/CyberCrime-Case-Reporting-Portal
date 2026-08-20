const mongoose = require('mongoose');
const Citizen = require('../models/Citizen');
const Case = require('../models/Case');
const OtpRecord = require('../models/OtpRecord');
const CaseStatusHistory = require('../models/CaseStatusHistory');
const generateCaseId = require('../utils/generateCaseId');
const generateOtp = require('../utils/generateOtp');
const { store } = require('../config/memoryDb');

/**
 * Stage 1: Helpline Verification & Case Registration
 * POST /api/helpline/create-case
 */
exports.createCase = async (req, res, next) => {
  try {
    const { fullName, phone, email, address, idProofType, idProofNumber, initialCategory } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Citizen Full Name and Phone Number are required.'
      });
    }

    const cleanPhone = phone.trim();
    const cleanName = fullName.trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    let citizen;
    let caseNumber = generateCaseId();
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (isMongoConnected) {
      // 1. Find or create Citizen record in MongoDB
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
        if (cleanName) citizen.fullName = cleanName;
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

      const newCase = await Case.create({
        caseNumber,
        citizen: citizen._id,
        category: initialCategory || 'Other Cybercrime',
        status: 'VERIFICATION_PENDING',
        priority: 'MEDIUM'
      });

      await OtpRecord.create({ caseNumber, phone: cleanPhone, otp, expiresAt });

      await CaseStatusHistory.create({
        caseNumber,
        status: 'VERIFICATION_PENDING',
        remarks: 'Case registered via 1930 Helpline Desk. OTP generated.',
        updatedByRole: 'SYSTEM'
      });

      return res.status(201).json({
        success: true,
        message: 'Stage 1 Completed: Case successfully initiated on 1930 Helpline Desk.',
        data: {
          caseNumber,
          otp,
          phone: citizen.phone,
          citizenName: citizen.fullName,
          expiresInMinutes: 10,
          createdAt: newCase.createdAt
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

      const newCase = {
        _id: 'case_' + Date.now(),
        caseNumber,
        citizen: citizen._id,
        citizenData: citizen,
        category: initialCategory || 'Other Cybercrime',
        incidentDate: null,
        description: '',
        lossAmount: 0,
        suspectDetails: { name: '', phone: '', bankDetails: '', urlOrHandle: '', otherInfo: '' },
        priority: 'MEDIUM',
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
        remarks: 'Case registered via 1930 Helpline Desk. OTP generated.',
        updatedByRole: 'SYSTEM',
        updatedByOfficer: null,
        timestamp: new Date()
      });

      return res.status(201).json({
        success: true,
        message: 'Stage 1 Completed: Case successfully initiated on 1930 Helpline Desk (In-Memory).',
        data: {
          caseNumber,
          otp,
          phone: citizen.phone,
          citizenName: citizen.fullName,
          expiresInMinutes: 10,
          createdAt: newCase.createdAt
        }
      });
    }

  } catch (error) {
    next(error);
  }
};
