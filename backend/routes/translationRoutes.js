import express from 'express';

const router = express.Router();

// Simplified translation endpoint - returns message that only English and Korean are supported
router.post('/translate', (req, res) => {
  const isKorean = req.headers['accept-language']?.includes('ko');
  res.status(400).json({ 
    error: isKorean 
      ? '번역 API가 비활성화되었습니다. 영어와 한국어 번역만 지원됩니다.' 
      : 'Translation API is disabled. Only static English and Korean translations are supported.'
  });
});

export default router;