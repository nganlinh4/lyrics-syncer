import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LyricsDisplay from './LyricsDisplay';
import AudioPlayer from './AudioPlayer';
import theme from '../theme/theme';

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
  albumArtUrl
}) => {
  const { t } = useTranslation();

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

  return (
    <Card title={t('matching.title')}>
      <div style={{ display: 'grid', gap: theme.spacing.lg }}>
        {/* Matching Buttons */}
        {showMatchingButton && (
          <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
            <Button
              disabled={matchingInProgress}
              onClick={() => onAdvancedMatch(artist, song, audioUrl, lyrics, selectedModel)}
              variant="primary"
              style={{ flex: '1 1 auto', minWidth: '200px' }}
            >
              {matchingInProgress ? t('common.loading') : t('matching.startButton')}
            </Button>

            <Button
              disabled={matchingInProgress}
              onClick={() => onAdvancedMatch(artist, song, audioUrl, lyrics, selectedModel, true)}
              variant="warning"
              style={{ flex: '1 1 auto', minWidth: '200px' }}
            >
              {t('lyrics.genius.force')}
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
          }}>
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
                  transition: theme.transitions.medium
                }}/>
              </div>
            )}
          </div>
        )}

        {/* Lyrics Display and Editing */}
        {matchingComplete && matchedLyrics.length > 0 && (
          <div style={{ display: 'grid', gap: theme.spacing.lg }}>
            {/* Album Art and Audio Player */}
            <div style={{ display: 'grid', gap: theme.spacing.md }}>
              {albumArtUrl && (
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.md
                }}>
                  <img 
                    src={albumArtUrl} 
                    alt="Album Art"
                    style={{ 
                      maxWidth: '300px',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: theme.borderRadius.md,
                      boxShadow: theme.shadows.md
                    }}
                  />
                  <Button
                    onClick={handleAlbumArtDownload}
                    variant="secondary"
                    size="small"
                  >
                    {t('common.download')}
                  </Button>
                </div>
              )}
              
              {audioUrl && (
                <AudioPlayer
                  audioUrl={audioUrl}
                  audioRef={audioRef}
                  handleAudioRef={handleAudioRef}
                  onError={onError}
                  onLoadedMetadata={onLoadedMetadata}
                />
              )}
            </div>

            <LyricsDisplay
              matchedLyrics={matchedLyrics}
              currentTime={currentTime}
              onLyricClick={onLyricClick}
              duration={audioDuration || 180}
              onUpdateLyrics={onUpdateLyrics}
              allowEditing={matchingComplete}
              onCustomLyrics={onCustomLyrics}
            />

            <div>
              <Button
                onClick={onDownloadJSON}
                variant="success"
                size="large"
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
        )}
      </div>
    </Card>
  );
};

export default LyricsMatchingSection;