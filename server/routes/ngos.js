const express = require('express');
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

// GET
router.get('/', async (req, res) => {
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

// DELETE /ngos/:id — Delete NGO profile by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await NGO.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'NGO not found' });
    res.json({ message: 'NGO deleted', deleted });
  } catch (err) {
    console.error('Error deleting NGO:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
