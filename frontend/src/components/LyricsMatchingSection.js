import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LyricsDisplay from './LyricsDisplay';
import AudioPlayer from './AudioPlayer';
import theme from '../theme/theme';

// Define animations in a style element
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInStagger {
      0% {
        opacity: 0;
        transform: translateY(10px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes slideInFromRight {
      0% {
        opacity: 0;
        transform: translateX(30px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes pulseGlow {
      0% {
        box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.4);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(66, 133, 244, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(66, 133, 244, 0);
      }
    }
    
    .matching-buttons-container {
      animation: fadeInStagger 0.5s ease-out forwards;
    }
    
    .matching-progress-container {
      animation: fadeInStagger 0.6s ease-out forwards;
    }
    
    .album-art-container {
      animation: fadeInStagger 0.7s ease-out forwards;
    }
    
    .lyrics-original-container {
      animation: slideInFromRight 0.7s ease-out forwards;
    }
    
    .audio-player-container {
      animation: fadeInStagger 0.8s ease-out forwards;
    }
    
    .synchronized-lyrics-container {
      animation: fadeInStagger 0.9s ease-out forwards;
    }
    
    .album-art-image {
      transition: all 0.3s ease;
    }
    
    .album-art-image:hover {
      transform: scale(1.03);
      box-shadow: ${theme.shadows.lg};
    }
    
    .download-json-button {
      animation: pulseGlow 2s infinite;
    }
    
    .progress-bar-animation {
      transition: width 0.5s ease-in-out;
    }
  `;
  document.head.appendChild(style);
}

const LyricsMatchingSection = ({
  matchingInProgress,
  showMatchingButton,
  onAdvancedMatch,
  onForceMatch,
  processingStatus,
  matchingProgress,
  matchingComplete,
  matchedLyrics,
  currentTime,
  onLyricClick,
  audioDuration,
  onUpdateLyrics,
  onCustomLyrics,
  onDownloadJSON,
  artist,
  song,
  audioUrl,
  lyrics,
  selectedModel,
  audioRef,
  handleAudioRef,
  onError,
  onLoadedMetadata,
  albumArtUrl,
  onAlbumArtChange
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  // Only render the section if there's something to show
  if (!showMatchingButton && !matchingInProgress && !matchingComplete) {
    return null;
  }

  const handleAlbumArtDownload = async () => {
    try {
      // Fetch the image to avoid cross-origin issues
      const response = await fetch(albumArtUrl);
      const blob = await response.blob();
      
      // Create object URL from the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${artist}_${song}_album_art.png`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error("Failed to download album art:", error);
      // Fallback to the original method if fetch fails
      const link = document.createElement('a');
      link.href = albumArtUrl;
      link.download = `${artist}_${song}_album_art.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError(new Error(t('errors.invalidImage')));
      return;
    }

    if (!artist || !song) {
      onError(new Error(t('errors.artistSongRequired')));
      return;
    }

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result;

          // Create temporary object URL for immediate display
          const objectUrl = URL.createObjectURL(file);
          void onAlbumArtChange?.(objectUrl);

          // Upload the file to the server
          const API_URL = 'http://localhost:3001';
          const response = await fetch(`${API_URL}/api/upload_album_art`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              artist,
              song,
              imageData: base64Data
            })
          });

          if (!response.ok) {
            throw new Error('Failed to upload album art');
          }

          // Get the server URL for the saved file
          const data = await response.json();
          
          // Update the album art URL to point to the saved file
          void onAlbumArtChange?.(data.albumArtUrl);
          
          // Clean up temporary object URL
          URL.revokeObjectURL(objectUrl);
        } catch (uploadError) {
          console.error("Failed to upload album art to server:", uploadError);
          onError(new Error(t('errors.uploadFailed')));
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to process album art:", error);
      onError(new Error(t('errors.uploadFailed')));
    }
  };

  return (
    <Card title={t('matching.title')}>
      <div style={{ display: 'grid', gap: theme.spacing.lg }}>
        {/* Matching Buttons */}
        {showMatchingButton && (
          <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }} className="matching-buttons-container">
            <Button
              disabled={matchingInProgress}
              onClick={() => onAdvancedMatch(artist, song, audioUrl, lyrics, selectedModel)}
              variant="primary"
              style={{ flex: '1 1 50%', minWidth: '200px', maxWidth: 'calc(50% - 8px)' }}
            >
              {matchingInProgress ? t('common.loading') : t('matching.startButton')}
            </Button>

            <Button
              disabled={matchingInProgress}
              onClick={() => onAdvancedMatch(artist, song, audioUrl, lyrics, selectedModel, true)}
              variant="warning"
              style={{ flex: '1 1 50%', minWidth: '200px', maxWidth: 'calc(50% - 8px)' }}
            >
              {t('lyrics.genius.forceRematch')}
            </Button>
          </div>
        )}

        {/* Processing Status */}
        {matchingInProgress && (
          <div style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.light,
            borderRadius: theme.borderRadius.sm,
            display: 'grid',
            gap: theme.spacing.sm
          }} className="matching-progress-container">
            <p style={theme.typography.body}>{t('matching.progress')} {processingStatus}</p>
            {matchingProgress > 0 && (
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: theme.colors.background.dark,
                borderRadius: theme.borderRadius.sm,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${matchingProgress}%`,
                  height: '100%',
                  backgroundColor: theme.colors.success,
                  transition: theme.transitions.medium,
                  className: 'progress-bar-animation'
                }}/>
              </div>
            )}
          </div>
        )}

        {/* Lyrics Display and Editing */}
        {matchingComplete && matchedLyrics.length > 0 && (
          <div style={{ display: 'grid', gap: theme.spacing.lg }}>
            {/* Top row: Album Art and Original Lyrics side-by-side */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: albumArtUrl ? '300px 1fr' : '1fr',
              gap: theme.spacing.lg,
              alignItems: 'start'
            }} className="album-art-container">
              {/* Left column: Album Art */}
              {albumArtUrl && (
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.md
                }} className="album-art-image">
                  <img 
                    src={albumArtUrl} 
                    alt="Album Art"
                    key={albumArtUrl}
                    style={{ 
                      width: '100%',
                      maxWidth: '300px',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: theme.borderRadius.md,
                      boxShadow: theme.shadows.md
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    gap: theme.spacing.sm,
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                  }}>
                    <Button
                      onClick={handleAlbumArtDownload}
                      variant="secondary"
                      size="small"
                    >
                      {t('common.downloadAlbumArt')}
                    </Button>
                    {onAlbumArtChange && (
                      <>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="secondary"
                          size="small"
                        >
                          {t('common.changeAlbumArt')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Right column: Original Lyrics Display */}
              {lyrics && lyrics.length > 0 && (
                <div style={{
                  maxHeight: '350px',
                  overflowY: 'auto',
                  backgroundColor: theme.colors.background.light,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  boxShadow: theme.shadows.sm
                }} className="lyrics-original-container">
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: theme.spacing.sm
                  }}>
                    <h3 style={{
                      ...theme.typography.h3
                    }}>
                      {t('lyrics.fromGenius')}
                    </h3>
                    <div style={{
                      display: 'flex',
                      gap: theme.spacing.sm
                    }}>
                      {onCustomLyrics && (
                        <Button
                          onClick={() => onCustomLyrics(lyrics)}
                          variant="secondary"
                          size="small"
                        >
                          {t('common.edit')}
                        </Button>
                      )}
                    </div>
                  </div>
                  {lyrics.map((line, index) => (
                    <p 
                      key={index}
                      style={{
                        margin: `${theme.spacing.xs} 0`,
                        fontSize: theme.typography.body.fontSize,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
              )}
            </div>
            
            {/* Middle row: Audio Player */}
            {audioUrl && (
              <div className="audio-player-container">
                <AudioPlayer
                  audioUrl={audioUrl}
                  audioRef={audioRef}
                  handleAudioRef={handleAudioRef}
                  onError={onError}
                  onLoadedMetadata={onLoadedMetadata}
                />
              </div>
            )}
            
            {/* Bottom row: Synchronized Lyrics */}
            <div className="synchronized-lyrics-container">
              <LyricsDisplay
                matchedLyrics={matchedLyrics}
                currentTime={currentTime}
                onLyricClick={onLyricClick}
                duration={audioDuration || 180}
                onUpdateLyrics={onUpdateLyrics}
                allowEditing={matchingComplete}
                onCustomLyrics={onCustomLyrics}
              />
              
              <div style={{ marginTop: theme.spacing.md }}>
                <Button
                  onClick={onDownloadJSON}
                  variant="success"
                  size="small"
                  style={{ maxWidth: '200px' }}
                  className="download-json-button"
                >
                  {t('lyrics.downloadJSON')}
                </Button>
                <p style={{ 
                  ...theme.typography.small,
                  color: theme.colors.text.secondary,
                  marginTop: theme.spacing.xs
                }}>
                  {t('matching.lineCount', { count: matchedLyrics.length })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LyricsMatchingSection;