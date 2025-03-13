import { useState, useCallback } from 'react';

const useApiKeys = () => {
  const [youtubeApiKey, setYoutubeApiKey] = useState(() => localStorage.getItem('youtubeApiKey') || '');
  const [youtubeKeyStatus, setYoutubeKeyStatus] = useState(() => localStorage.getItem('youtubeApiKey') ? 'saved' : 'empty');
  const [geniusApiKey, setGeniusApiKey] = useState(() => localStorage.getItem('geniusApiKey') || '');
  const [geniusKeyStatus, setGeniusKeyStatus] = useState(() => localStorage.getItem('geniusApiKey') ? 'saved' : 'empty');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [geminiKeyStatus, setGeminiKeyStatus] = useState(() => localStorage.getItem('geminiApiKey') ? 'saved' : 'empty');
  const [error, setError] = useState(null);

  const handleSaveApiKey = useCallback(async (type, key) => {
    try {
      if (!type || !key) {
        throw new Error('API key and type are required');
      }

      const response = await fetch('http://localhost:3001/api/save_api_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, key }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save API key');
      }

      localStorage.setItem(`${type}ApiKey`, key);
      switch(type) {
        case 'youtube':
          setYoutubeApiKey(key);
          setYoutubeKeyStatus('saved');
          break;
        case 'genius':
          setGeniusApiKey(key);
          setGeniusKeyStatus('saved');
          break;
        case 'gemini':
          setGeminiApiKey(key);
          setGeminiKeyStatus('saved');
          break;
        default:
          throw new Error('Invalid key type');
      }
      setError(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  const handleApiKeyChange = useCallback((type, value) => {
    switch(type) {
      case 'youtube':
        setYoutubeApiKey(value);
        setYoutubeKeyStatus('empty');
        break;
      case 'genius':
        setGeniusApiKey(value);
        setGeniusKeyStatus('empty');
        break;
      case 'gemini':
        setGeminiApiKey(value);
        setGeminiKeyStatus('empty');
        break;
      default:
        console.error('Invalid API key type');
    }
  }, []);

  return {
    apiKeys: {
      youtube: { key: youtubeApiKey, status: youtubeKeyStatus },
      genius: { key: geniusApiKey, status: geniusKeyStatus },
      gemini: { key: geminiApiKey, status: geminiKeyStatus }
    },
    handleSaveApiKey,
    handleApiKeyChange,
    error
  };
};

export default useApiKeys;