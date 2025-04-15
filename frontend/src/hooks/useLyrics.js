import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const useLyrics = () => {
  const { t } = useTranslation();
  const [lyrics, setLyrics] = useState([]);
  const [albumArtUrl, setAlbumArtUrl] = useState('');
  const [matchedLyrics, setMatchedLyrics] = useState([]);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [matchingComplete, setMatchingComplete] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [selectedImageModel, setSelectedImageModel] = useState(() => {
    const savedModel = localStorage.getItem('selectedImageModel');
    const defaultModel = 'gemini-2.0-flash-exp-image-generation';
    return savedModel || defaultModel;
  });
  const [selectedPromptModel, setSelectedPromptModel] = useState(() => {
    const savedModel = localStorage.getItem('selectedPromptModel');
    const defaultModel = 'gemini-2.0-flash-lite';
    return savedModel || defaultModel;
  });
  const [isCustomLyrics, setIsCustomLyrics] = useState(false);
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [languageDetected, setLanguageDetected] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);

  // Use hardcoded fallback instead of process.env to avoid browser errors
  const API_URL = 'http://localhost:3001';

  const handlePreviewLyrics = useCallback(async (artist, song) => {
    try {
      setError(null);

      const response = await fetch(`${API_URL}/api/preview_lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist, song })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch lyrics preview');
      }

      const data = await response.json();
      if (data.lyrics) {
        const lyricsArray = data.lyrics.split(/\\n|\n/).filter(line => line.trim());
        // Remove the first line from the array
        const lyricsWithoutFirstLine = lyricsArray.slice(1);
        setLyrics(lyricsWithoutFirstLine);
      }
    } catch (err) {
      setError(`Preview failed: ${err.message}`);
      throw err;
    }
  }, []);

  const handleAdvancedMatch = useCallback(async (
    artist,
    song,
    audioUrl,
    lyrics,
    selectedModel,
    forceRematch = false
  ) => {
    try {
      // Validate required parameters
      if (!artist || !song || !audioUrl || !lyrics || !lyrics.length || !selectedModel) {
        console.error('Missing required parameters:', {artist, song, audioUrl, lyrics: lyrics?.length, selectedModel});
        throw new Error('Missing required parameters');
      }

      setError(null);
      setMatchingInProgress(true);
      setMatchingProgress(0);
      setProcessingStatus('Initializing matching process...');

      const response = await fetch(`${API_URL}/api/match_lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist,
          song,
          audioPath: audioUrl,  // Changed from audioUrl to audioPath to match backend expectations
          lyrics,
          model: selectedModel,
          forceRematch
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('errors.matchingFailed'));
      }

      // Check for streaming or complete response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // Handle complete JSON response
        try {
          const data = await response.json();
          console.log('Received complete JSON response:', data);

          // Handle the response as a result message
          if (data.matched_lyrics) {
            setMatchedLyrics(data.matched_lyrics);
            setLanguageDetected(data.detected_language || '');
            setMatchingComplete(true);
          } else if (data.matchedLyrics) {
            setMatchedLyrics(data.matchedLyrics);
            setLanguageDetected(data.language || '');
            setMatchingComplete(true);
          } else {
            setError('Invalid response format from server');
          }
          return;
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          throw new Error(t('errors.invalidResponse'));
        }
      }

      // Handle streaming response for progress updates
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete messages from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);

              if (data.type === 'progress') {
                setMatchingProgress(data.progress);
                setProcessingStatus(data.status);
              } else if (data.type === 'result') {
                // Make sure we're extracting the matched lyrics array correctly
                const matchedData = data.matchedLyrics || [];
                console.log('Received matched lyrics:', matchedData);

                if (Array.isArray(matchedData) && matchedData.length > 0) {
                  setMatchedLyrics(matchedData);
                  setLanguageDetected(data.language || '');
                  setMatchingComplete(true);
                } else {
                  console.error('Invalid matched lyrics format:', matchedData);
                  setError('Received invalid lyrics data from server');
                }
              } else if (data.type === 'error') {
                throw new Error(data.message || data.error);
              }
            } catch (parseError) {
              console.error('Error parsing server message:', parseError);
            }
          }
        }
      }

    } catch (err) {
      setError(`Matching failed: ${err.message}`);
      throw err;
    } finally {
      setMatchingInProgress(false);
    }
  }, [t]);

  const handleUpdateLyrics = useCallback((updatedLyrics) => {
    setMatchedLyrics(updatedLyrics);
  }, []);

  const handleDownloadJSON = useCallback(() => {
    if (!matchedLyrics.length) {
      setError(t('errors.noLyricsToDownload'));
      return;
    }

    try {
      const jsonContent = JSON.stringify(matchedLyrics, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'synchronized_lyrics.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`${t('errors.generic')}: ${err.message}`);
    }
  }, [matchedLyrics, t]);

  const handleCustomLyrics = useCallback((customLyrics) => {
    setLyrics(customLyrics);
    setIsCustomLyrics(true);
    setMatchingComplete(false);
    setMatchedLyrics([]);
  }, []);

  const saveCustomLyrics = useCallback(async (customLyrics, artist, song) => {
    try {
      setError(null);

      if (!artist || !song) {
        throw new Error('Artist and song are required to save custom lyrics');
      }

      const response = await fetch(`${API_URL}/api/save_custom_lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist,
          song,
          lyrics: customLyrics
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save custom lyrics');
      }

      // Update local state
      setLyrics(customLyrics);
      setIsCustomLyrics(true);

      return true;
    } catch (err) {
      console.error('Custom lyrics save error:', err);
      setError(`Failed to save lyrics: ${err.message}`);
      throw err;
    }
  }, [API_URL]);

  const generateImagePrompt = useCallback(async () => {
    try {
      setError(null);

      // Handle blob URLs (custom uploaded images) consistently with generateImage
      let imageData;
      if (albumArtUrl.startsWith('blob:')) {
        const response = await fetch(albumArtUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        imageData = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });
      }

      const response = await fetch(`${API_URL}/api/generate_image_prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics,
          albumArtUrl: imageData ? undefined : albumArtUrl,
          albumArtData: imageData ? {
            data: imageData,
            mimeType: 'image/png'
          } : undefined,
          model: selectedPromptModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image prompt');
      }

      const data = await response.json();
      setGeneratedPrompt(data.prompt);
      return data.prompt;
    } catch (err) {
      console.error('Image prompt generation error:', err);
      setError(`Prompt generation failed: ${err.message}`);
      throw err;
    }
  }, [lyrics, albumArtUrl, selectedPromptModel]);  // Updated dependency to selectedPromptModel

  const generateImage = useCallback(async (prompt) => {
    try {
      setError(null);

      // If albumArtUrl is an object URL (custom uploaded image), fetch it and convert to base64
      let imageData;
      if (albumArtUrl.startsWith('blob:')) {
        const response = await fetch(albumArtUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        imageData = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });
      }

      const response = await fetch(`${API_URL}/api/generate_image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          albumArtUrl: imageData ? undefined : albumArtUrl,
          albumArtData: imageData ? {
            data: imageData,
            mimeType: 'image/png'
          } : undefined,
          model: selectedImageModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImage(data.data ? data : data.image);
      return data.data ? data : data.image;
    } catch (err) {
      console.error('Image generation error:', err);
      setError(`Image generation failed: ${err.message}`);
      throw err;
    }
  }, [API_URL, albumArtUrl, selectedImageModel]);

  const fetchFromGenius = useCallback(async (artist, song, force = false, youtubeArtist = '', youtubeSong = '') => {
    try {
      setError(null);
      setLoading(true); // Add loading state

      const response = await fetch(`${API_URL}/api/lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist,
          song,
          force,
          youtubeArtist,
          youtubeSong
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('errors.geniusFetchFailed'));
      }

      const data = await response.json();
      if (data.lyrics) {
        // Split lyrics into array, filter empty lines, and remove the first line
        const lyricsArray = data.lyrics.split(/\\n|\n/).filter(line => line.trim());
        // Remove the first line from the array
        const lyricsWithoutFirstLine = lyricsArray.slice(1);
        setLyrics(lyricsWithoutFirstLine);
        setAlbumArtUrl(data.albumArtUrl || '');
        setIsCustomLyrics(false);
        return { albumArtUrl: data.albumArtUrl }; // Return the albumArtUrl
      }
      return {};
    } catch (err) {
      setError(`Genius fetch failed: ${err.message}`);
      throw err;
    } finally {
      setLoading(false); // Make sure to clear loading state even if there's an error
    }
  }, [t]);

  return {
    lyrics,
    albumArtUrl,
    matchedLyrics,
    matchingInProgress,
    matchingComplete,
    loading, // Export loading state
    error,
    processingStatus,
    selectedImageModel,
    selectedPromptModel,
    isCustomLyrics,
    matchingProgress,
    languageDetected,
    generatedPrompt,
    generatedImage,
    setLyrics,
    setAlbumArtUrl,
    setMatchedLyrics,
    setMatchingComplete,
    setSelectedImageModel,
    setSelectedPromptModel,
    setError,
    handlePreviewLyrics,
    handleAdvancedMatch,
    handleUpdateLyrics,
    handleDownloadJSON,
    handleCustomLyrics,
    saveCustomLyrics,
    generateImagePrompt,
    generateImage,
    fetchFromGenius
  };
};

export default useLyrics;
