const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NGO = require('../models/NGO');
const Volunteer = require('../models/Volunteer');
const fs = require('fs');
const path = require('path');
const JWT_SECRET = process.env.JWT_SECRET;

// POST /auth/login — Authenticate user and return token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, role: user.role, refId: user.refId },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        refId: user.refId
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /auth/users — Admin only list of all users
router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// GET /auth/me — Get current user's account info (for Admins)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user info:', err);
    res.status(500).json({ error: 'Server error fetching user info' });
  }
});

// POST /auth/users - Admin creates a user of specified role, but with a blank profile
router.post('/users', requireAuth, requireRole('admin'), async (req, res) => {
  const { email, password, role } = req.body;

  const allowedRoles = ['volunteer', 'ngo', 'admin'];
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed,
      role,
      refId: null // profile can be created separately after login
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      userId: user._id,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// DELETE /auth/users/:id — Admin deletes user
router.delete('/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete linked profile and associated files if they exist
    if (user.role === 'volunteer' && user.refId) {
      const volunteerProfile = await Volunteer.findById(user.refId);
      if (volunteerProfile) {
        if (volunteerProfile.resumeUrl) {
          const resumePath = path.join(__dirname, '..', volunteerProfile.resumeUrl); 
          // Ensure path is correct relative to project root (uploads folder is in server/uploads)
          // If volunteerProfile.resumeUrl is like '/uploads/resumes/file.pdf',
          // then path.join(__dirname, '..', volunteerProfile.resumeUrl) should correctly point to server/uploads/resumes/file.pdf
          // as __dirname is server/routes
          if (fs.existsSync(resumePath)) {
             fs.unlink(resumePath, (err) => {
                if (err) console.error('Error deleting resume file during user deletion by admin:', err);
                else console.log('Successfully deleted resume file by admin:', resumePath);
            });
          } else {
            console.warn('Resume file not found at path for deletion:', resumePath);
          }
        }
        await Volunteer.findByIdAndDelete(user.refId);
      }
    } else if (user.role === 'ngo' && user.refId) {
      // NGOs don't have associated files like resumes in this system to delete from filesystem
      await NGO.findByIdAndDelete(user.refId);
    }

    // Then delete the user
    await user.deleteOne();

    res.json({ message: 'User and linked profile (and associated files) deleted', user });
  } catch (err) {
    console.error('Error deleting user by admin:', err);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// PATCH /auth/users/:id/role — Admin changes a user's role
router.patch('/users/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
  const { newRole } = req.body;

  const allowedRoles = ['volunteer', 'ngo', 'admin'];
  if (!allowedRoles.includes(newRole)) {
    return res.status(400).json({ error: 'Invalid role provided' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent admin from demoting themselves
    if (user._id.equals(req.user.userId)) {
      return res.status(403).json({ error: 'Admins cannot change their own role' });
    }

    user.role = newRole;
    await user.save();

    res.json({ message: 'Role updated', userId: user._id, newRole: user.role });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Server error updating role' });
  }
});

// PATCH /auth/users/:id/password - Admin resets a user's password
router.patch('/users/:id/password', requireAuth, requireRole('admin'), async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent admin from resetting their own password through this endpoint
    if (user._id.equals(req.user.userId)) {
      return res.status(403).json({ error: 'Admins cannot reset their own password this way' });
    }

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    await user.save();

    res.json({ message: 'Password reset successful', userId: user._id });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: 'Server error resetting password' });
  }
});

module.exports = router;
