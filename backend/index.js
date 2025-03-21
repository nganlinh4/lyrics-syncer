import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

// Import configuration
import config from './config/config.js';

// Import route modules
import audioRoutes from './routes/audioRoutes.js';
import lyricsRoutes from './routes/lyricsRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
// Removed translation routes import since we're only using static translations now

// Import utilities
import { ensureDirectories } from './utils/fileUtils.js';

// Initialize express app
const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin resource sharing for audio files
  contentSecurityPolicy: false // Disable CSP to allow audio playback
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Range'],
  exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges']
}));

// Increase JSON body size limit to 10MB
app.use(express.json({ limit: '10mb' }));

// Ensure required directories exist
ensureDirectories({
  AUDIO_DIR: config.audioDir,
  LYRICS_DIR: config.lyricsDir,
  ALBUM_ART_DIR: config.albumArtDir, // Added album art directory
  DEBUG_DIR: config.debugDir,
  TEMP_DIR: config.tempDir
});

// Set up static file serving for audio files
app.use('/audio', express.static(config.audioDir, {
  setHeaders: (res, filepath) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    });
    console.log(`Serving audio file: ${filepath}`);
  }
}));

// Set up static file serving for album art files
app.use('/album_art', express.static(config.albumArtDir, {
  setHeaders: (res, filepath) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache'
    });
    console.log(`Serving album art file: ${filepath}`);
  }
}));

// Register routes - all routes have /api prefix
app.use('/api', audioRoutes);
app.use('/api', lyricsRoutes);
app.use('/api', apiRoutes);
// Removed translation routes since we're only using static translations now

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(config.port, () => {
  console.log(`Server listening at http://localhost:${config.port}`);
});
