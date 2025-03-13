import React, { useState, useRef, useEffect } from 'react';

const LyricsDisplay = ({ matchedLyrics, currentTime, onLyricClick, duration, onUpdateLyrics, allowEditing = false }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingField, setEditingField] = useState(null); // 'start' or 'end'
  const [editValues, setEditValues] = useState({ start: 0, end: 0 });
  const [lyrics, setLyrics] = useState([]);
  const [history, setHistory] = useState([]); // For undo functionality
  const [originalLyrics, setOriginalLyrics] = useState([]); // For reset functionality
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const dragStartRef = useRef({ x: 0, value: 0 });
  const isDraggingRef = useRef(false);

  // Initialize local lyrics state from props
  useEffect(() => {
    setLyrics(matchedLyrics);
    // Save original lyrics for reset functionality (only on initial load)
    if (matchedLyrics.length > 0 && originalLyrics.length === 0) {
      setOriginalLyrics(JSON.parse(JSON.stringify(matchedLyrics)));
    }
  }, [matchedLyrics]);
  
  // Draw timeline visualization when lyrics change
  useEffect(() => {
    if (timelineRef.current && lyrics.length > 0) {
      drawTimeline();
    }
  }, [lyrics, currentTime]);
  
  // Draw the timeline visualization
  const drawTimeline = () => {
    const canvas = timelineRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);
    
    // Draw time markers
    ctx.fillStyle = '#ddd';
    for (let i = 0; i <= duration; i += Math.max(1, Math.floor(duration / 20))) {
      const x = (i / duration) * width;
      ctx.fillRect(x, 0, 1, height);
      
      // Draw time labels
      ctx.fillStyle = '#888';
      ctx.font = '10px Arial';
      ctx.fillText(`${i}s`, x + 2, height - 2);
      ctx.fillStyle = '#ddd';
    }
    
    // Draw lyric segments
    lyrics.forEach((lyric, index) => {
      const startX = (lyric.start / duration) * width;
      const endX = (lyric.end / duration) * width;
      const segmentWidth = endX - startX;
      
      // Get a color based on the index
      const hue = (index * 30) % 360;
      ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.7)`;
      ctx.fillRect(startX, 5, segmentWidth, height - 10);
      
      // Draw border
      ctx.strokeStyle = `hsla(${hue}, 70%, 40%, 0.9)`;
      ctx.strokeRect(startX, 5, segmentWidth, height - 10);
    });
    
    // Draw current time indicator
    const currentX = (currentTime / duration) * width;
    ctx.fillStyle = 'red';
    ctx.fillRect(currentX - 1, 0, 2, height);
  };

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
  
  // Start the drag operation
  const handleDragStart = (e, index, field) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Before editing, save the current state to history
    setHistory(prevHistory => [...prevHistory, JSON.parse(JSON.stringify(lyrics))]);
    
    // If we're not already editing this item, start editing it
    if (editingIndex !== index || editingField !== field) {
      startEditing(index, field);
    }
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartRef.current = { 
      x: clientX, 
      value: field === 'start' ? lyrics[index].start : lyrics[index].end 
    };
    isDraggingRef.current = true;
    
    // Add event listeners for dragging
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
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
    
    // Clean up event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
    
    // Make sure we apply the final update
    if (editingIndex !== null && editingField !== null) {
      const finalValue = editingField === 'start' ? editValues.start : editValues.end;
      updateTimings(editingIndex, editingField, finalValue);
      
      // Add a small delay before clearing the editing state to avoid visual jumps
      setTimeout(() => {
        setEditingIndex(null);
        setEditingField(null);
      }, 200);
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
        // Update the specific field for the current lyric
        return { ...lyric, [field]: newValue };
      } else if (i > index) {
        if (field === 'start') {
          // If we changed a start time, adjust both start and end for all following lyrics
          return {
            ...lyric,
            start: Math.max(0, lyric.start + delta),
            end: Math.max(lyric.start + 0.1, lyric.end + delta)
          };
        } else if (field === 'end' && delta !== 0) {
          // If we changed an end time, adjust start times for all following lyrics
          // to maintain the same gaps between segments
          return {
            ...lyric,
            start: Math.max(0, lyric.start + delta),
            end: Math.max(lyric.start + 0.1, lyric.end + delta)
          };
        }
      }
      return lyric;
    });
    
    setLyrics(updatedLyrics);
    
    // Notify parent component of updates
    if (onUpdateLyrics) {
      onUpdateLyrics(updatedLyrics);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Matched Lyrics</span>
        {allowEditing && (
          <div>
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
      <div style={{ marginBottom: '10px' }}>
        <canvas 
          ref={timelineRef}
          width={800}
          height={50}
          style={{
            width: '100%',
            height: '50px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
      </div>
      
      <div 
        ref={containerRef}
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
                alignItems: 'center'
              }}>
                <div style={{
                  fontWeight: isCurrentLyric ? '600' : 'normal',
                  flex: 1
                }}>
                  {lyric.text}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#f0f7ff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}>
                  {/* Start time */}
                  <span 
                    className="timing-editor"
                    style={{
                      color: (isEditing && editingField === 'start') ? '#e91e63' : '#1976d2',
                      fontWeight: '500',
                      cursor: allowEditing ? 'ew-resize' : 'default',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      border: (isEditing && editingField === 'start') ? '1px solid #e91e63' : '1px solid transparent',
                      backgroundColor: (isEditing && editingField === 'start') ? 'rgba(233, 30, 99, 0.1)' : 'transparent',
                      touchAction: 'none', // Prevents touch scrolling
                      userSelect: 'none',   // Prevents text selection during drag
                      position: 'relative',
                      zIndex: 10
                    }}
                    onMouseDown={allowEditing ? (e) => handleDragStart(e, index, 'start') : undefined}
                    onTouchStart={allowEditing ? (e) => handleDragStart(e, index, 'start') : undefined}
                    title={allowEditing ? "Drag horizontally to adjust start time" : ""}
                  >
                    {(isEditing && editingField === 'start' ? editValues.start : lyric.start).toFixed(2)}s
                  </span>
                  <span>-</span>
                  {/* End time */}
                  <span 
                    className="timing-editor"
                    style={{
                      color: (isEditing && editingField === 'end') ? '#e91e63' : '#1976d2',
                      fontWeight: '500',
                      cursor: allowEditing ? 'ew-resize' : 'default',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      border: (isEditing && editingField === 'end') ? '1px solid #e91e63' : '1px solid transparent',
                      backgroundColor: (isEditing && editingField === 'end') ? 'rgba(233, 30, 99, 0.1)' : 'transparent',
                      touchAction: 'none', // Prevents touch scrolling
                      userSelect: 'none',   // Prevents text selection during drag
                      position: 'relative',
                      zIndex: 10
                    }}
                    onMouseDown={allowEditing ? (e) => handleDragStart(e, index, 'end') : undefined}
                    onTouchStart={allowEditing ? (e) => handleDragStart(e, index, 'end') : undefined}
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
            Use the Undo button to revert the last change or Reset to go back to the original Gemini results.
          </p>
        </div>
      )}
    </div>
  );
};

export default LyricsDisplay;