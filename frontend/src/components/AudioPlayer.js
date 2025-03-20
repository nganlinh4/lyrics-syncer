import React from 'react';
import theme from '../theme/theme';

const AudioPlayer = ({
  audioUrl,
  audioRef,
  handleAudioRef,
  onError,
  onLoadedMetadata
}) => {
  const handleCanPlay = (e) => {
    if (e.target) {
      e.target.volume = 0.3;
    }
  };

  if (!audioUrl) return null;

  return (
    <div style={{ display: 'grid', gap: theme.spacing.md }}>
      <div style={{
        backgroundColor: theme.colors.background.light,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        boxShadow: theme.shadows.sm
      }}>
        <audio
          ref={(element) => {
            if (handleAudioRef) handleAudioRef(element);
            if (audioRef) audioRef.current = element;
            if (element) element.volume = 0.3;
          }}
          controls
          src={audioUrl}
          preload="auto"
          onCanPlay={handleCanPlay}
          style={{
            width: '100%',
            height: '40px'
          }}
          onError={onError}
          onLoadedMetadata={onLoadedMetadata}
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
