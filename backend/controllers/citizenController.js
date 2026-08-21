const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const CaseStatusHistory = require('../models/CaseStatusHistory');
const { store } = require('../config/memoryDb');

/**
 * Fetch authenticated citizen's case details
 * GET /api/citizen/case
 */
exports.getCaseDetails = async (req, res, next) => {
  try {
    const caseNumber = req.user.caseNumber;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const caseDoc = await Case.findOne({ caseNumber })
        .populate('citizen', 'fullName phone email address idProofType idProofNumber')
        .populate('assignedOfficer', 'name badgeNumber department');

      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });

      const evidenceList = await Evidence.find({ caseNumber }).sort({ uploadedAt: -1 });

      return res.status(200).json({ success: true, data: { case: caseDoc, evidence: evidenceList } });
    } else {
      const caseDoc = store.cases.find(c => c.caseNumber === caseNumber);
      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });

      const evidenceList = store.evidence.filter(e => e.caseNumber === caseNumber);
      const assignedOfficer = store.officers.find(o => o._id === caseDoc.assignedOfficer);

      const formattedCase = {
        ...caseDoc,
        citizen: caseDoc.citizenData || { fullName: 'Citizen', phone: '' },
        assignedOfficer: assignedOfficer || null
      };

      return res.status(200).json({ success: true, data: { case: formattedCase, evidence: evidenceList } });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * STAGE 3: Submit Detailed Complaint
 * PUT /api/citizen/case/submit
 */
exports.submitComplaint = async (req, res, next) => {
  try {
    const caseNumber = req.user.caseNumber;
    const { 
      title,
      category, 
      incidentDate, 
      description, 
      lossAmount, 
      suspectName, 
      suspectPhone, 
      bankDetails, 
      urlOrHandle, 
      otherInfo 
    } = req.body;

    // Backend Validation
    if (!description || description.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Incident description is required (minimum 5 characters).'
      });
    }

    const validCategories = [
      'Financial Fraud',
      'Non-Financial Cybercrime',
      'Mobile Theft/Loss',
      'Online Harassment',
      'Social Media Crime',
      'Other Cybercrime'
    ];

    const selectedCategory = (category && validCategories.includes(category)) ? category : 'Other Cybercrime';
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const caseDoc = await Case.findOne({ caseNumber });
      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case record not found.' });

      caseDoc.title = title ? title.trim() : (caseDoc.title || `${selectedCategory} Incident`);
      caseDoc.category = selectedCategory;
      caseDoc.incidentDate = incidentDate ? new Date(incidentDate) : caseDoc.incidentDate;
      caseDoc.description = description.trim();
      caseDoc.lossAmount = lossAmount ? parseFloat(lossAmount) : caseDoc.lossAmount;

      // Calculate priority/severity based on loss amount or category
      if (caseDoc.lossAmount >= 100000 || selectedCategory === 'Online Harassment') {
        caseDoc.priority = 'HIGH';
      } else if (caseDoc.lossAmount > 10000 || selectedCategory === 'Financial Fraud') {
        caseDoc.priority = 'MEDIUM';
      } else {
        caseDoc.priority = 'LOW';
      }

      caseDoc.suspectDetails = {
        name: suspectName ? suspectName.trim() : '',
        phone: suspectPhone ? suspectPhone.trim() : '',
        bankDetails: bankDetails ? bankDetails.trim() : '',
        urlOrHandle: urlOrHandle ? urlOrHandle.trim() : '',
        otherInfo: otherInfo ? otherInfo.trim() : ''
      };

      caseDoc.status = 'SUBMITTED';
      caseDoc.submittedAt = new Date();
      await caseDoc.save();

      await CaseStatusHistory.create({
        caseNumber,
        status: 'SUBMITTED',
        remarks: `Complaint submitted by citizen. Title: ${caseDoc.title}. Priority: ${caseDoc.priority}.`,
        updatedByRole: 'CITIZEN'
      });

      return res.status(200).json({
        success: true,
        message: 'Stage 3 Completed: Complaint details saved successfully.',
        caseNumber: caseDoc.caseNumber,
        data: caseDoc
      });

    } else {
      // In-Memory Operation
      const caseDoc = store.cases.find(c => c.caseNumber === caseNumber);
      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case record not found.' });

      caseDoc.title = title ? title.trim() : (caseDoc.title || `${selectedCategory} Incident`);
      caseDoc.category = selectedCategory;
      caseDoc.incidentDate = incidentDate ? new Date(incidentDate) : caseDoc.incidentDate;
      caseDoc.description = description.trim();
      caseDoc.lossAmount = lossAmount ? parseFloat(lossAmount) : caseDoc.lossAmount;

      if (caseDoc.lossAmount >= 100000 || selectedCategory === 'Online Harassment') {
        caseDoc.priority = 'HIGH';
      } else if (caseDoc.lossAmount > 10000 || selectedCategory === 'Financial Fraud') {
        caseDoc.priority = 'MEDIUM';
      } else {
        caseDoc.priority = 'LOW';
      }

      caseDoc.suspectDetails = {
        name: suspectName ? suspectName.trim() : '',
        phone: suspectPhone ? suspectPhone.trim() : '',
        bankDetails: bankDetails ? bankDetails.trim() : '',
        urlOrHandle: urlOrHandle ? urlOrHandle.trim() : '',
        otherInfo: otherInfo ? otherInfo.trim() : ''
      };

      caseDoc.status = 'SUBMITTED';
      caseDoc.submittedAt = new Date();
      caseDoc.updatedAt = new Date();

      store.case_status_history.push({
        _id: 'hist_' + Date.now(),
        caseNumber,
        status: 'SUBMITTED',
        remarks: `Complaint submitted by citizen. Title: ${caseDoc.title}. Priority: ${caseDoc.priority}.`,
        updatedByRole: 'CITIZEN',
        updatedByOfficer: null,
        timestamp: new Date()
      });

      return res.status(200).json({
        success: true,
        message: 'Stage 3 Completed: Complaint details saved successfully.',
        caseNumber: caseDoc.caseNumber,
        data: caseDoc
      });
    }

  } catch (error) {
    next(error);
  }
};

/**
 * STAGE 3: Upload Digital Evidence Archives
 * POST /api/citizen/case/evidence
 */
exports.uploadEvidence = async (req, res, next) => {
  try {
    const caseNumber = req.user.caseNumber;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: No evidence files selected for upload.'
      });
    }

    const { fileCategory } = req.body;
    const isMongoConnected = mongoose.connection.readyState === 1;
    const uploadedDocs = [];

    for (const file of req.files) {
      const item = {
        caseNumber,
        originalName: file.originalname,
        storedFileName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileCategory: fileCategory || 'OTHER',
        uploadedAt: new Date()
      };

      if (isMongoConnected) {
        const evidence = await Evidence.create(item);
        uploadedDocs.push(evidence);
      } else {
        item._id = 'ev_' + Date.now() + Math.floor(Math.random() * 1000);
        store.evidence.push(item);
        uploadedDocs.push(item);
      }
    }

    if (isMongoConnected) {
      await CaseStatusHistory.create({
        caseNumber,
        status: 'SUBMITTED',
        remarks: `Citizen uploaded ${uploadedDocs.length} digital evidence file(s).`,
        updatedByRole: 'CITIZEN'
      });
    } else {
      store.case_status_history.push({
        _id: 'hist_' + Date.now(),
        caseNumber,
        status: 'SUBMITTED',
        remarks: `Citizen uploaded ${uploadedDocs.length} digital evidence file(s).`,
        updatedByRole: 'CITIZEN',
        updatedByOfficer: null,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: `${uploadedDocs.length} evidence file(s) successfully attached to Case ${caseNumber}.`,
      caseNumber,
      data: uploadedDocs
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get Evidence List
 * GET /api/citizen/case/evidence
 */
exports.getEvidenceList = async (req, res, next) => {
  try {
    const caseNumber = req.user.caseNumber;
    const isMongoConnected = mongoose.connection.readyState === 1;

    let files;
    if (isMongoConnected) {
      files = await Evidence.find({ caseNumber }).sort({ uploadedAt: -1 });
    } else {
      files = store.evidence.filter(e => e.caseNumber === caseNumber);
    }
    res.status(200).json({ success: true, data: files });
  } catch (error) {
    next(error);
  }
};

/**
 * Stream/Download evidence file securely with ownership check
 * GET /api/citizen/case/evidence/:id/download
 */
exports.downloadEvidence = async (req, res, next) => {
  try {
    const caseNumber = req.user.caseNumber;
    const evidenceId = req.params.id;
    const isMongoConnected = mongoose.connection.readyState === 1;

    let fileRecord;
    if (isMongoConnected) {
      fileRecord = await Evidence.findById(evidenceId);
    } else {
      fileRecord = store.evidence.find(e => e._id === evidenceId);
    }

    if (!fileRecord) {
      return res.status(404).json({ success: false, message: 'Evidence file record not found.' });
    }

    // Ownership & Access Control Check
    if (fileRecord.caseNumber !== caseNumber) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You are not authorized to view or download evidence for another case.'
      });
    }

    if (!fs.existsSync(fileRecord.filePath)) {
      return res.status(404).json({ success: false, message: 'File no longer exists on server storage.' });
    }

    res.setHeader('Content-Type', fileRecord.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileRecord.originalName}"`);
    fs.createReadStream(fileRecord.filePath).pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Case Status Timeline History
 * GET /api/citizen/case/history
 */
exports.getCaseHistory = async (req, res, next) => {
  try {
    const caseNumber = req.user.caseNumber;
    const isMongoConnected = mongoose.connection.readyState === 1;

    let rawHistory;
    let caseObj = null;

    if (isMongoConnected) {
      caseObj = await Case.findOne({ caseNumber }).populate('assignedOfficer', 'name badgeNumber department');
      rawHistory = await CaseStatusHistory.find({ caseNumber }).populate('updatedByOfficer', 'name badgeNumber department').sort({ timestamp: -1 });
    } else {
      caseObj = store.cases.find(c => c.caseNumber === caseNumber);
      rawHistory = store.case_status_history.filter(h => h.caseNumber === caseNumber);
      rawHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    let defaultOfficer = null;
    if (caseObj && caseObj.assignedOfficer) {
      if (typeof caseObj.assignedOfficer === 'object') {
        defaultOfficer = caseObj.assignedOfficer;
      } else {
        defaultOfficer = store.officers.find(o => o._id === caseObj.assignedOfficer || o.officerId === caseObj.assignedOfficer);
      }
    }

    if (!defaultOfficer && store.officers && store.officers.length > 0) {
      defaultOfficer = store.officers[0];
    }

    const publicHistory = rawHistory.map(item => {
      let officerInfo = null;
      if (item.updatedByOfficer) {
        if (typeof item.updatedByOfficer === 'object') {
          officerInfo = item.updatedByOfficer;
        } else {
          officerInfo = store.officers.find(o => o._id === item.updatedByOfficer || o.officerId === item.updatedByOfficer);
        }
      }

      if (!officerInfo && defaultOfficer) {
        officerInfo = defaultOfficer;
      }

      return {
        _id: item._id,
        caseNumber: item.caseNumber,
        status: item.status,
        remarks: item.remarks || `Case status updated to ${item.status.replace(/_/g, ' ')}.`,
        updatedByRole: item.updatedByRole,
        updatedByOfficer: officerInfo ? {
          name: officerInfo.name,
          badgeNumber: officerInfo.badgeNumber,
          department: officerInfo.department || 'Financial Fraud Cell'
        } : {
          name: 'Inspector Rajesh Kumar',
          badgeNumber: 'CYBER-8841',
          department: 'Financial Fraud Cell'
        },
        timestamp: item.timestamp
      };
    });

    res.status(200).json({ success: true, data: publicHistory, assignedOfficer: defaultOfficer });
  } catch (error) {
    next(error);
  }
};
