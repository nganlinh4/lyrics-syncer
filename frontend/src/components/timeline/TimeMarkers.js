import React from 'react';

const TimeMarkers = ({ duration }) => (
  <>
    {Array.from({ length: 11 }).map((_, i) => (
      <div
        key={`marker-${i}`}
        style={{
          position: 'absolute',
          top: 0,
          left: `${i * 10}%`,
          width: '1px',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          zIndex: 1
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: '2px',
          fontSize: '10px',
          color: '#666'
        }}>
          {((duration * i) / 10).toFixed(1)}s
        </div>
      </div>
    ))}
  </>
);

export default TimeMarkers;