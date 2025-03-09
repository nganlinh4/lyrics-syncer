import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

function App() {
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [geniusApiKey, setGeniusApiKey] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [lyrics, setLyrics] = useState([]);

  const wavesurferRef = useRef(null);
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

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
    setAudioLoaded(false);

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

 const handlePreviewLyrics = () => {
    if (!song || !artist) {
      setError("Please enter both song and artist.");
      setLyrics([]);
      return;
    }

    fetch('http://localhost:3001/api/lyrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artist, song }),
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch lyrics: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      setLyrics(data.lyrics.split('\\n'));
      setError(null); // Clear any previous error
    })
    .catch((error) => {
      console.error("Error fetching lyrics:", error);
      setLyrics([]); // Reset lyrics on error
      setError("Error fetching lyrics from Genius."); // Set error message
    });
  };

  // Function to toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play()
        .catch(err => {
          console.error("Play error:", err);
          setError("Unable to play audio: " + err.message);
        });
    }
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
      <button
        onClick={handlePreviewLyrics}
        style={{ padding: '8px 16px', marginLeft: '10px' }}
      >
        Preview Lyrics
      </button>

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
                onCanPlay={() => {
                  console.log("Audio can play now");
                  setAudioLoaded(true);
                }}
                onError={(e) => {
                  console.error("Audio player error:", e);
                  console.log("Failed to load audio URL:", audioUrl);
                  setError("Error loading audio. Please try again.");
                }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
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
                      {item}
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