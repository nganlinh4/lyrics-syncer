import { useState, useEffect, useCallback } from 'react';

const STORAGE_PREFIX = 'lyrics_syncer_';
const API_TYPES = ['genius', 'youtube', 'gemini'];
const API_URL = 'http://localhost:3001'; // Hardcoded API URL to avoid process.env

const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState(() => {
    // Initialize state from localStorage with status
    return API_TYPES.reduce((acc, type) => {
      const storedKey = localStorage.getItem(`${STORAGE_PREFIX}${type}_api_key`);
      acc[type] = {
        key: storedKey || '',
        status: storedKey ? 'saved' : 'unsaved'
      };
      return acc;
    }, {});
  });

  const [error, setError] = useState(null);

  // Fetch API keys from backend on mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const response = await fetch(`${API_URL}/api/get_api_keys`);
        if (!response.ok) {
          console.warn('Failed to fetch API keys from backend');
          return;
        }

        const data = await response.json();
        if (data.apiKeys) {
          // Update state with backend API keys
          setApiKeys(prev => {
            const newApiKeys = { ...prev };

            // For each API key type, update the key if it exists in the backend
            // and there's no key in localStorage
            API_TYPES.forEach(type => {
              const storedKey = localStorage.getItem(`${STORAGE_PREFIX}${type}_api_key`);
              if (!storedKey && data.apiKeys[type]) {
                // Save to localStorage
                localStorage.setItem(`${STORAGE_PREFIX}${type}_api_key`, data.apiKeys[type]);
                // Update state
                newApiKeys[type] = {
                  key: data.apiKeys[type],
                  status: 'saved'
                };
              }
            });

            return newApiKeys;
          });
        }
      } catch (error) {
        console.error('Error fetching API keys:', error);
      }
    };

    fetchApiKeys();
  }, []);

  // Validate API key format based on type
  const validateApiKey = useCallback((type, key) => {
    if (!key.trim()) {
      throw new Error(`${type.charAt(0).toUpperCase() + type.slice(1)} API key cannot be empty`);
    }

    // Only perform basic validation to ensure the key isn't empty
    // More permissive validation that accepts most API key formats
    switch (type) {
      case 'genius':
        // Simple check for reasonable length
        if (key.length < 10) {
          throw new Error('Genius API key is too short');
        }
        break;

      case 'youtube':
        // Simple check for reasonable length
        if (key.length < 10) {
          throw new Error('YouTube API key is too short');
        }
        break;

      case 'gemini':
        // Very permissive - just check that it's not too short
        if (key.length < 10) {
          throw new Error('Gemini API key is too short');
        }
        break;

      default:
        throw new Error(`Unknown API key type: ${type}`);
    }
  }, []);

  // Handle API key changes
  const handleApiKeyChange = useCallback((type, value) => {
    setError(null);
    setApiKeys(prev => ({
      ...prev,
      [type]: {
        key: value,
        status: 'unsaved'
      }
    }));
  }, []);

  // Save API key to localStorage and update status
  const handleSaveApiKey = useCallback(async (type, value) => {
    try {
      setError(null);

      // Validate the API key format
      validateApiKey(type, value);

      // Save to localStorage
      localStorage.setItem(`${STORAGE_PREFIX}${type}_api_key`, value);

      // Update state with saved status
      setApiKeys(prev => ({
        ...prev,
        [type]: {
          key: value,
          status: 'saved'
        }
      }));

      // Verify the API key with backend
      try {
        const response = await fetch(`${API_URL}/api/save_api_key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            key: value
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn('API key validation response:', errorData);
          // Don't throw here - we still consider the key saved locally
        }
      } catch (verifyError) {
        console.warn(`API key verification skipped: ${verifyError.message}`);
        // Don't throw here - we still want to save the key even if verification is unavailable
      }

    } catch (error) {
      setError(error.message);

      // Update state to show error
      setApiKeys(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          status: 'error'
        }
      }));

      // Re-throw for component handling
      throw error;
    }
  }, [validateApiKey]);

  // Load saved keys on mount and when localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith(STORAGE_PREFIX)) {
        const type = e.key.replace(STORAGE_PREFIX, '').replace('_api_key', '');
        if (API_TYPES.includes(type)) {
          setApiKeys(prev => ({
            ...prev,
            [type]: {
              key: e.newValue || '',
              status: e.newValue ? 'saved' : 'unsaved'
            }
          }));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    apiKeys,
    error,
    handleApiKeyChange,
    handleSaveApiKey
  };
};

export default useApiKeys;