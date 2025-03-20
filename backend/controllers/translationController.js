import axios from 'axios';

export const translateText = async (req, res) => {
  try {
    const { text, source = 'en', target } = req.body;
    
    if (!text || !target) {
      return res.status(400).json({ error: 'Missing required fields: text and target language' });
    }
    
    // First try using Google Translate API (free and no API key required)
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${source}&tl=${target}&q=${encodeURIComponent(text)}`;
      const response = await axios.get(url);
      
      if (response.data && response.data[0] && response.data[0][0] && response.data[0][0][0]) {
        const translatedText = response.data[0][0][0];
        return res.json({ translatedText });
      }
    } catch (googleError) {
      console.error('Google translation error:', googleError.message);
      // If Google fails, we'll try the fallback below
    }
    
    // Fallback to LibreTranslate
    try {
      const libreTranslateUrl = 'https://libretranslate.de/translate';
      const response = await axios.post(libreTranslateUrl, {
        q: text,
        source: source,
        target: target,
        format: 'text',
      });
      
      if (response.data && response.data.translatedText) {
        return res.json({ translatedText: response.data.translatedText });
      } else {
        throw new Error('Invalid response from LibreTranslate');
      }
    } catch (libreError) {
      console.error('LibreTranslate error:', libreError.message);
      return res.status(500).json({ error: 'Translation service unavailable' });
    }
  } catch (error) {
    console.error('Translation error:', error.message);
    res.status(500).json({ error: 'An error occurred during translation' });
  }
};