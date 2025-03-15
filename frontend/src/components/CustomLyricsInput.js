import React, { useState } from 'react';

const CustomLyricsInput = ({ onCustomLyrics }) => {
  const [showInput, setShowInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleSubmit = () => {
    if (onCustomLyrics) {
      onCustomLyrics(customText);
    }
    setShowInput(false);
    setCustomText('');
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <button
        onClick={() => setShowInput(!showInput)}
        style={{
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 16px',
          marginRight: '10px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        {showInput ? 'Hide Custom Input' : 'Add Custom Lyrics'}
      </button>

      {showInput && (
        <div style={{ 
          marginTop: '10px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Paste your lyrics here (one line per lyric)"
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
          <button 
            onClick={handleSubmit} 
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Submit Lyrics
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomLyricsInput;