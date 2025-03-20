// filepath: c:\WORK_win\lyrics-syncer\frontend\src\components\AudioPreviewSection.js
import React from 'react';
import Card from '../ui/Card';
import AudioPlayer from './AudioPlayer';
import Button from '../ui/Button';
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
      link.download = 'album_art.png'; // Default name
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
      link.download = 'album_art.png';
      link.target = '_blank'; // Avoid opening in the same tab
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
                  width: '100%',
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
                Download Album Art
              </Button>
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