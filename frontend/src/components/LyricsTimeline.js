import React, { useState, useEffect, useRef } from 'react';

const LyricsTimeline = ({ matchedLyrics, currentTime, duration, onUpdateLyrics }) => {
  const [segments, setSegments] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [draggingEdge, setDraggingEdge] = useState(null); // 'left', 'right', or null
  const [startX, setStartX] = useState(0);
  const [originalStart, setOriginalStart] = useState(0);
  const [originalEnd, setOriginalEnd] = useState(0);
  const timelineRef = useRef(null);
  
  // Initialize segments when matchedLyrics change
  useEffect(() => {
    if (matchedLyrics && matchedLyrics.length > 0) {
      setSegments([...matchedLyrics]);
    }
  }, [matchedLyrics]);

  // Calculate position based on time
  const timeToPosition = (time) => {
    const percent = (time / duration) * 100;
    return `${percent}%`;
  };

  // Start dragging a segment
  const handleMouseDown = (e, index, edge) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDraggingIndex(index);
    setDraggingEdge(edge);
    setStartX(e.clientX);
    
    const segment = segments[index];
    setOriginalStart(segment.start);
    setOriginalEnd(segment.end);

    // Add event listeners for dragging
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Update segment positions while dragging
  const handleMouseMove = (e) => {
    if (draggingIndex === null || !timelineRef.current) return;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - startX;
    
    // Convert pixel movement to time
    const timePerPixel = duration / timelineRect.width;
    const deltaTime = deltaX * timePerPixel;
    
    const newSegments = [...segments];
    const currentSegment = newSegments[draggingIndex];
    
    // Calculate min/max bounds for adjustments
    const minStart = draggingIndex > 0 ? newSegments[draggingIndex - 1].end : 0;
    const maxEnd = draggingIndex < newSegments.length - 1 
      ? newSegments[draggingIndex + 1].start 
      : duration;
    
    if (draggingEdge === 'left') {
      // Dragging left edge
      currentSegment.start = Math.max(minStart, Math.min(currentSegment.end - 0.1, originalStart + deltaTime));
    } else if (draggingEdge === 'right') {
      // Dragging right edge
      currentSegment.end = Math.min(maxEnd, Math.max(currentSegment.start + 0.1, originalEnd + deltaTime));
    } else {
      // Dragging whole segment
      const segmentDuration = originalEnd - originalStart;
      
      // Calculate new positions
      let newStart = originalStart + deltaTime;
      let newEnd = originalEnd + deltaTime;
      
      // Check left boundary
      if (newStart < minStart) {
        newStart = minStart;
        newEnd = minStart + segmentDuration;
      }
      
      // Check right boundary
      if (newEnd > maxEnd) {
        newEnd = maxEnd;
        newStart = maxEnd - segmentDuration;
      }
      
      // Update current segment
      currentSegment.start = newStart;
      currentSegment.end = newEnd;
      
      // Push subsequent segments if needed
      if (draggingIndex < newSegments.length - 1 && Math.abs(newEnd - maxEnd) < 0.01) {
        // We're pushing against the next segment
        const pushAmount = deltaTime;
        
        // Only push if we're moving right
        if (pushAmount > 0) {
          for (let i = draggingIndex + 1; i < newSegments.length; i++) {
            const nextSegment = newSegments[i];
            const nextSegmentDuration = nextSegment.end - nextSegment.start;
            
            // Calculate new positions for this segment
            let nextStart = nextSegment.start + pushAmount;
            let nextEnd = nextSegment.end + pushAmount;
            
            // Check if we hit another segment or the end
            const hasNextSegment = i < newSegments.length - 1;
            const nextLimit = hasNextSegment ? newSegments[i + 1].start : duration;
            
            if (nextEnd > nextLimit) {
              // Can't push this segment fully
              nextEnd = nextLimit;
              nextStart = nextLimit - nextSegmentDuration;
              
              // We've hit a hard limit
              if (i < newSegments.length - 1) {
                // Continue pushing subsequent segments with the reduced amount
                pushAmount = nextEnd - nextSegment.end;
              }
            }
            
            // Update this segment
            nextSegment.start = nextStart;
            nextSegment.end = nextEnd;
            
            // If we're not pushing anymore, stop the cascade
            if (pushAmount <= 0) break;
          }
        }
      }
    }
    
    setSegments(newSegments);
  };

  // Stop dragging
  const handleMouseUp = () => {
    if (draggingIndex !== null) {
      // Update parent component with new timings
      onUpdateLyrics(segments);
    }
    
    // Clean up
    setDraggingIndex(null);
    setDraggingEdge(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Generate different colors for segments
  const getSegmentColor = (index) => {
    const colors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853',
      '#8E24AA', '#16A085', '#2980B9', '#8E44AD',
      '#F39C12', '#D35400', '#C0392B'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="lyrics-timeline-container" style={{ marginTop: '30px', marginBottom: '30px' }}>
      <h3 style={{ fontSize: '20px', color: '#333', marginBottom: '15px' }}>Lyrics Timeline Editor</h3>
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
        {/* Current time indicator */}
        <div
          className="current-time-indicator"
          style={{
            position: 'absolute',
            top: 0,
            left: timeToPosition(currentTime),
            width: '2px',
            height: '100%',
            backgroundColor: 'red',
            zIndex: 10,
            transition: 'left 0.1s linear'
          }}
        />
        
        {/* Time markers - every 10% */}
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
        
        {/* Lyrics segments */}
        {segments.map((segment, index) => {
          const left = timeToPosition(segment.start);
          const width = `${((segment.end - segment.start) / duration) * 100}%`;
          const isActive = draggingIndex === index;
          const segmentColor = getSegmentColor(index);
          
          return (
            <div
              key={index}
              className="segment"
              style={{
                position: 'absolute',
                top: '20px',
                left: left,
                width: width,
                height: '80px',
                backgroundColor: segmentColor,
                opacity: isActive ? 0.9 : 0.7,
                borderRadius: '4px',
                cursor: 'move',
                overflow: 'hidden',
                padding: '5px',
                border: isActive ? '2px solid #1976d2' : '1px solid rgba(0,0,0,0.2)',
                boxShadow: isActive ? '0 0 10px rgba(0,0,0,0.3)' : 'none',
                zIndex: isActive ? 5 : 2,
                userSelect: 'none',
                transition: isActive ? 'none' : 'all 0.2s ease'
              }}
              onMouseDown={(e) => handleMouseDown(e, index, null)}
            >
              <div className="segment-text" style={{
                fontSize: '10px', // Reduced font size
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
                fontSize: '9px', // Even smaller font for the time
                color: 'rgba(255,255,255,0.9)',
                marginTop: '2px'
              }}>
                {segment.start.toFixed(2)}s - {segment.end.toFixed(2)}s
              </div>
              
              {/* Left resize handle */}
              <div
                className="resize-handle left"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '10px',
                  height: '100%',
                  cursor: 'w-resize',
                  zIndex: 3
                }}
                onMouseDown={(e) => handleMouseDown(e, index, 'left')}
              />
              
              {/* Right resize handle */}
              <div
                className="resize-handle right"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '10px',
                  height: '100%',
                  cursor: 'e-resize',
                  zIndex: 3
                }}
                onMouseDown={(e) => handleMouseDown(e, index, 'right')}
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