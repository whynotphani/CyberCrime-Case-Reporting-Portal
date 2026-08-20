const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  caseNumber: { type: String, required: true, index: true },
  originalName: { type: String, required: true },
  storedFileName: { type: String, required: true },
  filePath: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileCategory: { 
    type: String, 
    enum: ['SCREENSHOT', 'BANK_STATEMENT', 'CHAT_LOG', 'AUDIO_VIDEO', 'OTHER'],
    default: 'OTHER'
  },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Evidence', evidenceSchema);
