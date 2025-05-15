const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const router = express.Router();
const bcrypt = require('bcryptjs');
const NGO = require('../models/NGO');
const User = require('../models/User');

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

    const ngo = new NGO({
      organizationName,
      email,
      areasOfConcern
    });
    const savedNGO = await ngo.save();

    const user = new User({
      email,
      password: hashedPassword,
      role: 'ngo',
      refId: savedNGO._id
    });
    const savedUser = await user.save();

    res.status(201).json({
      message: 'NGO registered successfully',
      userId: savedUser._id,
      ngoId: savedNGO._id
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

// PATCH /ngos/me — Edit own NGO Profile
router.patch('/me', requireAuth, requireRole('ngo'), async (req, res) => {
  const { organizationName, email, areasOfConcern } = req.body;

  try {
    const ngo = await NGO.findById(req.user.refId);
    if (!ngo) return res.status(404).json({ error: 'NGO profile not found' });

    if (organizationName) ngo.organizationName = organizationName;
    if (areasOfConcern) ngo.areasOfConcern = areasOfConcern;
    await ngo.save();

    if (email) {
      await User.findByIdAndUpdate(
        req.user.userId,
        { email: email.toLowerCase().trim() },
        { new: true }
      );
    }

    const updatedUser = await User.findById(req.user.userId);
    res.json({
    organizationName: ngo.organizationName,
    areasOfConcern: ngo.areasOfConcern,
    email: updatedUser.email
});
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
