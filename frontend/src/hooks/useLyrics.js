import { useState, useCallback } from 'react';

const useLyrics = () => {
  const [lyrics, setLyrics] = useState([]);
  const [albumArtUrl, setAlbumArtUrl] = useState('');
  const [matchedLyrics, setMatchedLyrics] = useState([]);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [matchingComplete, setMatchingComplete] = useState(false);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [languageDetected] = useState('');
  const [isCustomLyrics, setIsCustomLyrics] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);

  const handlePreviewLyrics = async (artist, song, forceRefetch = false) => {
    if (!song || !artist) {
      setError("Please enter both song and artist.");
      setLyrics([]);
      setAlbumArtUrl('');
      return;
    }

    try {
      setError(null);
      const endpoint = forceRefetch ? 'force_lyrics' : 'lyrics';
      
      const response = await fetch(`http://localhost:3001/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          artist, 
          song,
          // We use the force parameter to tell backend to ignore cached files
          // even for the regular lyrics endpoint
          force: forceRefetch 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch lyrics: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);  // Debug raw response
      const lyricsArray = data.lyrics.split(/\\n|\n/).filter(line => line.trim());
      console.log('Album Art URL from response:', data.albumArtUrl);  // Debug album art URL
      setLyrics(lyricsArray);
      setAlbumArtUrl(data.albumArtUrl || '');
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      setError(error.message);
      setLyrics([]);
    }
  };
  
  const handleCustomLyrics = (customText) => {
    setError(null);
    const lyricsArray = customText.split(/\\n|\n/).filter(line => line.trim());
    setLyrics(lyricsArray);
    setIsCustomLyrics(true);
    setMatchedLyrics([]);
  };

  const handleAdvancedMatch = async (artist, song, audioUrl, lyrics, model, force = false) => {
    try {
      setMatchingInProgress(true);
      setMatchingComplete(false);
      setError(null);

      const cleanAudioPath = audioUrl.split('?')[0].replace('http://localhost:3001/', '');
      const endpoint = force ? 'force_match' : 'match_lyrics';

      const response = await fetch(`http://localhost:3001/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artist,
          song,
          audioPath: cleanAudioPath,
          lyrics
,
          model
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to match lyrics: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      if (result.matched_lyrics) {
        setMatchedLyrics(result.matched_lyrics);
        setMatchingComplete(true);
      } else {
        throw new Error('No matched lyrics in response');
      }

    } catch (error) {
      console.error('Error matching lyrics:', error);
      setError(error.message);
      setMatchingComplete(false);
    } finally {
      setMatchingInProgress(false);
      setMatchingProgress(0);
      setProcessingStatus('');
      setError(null);
    }
  };

  const handleUpdateLyrics = (updatedLyrics) => {
    // Ensure the updated lyrics are properly formatted
    const formattedLyrics = updatedLyrics.map(lyric => ({
      start: Number(lyric.start),
      end: Number(lyric.end),
      text: lyric.text,
      confidence: lyric.confidence || 0.95
    }));
    setMatchedLyrics(formattedLyrics);
  };

  const handleDownloadJSON = useCallback(() => {
    if (!matchedLyrics || matchedLyrics.length === 0) {
      setError('No matched lyrics to download');
      return;
    }

    try {
      // Keep all fields except confidence, preserving language
      const cleanedLyrics = matchedLyrics.map(({ confidence, ...rest }) => ({
        start: rest.start,
        end: rest.end,
        text: rest.text,
        language: rest.language || 'unknown' // Fallback if language is missing
      }));
      
      const jsonBlob = new Blob([JSON.stringify(cleanedLyrics, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'lyrics_timing.json';
      document.body.appendChild(link);
      link.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading JSON:', error);
      setError('Failed to download JSON: ' + error.message);
    }
  }, [matchedLyrics]);

  const updateCurrentLyric = useCallback((time) => {
    if (!matchedLyrics || matchedLyrics.length === 0) return;

    const index = matchedLyrics.findIndex(
      (lyric) => time >= lyric.start && time <= lyric.end
    );

    if (index !== currentLyricIndex) {
      setCurrentLyricIndex(index);
    }
  }, [matchedLyrics, currentLyricIndex]);

  return {
    lyrics,
    albumArtUrl,
    matchedLyrics,
        setMatchedLyrics,
        setMatchingComplete,
    matchingInProgress,
    matchingComplete,
    error,
    processingStatus,
    matchingProgress,
    languageDetected,
    isCustomLyrics,
    currentLyricIndex,
    handlePreviewLyrics,
    handleAdvancedMatch,
    handleUpdateLyrics,
    handleDownloadJSON,
    updateCurrentLyric,
    setError,
    setLyrics
,
    handleCustomLyrics
  };
};

export default useLyrics;
