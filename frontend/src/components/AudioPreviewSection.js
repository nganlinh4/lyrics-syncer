import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  lyrics = [],
  artist,
  song,
  onAlbumArtChange,
  onCustomLyrics,
  onAudioChange
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const hasContent = audioUrl || albumArtUrl || lyrics.length > 0;
  if (!hasContent) return null;

  const handleAlbumArtDownload = async () => {
    try {
      const response = await fetch(albumArtUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'album_art.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error("Failed to download album art:", error);
      const link = document.createElement('a');
      link.href = albumArtUrl;
      link.download = 'album_art.png';
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

  const handleAudioFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      onError(new Error(t('errors.invalidAudio')));
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

          // Upload the file to the server
          const API_URL = 'http://localhost:3001';
          const response = await fetch(`${API_URL}/api/upload_audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              artist,
              song,
              audioData: base64Data
            })
          });

          if (!response.ok) {
            throw new Error('Failed to upload audio');
          }

          // Get the server URL for the saved file
          const data = await response.json();
          
          // Update the audio URL to point to the saved file
          if (onAudioChange) {
            onAudioChange(data.audioUrl);
          }
        } catch (uploadError) {
          console.error("Failed to upload audio to server:", uploadError);
          onError(new Error(t('errors.audioUploadFailed')));
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to process audio:", error);
      onError(new Error(t('errors.uploadFailed')));
    }
  };

  return (
    <Card title={t('common.preview')}>
      <div style={{ display: 'grid', gap: theme.spacing.md }}>
        {/* Content Section */}
        {(albumArtUrl || lyrics.length > 0) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: lyrics.length > 0 && albumArtUrl ? '300px 1fr' : '1fr',
            gap: theme.spacing.lg,
            alignItems: 'start'
          }}>
            {/* Album Art Section */}
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
                  key={albumArtUrl} // Add key prop to force re-render when URL changes
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

            {/* Lyrics Section */}
            {lyrics.length > 0 && (
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: theme.colors.background.light,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                boxShadow: theme.shadows.sm
              }}>
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
                    <Button
                      onClick={() => onCustomLyrics?.(lyrics)}
                      variant="secondary"
                      size="small"
                    >
                      {t('common.edit')}
                    </Button>
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
        )}

        {/* Audio Player Section */}
        {audioUrl && (
          <>
            <div ref={containerRef} style={{ width: '100%' }}>
              <AudioPlayer
                audioUrl={audioUrl}
                audioRef={audioRef}
                handleAudioRef={handleAudioRef}
                onError={onError}
                onLoadedMetadata={onLoadedMetadata}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              marginTop: theme.spacing.xs
            }}>
              <p style={{
                ...theme.typography.small,
                color: theme.colors.text.secondary
              }}>
                {t('audio.fileSize')}: {Math.round(fileSize / 1024)} KB
              </p>
              
              <input
                type="file"
                ref={audioInputRef}
                onChange={handleAudioFileChange}
                accept="audio/*"
                style={{ display: 'none' }}
              />
              <Button
                onClick={() => audioInputRef.current?.click()}
                variant="secondary"
                size="small"
              >
                {t('common.changeAudio')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default AudioPreviewSection;