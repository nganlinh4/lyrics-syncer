import React, { useEffect, useRef } from 'react';

const AudioPlayer = ({
  audioUrl,
  audioRef,
  handleAudioRef, // Add this prop
  containerRef,
  fileSize,
  onError,
  onLoadedMetadata
}) => {
  // Force set volume when audio loads
  const handleCanPlay = (e) => {
    if (e.target) {
      e.target.volume = 0.3;
    }
  };

  if (!audioUrl) return null;

  return (
    <div>
      <h3>Audio Preview</h3>
      <div 
        ref={containerRef} 
        style={{ marginTop: '20px', marginBottom: '20px', width: '100%' }}
      />

      <div style={{ marginTop: '10px', marginBottom: '20px' }}>
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
          style={{ width: '100%', marginTop: '10px' }}
          onError={onError}
          onLoadedMetadata={onLoadedMetadata}
        />

        <div style={{ marginTop: '10px' }}>
          <a href={audioUrl} target="_blank" rel="noopener noreferrer">
            Direct Download Link
          </a>
        </div>
      </div>

      {fileSize > 0 && (
        <div>File Size: {Math.round(fileSize / 1024)} KB</div>
      )}
    </div>
  );
};

export default AudioPlayer;
