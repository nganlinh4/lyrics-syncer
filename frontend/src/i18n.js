import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Initialize i18next
i18n
  // Use dynamic backend for loading translations
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    fallbackLng: 'en',
    // Debug mode (disable in production)
    debug: false,
    // Supported languages
    supportedLngs: [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 
      'ja', 'ko', 'ar', 'hi', 'th', 'vi'
    ],
    // Default namespace
    defaultNS: 'translation',
    // Cache translations to avoid repetitive network requests
    load: 'languageOnly',
    // Detect user language options
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    // Backend configuration for loading translations
    backend: {
      // Use Libre Translate API (fallback to LibreTranslate's public API)
      loadPath: 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=en&tl={{lng}}&q={{ns}}',
      // API route for local server
      addPath: 'http://localhost:3001/api/translate',
      allowMultiLoading: true,
      crossDomain: true,
    },
    // Handle missing keys by automatically adding them to translation files
    saveMissing: true,
    // This function runs for each missing key
    // We'll use it to dynamically translate English text to other languages
    missingKeyHandler: function(lngs, ns, key, fallbackValue) {
      // If language is English, don't translate
      if (lngs[0] === 'en') return;
      
      // Use Libre Translate API via our backend
      fetch('http://localhost:3001/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: key || fallbackValue,
          source: 'en',
          target: lngs[0],
        }),
      })
      .then(function(response) {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Translation network response was not ok');
      })
      .then(function(data) {
        if (data.translatedText) {
          // Add the translation to the resources
          i18n.addResource(lngs[0], ns, key, data.translatedText);
        }
      })
      .catch(function(error) {
        console.error('Translation error:', error);
        // Fallback to client-side translation using Google Translate API
        const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=en&tl=' + 
          lngs[0] + '&q=' + encodeURIComponent(key || fallbackValue);
        
        fetch(url)
          .then(function(response) { return response.json(); })
          .then(function(data) {
            if (data && data[0] && data[0][0] && data[0][0][0]) {
              const translatedText = data[0][0][0];
              i18n.addResource(lngs[0], ns, key, translatedText);
            }
          })
          .catch(function(fallbackError) {
            console.error('Fallback translation error:', fallbackError);
          });
      });
    },
  });

export default i18n;