const express = require('express');
const router = express.Router();
const NGO = require('../models/NGO');

// POST
router.post('/', async (req, res) => {
  try {
    const newNGO = new NGO(req.body);
    const saved = await newNGO.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving NGO:', err);
    res.status(500).json({ error: 'Failed to save NGO' });
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

module.exports = router;
