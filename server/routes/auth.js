const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  });
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, confirmPassword } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, password, and name are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return success response
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: errors.join(', ')
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Handle demo account - works without MongoDB
    if (email === 'demo@whchat.com' && password === 'demo123') {
      // Create demo user object (no database needed)
      const demoUser = {
        _id: 'demo-user-id-12345',
        name: 'Demo User',
        email: 'demo@whchat.com',
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date()
      };

      // Generate token
      const token = generateToken(demoUser._id);

      return res.json({
        message: 'Demo login successful',
        token,
        user: demoUser
      });
    }

    // For non-demo accounts, try database operations
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Update user online status
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      // Return success response
      res.json({
        message: 'Login successful',
        token,
        user: user.toPublicJSON()
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        error: 'Database connection error. Please try the demo account or check server configuration.'
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      const user = await User.findById(decoded.userId);
      
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date();
        await user.save();
      }
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({ message: 'Logout successful' }); // Still return success even if token is invalid
  }
});

// Get current user endpoint
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Middleware to authenticate requests
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Demo data seeding endpoint
router.post('/seed-demo', async (req, res) => {
  try {
    // Create demo users if they don't exist
    const demoUsers = [
      { name: 'Demo User', email: 'demo@whchat.com', password: 'demo123' },
      { name: 'Alice Johnson', email: 'alice@whchat.com', password: 'demo123' },
      { name: 'Bob Smith', email: 'bob@whchat.com', password: 'demo123' },
      { name: 'Carol Davis', email: 'carol@whchat.com', password: 'demo123' },
      { name: 'David Wilson', email: 'david@whchat.com', password: 'demo123' }
    ];

    const createdUsers = [];
    
    for (const userData of demoUsers) {
      let user = await User.findByEmail(userData.email);
      if (!user) {
        user = new User(userData);
        await user.save();
      }
      createdUsers.push(user);
    }

    // Create demo messages between users
    const Message = require('../models/Message');
    const demoUser = createdUsers[0]; // Demo User
    const alice = createdUsers[1];
    const bob = createdUsers[2];
    const carol = createdUsers[3];

    const demoMessages = [
      // Conversation with Alice
      { sender: alice._id, recipient: demoUser._id, content: "Hey! Welcome to WhChat! 👋", createdAt: new Date(Date.now() - 3600000) },
      { sender: demoUser._id, recipient: alice._id, content: "Hi Alice! Thanks for the warm welcome!", createdAt: new Date(Date.now() - 3500000) },
      { sender: alice._id, recipient: demoUser._id, content: "How are you finding the app so far?", createdAt: new Date(Date.now() - 3400000) },
      { sender: demoUser._id, recipient: alice._id, content: "It's amazing! The interface is so clean and modern ✨", createdAt: new Date(Date.now() - 3300000) },
      { sender: alice._id, recipient: demoUser._id, content: "I'm glad you like it! The real-time messaging is super fast too 🚀", createdAt: new Date(Date.now() - 1800000) },
      
      // Conversation with Bob
      { sender: bob._id, recipient: demoUser._id, content: "Hey there! I'm Bob, nice to meet you!", createdAt: new Date(Date.now() - 7200000) },
      { sender: demoUser._id, recipient: bob._id, content: "Nice to meet you too, Bob! 😊", createdAt: new Date(Date.now() - 7100000) },
      { sender: bob._id, recipient: demoUser._id, content: "Are you enjoying WhChat?", createdAt: new Date(Date.now() - 7000000) },
      { sender: demoUser._id, recipient: bob._id, content: "Absolutely! The design is incredible", createdAt: new Date(Date.now() - 6900000) },
      { sender: bob._id, recipient: demoUser._id, content: "Right? And it's so responsive! 💨", createdAt: new Date(Date.now() - 900000) },
      
      // Conversation with Carol
      { sender: carol._id, recipient: demoUser._id, content: "Hi! I heard you're new here. Welcome! 🎉", createdAt: new Date(Date.now() - 10800000) },
      { sender: demoUser._id, recipient: carol._id, content: "Thank you Carol! Everyone here is so friendly", createdAt: new Date(Date.now() - 10700000) },
      { sender: carol._id, recipient: demoUser._id, content: "That's what makes WhChat special - great community! 💙", createdAt: new Date(Date.now() - 600000) }
    ];

    // Check if messages already exist to avoid duplicates
    for (const msgData of demoMessages) {
      const existingMessage = await Message.findOne({
        sender: msgData.sender,
        recipient: msgData.recipient,
        content: msgData.content
      });
      
      if (!existingMessage) {
        const message = new Message(msgData);
        await message.save();
      }
    }

    res.json({
      message: 'Demo data seeded successfully',
      users: createdUsers.length,
      messages: demoMessages.length
    });

  } catch (error) {
    console.error('Demo seeding error:', error);
    res.status(500).json({
      error: 'Failed to seed demo data'
    });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
