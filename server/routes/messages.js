const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const User = require('../models/User');
const router = express.Router();

// POST /messages/send
router.post('/send', requireAuth, async (req, res) => {
  const { recipient, content } = req.body;

  if (!recipient || !content) {
    return res.status(400).json({ error: 'Recipient and content are required' });
  }

  try {
    const newMessage = new Message({
      sender: req.user.userId,
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

    // Find all messages where user is sender or recipient
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }]
    }).sort({ timestamp: -1 });

    const threads = new Map();

    for (const msg of messages) {
      const otherUser = msg.sender.toString() === userId ? msg.recipient.toString() : msg.sender.toString();
      if (!threads.has(otherUser)) {
        threads.set(otherUser, msg);
      }
    }

    // Convert to array and populate user info
    const results = await Promise.all([...threads.entries()].map(async ([userId, message]) => {
      const user = await User.findById(userId).select('email role');
      return {
        user: {
          _id: user._id,
          email: user.email,
          role: user.role
        },
        lastMessage: message
      };
    }));

    res.json(results);
  } catch (err) {
    console.error('Error loading inbox:', err);
    res.status(500).json({ error: 'Failed to load inbox' });
  }
});

// GET /messages/:userId — full chat history with specific user
router.get('/:userId', requireAuth, async (req, res) => {
  const currentUser = req.user.userId;
  const otherUser = req.params.userId;

  try {
    const conversation = await Message.find({
      $or: [
        { sender: currentUser, recipient: otherUser },
        { sender: otherUser, recipient: currentUser }
      ]
    }).sort({ timestamp: 1 }); // oldest to newest

    res.json(conversation);
  } catch (err) {
    console.error('Error loading conversation:', err);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

module.exports = router;
