const LyricsDisplay = ({ matchedLyrics }) => {
  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Matched Lyrics</h3>
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        border: '1px solid #ccc',
        padding: '10px',
        borderRadius: '4px'
      }}>
        {matchedLyrics.map((lyric, index) => (
          <div
            key={index}
            data-lyric-index={index}
            style={{
              padding: '10px',
              backgroundColor: index === 0 ? '#E3F2FD' : 'white',
              marginBottom: '5px',
              borderRadius: '4px',
              cursor: 'pointer',
              borderLeft: '4px solid #4CAF50',
              transition: '0.3s'
            }}
          >
            <div>{lyric.text}</div>
            <div style={{
              fontSize: '0.8em',
              color: '#666',
              marginTop: '4px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>{lyric.start.toFixed(2)}s - {lyric.end.toFixed(2)}s</span>
              <span>Confidence: {(lyric.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LyricsDisplay;