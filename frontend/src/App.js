import React, { useState, useRef, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

function App() {
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [geniusApiKey, setGeniusApiKey] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [lyrics, setLyrics] = useState([]);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [matchingComplete, setMatchingComplete] = useState(false);
  const [matchedLyrics, setMatchedLyrics] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);

  const wavesurferRef = useRef(null);
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);

  /**
  * Constructs a URL-friendly song name.
  * @param {string} artist The artist name.
  * @param {string} song The song name.
  * @returns {string} The URL-friendly song name.
  */
  const getSongName = (artist, song) => {
    return `${artist} - ${song}`.toLowerCase().replace(/\s+/g, '_');
  };

  const handleDownload = async () => {
    if (!song || !artist) {
      setError('Please enter both song and artist.');
      return;
    }

    setLoading(true);
    setError(null);
    // Removed setAudioLoaded(false) since audioLoaded state is removed

    try {
      const response = await fetch('http://localhost:3001/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist, song }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to process song: ${response.status} - ${errorData.error}`);
      }

      const songName = getSongName(artist, song);
      const audioDataResponse = await fetch(`http://localhost:3001/api/audio_data/${songName}`);

      if (!audioDataResponse.ok) {
        const errorData = await audioDataResponse.json();
        throw new Error(`Failed to fetch audio data: ${audioDataResponse.status} - ${errorData.error}`);
      }

      const audioData = await audioDataResponse.json();
      console.log("Audio data received:", audioData);

      // Set file size
      setFileSize(audioData.size);

      // Use the URL exactly as provided by the backend
      setAudioUrl(audioData.audio_url);

    } catch (error) {
      console.error("Error processing song:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async (keyType) => {
    try {
      const response = await fetch('http://localhost:3001/api/save_api_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyType === 'genius' ? geniusApiKey : youtubeApiKey, keyType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to save API key: ${response.status} - ${errorData.error}`);
      }
      alert(`${keyType.charAt(0).toUpperCase() + keyType.slice(1)} API Key saved!`);
    } catch (error) {
      setError(error.message);
    }
  };

  // Initialize WaveSurfer when the component mounts
  useEffect(() => {
    if (containerRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: 'violet',
        progressColor: 'purple',
        cursorColor: 'navy',
        barWidth: 3,
        height: 100,
        responsive: true
      });

      // Handle WaveSurfer events
      wavesurferRef.current.on('ready', () => {
        console.log('WaveSurfer is ready');
      });

      wavesurferRef.current.on('error', (err) => {
        console.error('WaveSurfer error:', err);
      });

      // Add timeupdate event
      wavesurferRef.current.on('timeupdate', (time) => {
        console.log('Current time:', time); // Debug log
        setCurrentTime(time);
      });

      // Also listen to audioprocess event as backup
      wavesurferRef.current.on('audioprocess', (time) => {
        console.log('Audioprocess time:', time); // Debug log
        setCurrentTime(time);
      });
    }

    // Clean up WaveSurfer on unmount
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, []);

  // Load audio into WaveSurfer when URL changes
  useEffect(() => {
    if (audioUrl && wavesurferRef.current) {
      console.log("Loading audio into WaveSurfer:", audioUrl);
      wavesurferRef.current.load(audioUrl);
    }
  }, [audioUrl]);

  const handlePreviewLyrics = async () => {
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
      // Split lyrics into an array, handling both \n and actual newlines
      const lyricsArray = data.lyrics.split(/\\n|\n/).filter(line => line.trim());
      setLyrics(lyricsArray);
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      setError(error.message);
      setLyrics([]);
    }
  };

  const handleAutoMatch = async () => {
    if (!audioUrl || lyrics.length === 0) {
      setError('Both audio and lyrics must be loaded first');
      return;
    }

    setMatchingInProgress(true);
    setError(null);

    try {
      const songName = getSongName(artist, song);
      const response = await fetch('http://localhost:3001/api/auto_match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          songName,
          lyrics: lyrics,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to match lyrics');
      }

      const matchedData = await response.json();
      setMatchedLyrics(matchedData.matched_lyrics);
      setMatchingComplete(true);

    } catch (error) {
      console.error('Error matching lyrics:', error);
      setError(error.message);
    } finally {
      setMatchingInProgress(false);
    }
  };

  // Removed togglePlay function

  // Add this function to find the current lyric
  const getCurrentLyricIndex = useCallback((time) => {
    if (!matchedLyrics || matchedLyrics.length === 0) return -1;
    const index = matchedLyrics.findIndex(
      (lyric) => time >= lyric.start && time <= lyric.end
    );
    console.log('Current lyric index:', index, 'for time:', time); // Debug log
    return index;
  }, [matchedLyrics]);

  // Debug current time changes
  useEffect(() => {
    console.log('Current time updated:', currentTime);
  }, [currentTime]);

  // Update scroll effect with proper dependencies
  useEffect(() => {
    const currentIndex = getCurrentLyricIndex(currentTime);
    if (currentIndex !== -1) {
      const element = document.querySelector(`[data-lyric-index="${currentIndex}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, getCurrentLyricIndex]);

  // Add timeupdate event listener to the audio element
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleTimeUpdate = () => {
        setCurrentTime(audioElement.currentTime);
        console.log('Audio currentTime:', audioElement.currentTime); // Debug log
      };

      audioElement.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, []);

  // New function to update time using requestAnimationFrame
  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, []);

  // Start and stop time tracking
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = () => {
      console.log('Audio started playing');
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    const handlePause = () => {
      console.log('Audio paused');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('seeking', updateTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('seeking', updateTime);
    };
  }, [updateTime]);

  // Render matched lyrics with current time tracking
  const renderMatchedLyrics = () => {
    if (!matchingComplete || !matchedLyrics) return null;

    return (
      <div style={{ marginTop: '20px' }}>
        <h3>Matched Lyrics</h3>
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '10px',
          scrollBehavior: 'smooth',
          position: 'relative'
        }}>
          {matchedLyrics.map((item, index) => {
            const isCurrentLyric = 
              currentTime >= item.start && 
              currentTime <= item.end;
            
            console.log(`Lyric ${index}:`, { 
              start: item.start, 
              end: item.end, 
              current: currentTime, 
              isActive: isCurrentLyric 
            });

            return (
              <div 
                key={index}
                data-lyric-index={index}
                style={{
                  padding: '10px',
                  backgroundColor: isCurrentLyric ? '#4CAF50' : 
                                 item.confidence > 0.8 ? '#e8f5e9' : 
                                 item.confidence > 0.6 ? '#fff3e0' : '#ffebee',
                  marginBottom: '5px',
                  borderRadius: '4px',
                  transition: 'background-color 0.3s ease',
                  color: isCurrentLyric ? 'white' : 'black',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = item.start;
                  }
                }}
              >
                <div style={{ 
                  fontWeight: isCurrentLyric ? 'bold' : 'normal'
                }}>
                  {item.line}
                </div>
                <div style={{ 
                  fontSize: '0.8em', 
                  color: isCurrentLyric ? 'rgba(255,255,255,0.8)' : '#666'
                }}>
                  Current Time: {currentTime.toFixed(2)}s | 
                  {`${item.start.toFixed(2)}s - ${item.end.toFixed(2)}s`}
                  <span style={{ marginLeft: '10px' }}>
                    Confidence: {(item.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lyrics Timing App</h1>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="song">Song:</label>
        <input
          type="text"
          id="song"
          value={song}
          onChange={(e) => setSong(e.target.value)}
          style={{ marginRight: '10px' }}
        />

        <label htmlFor="artist">Artist:</label>
        <input
          type="text"
          id="artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          style={{ marginRight: '10px' }}
        />

        <div style={{ marginTop: '15px' }}>
          <label htmlFor="geniusApiKey">Genius API Key:</label>
          <input
            type="text"
            id="geniusApiKey"
            value={geniusApiKey}
            onChange={(e) => setGeniusApiKey(e.target.value)}
            style={{ marginRight: '10px', width: '300px' }}
          />
          <button onClick={() => handleSaveApiKey('genius')}>Save Genius API Key</button>
        </div>

        <div style={{ marginTop: '15px' }}>
          <label htmlFor="youtubeApiKey">YouTube API Key:</label>
          <input
            type="text"
            id="youtubeApiKey"
            value={youtubeApiKey}
            onChange={(e) => setYoutubeApiKey(e.target.value)}
            style={{ marginRight: '10px', width: '300px' }}
          />
          <button onClick={() => handleSaveApiKey('youtube')}>Save YouTube API Key</button>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={loading}
        style={{ padding: '8px 16px', marginBottom: '20px' }}
      >
        {loading ? 'Processing...' : 'Download and Process'}
      </button>

      {/* Add the auto-match button */}
      {audioUrl && lyrics.length > 0 && !matchingInProgress && !matchingComplete && (
        <button
          onClick={handleAutoMatch}
          style={{ 
            padding: '8px 16px', 
            marginLeft: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Start Auto Lyrics Matching
        </button>
      )}

      {matchingInProgress && (
        <div style={{ marginTop: '10px' }}>
          <span>Matching lyrics to audio... Please wait</span>
          {/* You could add a progress spinner here */}
        </div>
      )}

      {renderMatchedLyrics()}

      <button
        onClick={handlePreviewLyrics}
        style={{ padding: '8px 16px', marginLeft: '10px' }}
      >
        Preview Lyrics
      </button>

      {/* Add this right after the button to display the lyrics */}
      {lyrics.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Lyrics Preview</h3>
          <div style={{ whiteSpace: 'pre-line' }}>
            {lyrics.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>
      )}

      <div>
        {audioUrl && (
          <>
            <h3>Audio Preview</h3>
            <div ref={containerRef} style={{ marginTop: '20px', marginBottom: '20px', width: '100%' }}></div>

            <div style={{ marginTop: '10px', marginBottom: '20px' }}>
              <audio
                ref={audioRef}
                controls
                src={audioUrl}
                preload="auto"
                style={{ width: '100%', marginTop: '10px' }}
                onError={(e) => {
                  console.error("Audio player error:", e);
                  console.log("Failed to load audio URL:", audioUrl);
                  setError("Error loading audio. Please try again.");
                }}
                // Removed the onPlay and onPause handlers since we're not using the playing state
              />

              {/* Add a direct download link as a fallback */}
              <div style={{ marginTop: '10px' }}>
                <a href={audioUrl} target="_blank" rel="noopener noreferrer">
                  Direct Download Link
                </a>
              </div>
            </div>

            {fileSize && <div>File Size: {Math.round(fileSize / 1024)} KB</div>}
            {lyrics.length > 0 && (
              <div>
                <h3>Lyrics</h3>
                <ul>
                  {lyrics.map((item, index) => (
                    <li key={index}>
                      {/* Check if item is an object or string */}
                      {typeof item === 'object' ? item.text : item}
                      {typeof item === 'object' && (
                        <span style={{ 
                          fontSize: '0.8em', 
                          color: '#666', 
                          marginLeft: '10px' 
                        }}>
                          ({item.start.toFixed(2)}s - {item.end.toFixed(2)}s)
                          {item.confidence && ` Confidence: ${(item.confidence * 100).toFixed(1)}%`}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;