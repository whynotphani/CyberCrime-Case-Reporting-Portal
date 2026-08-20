const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const CaseStatusHistory = require('../models/CaseStatusHistory');
const { store } = require('../config/memoryDb');

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

exports.submitComplaint = async (req, res, next) => {
  try {
    const caseNumber = req.user.caseNumber;
    const { category, incidentDate, description, lossAmount, suspectName, suspectPhone, bankDetails, urlOrHandle, otherInfo } = req.body;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const caseDoc = await Case.findOne({ caseNumber });
      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });

      if (category) caseDoc.category = category;
      caseDoc.incidentDate = incidentDate ? new Date(incidentDate) : caseDoc.incidentDate;
      caseDoc.description = description ? description.trim() : caseDoc.description;
      caseDoc.lossAmount = lossAmount ? parseFloat(lossAmount) : caseDoc.lossAmount;

      if (caseDoc.lossAmount >= 100000 || category === 'Online Harassment') caseDoc.priority = 'HIGH';
      else if (caseDoc.lossAmount > 10000 || category === 'Financial Fraud') caseDoc.priority = 'MEDIUM';
      else caseDoc.priority = 'LOW';

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
        remarks: `Complaint details submitted by citizen. Priority: ${caseDoc.priority}`,
        updatedByRole: 'CITIZEN'
      });

      return res.status(200).json({ success: true, message: 'Stage 3 Completed: Complaint details submitted.', data: caseDoc });
    } else {
      const caseDoc = store.cases.find(c => c.caseNumber === caseNumber);
      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });

      if (category) caseDoc.category = category;
      caseDoc.incidentDate = incidentDate ? new Date(incidentDate) : caseDoc.incidentDate;
      caseDoc.description = description ? description.trim() : caseDoc.description;
      caseDoc.lossAmount = lossAmount ? parseFloat(lossAmount) : caseDoc.lossAmount;

      if (caseDoc.lossAmount >= 100000 || category === 'Online Harassment') caseDoc.priority = 'HIGH';
      else if (caseDoc.lossAmount > 10000 || category === 'Financial Fraud') caseDoc.priority = 'MEDIUM';
      else caseDoc.priority = 'LOW';

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
        remarks: `Complaint details submitted by citizen. Priority: ${caseDoc.priority}`,
        updatedByRole: 'CITIZEN',
        updatedByOfficer: null,
        timestamp: new Date()
      });

      return res.status(200).json({ success: true, message: 'Stage 3 Completed: Complaint details submitted.', data: caseDoc });
    }
  } catch (error) {
    next(error);
  }
};

exports.uploadEvidence = async (req, res, next) => {
  try {
    const caseNumber = req.user.caseNumber;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No evidence files selected for upload.' });
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
        remarks: `Citizen uploaded ${uploadedDocs.length} evidence file(s).`,
        updatedByRole: 'CITIZEN'
      });
    } else {
      store.case_status_history.push({
        _id: 'hist_' + Date.now(),
        caseNumber,
        status: 'SUBMITTED',
        remarks: `Citizen uploaded ${uploadedDocs.length} evidence file(s).`,
        updatedByRole: 'CITIZEN',
        updatedByOfficer: null,
        timestamp: new Date()
      });
    }

    res.status(201).json({ success: true, message: `${uploadedDocs.length} file(s) uploaded successfully.`, data: uploadedDocs });
  } catch (error) {
    next(error);
  }
};

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

    if (!fileRecord || fileRecord.caseNumber !== caseNumber) {
      return res.status(404).json({ success: false, message: 'Evidence file not found or unauthorized.' });
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

exports.getCaseHistory = async (req, res, next) => {
  try {
    const caseNumber = req.user.caseNumber;
    const isMongoConnected = mongoose.connection.readyState === 1;

    let history;
    if (isMongoConnected) {
      history = await CaseStatusHistory.find({ caseNumber }).populate('updatedByOfficer', 'name badgeNumber').sort({ timestamp: -1 });
    } else {
      history = store.case_status_history.filter(h => h.caseNumber === caseNumber);
    }

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
