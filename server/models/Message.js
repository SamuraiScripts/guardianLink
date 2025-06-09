const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null }
});

// Indexes for optimal query performance
messageSchema.index({ conversationId: 1, timestamp: 1 }); // Conversation history
messageSchema.index({ recipient: 1, isRead: 1 }); // Unread messages count

module.exports = mongoose.model('Message', messageSchema);
