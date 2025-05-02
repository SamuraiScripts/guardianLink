const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['volunteer', 'ngo', 'admin'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, refPath: 'role', default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
