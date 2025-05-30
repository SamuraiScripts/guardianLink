const mongoose = require('mongoose');

const VolunteerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  weeklyAvailability: { type: Number, required: true },
  areasOfExpertise: { type: [String], default: [] },
  resumeUrl: { type: String },
  backgroundCheck: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Volunteer', VolunteerSchema);
