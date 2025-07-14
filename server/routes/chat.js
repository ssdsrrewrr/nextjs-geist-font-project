const express = require('express');
const { authenticateToken } = require('./auth');
const User = require('../models/User');
const Message = require('../models/Message');

const router = express.Router();

// Get all users (contacts) - excluding current user
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // Handle demo user - return demo contacts
    if (req.user._id === 'demo-user-id-12345') {
      const demoUsers = [
        {
          _id: 'alice-demo-id',
          name: 'Alice Johnson',
          email: 'alice@whchat.com',
          isOnline: true,
          lastSeen: new Date()
        },
        {
          _id: 'bob-demo-id',
          name: 'Bob Smith',
          email: 'bob@whchat.com',
          isOnline: false,
          lastSeen: new Date(Date.now() - 300000) // 5 minutes ago
        },
        {
          _id: 'carol-demo-id',
          name: 'Carol Davis',
          email: 'carol@whchat.com',
          isOnline: true,
          lastSeen: new Date()
        },
        {
          _id: 'david-demo-id',
          name: 'David Wilson',
          email: 'david@whchat.com',
          isOnline: false,
          lastSeen: new Date(Date.now() - 1800000) // 30 minutes ago
        }
      ];
      return res.json({ users: demoUsers });
    }

    // For non-demo users, try database
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name email isOnline lastSeen')
      .sort({ name: 1 });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get recent conversations for current user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    // Handle demo user conversations
    if (req.user._id === 'demo-user-id-12345') {
      const demoConversations = [
        {
          contact: {
            _id: 'alice-demo-id',
            name: 'Alice Johnson',
            email: 'alice@whchat.com',
            isOnline: true,
            lastSeen: new Date()
          },
          lastMessage: {
            _id: 'msg5',
            content: "I'm glad you like it! The real-time messaging is super fast too 🚀",
            createdAt: new Date(Date.now() - 1800000),
            sender: 'alice-demo-id'
          },
          unreadCount: 0
        },
        {
          contact: {
            _id: 'bob-demo-id',
            name: 'Bob Smith',
            email: 'bob@whchat.com',
            isOnline: false,
            lastSeen: new Date(Date.now() - 300000)
          },
          lastMessage: {
            _id: 'msg10',
            content: "Right? And it's so responsive! 💨",
            createdAt: new Date(Date.now() - 900000),
            sender: 'bob-demo-id'
          },
          unreadCount: 0
        },
        {
          contact: {
            _id: 'carol-demo-id',
            name: 'Carol Davis',
            email: 'carol@whchat.com',
            isOnline: true,
            lastSeen: new Date()
          },
          lastMessage: {
            _id: 'msg13',
            content: "That's what makes WhChat special - great community! 💙",
            createdAt: new Date(Date.now() - 600000),
            sender: 'carol-demo-id'
          },
          unreadCount: 0
        }
      ];
      return res.json({ conversations: demoConversations });
    }

    // For non-demo users, try database
    const conversations = await Message.getRecentConversations(req.user._id);
    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get conversation history between current user and another user
router.get('/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Handle demo user conversations
    if (req.user._id === 'demo-user-id-12345') {
      const demoUsers = {
        'alice-demo-id': { _id: 'alice-demo-id', name: 'Alice Johnson', email: 'alice@whchat.com', isOnline: true, lastSeen: new Date() },
        'bob-demo-id': { _id: 'bob-demo-id', name: 'Bob Smith', email: 'bob@whchat.com', isOnline: false, lastSeen: new Date(Date.now() - 300000) },
        'carol-demo-id': { _id: 'carol-demo-id', name: 'Carol Davis', email: 'carol@whchat.com', isOnline: true, lastSeen: new Date() },
        'david-demo-id': { _id: 'david-demo-id', name: 'David Wilson', email: 'david@whchat.com', isOnline: false, lastSeen: new Date(Date.now() - 1800000) }
      };

      const otherUser = demoUsers[userId];
      if (!otherUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      let demoMessages = [];

      // Generate demo messages based on user
      if (userId === 'alice-demo-id') {
        demoMessages = [
          {
            _id: 'msg1',
            sender: { _id: 'alice-demo-id', name: 'Alice Johnson', email: 'alice@whchat.com' },
            recipient: 'demo-user-id-12345',
            content: "Hey! Welcome to WhChat! 👋",
            createdAt: new Date(Date.now() - 3600000),
            isRead: true
          },
          {
            _id: 'msg2',
            sender: { _id: 'demo-user-id-12345', name: 'Demo User', email: 'demo@whchat.com' },
            recipient: 'alice-demo-id',
            content: "Hi Alice! Thanks for the warm welcome!",
            createdAt: new Date(Date.now() - 3500000),
            isRead: true
          },
          {
            _id: 'msg3',
            sender: { _id: 'alice-demo-id', name: 'Alice Johnson', email: 'alice@whchat.com' },
            recipient: 'demo-user-id-12345',
            content: "How are you finding the app so far?",
            createdAt: new Date(Date.now() - 3400000),
            isRead: true
          },
          {
            _id: 'msg4',
            sender: { _id: 'demo-user-id-12345', name: 'Demo User', email: 'demo@whchat.com' },
            recipient: 'alice-demo-id',
            content: "It's amazing! The interface is so clean and modern ✨",
            createdAt: new Date(Date.now() - 3300000),
            isRead: true
          },
          {
            _id: 'msg5',
            sender: { _id: 'alice-demo-id', name: 'Alice Johnson', email: 'alice@whchat.com' },
            recipient: 'demo-user-id-12345',
            content: "I'm glad you like it! The real-time messaging is super fast too 🚀",
            createdAt: new Date(Date.now() - 1800000),
            isRead: true
          }
        ];
      } else if (userId === 'bob-demo-id') {
        demoMessages = [
          {
            _id: 'msg6',
            sender: { _id: 'bob-demo-id', name: 'Bob Smith', email: 'bob@whchat.com' },
            recipient: 'demo-user-id-12345',
            content: "Hey there! I'm Bob, nice to meet you!",
            createdAt: new Date(Date.now() - 7200000),
            isRead: true
          },
          {
            _id: 'msg7',
            sender: { _id: 'demo-user-id-12345', name: 'Demo User', email: 'demo@whchat.com' },
            recipient: 'bob-demo-id',
            content: "Nice to meet you too, Bob! 😊",
            createdAt: new Date(Date.now() - 7100000),
            isRead: true
          },
          {
            _id: 'msg8',
            sender: { _id: 'bob-demo-id', name: 'Bob Smith', email: 'bob@whchat.com' },
            recipient: 'demo-user-id-12345',
            content: "Are you enjoying WhChat?",
            createdAt: new Date(Date.now() - 7000000),
            isRead: true
          },
          {
            _id: 'msg9',
            sender: { _id: 'demo-user-id-12345', name: 'Demo User', email: 'demo@whchat.com' },
            recipient: 'bob-demo-id',
            content: "Absolutely! The design is incredible",
            createdAt: new Date(Date.now() - 6900000),
            isRead: true
          },
          {
            _id: 'msg10',
            sender: { _id: 'bob-demo-id', name: 'Bob Smith', email: 'bob@whchat.com' },
            recipient: 'demo-user-id-12345',
            content: "Right? And it's so responsive! 💨",
            createdAt: new Date(Date.now() - 900000),
            isRead: true
          }
        ];
      } else if (userId === 'carol-demo-id') {
        demoMessages = [
          {
            _id: 'msg11',
            sender: { _id: 'carol-demo-id', name: 'Carol Davis', email: 'carol@whchat.com' },
            recipient: 'demo-user-id-12345',
            content: "Hi! I heard you're new here. Welcome! 🎉",
            createdAt: new Date(Date.now() - 10800000),
            isRead: true
          },
          {
            _id: 'msg12',
            sender: { _id: 'demo-user-id-12345', name: 'Demo User', email: 'demo@whchat.com' },
            recipient: 'carol-demo-id',
            content: "Thank you Carol! Everyone here is so friendly",
            createdAt: new Date(Date.now() - 10700000),
            isRead: true
          },
          {
            _id: 'msg13',
            sender: { _id: 'carol-demo-id', name: 'Carol Davis', email: 'carol@whchat.com' },
            recipient: 'demo-user-id-12345',
            content: "That's what makes WhChat special - great community! 💙",
            createdAt: new Date(Date.now() - 600000),
            isRead: true
          }
        ];
      }

      return res.json({
        messages: demoMessages,
        otherUser: otherUser
      });
    }

    // For non-demo users, try database
    // Validate that the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get conversation messages
    const messages = await Message.getConversation(
      req.user._id,
      userId,
      parseInt(limit),
      skip
    );

    // Mark messages as read (messages sent to current user)
    await Message.updateMany(
      {
        sender: userId,
        recipient: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      otherUser: otherUser.toPublicJSON()
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message (REST endpoint as backup to Socket.IO)
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { recipient, content } = req.body;

    if (!recipient || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }

    // Validate recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Create message
    const message = new Message({
      sender: req.user._id,
      recipient,
      content: content.trim()
    });

    await message.save();
    await message.populate('sender', 'name email');
    await message.populate('recipient', 'name email');

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.patch('/messages/read/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      {
        sender: userId,
        recipient: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Search users
router.get('/search/users', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name email isOnline lastSeen')
    .limit(20);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

module.exports = router;
