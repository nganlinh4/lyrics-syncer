import React from 'react';
import { getSegmentColor, timeToPosition } from './utils';

const LyricsSegment = ({
  segment,
  index,
  duration,
  isActive,
  dragCursor,
  onMouseDown,
  onTouchStart
}) => {
  const left = timeToPosition(segment.start, duration);
  const width = `${((segment.end - segment.start) / duration) * 100}%`;
  const segmentColor = getSegmentColor(index);

  return (
    <div
      key={index}
      className="segment"
      draggable="false"
      style={{
        position: 'absolute',
        top: '20px',
        left: left,
        width: width,
        height: '80px',
        backgroundColor: isActive ? 'rgba(33, 150, 243, 0.9)' : segmentColor,
        opacity: isActive ? 0.9 : 0.7,
        borderRadius: '4px',
        cursor: dragCursor,
        overflow: 'visible',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        padding: isActive ? '4px' : '5px',
        border: isActive ? '2px solid #1976d2' : '1px solid rgba(0,0,0,0.2)',
        boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
        zIndex: isActive ? 5 : 2,
        userSelect: 'none',
        transition: isActive ? 'none' : 'all 0.2s ease'
      }}
      onMouseDown={(e) => onMouseDown(e, index, null)}
      onTouchStart={(e) => {
        e.preventDefault();
        onTouchStart(e.touches[0], index, null);
      }}
    >
      <div className="segment-text" style={{
        fontSize: '10px',
        fontWeight: 'bold',
        color: 'white',
        textShadow: '0px 0px 2px rgba(0,0,0,0.7)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {segment.text}
      </div>
      
      <div className="segment-time" style={{
        fontSize: '9px',
        color: 'rgba(255,255,255,0.9)',
        marginTop: '2px'
      }}>
        {segment.start.toFixed(2)}s - {segment.end.toFixed(2)}s
      </div>
      
      {/* Left resize handle */}
      <div
        className="resize-handle left"
        draggable="false"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '10px',
          height: '100%',
          cursor: 'w-resize',
          zIndex: 3
        }}
        onMouseDown={(e) => onMouseDown(e, index, 'left')}
        onTouchStart={(e) => {
          e.preventDefault();
          onTouchStart(e.touches[0], index, 'left');
        }}
      />
      
      {/* Right resize handle */}
      <div
        className="resize-handle right"
        draggable="false"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '10px',
          height: '100%',
          cursor: 'e-resize',
          zIndex: 3
        }}
        onMouseDown={(e) => onMouseDown(e, index, 'right')}
        onTouchStart={(e) => {
          e.preventDefault();
          onTouchStart(e.touches[0], index, 'right');
        }}
      />
    </div>
  );
};

export default LyricsSegment;