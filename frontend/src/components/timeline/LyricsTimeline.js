import React, { useState, useEffect, useRef } from 'react';
import TimeMarkers from './TimeMarkers';
import TimeIndicator from './TimeIndicator';
import LyricsSegment from './LyricsSegment';
import useDragHandling from './useDragHandling';

const LyricsTimeline = ({ matchedLyrics, currentTime, duration, onUpdateLyrics }) => {
  const [segments, setSegments] = useState([]);
  const timelineRef = useRef(null);

  const {
    draggingIndex,
    dragCursor,
    startDrag,
    handleDrag,
    endDrag
  } = useDragHandling({
    segments,
    duration,
    onUpdateLyrics
  });

  useEffect(() => {
    if (matchedLyrics && matchedLyrics.length > 0) {
      const initialSegments = matchedLyrics.map(lyric => ({
        ...lyric,
        start: parseFloat(lyric.start.toFixed(3)),
        end: parseFloat(lyric.end.toFixed(3))
      }));
      setSegments(initialSegments);
    }
  }, [matchedLyrics]);

  const handleMouseDown = (e, index, edge) => {
    if (!timelineRef.current) {
      console.error('Timeline ref not available');
      return;
    }

    const rect = timelineRef.current.getBoundingClientRect();
    if (!rect) {
      console.error('Could not get timeline dimensions');
      return;
    }

    startDrag(e, index, edge, rect);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!timelineRef.current) return;
    const timelineRect = timelineRef.current.getBoundingClientRect();
    handleDrag(e, timelineRect);
  };

  const handleMouseUp = () => {
    endDrag();
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('touchend', handleMouseUp);
    document.removeEventListener('touchcancel', handleMouseUp);
  };

  return (
    <div className="lyrics-timeline-container" style={{ marginTop: '30px', marginBottom: '30px' }}>
      <h3 style={{ fontSize: '20px', color: '#333', marginBottom: '15px' }}>
        Lyrics Timeline Editor
      </h3>
      <div 
        className="timeline" 
        ref={timelineRef}
        style={{
          position: 'relative',
          height: '200px',
          backgroundColor: '#f0f4f8',
          marginTop: '10px',
          marginBottom: '20px',
          border: '2px solid #2196F3',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}
      >
        <TimeIndicator currentTime={currentTime} duration={duration} />
        <TimeMarkers duration={duration} />
        
        {segments.map((segment, index) => (
          <LyricsSegment
            key={index}
            segment={segment}
            index={index}
            duration={duration}
            isActive={draggingIndex === index}
            dragCursor={dragCursor}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          />
        ))}
      </div>
      
      <div style={{
        marginTop: '10px',
        fontSize: '12px',
        color: '#666'
      }}>
        <p><strong>How to use:</strong> Drag segments to adjust timing. Drag edges to resize.</p>
      </div>
    </div>
  );
};

export default LyricsTimeline;