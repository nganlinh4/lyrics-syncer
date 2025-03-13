import React, { useState, useRef, useEffect } from 'react';

const LyricsDisplay = ({ matchedLyrics, currentTime, onLyricClick, duration, onUpdateLyrics, allowEditing = false }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValues, setEditValues] = useState({ start: 0, end: 0 });
  const startInputRef = useRef(null);
  const [lyrics, setLyrics] = useState([]);

  // Initialize local lyrics state from props
  useEffect(() => {
    setLyrics(matchedLyrics);
  }, [matchedLyrics]);

  const getCurrentLyricIndex = (time) => {
    return lyrics.findIndex(
      (lyric) => time >= lyric.start && time <= lyric.end
    );
  };
  
  const currentIndex = getCurrentLyricIndex(currentTime);
  
  const startEditing = (index) => {
    const lyric = lyrics[index];
    setEditingIndex(index);
    setEditValues({
      start: lyric.start,
      end: lyric.end
    });
    // Focus on the start input after a brief delay for the DOM to update
    setTimeout(() => startInputRef.current?.focus(), 50);
  };
  
  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setEditValues(prev => ({
      ...prev,
      [field]: numValue
    }));
  };
  
  const saveEdits = (index) => {
    if (editingIndex === null) return;
    
    // Validate that start is less than end
    if (editValues.start >= editValues.end) {
      alert('Start time must be less than end time');
      return;
    }
    
    // Validate that times are within duration
    if (editValues.start < 0 || editValues.end > duration) {
      alert(`Times must be between 0 and ${duration.toFixed(2)} seconds`);
      return;
    }
    
    const updatedLyrics = [...lyrics];
    updatedLyrics[index] = {
      ...updatedLyrics[index],
      start: editValues.start,
      end: editValues.end
    };
    
    setLyrics(updatedLyrics);
    setEditingIndex(null);
    
    // Notify parent component of updates
    if (onUpdateLyrics) {
      onUpdateLyrics(updatedLyrics);
    }
  };
  
  const cancelEditing = () => {
    setEditingIndex(null);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      saveEdits(index);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Matched Lyrics</span>
        {allowEditing && (
          <span style={{ fontSize: '0.8em', color: '#666' }}>
            Click on timing values to edit
          </span>
        )}
      </h3>
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        border: '1px solid #ccc',
        padding: '10px',
        borderRadius: '4px'
      }}>
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
              onClick={isEditing ? undefined : () => onLyricClick(lyric.start)}
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
                
                {isEditing ? (
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <input
                      ref={startInputRef}
                      type="number"
                      min="0"
                      max={editValues.end - 0.1}
                      step="0.1"
                      value={editValues.start.toFixed(2)}
                      onChange={(e) => handleInputChange('start', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      style={{
                        width: '70px',
                        textAlign: 'center',
                        border: '1px solid #2196F3',
                        borderRadius: '4px',
                        padding: '4px'
                      }}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      min={editValues.start + 0.1}
                      max={duration}
                      step="0.1"
                      value={editValues.end.toFixed(2)}
                      onChange={(e) => handleInputChange('end', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      style={{
                        width: '70px',
                        textAlign: 'center',
                        border: '1px solid #2196F3',
                        borderRadius: '4px',
                        padding: '4px'
                      }}
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        saveEdits(index);
                      }}
                      style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer'
                      }}
                    >
                      ✓
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEditing();
                      }}
                      style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div 
                    style={{
                      fontSize: '0.9em',
                      color: '#1976d2',
                      fontWeight: '500',
                      backgroundColor: '#f0f7ff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      minWidth: '120px',
                      textAlign: 'center',
                      cursor: allowEditing ? 'text' : 'default',
                      border: allowEditing ? '1px dashed #ccc' : 'none'
                    }}
                    onClick={(e) => {
                      if (allowEditing) {
                        e.stopPropagation();
                        startEditing(index);
                      }
                    }}
                    title={allowEditing ? "Click to edit timing" : ""}
                  >
                    {lyric.start.toFixed(2)}s - {lyric.end.toFixed(2)}s
                  </div>
                )}
              </div>
              
              {isCurrentLyric && (
                <div style={{
                  height: '3px',
                  backgroundColor: '#2196F3',
                  marginTop: '6px',
                  width: `${((currentTime - lyric.start) / (lyric.end - lyric.start)) * 100}%`,
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
          <p>Click on timing values to edit start and end times. Press Enter to save or Escape to cancel.</p>
        </div>
      )}
    </div>
  );
};

export default LyricsDisplay;