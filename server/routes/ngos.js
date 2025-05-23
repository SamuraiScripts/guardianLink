const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const router = express.Router();
const bcrypt = require('bcryptjs');
const NGO = require('../models/NGO');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// POST /ngos — Register NGO + User
router.post('/', async (req, res) => {
  const {
    organizationName,
    email,
    password,
    areasOfConcern
  } = req.body;

  if (!organizationName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create NGO profile
    const ngo = new NGO({
      organizationName,
      email,
      areasOfConcern
    });
    const savedNGO = await ngo.save();

    // Create associated user
    const user = new User({
      email,
      password: hashedPassword,
      role: 'ngo',
      refId: savedNGO._id
    });
    const savedUser = await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: savedUser._id, role: savedUser.role, refId: savedUser.refId },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Return token to frontend
    res.status(201).json({
      message: 'NGO registered successfully',
      token
    });
  } catch (err) {
    console.error('Error registering NGO:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// GET /ngos - Displays list of NGOs in database (only Volunteers and Admins can access this, for their respective dashboards)
router.get('/', requireAuth, requireRole('volunteer', 'admin'), async (req, res) => {
  try {
    const { concern } = req.query;

    const filters = {};
    if (concern) filters.areasOfConcern = { $in: [concern] };

    const ngos = await NGO.find(filters);
    res.json(ngos);
  } catch (err) {
    console.error('Error fetching NGOs:', err);
    res.status(500).json({ error: 'Failed to fetch NGOs' });
  }
});

// GET /ngos/me — Get current NGO profile
router.get('/me', requireAuth, requireRole('ngo'), async (req, res) => {
  try {
    const ngo = await NGO.findById(req.user.refId);
    if (!ngo) return res.status(404).json({ error: 'NGO profile not found' });
    res.json(ngo);
  } catch (err) {
    console.error('Error fetching NGO profile:', err);
    res.status(500).json({ error: 'Server error fetching NGO profile' });
  }
});

// PATCH /ngos/me — Edit own NGO Profile
router.patch('/me', requireAuth, requireRole('ngo'), async (req, res) => {
  const { organizationName, email, areasOfConcern } = req.body;

  try {
    let ngo;

    if (req.user.refId) {
      // Edit existing profile
      ngo = await NGO.findById(req.user.refId);
      if (!ngo) return res.status(404).json({ error: 'NGO profile not found' });

      if (organizationName) ngo.organizationName = organizationName;
      if (areasOfConcern) ngo.areasOfConcern = areasOfConcern;
      await ngo.save();
    } else {
      // Create new profile + link to User
      ngo = new NGO({ organizationName, email, areasOfConcern });
      await ngo.save();

      await User.findByIdAndUpdate(req.user.userId, { refId: ngo._id });
    }

    // Always update user email
    if (email) {
      await User.findByIdAndUpdate(req.user.userId, {
        email: email.toLowerCase().trim()
      });
    }

    res.json({ message: 'NGO profile updated', ngo });
  } catch (err) {
    console.error('Error updating NGO profile:', err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// DELETE /ngos/me — Delete own NGO Account
router.delete('/me', requireAuth, requireRole('ngo'), async (req, res) => {
  try {
    // Delete profile
    await NGO.findByIdAndDelete(req.user.refId);

    // Delete linked user account
    await User.findByIdAndDelete(req.user.userId);

    res.json({ message: 'NGO account and user deleted' });
  } catch (err) {
    console.error('Error deleting NGO account:', err);
    res.status(500).json({ error: 'Server error deleting account' });
  }
});

module.exports = router;
