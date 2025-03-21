import express from 'express';

const router = express.Router();

// Simplified translation endpoint - returns message that only English and Korean are supported
router.post('/translate', (req, res) => {
  res.status(400).json({ 
    error: 'Translation API is disabled. Only static English and Korean translations are supported.'
  });
});

export default router;