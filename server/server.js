// Load environment variables
require('dotenv').config();

// Imports
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// App setup
const app = express();
const PORT = process.env.PORT || 5050;

// Routes
const volunteerRoutes = require('./routes/volunteers');
const ngoRoutes = require('./routes/ngos');
const authRoutes = require('./routes/auth');

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use('/ngos', ngoRoutes);
app.use('/auth', authRoutes);

// Routes
app.use('/volunteers', volunteerRoutes);

// Root route for sanity check
app.get('/', (req, res) => {
  res.send('Hello from Express backend!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
