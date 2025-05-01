const mongoose = require('mongoose');

const NGOSchema = new mongoose.Schema({
  organizationName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  areasOfConcern: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('NGO', NGOSchema);
