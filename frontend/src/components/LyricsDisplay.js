import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import theme from '../theme/theme';

const LyricsDisplay = ({ 
  matchedLyrics, 
  currentTime, 
  onLyricClick, 
  duration, 
  onUpdateLyrics, 
  allowEditing = false 
}) => {
  const { t } = useTranslation();

  // State for lyrics and editing
  const [lyrics, setLyrics] = useState([]);
  const [isSticky, setIsSticky] = useState(true);
  const [history, setHistory] = useState([]);
  const [originalLyrics, setOriginalLyrics] = useState([]);
  const [isAtOriginalState, setIsAtOriginalState] = useState(true);
  
  // Refs
  const timelineRef = useRef(null);
  const containerRef = useRef(null);
  const lastTimeRef = useRef(0);
  const dragInfo = useRef({ 
    dragging: false, 
    index: null, 
    field: null, 
    startX: 0, 
    startValue: 0,
    lastDragEnd: 0  // Add this to track when the last drag ended
  });

  // Sync with incoming matchedLyrics prop
  useEffect(() => {
    if (matchedLyrics && matchedLyrics.length > 0) {
      setLyrics(matchedLyrics);
      // Store original lyrics for reset functionality
      if (originalLyrics.length === 0) {
        setOriginalLyrics(JSON.parse(JSON.stringify(matchedLyrics)));
      }
      // Check if current state matches original state
      setIsAtOriginalState(JSON.stringify(matchedLyrics) === JSON.stringify(originalLyrics));
    }
  }, [matchedLyrics]);

  // Track whether current lyrics match original lyrics
  useEffect(() => {
    if (originalLyrics.length > 0) {
      const areEqual = lyrics.length === originalLyrics.length &&
        lyrics.every((lyric, index) => {
          const origLyric = originalLyrics[index];
          return (
            lyric.text === origLyric.text &&
            Math.abs(lyric.start - origLyric.start) < 0.001 &&
            Math.abs(lyric.end - origLyric.end) < 0.001
          );
        });

      if (isAtOriginalState !== areEqual) {
        setIsAtOriginalState(areEqual);
      }
    }
  }, [lyrics, originalLyrics, isAtOriginalState]);

  // Find current lyric index based on time
  const getCurrentLyricIndex = (time) => {
    return lyrics.findIndex((lyric, index) => {
      const nextLyric = lyrics[index + 1];
      return time >= lyric.start && 
        (nextLyric ? time < nextLyric.start : time <= lyric.end);
    });
  };
  
  const currentIndex = getCurrentLyricIndex(currentTime);
  
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
      const currentState = JSON.parse(JSON.stringify(lyrics));
      const originalState = JSON.parse(JSON.stringify(originalLyrics));
      
      // Only proceed if there are actual changes
      if (JSON.stringify(currentState) !== JSON.stringify(originalState)) {
        // Save current state to history before reset
        setHistory(prevHistory => [...prevHistory, currentState]);
        // Reset to original state
        setLyrics(originalState);
      
        // Notify parent component
        if (onUpdateLyrics) {
          onUpdateLyrics(originalState);
        }
      }
    }
  };
  
  // Start the drag operation - simplified
  const handleMouseDown = (e, index, field) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Save current state to history before making changes
    setHistory(prevHistory => [...prevHistory, JSON.parse(JSON.stringify(lyrics))]);
    
    const clientX = e.clientX;
    const value = field === 'start' ? lyrics[index].start : lyrics[index].end;
    
    // Store drag information
    dragInfo.current = {
      dragging: true,
      index: index,
      field: field,
      startX: clientX,
      startValue: value
    };
    
    // Add event listeners for dragging
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle mouse movement during drag - simplified
  const handleMouseMove = (e) => {
    const { dragging, index, field, startX, startValue } = dragInfo.current;
    if (!dragging) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - startX;
    const deltaTime = deltaX * 0.01; // 0.01 seconds per pixel
    let newValue = startValue + deltaTime;
    
    // Apply constraints
    const lyric = lyrics[index];
    if (field === 'start') {
      // Don't let start time go below 0 or above end time - 0.1
      newValue = Math.max(0, Math.min(lyric.end - 0.1, newValue));
    } else { // end
      // Don't let end time go below start time + 0.1 or above duration
      newValue = Math.max(lyric.start + 0.1, Math.min(duration || 9999, newValue));
    }
    
    // Round to 2 decimal places
    newValue = Math.round(newValue * 100) / 100;
    
    // Update lyrics
    updateTimings(index, field, newValue);
  };
  
  // End the drag operation - simplified
  const handleMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Record the drag end time
    dragInfo.current.lastDragEnd = Date.now();
    
    // Add a small delay to prevent click events from firing
    setTimeout(() => {
      // Cleanup
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Reset drag info but keep lastDragEnd
      dragInfo.current = { 
        dragging: false, 
        index: null, 
        field: null, 
        startX: 0, 
        startValue: 0,
        lastDragEnd: dragInfo.current.lastDragEnd 
      };
    }, 10);
  };
  
  // Update the specified lyric and adjust all subsequent timings - simplified
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
        const newStart = Math.max(0, lyric.start + delta);
        return {
          ...lyric,
          start: newStart,
          end: Math.max(newStart + 0.1, lyric.end + delta)
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

  // Draw the timeline visualization
  const drawTimeline = useCallback(() => {
    const canvas = timelineRef.current;
    if (!canvas || !duration) return;
    
    const ctx = canvas.getContext('2d');
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Set canvas dimensions for proper resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    
    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    
    // Find the max time to use same scale as drawing
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
  }, [lyrics, currentTime, duration]);

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
  }, [drawTimeline]);
  
  // Draw timeline visualization when lyrics or currentTime change
  useEffect(() => {
    if (timelineRef.current && lyrics.length > 0) {
      // Store current time for comparison
      lastTimeRef.current = currentTime;
      drawTimeline();
    }
  }, [lyrics, currentTime, duration, drawTimeline]);
  
  // Force redraw timeline when currentTime changes
  useEffect(() => {
    // Only redraw if time actually changed
    if (Math.abs(lastTimeRef.current - currentTime) > 0.01) {
      lastTimeRef.current = currentTime;
      if (timelineRef.current) {
        drawTimeline();
      }
    }
  }, [currentTime, drawTimeline]);

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.md
      }}>
        <h3 style={theme.typography.h3}>{t('lyrics.synchronizedLyrics')}</h3>
        
        {allowEditing && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: theme.spacing.sm,
            flexShrink: 0
          }}>
            <label 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: theme.typography.small.fontSize,
                color: theme.colors.text.secondary,
                whiteSpace: 'nowrap'
              }}
            >
              <input
                type="checkbox"
                checked={isSticky}
                onChange={(e) => setIsSticky(e.target.checked)}
                style={{ marginRight: theme.spacing.xs }}
              />
              {t('lyrics.stickyTimingsToggle')}
            </label>

            <Button
              onClick={handleUndo}
              disabled={history.length === 0}
              variant="secondary"
              size="small"
            >
              {t('common.undo')}
            </Button>

            <Button
              onClick={handleReset}
              disabled={originalLyrics.length === 0 || isAtOriginalState}
              variant="error"
              size="small"
            >
              {t('common.reset')}
            </Button>
          </div>
        )}
      </div>
      
      {/* Timeline Visualization */}
      <div style={{ marginBottom: theme.spacing.md, position: 'relative' }}>
        <canvas 
          ref={timelineRef}
          onClick={handleTimelineClick}
          style={{
            width: '100%',
            height: '50px',
            borderRadius: theme.borderRadius.sm,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.background.light,
            cursor: 'pointer'
          }}
        />
      </div>
      
      {/* Lyrics List */}
      <div 
        ref={containerRef}
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.sm,
          padding: theme.spacing.sm,
          backgroundColor: theme.colors.background.main
        }}
      >
        {lyrics.map((lyric, index) => {
          const isCurrentLyric = index === currentIndex;
          const isDragging = dragInfo.current.dragging && dragInfo.current.index === index;
          
          return (
            <div
              key={index}
              data-lyric-index={index}
              style={{
                padding: theme.spacing.md,
                backgroundColor: isCurrentLyric 
                  ? theme.colors.primary + '20' // 12% opacity
                  : theme.colors.background.light,
                marginBottom: '5px',
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
                borderLeft: `4px solid ${isCurrentLyric ? theme.colors.primary : theme.colors.border}`,
                transition: theme.transitions.fast,
                transform: isCurrentLyric ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isCurrentLyric ? theme.shadows.sm : 'none'
              }}
              onClick={(e) => {
                // Don't trigger click if we're in the middle of or just finished dragging
                if (dragInfo.current.dragging || Date.now() - dragInfo.current.lastDragEnd < 100) {
                  return;
                }
                onLyricClick(lyric.start);
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative'
              }}>
                <div style={{
                  flex: 1,
                  paddingRight: theme.spacing.xl,
                  fontWeight: isCurrentLyric ? '600' : 'normal'
                }}>
                  <span>{lyric.text}</span>
                </div>
                
                {allowEditing && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      backgroundColor: theme.colors.background.main,
                      padding: theme.spacing.sm,
                      borderRadius: theme.borderRadius.sm,
                      border: `1px solid ${theme.colors.border}`
                    }}
                  >
                    {/* Start Time */}
                    <span
                      style={{
                        color: isDragging && dragInfo.current.field === 'start' 
                          ? theme.colors.error
                          : theme.colors.primary,
                        fontWeight: '500',
                        cursor: allowEditing ? 'grab' : 'default',
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        borderRadius: theme.borderRadius.sm,
                        border: isDragging && dragInfo.current.field === 'start' 
                          ? `1px solid ${theme.colors.error}` 
                          : '1px solid transparent',
                        backgroundColor: isDragging && dragInfo.current.field === 'start'
                          ? theme.colors.error + '10'
                          : 'transparent',
                        userSelect: 'none'
                      }}
                      onMouseDown={(e) => handleMouseDown(e, index, 'start')}
                    >
                      {lyric.start.toFixed(2)}s
                    </span>
                    
                    <span style={{ color: theme.colors.text.secondary }}>-</span>
                    
                    {/* End Time */}
                    <span
                      style={{
                        color: isDragging && dragInfo.current.field === 'end'
                          ? theme.colors.error
                          : theme.colors.primary,
                        fontWeight: '500',
                        cursor: allowEditing ? 'grab' : 'default',
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        borderRadius: theme.borderRadius.sm,
                        border: isDragging && dragInfo.current.field === 'end'
                          ? `1px solid ${theme.colors.error}`
                          : '1px solid transparent',
                        backgroundColor: isDragging && dragInfo.current.field === 'end'
                          ? theme.colors.error + '10'
                          : 'transparent',
                        userSelect: 'none'
                      }}
                      onMouseDown={(e) => handleMouseDown(e, index, 'end')}
                    >
                      {lyric.end.toFixed(2)}s
                    </span>
                  </div>
                )}
              </div>
              
              {isCurrentLyric && (
                <div style={{
                  height: '3px',
                  backgroundColor: theme.colors.primary,
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
            {t('lyrics.timingInstructions')}
          </p>
        </div>
      )}
    </div>
  );
};

export default LyricsDisplay;






