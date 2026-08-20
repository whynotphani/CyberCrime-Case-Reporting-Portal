const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseNumber: { type: String, required: true, unique: true, index: true },
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'Citizen', required: true },
  category: { 
    type: String, 
    enum: [
      'Financial Fraud',
      'Non-Financial Cybercrime',
      'Mobile Theft/Loss',
      'Online Harassment',
      'Social Media Crime',
      'Other Cybercrime'
    ],
    default: 'Other Cybercrime'
  },
  title: { type: String, default: '' },
  incidentDate: { type: Date },
  description: { type: String, default: '' },
  lossAmount: { type: Number, default: 0 },
  suspectDetails: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    bankDetails: { type: String, default: '' },
    urlOrHandle: { type: String, default: '' },
    otherInfo: { type: String, default: '' }
  },
  priority: { 
    type: String, 
    enum: ['HIGH', 'MEDIUM', 'LOW'], 
    default: 'MEDIUM' 
  },
  status: { 
    type: String, 
    enum: [
      'VERIFICATION_PENDING',
      'SUBMITTED',
      'UNDER_REVIEW',
      'ASSIGNED',
      'UNDER_INVESTIGATION',
      'ADDITIONAL_INFO_REQUIRED',
      'RESOLVED',
      'CLOSED'
    ],
    default: 'VERIFICATION_PENDING'
  },
  assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', default: null },
  submittedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

caseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Case', caseSchema);
