import React, { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import SongInput from './components/SongInput';
import Settings from './components/Settings';
import AudioPreviewSection from './components/AudioPreviewSection';
import LyricsMatchingSection from './components/LyricsMatchingSection';
import CustomLyricsInput from './components/CustomLyricsInput';
import ModelSelector from './components/ModelSelector';
import ImageModelSelector from './components/ImageModelSelector';
import PromptModelSelector from './components/PromptModelSelector';
import Card from './ui/Card';
import Button from './ui/Button';
import useApiKeys from './hooks/useApiKeys';
import useAudioControl from './hooks/useAudioControl';
import useLyrics from './hooks/useLyrics';

function App() {
  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Model state
  const [selectedModel, setSelectedModel] = useState(() => {
    const savedModel = localStorage.getItem('selectedModel');
    const defaultModel = 'gemini-2.0-pro-exp-02-05';
    return savedModel || defaultModel;
  });

  // Other state
  const [artist, setArtist] = useState(() => localStorage.getItem('lastArtist') || '');
  const [song, setSong] = useState(() => localStorage.getItem('lastSong') || '');
  const [loading, setLoading] = useState(false);
  const [needsRefetch, setNeedsRefetch] = useState(true);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

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
    seekTo,
    handleAudioRef
  } = useAudioControl();

  const {
    lyrics,
    albumArtUrl,
    matchedLyrics,
    setMatchedLyrics,
    matchingInProgress,
    matchingComplete,
    error: lyricsError,
    processingStatus,
    selectedImageModel,
    selectedPromptModel,
    setSelectedImageModel,
    setSelectedPromptModel,
    setMatchingComplete,
    isCustomLyrics,
    matchingProgress,
    languageDetected,
    handlePreviewLyrics,
    handleAdvancedMatch,
    handleUpdateLyrics,
    handleDownloadJSON,
    setError,
    setLyrics,
    handleCustomLyrics,
    generatedPrompt,
    generatedImage,
    generateImagePrompt,
    generateImage,
    fetchFromGenius
  } = useLyrics();

  // Event handlers
  const handleGenerateImage = async () => {
    try {
      setGeneratingImage(true);
      setError(null);
      const prompt = await generateImagePrompt();
      if (!prompt) {
        throw new Error('Failed to generate prompt');
      }
      await generateImage(prompt);
    } catch (error) {
      setError(error.message);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!song || !artist) {
        throw new Error('Please enter both song and artist');
      }

      const API_URL = 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song, artist }),
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

  const handleForceDownload = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/force_process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song, artist }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to process: ${response.status}`);
      }

      await handleDownload();
    } catch (error) {
      setError(error.message);
      console.error('Force download error:', error);
    }
  };

  // Handle fetching lyrics from Genius
  const handleFetchFromGenius = async (artistName, songName) => {
    try {
      setLoading(true);
      setError(null);
      await fetchFromGenius(artistName, songName);
      setNeedsRefetch(false);
    } catch (error) {
      setError(error.message);
      console.error('Genius fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    setNeedsRefetch(true);
    if (!isCustomLyrics) setHasDownloaded(false);
    setMatchingComplete(false);
    setMatchedLyrics([]);
  }, [song, artist, setMatchedLyrics, setMatchingComplete]);

  // Computed values
  const canStartMatching = hasDownloaded && !needsRefetch && audioUrl && lyrics.length > 0;
  const showForceButtons = !loading && hasDownloaded;
  const showMatchingButton = canStartMatching && !matchingInProgress;

  return (
    <MainLayout onSettingsClick={() => setIsSettingsOpen(true)}>
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKeys={apiKeys}
        onApiKeyChange={handleApiKeyChange}
        onSaveApiKey={handleSaveApiKey}
        selectedModel={selectedModel}
        onModelChange={(model) => {
          setSelectedModel(model);
          localStorage.setItem('selectedModel', model);
        }}
        selectedImageModel={selectedImageModel}
        onImageModelChange={(model) => {
          setSelectedImageModel(model);
          localStorage.setItem('selectedImageModel', model);
        }}
        selectedPromptModel={selectedPromptModel}
        onPromptModelChange={(model) => {
          setSelectedPromptModel(model);
          localStorage.setItem('selectedPromptModel', model);
        }}
        ModelSelector={ModelSelector}
        ImageModelSelector={ImageModelSelector}
        PromptModelSelector={PromptModelSelector}
      />

      {/* Song Input Section */}
      <SongInput
        artist={artist}
        song={song}
        loading={loading}
        onArtistChange={(e) => {
          setArtist(e.target.value);
          setNeedsRefetch(true);
          localStorage.setItem('lastArtist', e.target.value);
        }}
        onSongChange={(e) => {
          setSong(e.target.value);
          setNeedsRefetch(true);
          localStorage.setItem('lastSong', e.target.value);
        }}
        onDownload={handleDownload}
        onForceDownload={handleForceDownload}
        onFetchFromGenius={handleFetchFromGenius}
        showForceButton={showForceButtons}
      />

      {/* Audio Preview Section - only show when not matching lyrics */}
      {audioUrl && !matchingComplete && !matchingInProgress && (
        <AudioPreviewSection
          audioUrl={audioUrl}
          audioRef={audioRef}
          containerRef={containerRef}
          fileSize={fileSize}
          albumArtUrl={albumArtUrl}
          lyrics={lyrics}
          onError={(e) => {
            console.error("Audio player error:", e);
            console.log("Failed to load audio URL:", audioUrl);
            setError("Error loading audio. Please try again.");
          }}
          onLoadedMetadata={(e) => {
            console.log("Audio metadata loaded, duration:", e.target.duration);
          }}
          handleAudioRef={handleAudioRef}
        />
      )}

      {/* Custom Lyrics Input */}
      {!matchingInProgress && (
        <CustomLyricsInput
          onCustomLyrics={handleCustomLyrics}
        />
      )}

      {/* Lyrics Matching Section */}
      <LyricsMatchingSection
        matchingInProgress={matchingInProgress}
        showMatchingButton={showMatchingButton}
        onAdvancedMatch={handleAdvancedMatch}
        processingStatus={processingStatus}
        matchingProgress={matchingProgress}
        matchingComplete={matchingComplete}
        matchedLyrics={matchedLyrics}
        currentTime={currentTime}
        onLyricClick={seekTo}
        audioDuration={audioDuration}
        onUpdateLyrics={handleUpdateLyrics}
        onCustomLyrics={handleCustomLyrics}
        onDownloadJSON={handleDownloadJSON}
        artist={artist}
        song={song}
        audioUrl={audioUrl}
        lyrics={lyrics}
        selectedModel={selectedModel}
        audioRef={audioRef}
        handleAudioRef={handleAudioRef}
        onError={(e) => {
          console.error("Audio player error:", e);
          console.log("Failed to load audio URL:", audioUrl);
          setError("Error loading audio. Please try again.");
        }}
        onLoadedMetadata={(e) => {
          console.log("Audio metadata loaded, duration:", e.target.duration);
        }}
        albumArtUrl={albumArtUrl}
      />

      {/* Image Generation Section */}
      {lyrics.length > 0 && (
        <Card title="Background Image Generation">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <Button
              onClick={handleGenerateImage}
              disabled={generatingImage || !albumArtUrl}
              variant={generatingImage ? 'disabled' : 'primary'}
            >
              {generatingImage ? 'Generating...' : 'Generate Background Image'}
            </Button>

            {generatedPrompt && (
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                Generated Prompt: {generatedPrompt}
              </p>
            )}

            {generatedImage && (
              <div>
                <img
                  src={`data:${generatedImage.mime_type};base64,${generatedImage.data}`}
                  alt="Generated background"
                  style={{
                    width: '100%',
                    maxWidth: '1920px',
                    height: 'auto',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  This image was generated using the song's lyrics and album art as inspiration.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Error Display */}
      {(apiError || lyricsError) && (
        <Card>
          <div style={{ color: '#f44336' }}>
            {apiError || lyricsError}
          </div>
        </Card>
      )}
    </MainLayout>
  );
}

export default App;
