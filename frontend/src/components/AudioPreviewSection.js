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
  handleAudioRef,
  lyrics = [] // Add lyrics prop with default empty array
}) => {
  if (!audioUrl) return null;

  return (
    <Card title="Audio Preview">
      <div style={{ display: 'grid', gap: theme.spacing.md }}>
        <div style={{
          display: 'grid', 
          gridTemplateColumns: lyrics.length > 0 && albumArtUrl ? '1fr 1fr' : '1fr',
          gap: theme.spacing.lg,
          alignItems: 'start'
        }}>
          {albumArtUrl && (
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}>
              <img 
                src={albumArtUrl} 
                alt="Album Art"
                style={{ 
                  maxWidth: '300px',
                  maxHeight: '300px',
                  width: '100%',
                  objectFit: 'contain',
                  borderRadius: theme.borderRadius.md,
                  boxShadow: theme.shadows.md
                }}
              />
            </div>
          )}

          {lyrics.length > 0 && (
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              backgroundColor: theme.colors.background.light,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadows.sm
            }}>
              <h3 style={{
                ...theme.typography.h3,
                marginBottom: theme.spacing.sm
              }}>
                Lyrics from Genius
              </h3>
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
                  {line || '\u00A0'} {/* Use non-breaking space for empty lines */}
                </p>
              ))}
            </div>
          )}
        </div>

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