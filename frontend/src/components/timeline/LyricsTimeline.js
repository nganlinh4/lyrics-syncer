import React, { useState, useEffect, useRef } from 'react';
import TimeMarkers from './TimeMarkers';
import TimeIndicator from './TimeIndicator';
import { getSegmentColor, timeToPosition } from './utils';

const LyricsTimeline = ({ matchedLyrics, currentTime, duration, onUpdateLyrics }) => {
  const [segments, setSegments] = useState([]);
  const [activeDrag, setActiveDrag] = useState(null);
  const timelineRef = useRef(null);
  const dragStartRef = useRef({ x: 0, segmentIndex: null, segmentStart: 0, segmentEnd: 0, type: null });

  // Update state when matchedLyrics changes
  useEffect(() => {
    if (matchedLyrics && matchedLyrics.length > 0) {
      const initialSegments = matchedLyrics.map(lyric => ({
        ...lyric,
        start: parseFloat(lyric.start),
        end: parseFloat(lyric.end)
      }));
      setSegments(initialSegments);
    }
  }, [matchedLyrics]);

  // Update parent component whenever segments change
  useEffect(() => {
    if (segments.length > 0) {
      onUpdateLyrics(segments);
    }
  }, [segments, onUpdateLyrics]);

  const handleDragStart = (e, index, type = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!timelineRef.current) return;
    
    const isTouch = e.type.startsWith('touch');
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const rect = timelineRef.current.getBoundingClientRect();
    const timelineX = clientX - rect.left;
    
    // Store initial state
    dragStartRef.current = {
      x: timelineX,
      segmentIndex: index,
      segmentStart: segments[index].start,
      segmentEnd: segments[index].end,
      type: type,
      width: rect.width
    };
    
    setActiveDrag({ index, type });
    
    // Set cursor style
    if (type === 'left') {
      document.body.style.cursor = 'w-resize';
    } else if (type === 'right') {
      document.body.style.cursor = 'e-resize';
    } else {
      document.body.style.cursor = 'move';
    }
    
    // Add event listeners
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
  };
  
  const handleDragMove = (e) => {
    e.preventDefault();
    
    if (activeDrag === null || !timelineRef.current) return;
    
    const isTouch = e.type.startsWith('touch');
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const rect = timelineRef.current.getBoundingClientRect();
    const currentX = clientX - rect.left;
    const deltaX = currentX - dragStartRef.current.x;
    
    // Convert pixel movement to time
    const pixelsPerSecond = dragStartRef.current.width / duration;
    const timeDelta = deltaX / pixelsPerSecond;
    
    setSegments(prevSegments => {
      const newSegments = [...prevSegments];
      const index = dragStartRef.current.segmentIndex;
      const segment = { ...newSegments[index] };
      
      if (dragStartRef.current.type === 'left') {
        // Dragging left edge - adjust start time
        segment.start = Math.max(0, Math.min(segment.end - 0.1, dragStartRef.current.segmentStart + timeDelta));
      } else if (dragStartRef.current.type === 'right') {
        // Dragging right edge - adjust end time
        segment.end = Math.max(segment.start + 0.1, Math.min(duration, dragStartRef.current.segmentEnd + timeDelta));
      } else {
        // Dragging entire segment - move both start and end
        const length = segment.end - segment.start;
        let newStart = dragStartRef.current.segmentStart + timeDelta;
        
        // Keep segment within bounds
        if (newStart < 0) {
          newStart = 0;
        } else if (newStart + length > duration) {
          newStart = duration - length;
        }
        
        segment.start = newStart;
        segment.end = newStart + length;
      }
      
      // Update the segment
      newSegments[index] = segment;
      return newSegments;
    });
  };
  
  const handleDragEnd = () => {
    // Reset cursor and state
    document.body.style.cursor = 'default';
    setActiveDrag(null);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchend', handleDragEnd);
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
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          touchAction: 'none' // Disable browser touch actions
        }}
      >
        <TimeIndicator currentTime={currentTime} duration={duration} />
        <TimeMarkers duration={duration} />
        
        {segments.map((segment, index) => {
          const isActive = activeDrag && activeDrag.index === index;
          const segmentColor = getSegmentColor(index);
          const left = timeToPosition(segment.start, duration);
          const width = `${((segment.end - segment.start) / duration) * 100}%`;
          
          return (
            <div
              key={`${segment.text}-${index}`}
              className="segment"
              style={{
                position: 'absolute',
                top: '20px',
                left: left,
                width: width,
                height: '80px',
                backgroundColor: isActive ? 'rgba(33, 150, 243, 0.9)' : segmentColor,
                opacity: isActive ? 0.9 : 0.7,
                borderRadius: '4px',
                cursor: 'move',
                overflow: 'hidden',
                pointerEvents: 'auto',
                padding: isActive ? '4px' : '5px',
                border: isActive ? '2px solid #1976d2' : '1px solid rgba(0,0,0,0.2)',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                zIndex: isActive ? 5 : 2,
                userSelect: 'none',
                transition: isActive ? 'none' : 'all 0.2s ease'
              }}
              onMouseDown={(e) => handleDragStart(e, index)}
              onTouchStart={(e) => handleDragStart(e, index)}
            >
              <div style={{
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
              
              <div style={{
                fontSize: '9px',
                color: 'rgba(255,255,255,0.9)',
                marginTop: '2px'
              }}>
                {segment.start.toFixed(2)}s - {segment.end.toFixed(2)}s
              </div>
              
              {/* Left resize handle */}
              <div
                className="resize-handle-left"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '12px',
                  height: '100%',
                  cursor: 'w-resize',
                  zIndex: 3,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent'
                }}
                onMouseDown={(e) => handleDragStart(e, index, 'left')}
                onTouchStart={(e) => handleDragStart(e, index, 'left')}
              />
              
              {/* Right resize handle */}
              <div
                className="resize-handle-right"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '12px',
                  height: '100%',
                  cursor: 'e-resize',
                  zIndex: 3,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent'
                }}
                onMouseDown={(e) => handleDragStart(e, index, 'right')}
                onTouchStart={(e) => handleDragStart(e, index, 'right')}
              />
            </div>
          );
        })}
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