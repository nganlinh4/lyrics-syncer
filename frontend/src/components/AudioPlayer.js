import React from 'react';

const AudioPlayer = ({
  audioUrl,
  audioRef,
  containerRef,
  fileSize,
  onError,
  onLoadedMetadata
}) => {
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
          ref={audioRef}
          controls
          src={audioUrl}
          preload="auto"
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