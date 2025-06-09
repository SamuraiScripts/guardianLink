const crypto = require('crypto');

/**
 * Generate a deterministic conversation ID by hashing sorted user IDs
 * @param {string} userId1 - First user ID (ObjectId as string)
 * @param {string} userId2 - Second user ID (ObjectId as string)
 * @returns {string} - MD5 hash as hex string (32 characters)
 */
function generateConversationId(userId1, userId2) {
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  const combined = sortedIds.join('_');
  return crypto.createHash('md5').update(combined).digest('hex');
}

module.exports = {
  generateConversationId
}; 
