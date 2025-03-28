import express from 'express';
import { 
  getLyricsTiming, 
  saveTiming, 
  getLyrics, 
  forceLyrics,
  autoMatchLyrics,
  saveCustomLyrics
} from '../controllers/lyricsController.js';

const router = express.Router();

// Lyrics data endpoints
router.get('/lyrics_timing/:song_name', getLyricsTiming);
router.post('/save_timing', saveTiming);
router.post('/lyrics', getLyrics);
router.post('/force_lyrics', forceLyrics);
router.post('/save_custom_lyrics', saveCustomLyrics);
router.post('/auto_match', autoMatchLyrics);

export default router;