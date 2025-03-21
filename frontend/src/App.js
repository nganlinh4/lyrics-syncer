import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from './layouts/MainLayout';
import SongInput from './components/SongInput';
import Settings from './components/Settings';
import AudioPreviewSection from './components/AudioPreviewSection';
import LyricsMatchingSection from './components/LyricsMatchingSection';
import CustomLyricsInput from './components/CustomLyricsInput';
import ModelSelector from './components/ModelSelector';
import ImageModelSelector from './components/ImageModelSelector';
import PromptModelSelector from './components/PromptModelSelector';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Card from './ui/Card';
import Button from './ui/Button';
import ErrorDisplay from './ui/ErrorDisplay';
import theme from './theme/theme';
import ThemeProvider from './theme/ThemeProvider';
import useApiKeys from './hooks/useApiKeys';
import useAudioControl from './hooks/useAudioControl';
import useLyrics from './hooks/useLyrics';

const MainApp = () => {
  const { t } = useTranslation();
  
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
    loading: geniusLoading,
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
    } finally {
      setLoading(false);
    }
  };

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

      <div style={{ display: 'grid', gap: theme.spacing.xl, maxWidth: '800px', margin: '0 auto', padding: theme.spacing.lg }}>
        {/* Error Display */}
        {apiError && <ErrorDisplay message={apiError} onClose={() => setError(null)} />}
        {lyricsError && <ErrorDisplay message={lyricsError} onClose={() => setError(null)} />}

        {/* Song Input */}
        <SongInput
          artist={artist}
          song={song}
          loading={loading}
          geniusLoading={geniusLoading}
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
          onFetchFromGenius={fetchFromGenius}
          showForceButton={showForceButtons}
        />

        {/* Audio Preview Section - show whenever there's content */}
        {(audioUrl || lyrics.length > 0 || albumArtUrl) && !matchingComplete && !matchingInProgress && (
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
          <Card title={t('imageGeneration.title')}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <Button
                onClick={async (e) => {
                  e.preventDefault();
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
                    console.error('Image generation error:', error);
                  } finally {
                    setGeneratingImage(false);
                  }
                }}
                disabled={generatingImage || !albumArtUrl}
                variant={generatingImage ? 'disabled' : 'primary'}
              >
                {generatingImage ? t('imageGeneration.generating') : t('imageGeneration.generateButton')}
              </Button>

              {generatedPrompt && (
                <p style={{ fontSize: '0.9em', color: '#666' }}>
                  {t('imageGeneration.prompt')} {generatedPrompt}
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
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: theme.spacing.sm 
                  }}>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      {t('imageGeneration.imageCredit')}
                    </p>
                    <Button
                      onClick={() => {
                        try {
                          // For base64 images, we can convert directly to blob
                          const byteString = atob(generatedImage.data);
                          const mimeType = generatedImage.mime_type || 'image/png';
                          const ab = new ArrayBuffer(byteString.length);
                          const ia = new Uint8Array(ab);
                          for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                          }
                          const blob = new Blob([ab], { type: mimeType });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${artist}_${song}_background.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url); // Clean up the URL object
                        } catch (error) {
                          console.error('Error downloading image:', error);
                          setError('Failed to download the background image. Please try again.');
                        }
                      }}
                      variant="secondary"
                      size="small"
                    >
                      {t('imageGeneration.downloadButton')}
                    </Button>
                  </div>
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
      </div>
    </MainLayout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
