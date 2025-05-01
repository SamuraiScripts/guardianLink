const express = require('express');
const router = express.Router();
const Volunteer = require('../models/Volunteer');

// POST
router.post('/', async (req, res) => {
  try {
    // uses the schema from Volunteer.js to create a new document
    const newVolunteer = new Volunteer(req.body);
    // uses Mongoose's .save() to insert that document into the actual MongoDB database
    const saved = await newVolunteer.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving volunteer:', err);
    res.status(500).json({ error: 'Failed to save volunteer' });
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

module.exports = router;
