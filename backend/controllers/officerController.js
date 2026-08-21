const mongoose = require('mongoose');
const fs = require('fs');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const CaseStatusHistory = require('../models/CaseStatusHistory');
const Officer = require('../models/Officer');
const { store } = require('../config/memoryDb');

exports.getCases = async (req, res, next) => {
  try {
    const { category, priority, status, search } = req.query;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      let query = {};
      if (category && typeof category === 'string') query.category = category;
      if (priority && typeof priority === 'string') query.priority = priority;
      if (status && typeof status === 'string') query.status = status;

      if (search && typeof search === 'string') {
        const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(safeSearch, 'i');
        query.$or = [{ caseNumber: searchRegex }, { description: searchRegex }];
      }

      const cases = await Case.find(query)
        .populate('citizen', 'fullName phone email')
        .populate('assignedOfficer', 'name badgeNumber department')
        .sort({ updatedAt: -1 });

      const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      cases.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));

      return res.status(200).json({ success: true, count: cases.length, data: cases });
    } else {
      let filtered = [...store.cases];

      if (category) filtered = filtered.filter(c => c.category === category);
      if (priority) filtered = filtered.filter(c => c.priority === priority);
      if (status) filtered = filtered.filter(c => c.status === status);

      if (search) {
        const s = search.trim().toLowerCase();
        filtered = filtered.filter(c => c.caseNumber.toLowerCase().includes(s) || c.description.toLowerCase().includes(s));
      }

      const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      filtered.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));

      const formattedCases = filtered.map(c => {
        const assigned = store.officers.find(o => o._id === c.assignedOfficer);
        return {
          ...c,
          citizen: c.citizenData || { fullName: 'Citizen', phone: '' },
          assignedOfficer: assigned || null
        };
      });

      return res.status(200).json({ success: true, count: formattedCases.length, data: formattedCases });
    }
  } catch (error) {
    next(error);
  }
};

exports.getCaseByNumber = async (req, res, next) => {
  try {
    const caseNumber = req.params.caseNumber;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const caseDoc = await Case.findOne({ caseNumber })
        .populate('citizen', 'fullName phone email address idProofType idProofNumber')
        .populate('assignedOfficer', 'name badgeNumber role department email');

      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });

      const evidenceList = await Evidence.find({ caseNumber }).sort({ uploadedAt: -1 });
      const historyList = await CaseStatusHistory.find({ caseNumber }).populate('updatedByOfficer', 'name badgeNumber').sort({ timestamp: -1 });

      return res.status(200).json({ success: true, data: { case: caseDoc, evidence: evidenceList, history: historyList } });
    } else {
      const caseDoc = store.cases.find(c => c.caseNumber === caseNumber);
      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });

      const evidenceList = store.evidence.filter(e => e.caseNumber === caseNumber);
      const historyList = store.case_status_history.filter(h => h.caseNumber === caseNumber);
      const assigned = store.officers.find(o => o._id === caseDoc.assignedOfficer);

      const formattedCase = {
        ...caseDoc,
        citizen: caseDoc.citizenData || { fullName: 'Citizen', phone: '' },
        assignedOfficer: assigned || null
      };

      return res.status(200).json({ success: true, data: { case: formattedCase, evidence: evidenceList, history: historyList } });
    }
  } catch (error) {
    next(error);
  }
};

exports.updateCaseStatus = async (req, res, next) => {
  try {
    const caseNumber = req.params.caseNumber;
    const { status, priority, remarks } = req.body;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const caseDoc = await Case.findOne({ caseNumber });
      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });

      const oldStatus = caseDoc.status;
      if (status) caseDoc.status = status;
      if (priority && ['HIGH', 'MEDIUM', 'LOW'].includes(priority)) caseDoc.priority = priority;

      await caseDoc.save();

      const validOfficerId = mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : null;
      await CaseStatusHistory.create({
        caseNumber,
        status: caseDoc.status,
        remarks: remarks || `Status updated from ${oldStatus} to ${caseDoc.status} by Officer ${req.user.name}`,
        updatedByRole: 'OFFICER',
        updatedByOfficer: validOfficerId
      });

      return res.status(200).json({ success: true, message: `Case ${caseNumber} status updated to '${caseDoc.status}'.`, data: caseDoc });
    } else {
      const caseDoc = store.cases.find(c => c.caseNumber === caseNumber);
      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });

      const oldStatus = caseDoc.status;
      if (status) caseDoc.status = status;
      if (priority && ['HIGH', 'MEDIUM', 'LOW'].includes(priority)) caseDoc.priority = priority;
      caseDoc.updatedAt = new Date();

      store.case_status_history.push({
        _id: 'hist_' + Date.now(),
        caseNumber,
        status: caseDoc.status,
        remarks: remarks || `Status updated from ${oldStatus} to ${caseDoc.status} by Officer ${req.user.name}`,
        updatedByRole: 'OFFICER',
        updatedByOfficer: req.user.id,
        timestamp: new Date()
      });

      return res.status(200).json({ success: true, message: `Case ${caseNumber} status updated to '${caseDoc.status}'.`, data: caseDoc });
    }
  } catch (error) {
    next(error);
  }
};

exports.assignCase = async (req, res, next) => {
  try {
    const caseNumber = req.params.caseNumber;
    const { targetOfficerId, remarks } = req.body;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const caseDoc = await Case.findOne({ caseNumber });
      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });

      const targetOfficer = await Officer.findById(targetOfficerId);
      if (!targetOfficer) return res.status(404).json({ success: false, message: 'Target Officer not found.' });

      caseDoc.assignedOfficer = targetOfficer._id;
      if (caseDoc.status === 'VERIFICATION_PENDING' || caseDoc.status === 'SUBMITTED') caseDoc.status = 'ASSIGNED';
      await caseDoc.save();

      const validOfficerId = mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : null;
      await CaseStatusHistory.create({
        caseNumber,
        status: caseDoc.status,
        remarks: remarks || `Case assigned/forwarded to ${targetOfficer.name} (${targetOfficer.badgeNumber}).`,
        updatedByRole: 'OFFICER',
        updatedByOfficer: validOfficerId
      });

      return res.status(200).json({ success: true, message: `Case ${caseNumber} assigned to ${targetOfficer.name}.`, data: caseDoc });
    } else {
      const caseDoc = store.cases.find(c => c.caseNumber === caseNumber);
      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });

      const targetOfficer = store.officers.find(o => o._id === targetOfficerId || o.officerId === targetOfficerId);
      if (!targetOfficer) return res.status(404).json({ success: false, message: 'Target Officer not found.' });

      caseDoc.assignedOfficer = targetOfficer._id;
      if (caseDoc.status === 'VERIFICATION_PENDING' || caseDoc.status === 'SUBMITTED') caseDoc.status = 'ASSIGNED';
      caseDoc.updatedAt = new Date();

      store.case_status_history.push({
        _id: 'hist_' + Date.now(),
        caseNumber,
        status: caseDoc.status,
        remarks: remarks || `Case assigned/forwarded to ${targetOfficer.name} (${targetOfficer.badgeNumber}).`,
        updatedByRole: 'OFFICER',
        updatedByOfficer: req.user.id,
        timestamp: new Date()
      });

      return res.status(200).json({ success: true, message: `Case ${caseNumber} assigned to ${targetOfficer.name}.`, data: caseDoc });
    }
  } catch (error) {
    next(error);
  }
};

exports.getOfficerList = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    let officers;
    if (isMongoConnected) {
      officers = await Officer.find({}, 'name badgeNumber role department email officerId');
    } else {
      officers = store.officers.map(o => ({ _id: o._id, officerId: o.officerId, name: o.name, badgeNumber: o.badgeNumber, role: o.role, department: o.department, email: o.email }));
    }
    res.status(200).json({ success: true, data: officers });
  } catch (error) {
    next(error);
  }
};

exports.downloadOfficerEvidence = async (req, res, next) => {
  try {
    const evidenceId = req.params.id;
    const isMongoConnected = mongoose.connection.readyState === 1;

    let fileRecord;
    if (isMongoConnected) {
      fileRecord = await Evidence.findById(evidenceId);
    } else {
      fileRecord = store.evidence.find(e => e._id === evidenceId);
    }

    if (!fileRecord) return res.status(404).json({ success: false, message: 'Evidence file record not found.' });

    if (!fs.existsSync(fileRecord.filePath)) {
      return res.status(404).json({ success: false, message: 'File missing from server storage.' });
    }

    res.setHeader('Content-Type', fileRecord.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileRecord.originalName}"`);
    fs.createReadStream(fileRecord.filePath).pipe(res);
  } catch (error) {
    next(error);
  }
};

exports.deleteCase = async (req, res, next) => {
  try {
    const caseNumber = req.params.caseNumber;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const deletedCase = await Case.findOneAndDelete({ caseNumber });
      if (!deletedCase) {
        return res.status(404).json({ success: false, message: 'Case not found.' });
      }

      await Evidence.deleteMany({ caseNumber });
      await CaseStatusHistory.deleteMany({ caseNumber });

      return res.status(200).json({ success: true, message: `Case ${caseNumber} deleted successfully.` });
    } else {
      const caseIdx = store.cases.findIndex(c => c.caseNumber === caseNumber);
      if (caseIdx === -1) {
        return res.status(404).json({ success: false, message: 'Case not found.' });
      }

      store.cases.splice(caseIdx, 1);
      store.evidence = store.evidence.filter(e => e.caseNumber !== caseNumber);
      store.case_status_history = store.case_status_history.filter(h => h.caseNumber !== caseNumber);
      store.otp_records = store.otp_records.filter(o => o.caseNumber !== caseNumber);

      return res.status(200).json({ success: true, message: `Case ${caseNumber} deleted successfully.` });
    }
  } catch (error) {
    next(error);
  }
};

exports.getAllCredentials = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user && (
      (req.user.email && req.user.email.toLowerCase() === 'marpuphani00@gmail.com') ||
      req.user.badgeNumber === 'CYBER-2005' ||
      req.user.role === 'ADMIN' ||
      req.user.officerRole === 'ADMIN'
    );
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Only Super Admin (marpuphani00@gmail.com) can manage officer credentials.' });
    }

    const isMongoConnected = mongoose.connection.readyState === 1;
    let officers;
    if (isMongoConnected) {
      officers = await Officer.find({}, 'name badgeNumber role department email officerId createdAt');
    } else {
      officers = store.officers.map(o => ({ _id: o._id, officerId: o.officerId, name: o.name, badgeNumber: o.badgeNumber, role: o.role, department: o.department, email: o.email, createdAt: o.createdAt }));
    }
    return res.status(200).json({ success: true, data: officers });
  } catch (error) {
    next(error);
  }
};

exports.createOfficerCredential = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user && (
      (req.user.email && req.user.email.toLowerCase() === 'marpuphani00@gmail.com') ||
      req.user.badgeNumber === 'CYBER-2005' ||
      req.user.role === 'ADMIN' ||
      req.user.officerRole === 'ADMIN'
    );
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Only Super Admin can create officer credentials.' });
    }

    const { name, badgeNumber, email, password, department, role } = req.body;
    if (!name || !badgeNumber || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, badge number, email, and password.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const officerId = `OFF-${Math.floor(100 + Math.random() * 900)}`;
    const newOfficer = {
      _id: `off_${Date.now()}`,
      officerId,
      name,
      badgeNumber,
      email: email.trim().toLowerCase(),
      passwordHash,
      role: role || 'INVESTIGATING_OFFICER',
      department: department || 'Cybercrime Department',
      createdAt: new Date()
    };

    const isMongoConnected = mongoose.connection.readyState === 1;
    if (isMongoConnected) {
      const existing = await Officer.findOne({ email: newOfficer.email });
      if (existing) return res.status(400).json({ success: false, message: 'An officer with this email already exists.' });
      await Officer.create({ ...newOfficer, password: passwordHash });
    } else {
      const existing = store.officers.find(o => o.email === newOfficer.email);
      if (existing) return res.status(400).json({ success: false, message: 'An officer with this email already exists.' });
      store.officers.push(newOfficer);
    }

    return res.status(201).json({ success: true, message: `Officer credential created for ${name}.`, data: newOfficer });
  } catch (error) {
    next(error);
  }
};

exports.updateOfficerCredential = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user && (
      (req.user.email && req.user.email.toLowerCase() === 'marpuphani00@gmail.com') ||
      req.user.badgeNumber === 'CYBER-2005' ||
      req.user.role === 'ADMIN' ||
      req.user.officerRole === 'ADMIN'
    );
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Only Super Admin can update officer credentials.' });
    }

    const officerId = req.params.id;
    const { name, badgeNumber, email, password, department, role } = req.body;

    const isMongoConnected = mongoose.connection.readyState === 1;
    if (isMongoConnected) {
      const off = await Officer.findById(officerId);
      if (!off) return res.status(404).json({ success: false, message: 'Officer record not found.' });

      if (name) off.name = name;
      if (badgeNumber) off.badgeNumber = badgeNumber;
      if (email) off.email = email.trim().toLowerCase();
      if (department) off.department = department;
      if (role) off.role = role;
      if (password) off.password = await bcrypt.hash(password, 10);

      await off.save();
      return res.status(200).json({ success: true, message: `Officer credentials updated successfully.`, data: off });
    } else {
      const offIdx = store.officers.findIndex(o => o._id === officerId || o.officerId === officerId);
      if (offIdx === -1) return res.status(404).json({ success: false, message: 'Officer record not found.' });

      const off = store.officers[offIdx];
      if (name) off.name = name;
      if (badgeNumber) off.badgeNumber = badgeNumber;
      if (email) off.email = email.trim().toLowerCase();
      if (department) off.department = department;
      if (role) off.role = role;
      if (password) off.passwordHash = await bcrypt.hash(password, 10);

      return res.status(200).json({ success: true, message: `Officer credentials updated successfully.`, data: off });
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteOfficerCredential = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user && (
      (req.user.email && req.user.email.toLowerCase() === 'marpuphani00@gmail.com') ||
      req.user.badgeNumber === 'CYBER-2005' ||
      req.user.role === 'ADMIN' ||
      req.user.officerRole === 'ADMIN'
    );
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Only Super Admin can delete officer credentials.' });
    }

    const officerId = req.params.id;
    const isMongoConnected = mongoose.connection.readyState === 1;

    let targetEmail = '';
    if (isMongoConnected) {
      const off = await Officer.findById(officerId);
      if (off) targetEmail = off.email;
    } else {
      const off = store.officers.find(o => o._id === officerId || o.officerId === officerId);
      if (off) targetEmail = off.email;
    }

    if (targetEmail === 'marpuphani00@gmail.com') {
      return res.status(400).json({ success: false, message: 'Super Admin credential (marpuphani00@gmail.com) cannot be deleted.' });
    }

    if (isMongoConnected) {
      await Officer.findByIdAndDelete(officerId);
    } else {
      store.officers = store.officers.filter(o => o._id !== officerId && o.officerId !== officerId);
    }

    return res.status(200).json({ success: true, message: 'Officer credential deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
