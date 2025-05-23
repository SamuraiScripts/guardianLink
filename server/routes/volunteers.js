const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Volunteer = require('../models/Volunteer');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure Multer storage for resumes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/resumes'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF or Word documents allowed'));
  }
});

// POST /volunteers — Register Volunteer + User
router.post('/', upload.single('resume'), async (req, res) => {
  const {
    fullName,
    email,
    password,
    weeklyAvailability,
    backgroundCheck,
    areasOfExpertise
  } = req.body;

  const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : null;

  // Validate required fields + attestation checkbox
  if (
  !fullName ||
  !email ||
  !password ||
  !weeklyAvailability ||
  !resumeUrl ||
  !areasOfExpertise ||
  backgroundCheck !== 'true'
  ) {
  // Delete orphaned resume if it was uploaded but the request is invalid
  if (req.file) {
    fs.unlink(path.join(__dirname, '../uploads/resumes', req.file.filename), (err) => {
      if (err) console.error('Failed to delete orphaned resume:', err);
    });
  }

  return res.status(400).json({ error: 'Missing required fields or background check not passed' });
  }

  try {
    // Ensure email is unique
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create volunteer profile
    const volunteer = new Volunteer({
      fullName,
      email,
      weeklyAvailability,
      resumeUrl,
      backgroundCheck: true, // we validated it's 'true'
      areasOfExpertise: Array.isArray(areasOfExpertise)
        ? areasOfExpertise
        : areasOfExpertise
        ? [areasOfExpertise]
        : []
    });

    const savedVolunteer = await volunteer.save();

    // Create user for login
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

// GET /volunteers - Displays list of Volunteers in database (only NGOs and Admins can access this, for their respective dashboards)
router.get('/', requireAuth, requireRole('ngo', 'admin'), async (req, res) => {
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

// GET /volunteers/me — Get current Volunteer profile
router.get('/me', requireAuth, requireRole('volunteer'), async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.user.refId);
    if (!volunteer) return res.status(404).json({ error: 'Volunteer profile not found' });
    res.json(volunteer);
  } catch (err) {
    console.error('Error fetching Volunteer profile:', err);
    res.status(500).json({ error: 'Server error fetching Volunteer profile' });
  }
});

// PATCH /volunteers/me - Edit own Volunteer profile
router.patch('/me', requireAuth, requireRole('volunteer'), upload.single('resume'), async (req, res) => {
  const {
    fullName,
    email,
    weeklyAvailability,
    areasOfExpertise
  } = req.body;

  const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : null;

  try {
    let volunteer;

    if (req.user.refId) {
      // Edit existing profile
      volunteer = await Volunteer.findById(req.user.refId);
      if (!volunteer) return res.status(404).json({ error: 'Volunteer profile not found' });

      if (fullName) volunteer.fullName = fullName;
      if (weeklyAvailability) volunteer.weeklyAvailability = weeklyAvailability;
      if (areasOfExpertise) volunteer.areasOfExpertise = Array.isArray(areasOfExpertise)
        ? areasOfExpertise
        : [areasOfExpertise];
      if (resumeUrl) volunteer.resumeUrl = resumeUrl;

      await volunteer.save();
    } else {
      // Create new profile + link to User
      volunteer = new Volunteer({
        fullName,
        email,
        weeklyAvailability,
        backgroundCheck: true, // assumed already passed if profile being edited
        areasOfExpertise: Array.isArray(areasOfExpertise)
          ? areasOfExpertise
          : [areasOfExpertise],
        resumeUrl
      });
      await volunteer.save();

      await User.findByIdAndUpdate(req.user.userId, { refId: volunteer._id });
    }

    // Always update user email
    if (email) {
      await User.findByIdAndUpdate(req.user.userId, {
        email: email.toLowerCase().trim()
      });
    }

    res.json({ message: 'Volunteer profile updated', volunteer });
  } catch (err) {
    console.error('Error updating Volunteer profile:', err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// DELETE /volunteers/me - Delete own Volunteer profile
router.delete('/me', requireAuth, requireRole('volunteer'), async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.user.refId);
    if (!volunteer) return res.status(404).json({ error: 'Volunteer profile not found' });

    // Delete resume file if it exists
    if (volunteer.resumeUrl) {
      const filePath = path.join(__dirname, '../', volunteer.resumeUrl);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete resume file:', err);
      });
    }

    // Delete Volunteer profile
    await Volunteer.findByIdAndDelete(req.user.refId);

    // Delete associated User account
    await User.findByIdAndDelete(req.user.userId);

    res.json({ message: 'Volunteer account and profile deleted successfully' });
  } catch (err) {
    console.error('Error deleting volunteer account:', err);
    res.status(500).json({ error: 'Server error deleting account' });
  }
});

module.exports = router;
