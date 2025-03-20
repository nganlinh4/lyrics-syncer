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

app.use(express.json());

// Ensure required directories exist
ensureDirectories({
  AUDIO_DIR: config.audioDir,
  LYRICS_DIR: config.lyricsDir,
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

// Register routes - all routes have /api prefix
app.use('/api', audioRoutes);
app.use('/api', lyricsRoutes);
app.use('/api', apiRoutes);

// Start the server
app.listen(config.port, () => {
  console.log(`Server listening at http://localhost:${config.port}`);
});
