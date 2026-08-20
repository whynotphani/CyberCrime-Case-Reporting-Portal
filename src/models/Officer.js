const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const officerSchema = new mongoose.Schema({
  officerId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  badgeNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['HELPLINE_OPERATOR', 'INVESTIGATING_OFFICER', 'ADMIN'], 
    default: 'INVESTIGATING_OFFICER' 
  },
  department: { type: String, default: 'Cyber Cell Desk' },
  createdAt: { type: Date, default: Date.now }
});

officerSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('Officer', officerSchema);
