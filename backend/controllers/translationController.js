import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Cache translations to avoid unnecessary API calls
const translationCache = new Map();

const translateObject = async (obj, targetLang, sourceKey = '') => {
  const translatedObj = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = sourceKey ? `${sourceKey}.${key}` : key;
    
    if (typeof value === 'object') {
      translatedObj[key] = await translateObject(value, targetLang, fullKey);
    } else if (typeof value === 'string') {
      const cacheKey = `${targetLang}:${fullKey}:${value}`;
      
      if (translationCache.has(cacheKey)) {
        translatedObj[key] = translationCache.get(cacheKey);
        continue;
      }

      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=en&tl=${targetLang}&q=${encodeURIComponent(value)}`;
        const response = await axios.get(url);
        
        if (response.data?.[0]?.[0]?.[0]) {
          const translatedText = response.data[0][0][0];
          translationCache.set(cacheKey, translatedText);
          translatedObj[key] = translatedText;
        } else {
          console.warn(`Translation failed for key ${fullKey}, using original text`);
          translatedObj[key] = value;
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Translation error for key ${fullKey}:`, error.message);
        translatedObj[key] = value; // Fallback to original if translation fails
      }
    } else {
      translatedObj[key] = value;
    }
  }
  
  return translatedObj;
};

// This file has been simplified since we're using static translations for Korean and English only
// We're keeping an empty file instead of deleting it to avoid disrupting any imports

// Function is kept as a stub to avoid breaking any existing code
export const translateText = async (req, res) => {
  // No longer needed since we're using static translations for Korean and English only
  res.status(400).json({ 
    error: 'Translation API is disabled. Only static English and Korean translations are supported.'
  });
};