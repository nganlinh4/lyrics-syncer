import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeProvider from './theme/ThemeProvider';
import MainLayout from './layouts/MainLayout';
import SongInput from './components/SongInput';
import Settings from './components/Settings';
import AudioPreviewSection from './components/AudioPreviewSection';
import LyricsMatchingSection from './components/LyricsMatchingSection';
import LyricsEditor from './components/LyricsEditor';  // Import the new component
import ModelSelector from './components/ModelSelector';
import ImageModelSelector from './components/ImageModelSelector';
import PromptModelSelector from './components/PromptModelSelector';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Card from './ui/Card';
import Button from './ui/Button';
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
    const defaultModel = 'gemini-2.5-pro-exp-03-25';
    return savedModel || defaultModel;
  });

  // Other state
  const [artist, setArtist] = useState(() => localStorage.getItem('lastArtist') || '');
  const [song, setSong] = useState(() => localStorage.getItem('lastSong') || '');
  const [loading, setLoading] = useState(false);
  const [needsRefetch, setNeedsRefetch] = useState(true);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [albumArtUrl, setAlbumArtUrl] = useState('');
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);

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
    handleAdvancedMatch,
    handleUpdateLyrics,
    handleDownloadJSON,
    setError,
    setLyrics,
    handleCustomLyrics,
    saveCustomLyrics,  // Extract saveCustomLyrics from the hook
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
  }, [isCustomLyrics, song, artist, setMatchedLyrics, setMatchingComplete]);

  // Computed values
  const canStartMatching = hasDownloaded && !needsRefetch && audioUrl && lyrics.length > 0;
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

  const handleAlbumArtChange = (newUrl) => {
    setAlbumArtUrl(newUrl);
  };

  const handleAudioChange = (newUrl) => {
    setAudioUrl(newUrl);
    setNeedsRefetch(false);
  };

  const onLoadedMetadata = (e) => {
    console.log("Audio metadata loaded, duration:", e.target.duration);
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

      <div className="main-content">
        {/* Error Display with improved visibility */}
        {(apiError || lyricsError) && (
          <Card className="error-display">
            <div role="alert">
              {apiError || lyricsError}
            </div>
          </Card>
        )}

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
          onFetchFromGenius={async (artist, song, force = false) => {
            try {
              const result = await fetchFromGenius(artist, song, force);
              if (result && result.albumArtUrl) {
                setAlbumArtUrl(result.albumArtUrl);
              }
            } catch (error) {
              setError(error.message);
            }
          }}
        />

        {/* Audio Preview Section with improved dark mode contrast */}
        {(audioUrl || lyrics.length > 0 || albumArtUrl) && !matchingComplete && !isEditingLyrics && (
          <Card>
            <AudioPreviewSection
              audioUrl={audioUrl}
              audioRef={audioRef}
              containerRef={containerRef}
              fileSize={fileSize}
              albumArtUrl={albumArtUrl}
              onError={setError}
              onLoadedMetadata={onLoadedMetadata}
              handleAudioRef={handleAudioRef}
              lyrics={lyrics}
              artist={artist}
              song={song}
              onAlbumArtChange={handleAlbumArtChange}
              onAudioChange={handleAudioChange}
              onCustomLyrics={() => setIsEditingLyrics(true)}
            />
          </Card>
        )}

        {/* Lyrics Editor (replaces CustomLyricsInput) */}
        {!matchingInProgress && isEditingLyrics && (
          <Card>
            <LyricsEditor
              initialLyrics={lyrics}
              artist={artist}
              song={song}
              onSave={async (lyricsArray, artist, song) => {
                try {
                  await saveCustomLyrics(lyricsArray, artist, song);
                  
                  // Update state
                  setLyrics(lyricsArray);
                  setIsEditingLyrics(false);
                } catch (error) {
                  setError(error.message);
                }
              }}
              onCancel={() => setIsEditingLyrics(false)}
            />
          </Card>
        )}

        {/* Lyrics Matching Section with improved visual hierarchy */}
        {(showMatchingButton || matchingInProgress || matchingComplete) && (
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
            className={matchingInProgress ? 'processing' : ''}
            onAlbumArtChange={handleAlbumArtChange}
          />
        )}

        {/* Image Generation Section with consistent spacing and improved contrast */}
        {lyrics.length > 0 && (
          <Card>
            <div className="image-generation">
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
                className="generate-button"
              >
                {generatingImage ? t('imageGeneration.generating') : t('imageGeneration.generateButton')}
              </Button>

              {generatedPrompt && (
                <p className="prompt-text">
                  {t('imageGeneration.prompt')} {generatedPrompt}
                </p>
              )}

              {generatedImage && (
                <div className="generated-image-container">
                  <img
                    src={`data:${generatedImage.mime_type};base64,${generatedImage.data}`}
                    alt="Generated background"
                    className="generated-image"
                  />
                  <div className="image-actions">
                    <small className="image-credit">
                      {t('imageGeneration.imageCredit')}
                    </small>
                    <Button
                      onClick={() => {
                        try {
                          const byteString = atob(generatedImage.data);
                          const mimeType = generatedImage.mime_type || 'image/png';
                          const ab = new ArrayBuffer(byteString.length);
                          const ia = new Uint8Array(ab);
                          for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                          }
                          const blob = new Blob([ab], { type: mimeType });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `generated_background_${artist}_${song}.png`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error('Error downloading image:', error);
                          setError(t('errors.downloadFailed'));
                        }
                      }}
                      variant="primary"
                      size="small"
                    >
                      {t('common.download')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <MainApp />,
    },
    {
      path: "/privacy",
      element: <PrivacyPolicy />,
    },
    {
      path: "/terms",
      element: <TermsOfService />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
