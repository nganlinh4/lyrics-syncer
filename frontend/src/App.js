import React, { useState } from 'react';
import LyricsDisplay from './components/LyricsDisplay';
import LyricsTimeline from './components/timeline/LyricsTimeline';
import ApiKeyInput from './components/ApiKeyInput';
import AudioPlayer from './components/AudioPlayer';
import ModelSelector from './components/ModelSelector';
import useApiKeys from './hooks/useApiKeys';
import useAudioControl from './hooks/useAudioControl';
import useLyrics from './hooks/useLyrics';

function App() {
  // Local state
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash-thinking-exp-01-21');
  const [artist, setArtist] = useState(() => localStorage.getItem('lastArtist') || '');
  const [song, setSong] = useState(() => localStorage.getItem('lastSong') || '');
  const [loading, setLoading] = useState(false);
  const [audioOnly, setAudioOnly] = useState(() => localStorage.getItem('audioOnly') === 'true');

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
    matchingInProgress,
    matchingComplete,
    error: lyricsError,
    processingStatus,
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

      {audioUrl && lyrics.length > 0 && (
        <button
          onClick={() => handleAdvancedMatch(artist, song, audioUrl, lyrics, selectedModel)}
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

      {/* Lyrics Timeline Editor */}
      {matchingComplete && matchedLyrics.length > 0 && (
        <div id="timeline-editor"
          tabIndex="-1"
          style={{ 
            marginTop: '30px', 
            padding: '15px',
 
            backgroundColor: '#f8f9fa',
            outline: 'none', // Hide focus outline
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#1976d2' }}>Edit Lyrics Timing</h3>
          <LyricsTimeline 
            matchedLyrics={matchedLyrics} 
            currentTime={currentTime}
            duration={audioDuration || 180}
            onUpdateLyrics={(updatedLyrics) => {
              console.log('Timeline update:', updatedLyrics);
              handleUpdateLyrics(updatedLyrics);
              document.getElementById('timeline-editor').focus();
            }}
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

      {/* Lyrics Display */}
      {matchingComplete && matchedLyrics.length > 0 && (
        <LyricsDisplay 
          matchedLyrics={matchedLyrics} 
          currentTime={currentTime} 
          onLyricClick={seekTo}
        />
      )}

      {/* Preview Button */}
      <button
        onClick={() => handlePreviewLyrics(artist, song)}
        style={{ padding: '8px 16px', marginLeft: '10px' }}
      >
        Preview Lyrics
      </button>

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