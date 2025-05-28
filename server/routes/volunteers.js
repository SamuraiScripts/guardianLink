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
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

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

    // Find all User documents with role 'volunteer' that have a refId
    const volunteerUsers = await User.find({ role: 'volunteer', refId: { $ne: null } }).select('refId');
    const linkedVolunteerProfileIds = volunteerUsers.map(user => user.refId);

    if (linkedVolunteerProfileIds.length === 0) {
      return res.json([]); // No linked volunteer profiles found
    }

    const filters = {
      _id: { $in: linkedVolunteerProfileIds } // Only fetch Volunteers linked to a user
    };

    if (minHours && !isNaN(Number(minHours))) {
      filters.weeklyAvailability = { $gte: Number(minHours) };
    }
    if (expertise) {
      // Assuming expertise is a string for $in, adjust if it can be an array or needs regex
      filters.areasOfExpertise = { $in: Array.isArray(expertise) ? expertise : [expertise] };
    }

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

  let newResumeFilePath = null;
  if (req.file) {
    newResumeFilePath = req.file.path;
  }

  try {
    let volunteer;
    let isNewProfile = false;

    if (req.user.refId) {
      // Edit existing profile
      volunteer = await Volunteer.findById(req.user.refId);
      if (!volunteer) {
        if (newResumeFilePath) fs.unlinkSync(newResumeFilePath);
        return res.status(404).json({ error: 'Volunteer profile not found' });
      }

      const originalResumeUrl = volunteer.resumeUrl;

      // Update fields from request body
      if (fullName) volunteer.fullName = fullName;
      if (email) volunteer.email = email;
      if (weeklyAvailability) volunteer.weeklyAvailability = weeklyAvailability;
      if (areasOfExpertise) {
        volunteer.areasOfExpertise = Array.isArray(areasOfExpertise)
          ? areasOfExpertise
          : typeof areasOfExpertise === 'string' 
            ? areasOfExpertise.split(',').map(s => s.trim()).filter(s => s)
            : [];
      }
      
      if (newResumeFilePath) {
        volunteer.resumeUrl = `/uploads/resumes/${req.file.filename}`;
      }

      try {
        await volunteer.save();
        if (newResumeFilePath && originalResumeUrl && originalResumeUrl !== volunteer.resumeUrl) {
          const oldResumePath = path.join(__dirname, '../', originalResumeUrl);
          if (fs.existsSync(oldResumePath)) {
            fs.unlink(oldResumePath, (err) => {
              if (err) console.error('Failed to delete old resume during update:', err);
              else console.log('Successfully deleted old resume during update:', oldResumePath);
            });
          }
        }
      } catch (saveError) {
        if (newResumeFilePath) {
          fs.unlink(newResumeFilePath, (unlinkErr) => {
            if (unlinkErr) console.error('Failed to delete new resume after save error:', unlinkErr);
            else console.log('Cleaned up new resume after save error:', newResumeFilePath);
          });
        }
        throw saveError;
      }

    } else {
      // Create new profile + link to User
      isNewProfile = true;
      if (!fullName || !email || !weeklyAvailability) {
        if (newResumeFilePath) fs.unlinkSync(newResumeFilePath);
        return res.status(400).json({ error: 'Missing required fields for profile creation (fullName, email, weeklyAvailability).' });
      }
      volunteer = new Volunteer({
        fullName,
        email,
        weeklyAvailability,
        backgroundCheck: true,
        areasOfExpertise: Array.isArray(areasOfExpertise)
          ? areasOfExpertise
          : typeof areasOfExpertise === 'string' 
            ? areasOfExpertise.split(',').map(s => s.trim()).filter(s => s)
            : [],
        resumeUrl: newResumeFilePath ? `/uploads/resumes/${req.file.filename}` : null
      });
      
      try {
        await volunteer.save();
      } catch (saveError) {
         if (newResumeFilePath) {
            fs.unlink(newResumeFilePath, (unlinkErr) => {
                if (unlinkErr) console.error('Failed to delete new resume after save error (new profile):', unlinkErr);
                else console.log('Cleaned up new resume after save error (new profile):', newResumeFilePath);
            });
        }
        throw saveError;
      }
      await User.findByIdAndUpdate(req.user.userId, { refId: volunteer._id });
    }

    if (isNewProfile) {
      const updatedUser = await User.findById(req.user.userId);
      const newToken = jwt.sign(
        { userId: updatedUser._id, role: updatedUser.role, refId: updatedUser.refId, email: updatedUser.email },
        JWT_SECRET,
        { expiresIn: '2h' }
      );
      return res.json({ 
        message: 'Volunteer profile created and updated successfully', 
        volunteer, 
        token: newToken 
      });
    } else {
      return res.json({ message: 'Volunteer profile updated', volunteer });
    }
  } catch (err) {
    console.error('Error updating Volunteer profile:', err.message, err.stack);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message, details: err.errors });
    }
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
