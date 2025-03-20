// filepath: c:\WORK_win\lyrics-syncer\backend\config\config.js
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

export default {
  // Server configuration
  port: process.env.PORT || 3001,
  
  // Directories
  rootDir: ROOT_DIR,
  audioDir: path.join(ROOT_DIR, '..', 'audio'),
  lyricsDir: path.join(ROOT_DIR, '..', 'lyrics'),
  albumArtDir: path.join(ROOT_DIR, '..', 'album_art'), // Added album art directory
  debugDir: path.join(ROOT_DIR, 'debug'),
  tempDir: path.join(ROOT_DIR, '..', 'audio', 'temp'),
  
  // Python script path
  pythonScriptPath: path.join(ROOT_DIR, 'main.py'),
  
  // Config file path
  configFilePath: path.join(ROOT_DIR, 'config.json'),

  // Valid API key types
  validApiKeyTypes: ['youtube', 'genius', 'gemini']
};