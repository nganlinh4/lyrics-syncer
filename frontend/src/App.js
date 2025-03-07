import React, { useState } from 'react';

function App() {
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [lyrics, setLyrics] = useState([]);
  const [audioUrl, setAudioUrl] = useState('');

  const handleDownload = async () => {
    // Placeholder for download logic (to be implemented later)
    alert(`Downloading ${song} by ${artist}...`);

    // Simulate fetching audio data
    const audioDataResponse = await fetch(`http://localhost:3001/api/audio_data/${artist} - ${song}`);
    if (audioDataResponse.ok) {
      const audioData = await audioDataResponse.json();
      setAudioUrl(audioData.audio_url);
    }

    // Simulate fetching lyrics timing
    const lyricsTimingResponse = await fetch(`http://localhost:3001/api/lyrics_timing/${artist} - ${song}`);
    if (lyricsTimingResponse.ok) {
      const lyricsTiming = await lyricsTimingResponse.json();
      setLyrics(lyricsTiming);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lyrics Timing App</h1>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="song">Song:</label>
        <input
          type="text"
          id="song"
          value={song}
          onChange={(e) => setSong(e.target.value)}
          style={{ marginRight: '10px' }}
        />

        <label htmlFor="artist">Artist:</label>
        <input
          type="text"
          id="artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          style={{ marginRight: '10px' }}
        />

        <button onClick={handleDownload}>Download and Process</button>
      </div>

      {audioUrl && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Audio</h2>
          <audio controls src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {lyrics.length > 0 && (
        <div>
          <h2>Lyrics</h2>
          {lyrics.map((item, index) => (
            <p key={index} style={{ marginTop: '5px' }}>
              {item.start.toFixed(2)}s - {item.end.toFixed(2)}s: {item.line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;