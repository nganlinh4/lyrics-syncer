import { useState, useCallback } from 'react';

const useLyrics = () => {
  const [lyrics, setLyrics] = useState([]);
  const [matchedLyrics, setMatchedLyrics] = useState([]);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [matchingComplete, setMatchingComplete] = useState(false);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [languageDetected, setLanguageDetected] = useState('');
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);

  const handlePreviewLyrics = async (artist, song) => {
    if (!song || !artist) {
      setError("Please enter both song and artist.");
      setLyrics([]);
      return;
    }

    try {
      setError(null);
      const response = await fetch('http://localhost:3001/api/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist, song }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch lyrics: ${response.status}`);
      }

      const data = await response.json();
      const lyricsArray = data.lyrics.split(/\\n|\n/).filter(line => line.trim());
      setLyrics(lyricsArray);
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      setError(error.message);
      setLyrics([]);
    }
  };

  const handleAdvancedMatch = async (artist, song, audioUrl, lyrics) => {
    try {
      setMatchingInProgress(true);
      setMatchingComplete(false);
      setError(null);

      const cleanAudioPath = audioUrl.split('?')[0].replace('http://localhost:3001/', '');

      const response = await fetch('http://localhost:3001/api/match_lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artist,
          song,
          audioPath: cleanAudioPath,
          lyrics
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
    }
  };

  const handleUpdateLyrics = (updatedLyrics) => {
    setMatchedLyrics(updatedLyrics);
  };

  const handleDownloadJSON = useCallback(() => {
    if (!matchedLyrics || matchedLyrics.length === 0) {
      setError('No matched lyrics to download');
      return;
    }

    try {
      const cleanedLyrics = matchedLyrics.map(({ confidence, ...rest }) => rest);
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
    matchedLyrics,
    matchingInProgress,
    matchingComplete,
    error,
    processingStatus,
    matchingProgress,
    languageDetected,
    currentLyricIndex,
    handlePreviewLyrics,
    handleAdvancedMatch,
    handleUpdateLyrics,
    handleDownloadJSON,
    updateCurrentLyric,
    setError,
    setLyrics
  };
};

export default useLyrics;