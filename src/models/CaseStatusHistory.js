const mongoose = require('mongoose');

const caseStatusHistorySchema = new mongoose.Schema({
  caseNumber: { type: String, required: true, index: true },
  status: { type: String, required: true },
  remarks: { type: String, default: '' },
  updatedByRole: { 
    type: String, 
    enum: ['CITIZEN', 'OFFICER', 'SYSTEM'], 
    required: true 
  },
  updatedByOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', default: null },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CaseStatusHistory', caseStatusHistorySchema);
