const mongoose = require('mongoose');

const otpRecordSchema = new mongoose.Schema({
  caseNumber: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  isVerified: { type: Boolean, default: false },
  isUsed: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 }
});

module.exports = mongoose.model('OtpRecord', otpRecordSchema);
