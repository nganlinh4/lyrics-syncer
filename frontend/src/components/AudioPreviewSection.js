// filepath: c:\WORK_win\lyrics-syncer\frontend\src\components\AudioPreviewSection.js
import React from 'react';
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
  lyrics = []
}) => {
  const { t } = useTranslation();
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
                  style={{ 
                    width: '100%',
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
                  {t('common.downloadAlbumArt')}
                </Button>
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
                <h3 style={{
                  ...theme.typography.h3,
                  marginBottom: theme.spacing.sm
                }}>
                  {t('lyrics.fromGenius')}
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

            {fileSize > 0 && (
              <p style={{
                ...theme.typography.small,
                color: theme.colors.text.secondary,
                marginTop: theme.spacing.xs
              }}>
                {t('audio.fileSize')}: {Math.round(fileSize / 1024)} KB
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default AudioPreviewSection;