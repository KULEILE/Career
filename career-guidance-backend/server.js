const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/eligibility', require('./routes/eligibility'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Career Guidance API is running!' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});