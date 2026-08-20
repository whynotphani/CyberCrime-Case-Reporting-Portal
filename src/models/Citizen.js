const mongoose = require('mongoose');

const citizenSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true, index: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  idProofType: { 
    type: String, 
    enum: ['AADHAAR', 'PAN', 'VOTER_ID', 'DRIVING_LICENSE', 'OTHER'],
    default: 'OTHER'
  },
  idProofNumber: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Citizen', citizenSchema);
