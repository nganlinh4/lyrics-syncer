import express from 'express';
import { 
  saveApiKey, 
  matchLyrics, 
  forceMatchLyrics, 
  generateImagePrompt, 
  generateImage,
  deleteCache 
} from '../controllers/apiController.js';
import { translateText } from '../controllers/translationController.js';

const router = express.Router();

// API key management
router.post('/save_api_key', saveApiKey);

// Lyrics matching endpoints
router.post('/match_lyrics', matchLyrics);
router.post('/force_match', forceMatchLyrics);

// Image generation endpoints
router.post('/generate_image_prompt', generateImagePrompt);
router.post('/generate_image', generateImage);

// Cache management
router.post('/delete_cache', deleteCache);

// Translation endpoint
router.post('/translate', translateText);

export default router;