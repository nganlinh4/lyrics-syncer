import React, { useState, useRef, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

function App() {
  const [artist, setArtist] = useState('');
  const [song, setSong] = useState('');
  const [lyrics, setLyrics] = useState([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [matchedLyrics, setMatchedLyrics] = useState([]);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [matchingComplete, setMatchingComplete] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fileSize, setFileSize] = useState(0);
  const [youtubeApiKey, setYoutubeApiKey] = useState(() => localStorage.getItem('youtubeApiKey') || '');
  const [youtubeKeyStatus, setYoutubeKeyStatus] = useState(() => localStorage.getItem('youtubeApiKey') ? 'saved' : 'empty');
  const [geniusApiKey, setGeniusApiKey] = useState(() => localStorage.getItem('geniusApiKey') || '');
  const [geniusKeyStatus, setGeniusKeyStatus] = useState(() => localStorage.getItem('geniusApiKey') ? 'saved' : 'empty');
  const [spotifyClientId, setSpotifyClientId] = useState(() => localStorage.getItem('spotifyClientId') || '');
  const [spotifyClientIdStatus, setSpotifyClientIdStatus] = useState(() => localStorage.getItem('spotifyClientId') ? 'saved' : 'empty');
  const [spotifyClientSecret, setSpotifyClientSecret] = useState(() => localStorage.getItem('spotifyClientSecret') || '');
  const [spotifyClientSecretStatus, setSpotifyClientSecretStatus] = useState(() => localStorage.getItem('spotifyClientSecret') ? 'saved' : 'empty');

  // Refs
  const wavesurferRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);

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

      wavesurferRef.current.on('ready', () => {
        console.log('WaveSurfer is ready');
      });

      wavesurferRef.current.on('error', (err) => {
        console.error('WaveSurfer error:', err);
      });

      wavesurferRef.current.on('timeupdate', (time) => {
        setCurrentTime(time);
      });

      wavesurferRef.current.on('audioprocess', (time) => {
        setCurrentTime(time);
      });
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, []);

  const handleSaveApiKey = async (type, key, secret = null) => {
    try {
      if (!type || !key) {
        throw new Error('API key and type are required');
      }

      const keyToSend = type === 'genius' ? geniusApiKey : key;
      const body = secret !== null 
        ? { type, key: keyToSend, secret }
        : { type, key: keyToSend };

      const response = await fetch('http://localhost:3001/api/save_api_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save API key');
      }

      // Update localStorage and status based on type
      switch(type) {
        case 'youtube':
          localStorage.setItem('youtubeApiKey', keyToSend);
          setYoutubeApiKey(keyToSend);
          setYoutubeKeyStatus('saved');
          break;
        case 'genius':
          localStorage.setItem('geniusApiKey', keyToSend);
          setGeniusApiKey(keyToSend);
          setGeniusKeyStatus('saved');
          break;
        case 'spotify':
          localStorage.setItem('spotifyClientId', keyToSend);
          localStorage.setItem('spotifyClientSecret', secret);
          setSpotifyClientId(keyToSend);
          setSpotifyClientSecret(secret);
          setSpotifyClientIdStatus('saved');
          setSpotifyClientSecretStatus('saved');
          break;
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs
      if (!song || !artist) {
        throw new Error('Please enter both song and artist');
      }

      // Call the process endpoint
      const response = await fetch('http://localhost:3001/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song, artist }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to process: ${response.status}`);
      }

      const data = await response.json();
      
      // Update lyrics if they were returned
      if (data.lyrics) {
        const lyricsArray = data.lyrics.split(/\\n|\n/).filter(line => line.trim());
        setLyrics(lyricsArray);
      }

      // Update audio URL
      const songName = `${artist.toLowerCase().replace(/\s+/g, '_')}_-_${song.toLowerCase().replace(/\s+/g, '_')}`;
      const audioResponse = await fetch(`http://localhost:3001/api/audio_data/${encodeURIComponent(songName)}`);
      if (!audioResponse.ok) {
        throw new Error('Failed to get audio data');
      }
      
      const audioData = await audioResponse.json();
      setAudioUrl(audioData.audio_url);
      
      // Optional: Update file size if available
      if (audioData.size) {
        setFileSize(audioData.size);
      }

    } catch (error) {
      setError(error.message);
      console.error('Download error:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (!lyrics.length === 0) {
      setError('Lyrics must be loaded first');
      return;
    }

    setMatchingInProgress(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/auto_match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          artist,
          song,
          lyrics: lyrics
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to match lyrics');
      }

      const { matched_lyrics } = await response.json();
      setMatchedLyrics(matched_lyrics);
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

  // Update time tracking with better precision
  const updateTime = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, []);

  // Enhanced time tracking setup
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

    const handleSeeking = () => {
      setCurrentTime(audioElement.currentTime);
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('seeking', handleSeeking);
    audioElement.addEventListener('seeked', handleSeeking);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('seeking', handleSeeking);
      audioElement.removeEventListener('seeked', handleSeeking);
    };
  }, [updateTime]);

  // Optimized render function for matched lyrics
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
                  transition: 'all 0.3s ease',
                  color: isCurrentLyric ? 'white' : 'black',
                  cursor: 'pointer',
                  transform: isCurrentLyric ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isCurrentLyric ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
                }}
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = item.start;
                    if (audioRef.current.paused) {
                      audioRef.current.play();
                    }
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
                  color: isCurrentLyric ? 'rgba(255,255,255,0.8)' : '#666',
                  marginTop: '4px'
                }}>
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

  // Auto-scroll effect for current lyric
  useEffect(() => {
    const currentIndex = getCurrentLyricIndex(currentTime);
    if (currentIndex !== -1) {
      const element = document.querySelector(`[data-lyric-index="${currentIndex}"]`);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
      }
    }
  }, [currentTime, getCurrentLyricIndex]);

  // Add status indicator component
  const StatusIndicator = ({ status }) => (
    <span style={{
      marginLeft: '10px',
      color: status === 'saved' ? '#4CAF50' : '#666',
      fontSize: '0.8em'
    }}>
      {status === 'saved' ? '✓ Saved' : 'Not saved'}
    </span>
  );

  return (
    <div className="container">
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
            onChange={(e) => {
              setGeniusApiKey(e.target.value);
              setGeniusKeyStatus('empty');
            }}
            style={{ marginRight: '10px', width: '300px' }}
          />
          <button onClick={() => handleSaveApiKey('genius', geniusApiKey)}>Save Genius API Key</button>
          <StatusIndicator status={geniusKeyStatus} />
        </div>

        <div style={{ marginTop: '15px' }}>
          <label htmlFor="youtubeApiKey">YouTube API Key:</label>
          <input
            type="text"
            id="youtubeApiKey"
            value={youtubeApiKey}
            onChange={(e) => {
              setYoutubeApiKey(e.target.value);
              setYoutubeKeyStatus('empty');
            }}
            style={{ marginRight: '10px', width: '300px' }}
          />
          <button onClick={() => handleSaveApiKey('youtube', youtubeApiKey)}>Save YouTube API Key</button>
          <StatusIndicator status={youtubeKeyStatus} />
        </div>

        {/* Add Spotify API inputs */}
        <div style={{ marginTop: '15px' }}>
          <div>
            <label htmlFor="spotifyClientId">Spotify Client ID:</label>
            <input
              type="text"
              id="spotifyClientId"
              value={spotifyClientId}
              onChange={(e) => {
                setSpotifyClientId(e.target.value);
                setSpotifyClientIdStatus('empty');
              }}
              style={{ marginRight: '10px', width: '300px' }}
            />
            <StatusIndicator status={spotifyClientIdStatus} />
          </div>
          <div style={{ marginTop: '5px' }}>
            <label htmlFor="spotifyClientSecret">Spotify Client Secret:</label>
            <input
              type="password"
              id="spotifyClientSecret"
              value={spotifyClientSecret}
              onChange={(e) => {
                setSpotifyClientSecret(e.target.value);
                setSpotifyClientSecretStatus('empty');
              }}
              style={{ marginRight: '10px', width: '300px' }}
            />
            <StatusIndicator status={spotifyClientSecretStatus} />
          </div>
          <button 
            onClick={() => handleSaveApiKey('spotify', spotifyClientId, spotifyClientSecret)}
            style={{ marginTop: '5px' }}
          >
            Save Spotify API Keys
          </button>
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
          Get Lyrics Matching
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