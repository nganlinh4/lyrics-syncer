import React from 'react';
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
  // Only render the section if there's something to show
  if (!showMatchingButton && !matchingInProgress && !matchingComplete) {
    return null;
  }

  return (
    <Card title="Lyrics Matching">
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
              {matchingInProgress ? 'Matching...' : 'Match Lyrics with Audio'}
            </Button>

            <Button
              disabled={matchingInProgress}
              onClick={() => onAdvancedMatch(artist, song, audioUrl, lyrics, selectedModel, true)}
              variant="warning"
              style={{ flex: '1 1 auto', minWidth: '200px' }}
            >
              Force Rematch
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
            <p style={theme.typography.body}>Processing: {processingStatus}</p>
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
                  justifyContent: 'center'
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
                Download Lyrics JSON
              </Button>
              <p style={{ 
                ...theme.typography.small,
                color: theme.colors.text.secondary,
                marginTop: theme.spacing.xs
              }}>
                Downloads the edited lyrics timing as a JSON file
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LyricsMatchingSection;