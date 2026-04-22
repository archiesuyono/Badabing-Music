require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');
const musicRoutes = require('./routes/musicRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const youtubeRoutes = require('./routes/youtubeRoutes');
const errorHandler = require('./middleware/errorHandler');
const { initializeSpotify } = require('./utils/externalApis');
const logger = require('./utils/logger');

const app = express();

// Middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/youtube', youtubeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: false }).then(async () => {
  console.log('Database synchronized successfully');
  
  // Initialize Spotify API
  try {
    await initializeSpotify();
    logger.info('Spotify API initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Spotify API', error);
  }
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    logger.info('Server started successfully', { port: PORT, env: process.env.NODE_ENV });
  });
}).catch(err => {
  logger.error('Failed to sync database', err);
  console.error('Failed to sync database:', err);
  process.exit(1);
});

module.exports = app;
