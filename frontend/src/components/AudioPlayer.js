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

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: theme.spacing.md
      }}>
        <a
          href={audioUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: theme.colors.primary,
            fontSize: theme.typography.small.fontSize,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Audio File
        </a>
      </div>
    </div>
  );
};

export default AudioPlayer;
