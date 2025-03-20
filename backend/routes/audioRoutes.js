// filepath: c:\WORK_win\lyrics-syncer\backend\routes\audioRoutes.js
import express from 'express';
import { 
  getAudioData,
  processSong,
  forceProcessSong
} from '../controllers/audioController.js';

const router = express.Router();

// Audio endpoints
router.get('/audio_data/:song_name', getAudioData);
router.post('/process', processSong);
router.post('/force_process', forceProcessSong);

export default router;