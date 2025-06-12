const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const User = require('../models/User');
const { generateConversationId } = require('../utils/messageUtils');
const router = express.Router();

// POST /messages/send
router.post('/send', requireAuth, async (req, res) => {
  const { recipient, content } = req.body;

  if (!recipient || !content) {
    return res.status(400).json({ error: 'Recipient and content are required' });
  }

  try {
    const sender = req.user.userId;
    const conversationId = generateConversationId(sender, recipient);

    const newMessage = new Message({
      conversationId,
      sender,
      recipient,
      content
    });

    const saved = await newMessage.save();
    res.status(201).json({ message: 'Message sent', data: saved });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /messages/inbox — list recent conversations
router.get('/inbox', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const mongoose = require('mongoose');
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Clean up orphaned messages from deleted users
    const orphanedMessages = await Message.find({
      $or: [{ sender: userObjectId }, { recipient: userObjectId }]
    }).populate('sender recipient', '_id');
    
    const messagesToCleanup = orphanedMessages.filter(msg => !msg.sender || !msg.recipient);
    
    if (messagesToCleanup.length > 0) {
      const orphanedIds = messagesToCleanup.map(msg => msg._id);
      await Message.deleteMany({ _id: { $in: orphanedIds } });
      console.log(`Cleaned up ${orphanedIds.length} orphaned messages from deleted users in inbox`);
    }

    // Get all messages for this user
    const allUserMessages = await Message.find({
      $or: [{ sender: userObjectId }, { recipient: userObjectId }]
    });
    
    // Aggregate to get the latest message per conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userObjectId }, { recipient: userObjectId }]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$recipient", userObjectId] }, { $eq: ["$isRead", false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { "lastMessage.timestamp": -1 }
      }
    ]);

    // Populate user info for each conversation
    const results = await Promise.all(conversations.map(async (conv) => {
      const lastMessage = conv.lastMessage;
      const otherUserId = lastMessage.sender.toString() === userId ? lastMessage.recipient.toString() : lastMessage.sender.toString();
      
      const user = await User.findById(otherUserId).select('email role refId');
      if (!user) {
        return null;
      }
      
      // Get the display name based on user role
      let displayName = user.email; // Fallback to email
      if (user.refId) {
        try {
          if (user.role === 'volunteer') {
            const Volunteer = require('../models/Volunteer');
            const volunteer = await Volunteer.findById(user.refId);
            if (volunteer && volunteer.fullName) {
              displayName = volunteer.fullName;
            }
          } else if (user.role === 'ngo') {
            const NGO = require('../models/NGO');
            const ngo = await NGO.findById(user.refId);
            if (ngo && ngo.organizationName) {
              displayName = ngo.organizationName;
            }
          }
        } catch (err) {
          console.warn(`Error fetching profile for user ${otherUserId}:`, err);
        }
      }
      
      return {
        conversationId: conv._id,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          displayName: displayName || user.email // Ensure we always have a fallback
        },
        lastMessage: lastMessage,
        unreadCount: conv.unreadCount
      };
    }));

    // Filter out null results (where user wasn't found)
    const filteredResults = results.filter(result => result !== null);
    
    res.json(filteredResults);
  } catch (err) {
    console.error('Error loading inbox:', err);
    res.status(500).json({ error: 'Failed to load inbox' });
  }
});

// GET /messages/conversation/:userId — full chat history with specific user
router.get('/conversation/:userId', requireAuth, async (req, res) => {
  const currentUser = req.user.userId;
  const otherUser = req.params.userId;

  try {
    const conversationId = generateConversationId(currentUser, otherUser);
    
    const conversation = await Message.find({ conversationId })
      .sort({ timestamp: 1 }); // oldest to newest

    res.json(conversation);
  } catch (err) {
    console.error('Error loading conversation:', err);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

// GET /messages/unread-count — get total unread message count for current user
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // First, clean up any orphaned messages from deleted users
    const orphanedMessages = await Message.find({
      recipient: userId,
      isRead: false
    }).populate('sender', '_id');
    
    // Filter out messages where sender lookup failed (deleted users)
    const messagesToCleanup = orphanedMessages.filter(msg => !msg.sender);
    
    if (messagesToCleanup.length > 0) {
      const orphanedIds = messagesToCleanup.map(msg => msg._id);
      await Message.deleteMany({ _id: { $in: orphanedIds } });
      console.log(`Cleaned up ${orphanedIds.length} orphaned messages from deleted users`);
    }
    
    // Now get the accurate unread count
    const unreadCount = await Message.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error('Error getting unread count:', err);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// PATCH /messages/:messageId/read — mark a specific message as read
router.patch('/:messageId/read', requireAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findOneAndUpdate(
      { 
        _id: messageId, 
        recipient: userId, // Only recipient can mark as read
        isRead: false // Only update if not already read
      },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found or already read' });
    }

    res.json({ message: 'Message marked as read', data: message });
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// PATCH /messages/mark-read/:userId — mark all messages from a specific user as read
router.patch('/mark-read/:userId', requireAuth, async (req, res) => {
  try {
    const currentUser = req.user.userId;
    const otherUser = req.params.userId;
    const conversationId = generateConversationId(currentUser, otherUser);

    const result = await Message.updateMany(
      {
        conversationId,
        recipient: currentUser, // Only mark messages sent TO current user
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ 
      message: 'Messages marked as read', 
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// GET /messages/user-id/:profileId — Get User ID from profile ID
router.get('/user-id/:profileId', requireAuth, async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const user = await User.findOne({ refId: profileId }).select('_id email role refId');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found for this profile' });
    }

    // Get the display name based on user role
    let displayName = user.email; // Fallback to email
    if (user.refId) {
      try {
        if (user.role === 'volunteer') {
          const Volunteer = require('../models/Volunteer');
          const volunteer = await Volunteer.findById(user.refId);
          if (volunteer && volunteer.fullName) {
            displayName = volunteer.fullName;
          }
        } else if (user.role === 'ngo') {
          const NGO = require('../models/NGO');
          const ngo = await NGO.findById(user.refId);
          if (ngo && ngo.organizationName) {
            displayName = ngo.organizationName;
          }
        }
      } catch (err) {
        console.warn(`Error fetching profile for user ${user._id}:`, err);
      }
    }

    res.json({ 
      userId: user._id,
      email: user.email,
      role: user.role,
      displayName: displayName || user.email // Ensure we always have a fallback
    });
  } catch (err) {
    console.error('Error finding user for profile:', err);
    res.status(500).json({ error: 'Failed to find user' });
  }
});

// POST /messages/cleanup-orphaned — Clean up messages from deleted users
router.post('/cleanup-orphaned', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find all messages where the sender or recipient no longer exists
    const allMessages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }]
    }).populate('sender recipient', '_id');
    
    const orphanedMessages = allMessages.filter(msg => !msg.sender || !msg.recipient);
    
    if (orphanedMessages.length > 0) {
      const orphanedIds = orphanedMessages.map(msg => msg._id);
      await Message.deleteMany({ _id: { $in: orphanedIds } });
      
      res.json({ 
        message: 'Orphaned messages cleaned up successfully', 
        deletedCount: orphanedIds.length,
        deletedMessageIds: orphanedIds
      });
    } else {
      res.json({ 
        message: 'No orphaned messages found', 
        deletedCount: 0 
      });
    }
  } catch (err) {
    console.error('Error cleaning up orphaned messages:', err);
    res.status(500).json({ error: 'Failed to cleanup orphaned messages' });
  }
});

// GET /messages/debug - Debug endpoint to check messages
router.get('/debug', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const mongoose = require('mongoose');
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all messages for this user
    const allMessages = await Message.find({
      $or: [{ sender: userObjectId }, { recipient: userObjectId }]
    }).sort({ timestamp: -1 });

    // Check conversation IDs
    const conversationIds = [...new Set(allMessages.map(msg => msg.conversationId))];
    
    // Generate expected conversation IDs for verification
    const userIds = [...new Set(allMessages.flatMap(msg => [
      msg.sender.toString(), 
      msg.recipient.toString()
    ]))].filter(id => id !== userId);

    const expectedConversationIds = userIds.map(otherId => ({
      otherId,
      expectedId: generateConversationId(userId, otherId)
    }));

    res.json({
      userId,
      totalMessages: allMessages.length,
      messages: allMessages.slice(0, 3), // First 3 messages for inspection
      conversationIds,
      expectedConversationIds,
      messagesWithConversationId: allMessages.filter(msg => msg.conversationId).length,
      messagesWithoutConversationId: allMessages.filter(msg => !msg.conversationId).length
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: 'Debug failed', details: err.message });
  }
});

module.exports = router;
