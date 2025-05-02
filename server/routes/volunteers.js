const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Volunteer = require('../models/Volunteer');
const User = require('../models/User');

// POST /volunteers — Register Volunteer + User
router.post('/', async (req, res) => {
  const {
    fullName,
    email,
    password,
    weeklyAvailability,
    resumeUrl,
    backgroundCheck,
    areasOfExpertise
  } = req.body;

  // Validate required fields
  if (!fullName || !email || !password || !weeklyAvailability) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if email is already used
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Volunteer profile
    const volunteer = new Volunteer({
      fullName,
      email,
      weeklyAvailability,
      resumeUrl,
      backgroundCheck,
      areasOfExpertise
    });
    const savedVolunteer = await volunteer.save();

    // Create User
    const user = new User({
      email,
      password: hashedPassword,
      role: 'volunteer',
      refId: savedVolunteer._id
    });
    const savedUser = await user.save();

    res.status(201).json({
      message: 'Volunteer registered successfully',
      userId: savedUser._id,
      volunteerId: savedVolunteer._id
    });
  } catch (err) {
    console.error('Error registering volunteer:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// GET
router.get('/', async (req, res) => {
  try {
    const { minHours, expertise } = req.query;

    const filters = {};
    if (minHours) filters.weeklyAvailability = { $gte: Number(minHours) };
    if (expertise) filters.areasOfExpertise = { $in: [expertise] };

    const volunteers = await Volunteer.find(filters);
    res.json(volunteers);
  } catch (err) {
    console.error('Error fetching volunteers:', err);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

// DELETE /volunteers/:id — Delete volunteer profile by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Volunteer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Volunteer not found' });
    res.json({ message: 'Volunteer deleted', deleted });
  } catch (err) {
    console.error('Error deleting volunteer:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
