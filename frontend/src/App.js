import React, { useState, useEffect } from 'react';
import LyricsDisplay from './components/LyricsDisplay';
import ApiKeyInput from './components/ApiKeyInput';
import AudioPlayer from './components/AudioPlayer';
import ModelSelector from './components/ModelSelector';
import useApiKeys from './hooks/useApiKeys';
import useAudioControl from './hooks/useAudioControl';
import useLyrics from './hooks/useLyrics';

function App() {
  // Local state
  const [selectedModel, setSelectedModel] = useState(() => {
    const savedModel = localStorage.getItem('selectedModel');
    const defaultModel = 'gemini-2.0-pro-exp-02-05';
    return savedModel || defaultModel;
  });
  const [artist, setArtist] = useState(() => localStorage.getItem('lastArtist') || '');
  const [song, setSong] = useState(() => localStorage.getItem('lastSong') || '');
  const [loading, setLoading] = useState(false);
  const [needsRefetch, setNeedsRefetch] = useState(true);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [audioOnly, setAudioOnly] = useState(() => localStorage.getItem('audioOnly') === 'true');
  const [hasMatched, setHasMatched] = useState(false);

  // Custom hooks
  const {
    apiKeys,
    handleSaveApiKey,
    handleApiKeyChange,
    error: apiError
  } = useApiKeys();

  const {
    currentTime,
    audioDuration,
    audioUrl,
    fileSize,
    containerRef,
    audioRef,
    setAudioUrl,
    setFileSize,
    seekTo
  } = useAudioControl();

  const {
    lyrics,
    matchedLyrics,
    setMatchedLyrics,
    matchingInProgress,
    matchingComplete,
    error: lyricsError,
    processingStatus,
    setMatchingComplete,
    matchingProgress,
    languageDetected,
    handlePreviewLyrics,
    handleAdvancedMatch,
    handleUpdateLyrics,
    handleDownloadJSON,
    updateCurrentLyric,
    setError,
    setLyrics
  } = useLyrics();

  // Add this function where other handlers are defined
  // Regular download and process
  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!song || !artist) {
        throw new Error('Please enter both song and artist');
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/api/process`, {
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
      setNeedsRefetch(false);
      setHasDownloaded(true);

      const songName = `${artist.toLowerCase().replace(/\s+/g, '_')}_-_${song.toLowerCase().replace(/\s+/g, '_')}`;
      const audioResponse = await fetch(`${API_URL}/api/audio_data/${encodeURIComponent(songName)}`);
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

  // Force re-download and process
  const handleForceDownload = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/api/force_process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song, artist, audioOnly }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to process: ${response.status}`);
      }

      // Re-use same code as regular download
      await handleDownload();
    } catch (error) {
      setError(error.message);
      console.error('Force download error:', error);
    }
  };

  // Effect to handle song/artist changes
  useEffect(() => {
    setNeedsRefetch(true);
    setHasDownloaded(false);
    setMatchingComplete(false);
    setMatchedLyrics([]);
  }, [song, artist]);

  const canStartMatching = hasDownloaded && !needsRefetch && audioUrl && lyrics.length > 0;
  const showForceButtons = !loading && hasDownloaded;
  const showMatchingButton = canStartMatching && !matchingInProgress;

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
              setNeedsRefetch(true);
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
            Audio Only
          </label>
        </div>

        <label htmlFor="artist">Artist:</label>
        <input
          type="text"
          id="artist"
          value={artist}
          onChange={(e) => {
            setArtist(e.target.value);
            setNeedsRefetch(true);
            localStorage.setItem('lastArtist', e.target.value);
          }}
          style={{ marginRight: '10px' }}
        />

        {/* API Key Inputs */}
        <ApiKeyInput
          type="genius"
          value={apiKeys.genius.key}
          status={apiKeys.genius.status}
          onChange={(value) => handleApiKeyChange('genius', value)}
          onSave={handleSaveApiKey}
        />
        <ApiKeyInput
          type="youtube"
          value={apiKeys.youtube.key}
          status={apiKeys.youtube.status}
          onChange={(value) => handleApiKeyChange('youtube', value)}
          onSave={handleSaveApiKey}
        />
        <ApiKeyInput
          type="gemini"
          value={apiKeys.gemini.key}
          status={apiKeys.gemini.status}
          onChange={(value) => handleApiKeyChange('gemini', value)}
          onSave={handleSaveApiKey}
        />
          
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={(model) => {
              setSelectedModel(model);
              localStorage.setItem('selectedModel', model);
            }}
          />
      </div>

      {/* Action Buttons */}
      <button
        onClick={handleDownload}
        disabled={loading}
        style={{ padding: '8px 16px', marginBottom: '20px' }}
      >
        {loading ? 'Processing...' : 'Download and Process'}
      </button>

      
      {/* Force re-download buttons */}
      {showForceButtons && (
        <>
          <button
            onClick={handleForceDownload}
            disabled={loading}
            style={{ padding: '8px 16px', marginLeft: '10px' }}
          >
            Force Re-download & Process
          </button>
        </>
      )}

      {showMatchingButton && (
        <>
          <button
            disabled={matchingInProgress}
            onClick={() => handleAdvancedMatch(artist, song, audioUrl, lyrics, selectedModel)}
            style={{ 
              padding: '8px 16px', 
              marginLeft: '10px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: matchingInProgress ? 'not-allowed' : 'pointer'
            }}
          >
            {matchingInProgress ? 'Matching...' : 'Match Lyrics with Audio'}
          </button>
          
          
            <button
              disabled={matchingInProgress}
              onClick={() => handleAdvancedMatch(artist, song, audioUrl, lyrics, selectedModel, true)}
              style={{ 
                padding: '8px 16px', 
                marginLeft: '10px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: matchingInProgress ? 'not-allowed' : 'pointer'
              }}
            >
              Force Rematch
            </button>
        </>
      )}

      {/* Processing Status */}
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

      {/* Language Detection */}
      {languageDetected && (
        <div style={{
          marginTop: '10px',
          fontSize: '0.9em',
          color: '#666'
        }}>
          Detected Language: {languageDetected}
        </div>
      )}

      {/* Audio Player */}
      {audioUrl && (
        <AudioPlayer
          audioUrl={audioUrl}
          audioRef={audioRef}
          containerRef={containerRef}
          fileSize={fileSize}
          onError={(e) => {
            console.error("Audio player error:", e);
            console.log("Failed to load audio URL:", audioUrl);
            setError("Error loading audio. Please try again.");
          }}
          onLoadedMetadata={(e) => {
            console.log("Audio metadata loaded, duration:", e.target.duration);
          }}
        />
      )}

      {/* Lyrics Display with Editing */}
      {matchingComplete && matchedLyrics.length > 0 && (
        <div>
          <LyricsDisplay 
            matchedLyrics={matchedLyrics} 
            currentTime={currentTime} 
            onLyricClick={seekTo}
            duration={audioDuration || 180}
            onUpdateLyrics={handleUpdateLyrics}
            allowEditing={true}
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

      {/* Preview Button */}
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => handlePreviewLyrics(artist, song)}
          style={{ padding: '8px 16px' }}
        >
          Preview Lyrics
        </button>
        {!loading && lyrics.length > 0 && (
          <button
            onClick={() => handlePreviewLyrics(artist, song, true)}
            style={{ padding: '8px 16px', marginLeft: '10px' }}
          >
            Force Re-fetch Lyrics
          </button>
        )}
      </div>

      {/* Lyrics Preview */}
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

      {/* Error Display */}
      {(apiError || lyricsError) && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          {apiError || lyricsError}
        </div>
      )}
    </div>
  );
}

export default App;
