const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./backend/config/db');
const errorHandler = require('./backend/middleware/errorHandler');

// Backend Route Imports
const helplineRoutes = require('./backend/routes/helplineRoutes');
const authRoutes = require('./backend/routes/authRoutes');
const citizenRoutes = require('./backend/routes/citizenRoutes');
const officerRoutes = require('./backend/routes/officerRoutes');

const app = express();

// Connect to Database
connectDB();

// Core Middlewares & Security Headers
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Set HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:");
  next();
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, 'frontend')));

// Register Backend API Endpoints
app.use('/api/helpline', helplineRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/officer', officerRoutes);

// Fallback Route to serve main landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Centralized Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`===========================================================`);
  console.log(`  CyberCrime Case Reporting Portal Server Started!`);
  console.log(`  Access Frontend Portal: http://localhost:${PORT}`);
  console.log(`===========================================================`);
});
