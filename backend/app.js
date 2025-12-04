const express = require('express');
const cors = require('cors');

const satelliteRoutes = require('./routes/satelliteRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((item) => item.trim())
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
  })
);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/satellites', satelliteRoutes);
app.use('/api/satellites/telemetry', telemetryRoutes);
app.use('/api', predictionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);


module.exports = app;

