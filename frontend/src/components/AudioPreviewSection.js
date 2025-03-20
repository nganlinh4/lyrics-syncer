// filepath: c:\WORK_win\lyrics-syncer\frontend\src\components\AudioPreviewSection.js
import React from 'react';
import Card from '../ui/Card';
import AudioPlayer from './AudioPlayer';
import theme from '../theme/theme';

const AudioPreviewSection = ({
  audioUrl,
  audioRef,
  containerRef,
  fileSize,
  albumArtUrl,
  onError,
  onLoadedMetadata,
  handleAudioRef
}) => {
  if (!audioUrl) return null;

  return (
    <Card title="Audio Preview">
      <div style={{ display: 'grid', gap: theme.spacing.md }}>
        {albumArtUrl && (
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            marginBottom: theme.spacing.md
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

        <div 
          ref={containerRef} 
          style={{ width: '100%' }}
        >
          <AudioPlayer
            audioUrl={audioUrl}
            audioRef={audioRef}
            handleAudioRef={handleAudioRef}
            onError={onError}
            onLoadedMetadata={onLoadedMetadata}
          />
        </div>

        {fileSize > 0 && (
          <p style={{
            ...theme.typography.small,
            color: theme.colors.text.secondary,
            marginTop: theme.spacing.xs
          }}>
            File Size: {Math.round(fileSize / 1024)} KB
          </p>
        )}
      </div>
    </Card>
  );
};

export default AudioPreviewSection;