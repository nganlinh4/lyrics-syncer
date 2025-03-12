import React, { useState, useRef, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import LyricsDisplay from './components/LyricsDisplay';
import LyricsTimeline from './components/LyricsTimeline';

const ApiKeyInstructions = ({ type }) => {
  const instructions = {
    youtube: {
      link: "https://console.cloud.google.com/apis/credentials",
      steps: [
        "1. Go to Google Cloud Console",
        "2. Create or select a project",
        "3. Enable 'YouTube Data API v3'",
        "4. Go to Credentials",
        "5. Create API Key"
      ]
    },
    genius: {
      link: "https://genius.com/api-clients",
      steps: [
        "1. Sign in to Genius",
        "2. Click 'New API Client'",
        "3. Fill in app details",
        "4. Get Client Access Token"
      ]
    },
    gemini: {
      link: "https://makersuite.google.com/app/apikey",
      steps: [
        "1. Sign in to Google AI Studio",
        "2. Click 'Get API key'",
        "3. Create new key or select existing"
      ]
    }
  };

  return (
    <div style={{ 
      fontSize: '0.8em', 
      marginTop: '5px',
      color: '#666' 
    }}>
      <a 
        href={instructions[type].link} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ color: '#0066cc' }}
      >
        Get {type.charAt(0).toUpperCase() + type.slice(1)} API Key
      </a>
      <div style={{ marginTop: '3px' }}>
        {instructions[type].steps.map((step, index) => (
          <div key={index}>{step}</div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [artist, setArtist] = useState(() => localStorage.getItem('lastArtist') || '');
  const [song, setSong] = useState(() => localStorage.getItem('lastSong') || '');
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
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [geminiKeyStatus, setGeminiKeyStatus] = useState(() => localStorage.getItem('geminiApiKey') ? 'saved' : 'empty');
  const [processingStatus, setProcessingStatus] = useState('');
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [languageDetected, setLanguageDetected] = useState('');
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioOnly, setAudioOnly] = useState(() => localStorage.getItem('audioOnly') === 'true');

  // Refs
  const wavesurferRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);

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
        setAudioDuration(wavesurferRef.current.getDuration());
      });

      wavesurferRef.current.on('error', (err) => {
        console.error('WaveSurfer error:', err);
      });

      wavesurferRef.current.on('timeupdate', (time) => {
        setCurrentTime(time);
        updateCurrentLyric(time);
      });

      wavesurferRef.current.on('audioprocess', (time) => {
        setCurrentTime(time);
        updateCurrentLyric(time);
      });
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, []);

  const handleSaveApiKey = async (type, key) => {
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

      switch(type) {
        case 'youtube':
          localStorage.setItem('youtubeApiKey', key);
          setYoutubeApiKey(key);
          setYoutubeKeyStatus('saved');
          break;
        case 'genius':
          localStorage.setItem('geniusApiKey', key);
          setGeniusApiKey(key);
          setGeniusKeyStatus('saved');
          break;
        case 'gemini':
          localStorage.setItem('geminiApiKey', key);
          setGeminiApiKey(key);
          setGeminiKeyStatus('saved');
          break;
        default:
          throw new Error('Invalid key type');
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

      if (!song || !artist) {
        throw new Error('Please enter both song and artist');
      }

      const response = await fetch('http://localhost:3001/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          song, 
          artist,
          audioOnly 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to process: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.lyrics) {
        const lyricsArray = data.lyrics.split(/\\n|\n/).filter(line => line.trim());
        setLyrics(lyricsArray);
      }

      const songName = `${artist.toLowerCase().replace(/\s+/g, '_')}_-_${song.toLowerCase().replace(/\s+/g, '_')}`;
      const audioResponse = await fetch(`http://localhost:3001/api/audio_data/${encodeURIComponent(songName)}`);
      if (!audioResponse.ok) {
        throw new Error('Failed to get audio data');
      }
      
      const audioData = await audioResponse.json();
      setAudioUrl(audioData.audio_url);
      
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

  const handleAdvancedMatch = async () => {
    try {
        setMatchingInProgress(true);
        setMatchingComplete(false);
        setLoading(true);
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
        setLoading(false);
    }
  };

  const getCurrentLyricIndex = useCallback((currentTime) => {
    if (!matchedLyrics || matchedLyrics.length === 0) {
      return -1;
    }

    return matchedLyrics.findIndex(
      (lyric) => currentTime >= lyric.start && currentTime <= lyric.end
    );
  }, [matchedLyrics]);

  const updateCurrentLyric = useCallback((time) => {
    if (!matchedLyrics || matchedLyrics.length === 0) return;

    const index = matchedLyrics.findIndex(
      (lyric) => time >= lyric.start && time <= lyric.end
    );

    if (index !== currentLyricIndex) {
      setCurrentLyricIndex(index);

    }
  }, [matchedLyrics, currentLyricIndex, getCurrentLyricIndex]);

  useEffect(() => {
    const currentIndex = getCurrentLyricIndex(currentTime);
    if (currentIndex !== -1) {
      const element = document.querySelector(`[data-lyric-index="${currentIndex}"]`);
      if (element) {
        const container = element.closest('.matched-lyrics-container');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const scrollOffset = elementRect.top - containerRect.top - (containerRect.height / 2);
          container.scrollBy({ top: scrollOffset, behavior: 'smooth' });
        }
        updateCurrentLyric(currentTime);
      }
    }
  }, [currentTime, getCurrentLyricIndex]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleTimeUpdate = () => {
        updateCurrentLyric(audioElement.currentTime);
        setCurrentTime(audioElement.currentTime);
      };

      audioElement.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, []);

  const updateTime = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, []);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = () => {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    const handlePause = () => {
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

  const renderMatchedLyrics = () => {
    if (!matchingComplete || !matchedLyrics) return null;

    return (
      <div style={{ marginTop: '20px' }}>
        <h3>Matched Lyrics</h3>
        <div 
          className="matched-lyrics-container"
          style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
>
          {matchedLyrics.map((item, index) => {
            const isCurrentLyric = index === currentLyricIndex;
            const confidenceColor = 
              item.confidence > 0.9 ? '#4CAF50' :
              item.confidence > 0.7 ? '#FFA726' :
              '#F44336';

            return (
              <div 
                key={index}
                data-lyric-index={index}
                style={{
                  padding: '10px',
                  backgroundColor: isCurrentLyric ? '#e3f2fd' : 'white',
                  marginBottom: '5px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  borderLeft: `4px solid ${confidenceColor}`,
                  transition: 'all 0.3s ease',
                  boxShadow: isCurrentLyric ? '0 0 10px rgba(0,0,0,0.1)' : 'none'
                }}
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = item.start;
                    audioRef.current.play();
                  }
                  if (wavesurferRef.current) {
                    wavesurferRef.current.seekTo(item.start / wavesurferRef.current.getDuration());
                  }
                }}
              >
                <div style={{
                  fontWeight: isCurrentLyric ? '600' : 'normal'
                }}>
                  {item.text || item.line}
                </div>
                <div style={{ 
                  fontSize: '0.8em',
                  color: '#666',
                  marginTop: '4px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{`${item.start.toFixed(2)}s - ${item.end.toFixed(2)}s`}</span>
                  <span>Confidence: {(item.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const StatusIndicator = ({ status }) => (
    <span style={{
      marginLeft: '10px',
      color: status === 'saved' ? '#4CAF50' : '#666',
      fontSize: '0.8em'
    }}>
      {status === 'saved' ? '✓ Saved' : 'Not saved'}
    </span>
  );

  const handleUpdateLyrics = (updatedLyrics) => {
    setMatchedLyrics(updatedLyrics);
  };

  const handleDownloadJSON = () => {
    if (!matchedLyrics || matchedLyrics.length === 0) {
      setError('No matched lyrics to download');
      return;
    }

    try {
      // Create a new array without the confidence field
      const cleanedLyrics = matchedLyrics.map(({ confidence, ...rest }) => rest);
      
      // Create a Blob with the JSON data
      const jsonBlob = new Blob([JSON.stringify(cleanedLyrics, null, 2)], { type: 'application/json' });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(jsonBlob);
      
      // Create a link element and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${artist.toLowerCase().replace(/\s+/g, '_')}_-_${song.toLowerCase().replace(/\s+/g, '_')}_lyrics.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading JSON:', error);
      setError('Failed to download JSON: ' + error.message);
    }
  };

  // Make sure audio duration gets set when audio loads
  useEffect(() => {
    const handleAudioLoaded = () => {
      if (audioRef.current) {
        const duration = audioRef.current.duration;
        console.log("Audio duration set from audio element:", duration);
        setAudioDuration(duration);
      }
    };

    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener('loadedmetadata', handleAudioLoaded);
      audioElement.addEventListener('durationchange', handleAudioLoaded);
      
      // If duration is already available, set it immediately
      if (audioElement.duration && audioElement.duration !== Infinity) {
        console.log("Audio duration available immediately:", audioElement.duration);
        setAudioDuration(audioElement.duration);
      }
      
      return () => {
        audioElement.removeEventListener('loadedmetadata', handleAudioLoaded);
        audioElement.removeEventListener('durationchange', handleAudioLoaded);
      };
    }
  }, [audioRef.current]);

  // Add debug information before render
  useEffect(() => {
    console.log("Debug rendering conditions:", { 
      matchingComplete, 
      matchedLyricsLength: matchedLyrics.length, 
      audioDuration,
      audioUrl
    });
  }, [matchingComplete, matchedLyrics, audioDuration, audioUrl]);

  return (
    <div className="container">
      <h1>Lyrics Timing App</h1>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <label htmlFor="song">Song:</label>
          <input
            type="text"
            id="song"
            value={song}
            onChange={(e) => {
              setSong(e.target.value);
              localStorage.setItem('lastSong', e.target.value);
            }}
          />
          <label>
            <input
              type="checkbox"
              checked={audioOnly}
              onChange={(e) => {
                setAudioOnly(e.target.checked);
                localStorage.setItem('audioOnly', e.target.checked);
              }}
            />
            Audio
          </label>
        </div>

        <label htmlFor="artist">Artist:</label>
        <input
          type="text"
          id="artist"
          value={artist}
          onChange={(e) => {
            setArtist(e.target.value);
            localStorage.setItem('lastArtist', e.target.value);
          }}
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
          <ApiKeyInstructions type="genius" />
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
          <ApiKeyInstructions type="youtube" />
        </div>

        <div style={{ marginTop: '15px' }}>
          <label htmlFor="geminiApiKey">Gemini API Key:</label>
          <input
            type="text"
            id="geminiApiKey"
            value={geminiApiKey}
            onChange={(e) => {
              setGeminiApiKey(e.target.value);
              setGeminiKeyStatus('empty');
            }}
            style={{ marginRight: '10px', width: '300px' }}
          />
          <button onClick={() => handleSaveApiKey('gemini', geminiApiKey)}>Save Gemini API Key</button>
          <StatusIndicator status={geminiKeyStatus} />
          <ApiKeyInstructions type="gemini" />
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={loading}
        style={{ padding: '8px 16px', marginBottom: '20px' }}
      >
        {loading ? 'Processing...' : 'Download and Process'}
      </button>

      {audioUrl && lyrics.length > 0 && (
        <button
          onClick={handleAdvancedMatch}
          disabled={matchingInProgress}
          style={{ 
            padding: '8px 16px', 
            marginLeft: '10px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: matchingInProgress ? 'not-allowed' : 'pointer',
            opacity: matchingInProgress ? 0.7 : 1
          }}
        >
          {matchingInProgress ? 'Matching in Progress...' : 'Advanced Lyrics Matching (ML)'}
        </button>
      )}

      {matchingInProgress && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <p>Processing: {processingStatus}</p>
          {matchingProgress > 0 && (
            <div style={{ 
              width: '100%',
              height: '20px',
              backgroundColor: '#ddd',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${matchingProgress}%`,
                height: '100%',
                backgroundColor: '#4CAF50',
                transition: 'width 0.3s ease-in-out'
              }}></div>
            </div>
          )}
        </div>
      )}

      {languageDetected && (
        <div style={{
          marginTop: '10px',
          fontSize: '0.9em',
          color: '#666'
        }}>
          Detected Language: {languageDetected}
        </div>
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
                onLoadedMetadata={(e) => {
                  console.log("Audio metadata loaded, duration:", e.target.duration);
                  setAudioDuration(e.target.duration);
                }}
              />

              <div style={{ marginTop: '10px' }}>
                <a href={audioUrl} target="_blank" rel="noopener noreferrer">
                  Direct Download Link
                </a>
              </div>
            </div>

            {fileSize > 0 && <div>File Size: {Math.round(fileSize / 1024)} KB</div>}
          </>
        )}
      </div>

      {/* Place the timeline editor first, right after the audio player */}
      {matchingComplete && matchedLyrics.length > 0 && (
        <div style={{ 
          marginTop: '30px', 
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#1976d2' }}>Edit Lyrics Timing</h3>
          <LyricsTimeline 
            matchedLyrics={matchedLyrics} 
            currentTime={currentTime}
            duration={audioDuration || 180} /* Use a default duration if audioDuration is not set */
            onUpdateLyrics={handleUpdateLyrics}
          />
          

          <button
            onClick={handleDownloadJSON}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '15px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Download Lyrics JSON
          </button>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Downloads the edited lyrics timing as a JSON file (without confidence field)
          </p>
        </div>
      )}

      {/* Then show the standard lyrics display */}
      {matchingComplete && matchedLyrics.length > 0 && (
        <LyricsDisplay 
          matchedLyrics={matchedLyrics} 
          currentTime={currentTime} 
          onLyricClick={(startTime) => {
            if (audioRef.current) {
              audioRef.current.currentTime = startTime;
              audioRef.current.play();
            }
            if (wavesurferRef.current) {
              wavesurferRef.current.seekTo(startTime / wavesurferRef.current.getDuration());
            }
          }} 
        />
      )}

      <button
        onClick={handlePreviewLyrics}
        style={{ padding: '8px 16px', marginLeft: '10px' }}
      >
        Preview Lyrics
      </button>

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
    </div>
  );
}

export default App;