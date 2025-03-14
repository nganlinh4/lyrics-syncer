import React, { useState, useRef, useEffect } from 'react';

const LyricsDisplay = ({ matchedLyrics, currentTime, onLyricClick, duration, onUpdateLyrics, allowEditing = false }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingField, setEditingField] = useState(null); // 'start' or 'end'
  const [editValues, setEditValues] = useState({ start: 0, end: 0 });
  const [lyrics, setLyrics] = useState([]);
  const [isSticky, setIsSticky] = useState(true); // Add sticky mode state
  const [history, setHistory] = useState([]); // For undo functionality
  const [originalLyrics, setOriginalLyrics] = useState([]); // For reset functionality
  const [hoveredElement, setHoveredElement] = useState(null); // Track which element is being hovered over
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const dragStartRef = useRef({ x: 0, value: 0 });
  const isDraggingRef = useRef(false);
  const lastInteractionRef = useRef(null); // Track last interacted element
  const justFinishedDraggingRef = useRef(false); // Track if we just finished dragging
  const lastTimeRef = useRef(0); // To track changes in currentTime

  // Initialize local lyrics state from props
  useEffect(() => {
    setLyrics(matchedLyrics);
    // Save original lyrics for reset functionality (only on initial load)
    if (matchedLyrics.length > 0 && originalLyrics.length === 0) {
      setOriginalLyrics(JSON.parse(JSON.stringify(matchedLyrics)));
    }
  }, [matchedLyrics]);
  
  // Initialize and resize the canvas for proper pixel density
  useEffect(() => {
    if (timelineRef.current) {
      const canvas = timelineRef.current;
      const container = canvas.parentElement;
      
      // Set canvas dimensions to match its display size to avoid blurry text
      const resizeCanvas = () => {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Set display size (css pixels)
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = '50px';
        
        // Set actual size in memory (scaled for pixel density)
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = 50 * dpr;
        
        // Scale context to ensure correct drawing
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        drawTimeline();
      };
      
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, []);
  
  // Draw timeline visualization when lyrics or currentTime change
  useEffect(() => {
    if (timelineRef.current && lyrics.length > 0) {
      // Store current time for comparison
      lastTimeRef.current = currentTime;
      drawTimeline();
    }
  }, [lyrics, currentTime, duration]);
  
  // Draw the timeline visualization
  const drawTimeline = () => {
    const canvas = timelineRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Clear with proper scaling
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    
    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    
    // Find the max time in lyrics to prevent stretching
    const maxLyricTime = lyrics.length > 0 
      ? Math.max(...lyrics.map(lyric => lyric.end))
      : duration;
    
    // Use the greater of actual duration or max lyric time 
    const timelineEnd = Math.max(maxLyricTime, duration) * 1.05; // Add 5% padding
    
    // Draw lyric segments FIRST (below time markers)
    lyrics.forEach((lyric, index) => {
      const startX = (lyric.start / timelineEnd) * displayWidth;
      const endX = (lyric.end / timelineEnd) * displayWidth;
      const segmentWidth = Math.max(1, endX - startX); // Ensure minimum width
      
      // Get a color based on the index
      const hue = (index * 30) % 360;
      ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.7)`;
      // Draw segments in lower 70% of canvas height
      ctx.fillRect(startX, displayHeight * 0.3, segmentWidth, displayHeight * 0.7);
      
      // Draw border
      ctx.strokeStyle = `hsla(${hue}, 70%, 40%, 0.9)`;
      ctx.strokeRect(startX, displayHeight * 0.3, segmentWidth, displayHeight * 0.7);
    });
    
    // Draw time markers ON TOP
    ctx.fillStyle = '#ddd';
    
    // Calculate proper spacing for time markers based on timeline length
    const timeStep = Math.max(1, Math.ceil(timelineEnd / 15));
    for (let i = 0; i <= timelineEnd; i += timeStep) {
      const x = (i / timelineEnd) * displayWidth;
      // Draw full-height vertical lines
      ctx.fillRect(x, 0, 1, displayHeight);
      
      // Draw time labels at the top
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(`${i}s`, x + 3, 2);
      ctx.fillStyle = '#ddd';
    }
    
    // Draw current time indicator - make it more visible
    const currentX = (currentTime / timelineEnd) * displayWidth;
    
    // Draw indicator shadow for better visibility
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(currentX - 2, 0, 4, displayHeight);
    
    // Draw indicator
    ctx.fillStyle = 'red';
    ctx.fillRect(currentX - 1, 0, 3, displayHeight);
    
    // Draw playhead triangle at the top
    ctx.beginPath();
    ctx.moveTo(currentX - 6, 0);
    ctx.lineTo(currentX + 6, 0);
    ctx.lineTo(currentX, 6);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
  };

  // Force redraw timeline when currentTime changes
  useEffect(() => {
    // Only redraw if time actually changed
    if (Math.abs(lastTimeRef.current - currentTime) > 0.01) {
      lastTimeRef.current = currentTime;
      if (timelineRef.current) {
        drawTimeline();
      }
    }
  }, [currentTime]);

  const getCurrentLyricIndex = (time) => {
    return lyrics.findIndex(
      (lyric) => time >= lyric.start && time <= lyric.end
    );
  };
  
  const currentIndex = getCurrentLyricIndex(currentTime);
  
  const startEditing = (index, field) => {
    const lyric = lyrics[index];
    setEditingIndex(index);
    setEditingField(field);
    setEditValues({
      start: lyric.start,
      end: lyric.end
    });
    // Store this as the last interaction
    lastInteractionRef.current = { index, field };
  };
  
  // Handle the undo operation
  const handleUndo = () => {
    if (history.length > 0) {
      // Get the last state from history
      const lastState = history[history.length - 1];
      
      // Update the lyrics to the previous state
      setLyrics(lastState);
      
      // Notify parent component
      if (onUpdateLyrics) {
        onUpdateLyrics(lastState);
      }
      
      // Remove the used state from history
      setHistory(prevHistory => prevHistory.slice(0, -1));
    }
  };
  
  // Handle the reset operation
  const handleReset = () => {
    if (originalLyrics.length > 0) {
      // Save current state to history before reset
      setHistory(prevHistory => [...prevHistory, JSON.parse(JSON.stringify(lyrics))]);
      
      // Reset to original state
      setLyrics(JSON.parse(JSON.stringify(originalLyrics)));
      
      // Notify parent component
      if (onUpdateLyrics) {
        onUpdateLyrics(originalLyrics);
      }
    }
  };
  
  // Handle mouse enter for hover effects
  const handleMouseEnter = (index, field) => {
    if (allowEditing) {
      setHoveredElement({ index, field });
    }
  };
  
  // Handle mouse leave for hover effects
  const handleMouseLeave = () => {
    setHoveredElement(null);
  };
  
  // Start the drag operation
  const handleDragStart = (e, index, field) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Before editing, save the current state to history
    setHistory(prevHistory => [...prevHistory, JSON.parse(JSON.stringify(lyrics))]);
    
    // Always start editing on drag - no need to check if we're already editing
    startEditing(index, field);
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartRef.current = { 
      x: clientX, 
      value: field === 'start' ? lyrics[index].start : lyrics[index].end 
    };
    
    // Set dragging flag to true immediately
    isDraggingRef.current = true;
    justFinishedDraggingRef.current = false;
    
    // Add event listeners for dragging
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    
    // Call handleDragMove immediately with the current event
    // This ensures the dragging starts with the first mouse position
    handleDragMove(e);
  };
  
  // Handle the drag movement
  const handleDragMove = (e) => {
    if (!isDraggingRef.current || editingIndex === null || editingField === null) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - dragStartRef.current.x;
    
    // Convert pixel movement to time - 0.01s per pixel for fine control
    const timeDelta = deltaX * 0.01;
    const newValue = Math.round((dragStartRef.current.value + timeDelta) * 100) / 100; // Round to 2 decimal places
    
    // Update the values based on which field we're editing
    const updatedValues = { ...editValues };
    if (editingField === 'start') {
      // Don't let start time go below 0 or above end time - 0.1
      updatedValues.start = Math.max(0, Math.min(updatedValues.end - 0.1, newValue));
    } else { // end
      // Don't let end time go below start time + 0.1 or above duration
      updatedValues.end = Math.max(updatedValues.start + 0.1, Math.min(duration, newValue));
    }
    
    setEditValues(updatedValues);
    
    // Update the lyric and all subsequent lyrics immediately
    updateTimings(editingIndex, editingField, updatedValues[editingField]);
  };
  
  // End the drag operation
  const handleDragEnd = () => {
    isDraggingRef.current = false;
    
    // Set the flag to indicate we just finished dragging
    // This will prevent the container click from clearing the editing state
    justFinishedDraggingRef.current = true;
    
    // Reset the flag after a short delay
    setTimeout(() => {
      justFinishedDraggingRef.current = false;
    }, 100);
    
    // Clean up event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
    
    // Make sure we apply the final update
    if (editingIndex !== null && editingField !== null) {
      const finalValue = editingField === 'start' ? editValues.start : editValues.end;
      updateTimings(editingIndex, editingField, finalValue);
      
      // IMPORTANT: We no longer clear the editing state
      // This maintains focus on the current timing value
      // allowing immediate re-dragging
    }
  };
  
  // Function to explicitly clear editing state (when clicking elsewhere)
  const clearEditingState = () => {
    setEditingIndex(null);
    setEditingField(null);
  };
  
  // Click handler for the container - clear editing state when clicking outside timing values
  const handleContainerClick = (e) => {
    // Check if the click is on a timing value
    const target = e.target;
    
    // If we just finished dragging, don't clear the editing state
    // This prevents losing focus when dropping outside of timing elements
    if (justFinishedDraggingRef.current) {
      return;
    }
    
    // Only clear if clicking outside of timing editors
    if (!target.classList.contains('timing-editor')) {
      clearEditingState();
    }
  };

  // Update the specified lyric and adjust all subsequent timings
  const updateTimings = (index, field, newValue) => {
    const oldLyrics = [...lyrics];
    const currentLyric = { ...oldLyrics[index] };
    const delta = newValue - currentLyric[field];
    
    if (Math.abs(delta) < 0.001) return; // Skip tiny changes
    
    const updatedLyrics = oldLyrics.map((lyric, i) => {
      if (i === index) {
        if (field === 'start') {
          // When changing start time, maintain the segment length by moving the end time
          const length = lyric.end - lyric.start;
          return {
            ...lyric,
            start: newValue,
            end: newValue + length
          };
        } else {
          // For end time changes, just update the end
          return { ...lyric, [field]: newValue };
        }
      } else if (i > index && isSticky) {
        // For all subsequent segments, shift both start and end by the same delta
        // Only if sticky mode is enabled
        return {
          ...lyric,
          start: Math.max(0, lyric.start + delta),
          end: Math.max(lyric.start + 0.1, lyric.end + delta)
        };
      }
      return lyric;
    });
    
    setLyrics(updatedLyrics);
    if (onUpdateLyrics) {
      onUpdateLyrics(updatedLyrics);
    }
  };

  // Handle click on the timeline to seek
  const handleTimelineClick = (e) => {
    if (!timelineRef.current || !duration) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timelineWidth = rect.width;
    
    // Find the max time to use same scale as drawing
    const maxLyricTime = lyrics.length > 0 
      ? Math.max(...lyrics.map(lyric => lyric.end))
      : duration;
    const timelineEnd = Math.max(maxLyricTime, duration) * 1.05;
    
    // Calculate the time based on click position
    const newTime = (clickX / timelineWidth) * timelineEnd;
    
    // Seek to the new time
    if (newTime >= 0 && newTime <= duration && onLyricClick) {
      onLyricClick(Math.min(duration, newTime));
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Matched Lyrics</span>
        {allowEditing && (
          <div>
            <label 
              style={{ 
                marginRight: '15px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={isSticky}
                onChange={(e) => setIsSticky(e.target.checked)}
                style={{ marginRight: '5px' }}
              />
              <span style={{ 
                fontSize: '14px',
                color: '#666'
              }}>
                Sticky Timings
              </span>
            </label>
            <button 
              onClick={handleUndo}
              disabled={history.length === 0}
              style={{
                backgroundColor: history.length === 0 ? '#ddd' : '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                marginRight: '8px',
                cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              title="Undo last change"
            >
              Undo
            </button>
            <button 
              onClick={handleReset}
              disabled={originalLyrics.length === 0}
              style={{
                backgroundColor: originalLyrics.length === 0 ? '#ddd' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                cursor: originalLyrics.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              title="Reset to original Gemini results"
            >
              Reset
            </button>
          </div>
        )}
      </h3>
      
      {/* Timeline Visualization */}
      <div style={{ marginBottom: '10px', position: 'relative' }}>
        <canvas 
          ref={timelineRef}
          onClick={handleTimelineClick}
          style={{
            width: '100%',
            height: '50px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}
        />
      </div>
      
      <div 
        ref={containerRef}
        onClick={handleContainerClick}
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '10px',
          borderRadius: '4px'
        }}
      >
        {lyrics.map((lyric, index) => {
          const isCurrentLyric = index === currentIndex;
          const isEditing = editingIndex === index;
          
          return (
            <div
              key={index}
              data-lyric-index={index}
              style={{
                padding: '10px',
                backgroundColor: isCurrentLyric ? '#E3F2FD' : 'white',
                marginBottom: '5px',
                borderRadius: '4px',
                cursor: 'pointer',
                borderLeft: `4px solid ${isCurrentLyric ? '#2196F3' : '#ddd'}`,
                transition: 'all 0.3s ease',
                transform: isCurrentLyric ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isCurrentLyric ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
              }}
              onClick={(e) => {
                // Only seek if we're not currently editing
                if (editingIndex === null) {
                  onLyricClick(lyric.start);
                }
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative'
              }}>
                <div style={{
                  fontWeight: isCurrentLyric ? '600' : 'normal',
                  flex: 1,
                  paddingRight: '120px' // Ensure text doesn't overlap with timing values
                }}>
                  {lyric.text}
                </div>
                
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: '#f0f7ff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    position: 'absolute',
                    right: '70px', // Moved further left, leaving more space on right
                    zIndex: 5
                  }}
                >
                  {/* Start time */}
                  <span 
                    className="timing-editor"
                    style={{
                      color: (isEditing && editingField === 'start') || (hoveredElement && hoveredElement.index === index && hoveredElement.field === 'start') 
                        ? '#e91e63' : '#1976d2',
                      fontWeight: '500',
                      cursor: allowEditing ? 'grab' : 'default',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      border: ((isEditing && editingField === 'start') || (hoveredElement && hoveredElement.index === index && hoveredElement.field === 'start')) 
                        ? '1px solid #e91e63' : '1px solid transparent',
                      backgroundColor: ((isEditing && editingField === 'start') || (hoveredElement && hoveredElement.index === index && hoveredElement.field === 'start')) 
                        ? 'rgba(233, 30, 99, 0.1)' : 'transparent',
                      touchAction: 'none',
                      userSelect: 'none',
                      position: 'relative',
                      zIndex: 10,
                      transition: 'all 0.15s ease',
                      cursor: isDraggingRef.current ? 'grabbing' : 'grab'
                    }}
                    onMouseDown={allowEditing ? (e) => handleDragStart(e, index, 'start') : undefined}
                    onTouchStart={allowEditing ? (e) => handleDragStart(e, index, 'start') : undefined}
                    onMouseEnter={allowEditing ? () => handleMouseEnter(index, 'start') : undefined}
                    onMouseLeave={allowEditing ? handleMouseLeave : undefined}
                    title={allowEditing ? "Drag horizontally to adjust start time" : ""}
                  >
                    {(isEditing && editingField === 'start' ? editValues.start : lyric.start).toFixed(2)}s
                  </span>
                  <span>-</span>
                  {/* End time */}
                  <span 
                    className="timing-editor"
                    style={{
                      color: (isEditing && editingField === 'end') || (hoveredElement && hoveredElement.index === index && hoveredElement.field === 'end') 
                        ? '#e91e63' : '#1976d2',
                      fontWeight: '500',
                      cursor: allowEditing ? 'grab' : 'default',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      border: ((isEditing && editingField === 'end') || (hoveredElement && hoveredElement.index === index && hoveredElement.field === 'end')) 
                        ? '1px solid #e91e63' : '1px solid transparent',
                      backgroundColor: ((isEditing && editingField === 'end') || (hoveredElement && hoveredElement.index === index && hoveredElement.field === 'end')) 
                        ? 'rgba(233, 30, 99, 0.1)' : 'transparent',
                      touchAction: 'none',
                      userSelect: 'none',
                      position: 'relative',
                      zIndex: 10,
                      transition: 'all 0.15s ease',
                      cursor: isDraggingRef.current ? 'grabbing' : 'grab'
                    }}
                    onMouseDown={allowEditing ? (e) => handleDragStart(e, index, 'end') : undefined}
                    onTouchStart={allowEditing ? (e) => handleDragStart(e, index, 'end') : undefined}
                    onMouseEnter={allowEditing ? () => handleMouseEnter(index, 'end') : undefined}
                    onMouseLeave={allowEditing ? handleMouseLeave : undefined}
                    title={allowEditing ? "Drag horizontally to adjust end time" : ""}
                  >
                    {(isEditing && editingField === 'end' ? editValues.end : lyric.end).toFixed(2)}s
                  </span>
                </div>
              </div>
              
              {isCurrentLyric && (
                <div style={{
                  height: '3px',
                  backgroundColor: '#2196F3',
                  marginTop: '6px',
                  width: `${Math.min(100, Math.max(0, ((currentTime - lyric.start) / (lyric.end - lyric.start)) * 100))}%`,
                  transition: 'width 0.2s linear',
                  maxWidth: '100%'
                }} />
              )}
            </div>
          );
        })}
      </div>
      
      {allowEditing && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          <p>
            Drag timing values horizontally to adjust (left/right). Changes to earlier timings will automatically update later ones.
            Use the Undo button to revert the last change or Reset to go back to the original Gemini results.<br/>
            Toggle "Sticky Timings" to control whether adjusting a timing affects all subsequent timings.
          </p>
        </div>
      )}
    </div>
  );
};

export default LyricsDisplay;






