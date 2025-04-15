import express from 'express';
import {
  getApiKeys,
  saveApiKey,
  matchLyrics,
  forceMatchLyrics,
  generateImagePrompt,
  generateImage,
  deleteCache,
  uploadAlbumArt,
  uploadAudio
} from '../controllers/apiController.js';

const router = express.Router();

// API key management
router.get('/get_api_keys', getApiKeys);
router.post('/save_api_key', saveApiKey);

// Audio upload route
router.post('/upload_audio', uploadAudio);

// Album art upload endpoint
router.post('/upload_album_art', uploadAlbumArt);

// Lyrics matching endpoints
router.post('/match_lyrics', matchLyrics);
router.post('/force_match', forceMatchLyrics);

// Image generation endpoints
router.post('/generate_image_prompt', generateImagePrompt);
router.post('/generate_image', generateImage);

// Cache management
router.post('/delete_cache', deleteCache);

export default router;