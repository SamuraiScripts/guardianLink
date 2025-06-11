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
      { userId: savedUser._id, role: savedUser.role, refId: savedUser.refId, email: savedUser.email },
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
    if (savedNGO && !savedUser) { 
        await NGO.findByIdAndDelete(savedNGO._id);
        return res.status(500).json({ error: 'Server error: Could not create user for NGO profile.'})
    }
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// GET /ngos - Displays list of NGOs in database (only Volunteers and Admins can access this, for their respective dashboards)
router.get('/', requireAuth, requireRole('volunteer', 'admin'), async (req, res) => {
  try {
    const { concern } = req.query;

    // Find all User documents with role 'ngo' that have a refId
    const ngoUsers = await User.find({ role: 'ngo', refId: { $ne: null } }).select('refId');
    const linkedNgoProfileIds = ngoUsers.map(user => user.refId);

    if (linkedNgoProfileIds.length === 0) {
      return res.json([]); // No linked NGO profiles found
    }

    const filters = {
      _id: { $in: linkedNgoProfileIds } // Only fetch NGOs linked to a user
    };
    if (concern) {
      // Ensure concern is treated as a regex for broader matching if it's a single string,
      // or handle array of concerns if your model/query supports it.
      // For simplicity, assuming 'concern' is a string to be matched within the array.
      // If 'areasOfConcern' is an array of strings, and you want to match any part,
      // you might need a regex or ensure the query parameter is processed accordingly.
      // The $in operator expects an array of exact matches or regex objects.
      // If 'concern' is a single string, we might want to match if it's one of the concerns.
      // If 'concern' is intended to be a substring search across all concerns, a $regex might be better.
      // For now, sticking to the original $in logic but it might need refinement based on exact matching needs.
      filters.areasOfConcern = { $in: Array.isArray(concern) ? concern : [concern] };
    }

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
    
    // Include email from associated User record
    const user = await User.findById(req.user.userId).select('email');
    const ngoWithEmail = {
      ...ngo.toObject(),
      email: user ? user.email : null
    };
    
    res.json(ngoWithEmail);
  } catch (err) {
    console.error('Error fetching NGO profile:', err);
    res.status(500).json({ error: 'Server error fetching NGO profile' });
  }
});

// PATCH /ngos/me — Edit own NGO Profile
router.patch('/me', requireAuth, requireRole('ngo'), async (req, res) => {
  const { organizationName, areasOfConcern } = req.body;

  try {
    let ngo;
    let isNewProfile = false;

    if (req.user.refId) {
      // Edit existing profile
      ngo = await NGO.findById(req.user.refId);
      if (!ngo) return res.status(404).json({ error: 'NGO profile not found' });

      if (organizationName) ngo.organizationName = organizationName;
      if (areasOfConcern) {
         ngo.areasOfConcern = Array.isArray(areasOfConcern) 
            ? areasOfConcern 
            : typeof areasOfConcern === 'string' 
              ? areasOfConcern.split(',').map(s => s.trim()).filter(s => s) 
              : [];
      }
      await ngo.save();
    } else {
      // Create new profile + link to User
      isNewProfile = true;
      if (!organizationName) {
        return res.status(400).json({ error: 'Organization name is required for new NGO profile.' });
      }
      ngo = new NGO({ 
        organizationName, 
        areasOfConcern: Array.isArray(areasOfConcern) 
            ? areasOfConcern 
            : typeof areasOfConcern === 'string' 
              ? areasOfConcern.split(',').map(s => s.trim()).filter(s => s) 
              : [] 
      });
      await ngo.save();
      await User.findByIdAndUpdate(req.user.userId, { refId: ngo._id });
    }

    if (isNewProfile) {
      const updatedUser = await User.findById(req.user.userId);
      const newToken = jwt.sign(
        { userId: updatedUser._id, role: updatedUser.role, refId: updatedUser.refId, email: updatedUser.email },
        JWT_SECRET,
        { expiresIn: '2h' }
      );
      return res.json({ 
        message: 'NGO profile created and updated successfully', 
        ngo, 
        token: newToken 
      });
    } else {
      return res.json({ message: 'NGO profile updated', ngo });
    }

  } catch (err) {
    console.error('Error updating NGO profile:', err);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message, details: err.errors });
    }
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
