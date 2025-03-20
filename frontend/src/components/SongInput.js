// filepath: c:\WORK_win\lyrics-syncer\frontend\src\components\SongInput.js
import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import theme from '../theme/theme';

const SongInput = ({
  artist,
  song,
  loading,
  onArtistChange,
  onSongChange,
  onDownload,
  onForceDownload,
  onFetchFromGenius,
  showForceButton
}) => {
  const [sameAsYoutube, setSameAsYoutube] = useState(() => 
    localStorage.getItem('sameAsYoutube') !== 'false'
  );
  const [geniusArtist, setGeniusArtist] = useState(() => 
    localStorage.getItem('geniusArtist') || artist
  );
  const [geniusSong, setGeniusSong] = useState(() => 
    localStorage.getItem('geniusSong') || song
  );

  // Update Genius fields when YouTube fields change if sameAsYoutube is true
  useEffect(() => {
    if (sameAsYoutube) {
      setGeniusArtist(artist);
      setGeniusSong(song);
    }
  }, [sameAsYoutube, artist, song]);

  const handleSameAsYoutubeChange = (e) => {
    const isChecked = e.target.checked;
    setSameAsYoutube(isChecked);
    localStorage.setItem('sameAsYoutube', isChecked);
    
    if (isChecked) {
      setGeniusArtist(artist);
      setGeniusSong(song);
    }
  };

  const handleGeniusArtistChange = (e) => {
    const value = e.target.value;
    setGeniusArtist(value);
    localStorage.setItem('geniusArtist', value);
  };

  const handleGeniusSongChange = (e) => {
    const value = e.target.value;
    setGeniusSong(value);
    localStorage.setItem('geniusSong', value);
  };

  return (
    <Card title="Song Details">
      <div style={{ display: 'grid', gap: theme.spacing.md }}>
        {/* YouTube Search Fields */}
        <div style={{ 
          borderBottom: `1px solid ${theme.colors.border}`, 
          paddingBottom: theme.spacing.md,
          marginBottom: theme.spacing.sm 
        }}>
          <h3 style={{ ...theme.typography.h3, marginBottom: theme.spacing.sm }}>YouTube Search</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'center', gap: theme.spacing.md }}>
            <label htmlFor="artist" style={theme.typography.body}>Artist:</label>
            <input
              type="text"
              id="artist"
              value={artist}
              onChange={onArtistChange}
              style={{
                padding: theme.spacing.sm,
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: theme.typography.body.fontSize
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'center', gap: theme.spacing.md, marginTop: theme.spacing.sm }}>
            <label htmlFor="song" style={theme.typography.body}>Song:</label>
            <input
              type="text"
              id="song"
              value={song}
              onChange={onSongChange}
              style={{
                padding: theme.spacing.sm,
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: theme.typography.body.fontSize
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
            <Button
              onClick={onDownload}
              disabled={loading}
              variant="primary"
            >
              {loading ? 'Processing...' : 'Download and Process'}
            </Button>

            {showForceButton && (
              <Button
                onClick={onForceDownload}
                disabled={loading}
                variant="warning"
              >
                Force Re-download & Process
              </Button>
            )}
          </div>
        </div>

        {/* Genius Search Fields */}
        <div>
          <h3 style={{ ...theme.typography.h3, marginBottom: theme.spacing.sm }}>Genius Lyrics Search</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            <input
              type="checkbox"
              id="sameAsYoutube"
              checked={sameAsYoutube}
              onChange={handleSameAsYoutubeChange}
            />
            <label htmlFor="sameAsYoutube" style={theme.typography.body}>
              Same as YouTube search
            </label>
          </div>

          {!sameAsYoutube && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'center', gap: theme.spacing.md }}>
                <label htmlFor="geniusArtist" style={theme.typography.body}>Artist:</label>
                <input
                  type="text"
                  id="geniusArtist"
                  value={geniusArtist}
                  onChange={handleGeniusArtistChange}
                  style={{
                    padding: theme.spacing.sm,
                    borderRadius: theme.borderRadius.sm,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: theme.typography.body.fontSize
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'center', gap: theme.spacing.md, marginTop: theme.spacing.sm }}>
                <label htmlFor="geniusSong" style={theme.typography.body}>Song:</label>
                <input
                  type="text"
                  id="geniusSong"
                  value={geniusSong}
                  onChange={handleGeniusSongChange}
                  style={{
                    padding: theme.spacing.sm,
                    borderRadius: theme.borderRadius.sm,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: theme.typography.body.fontSize
                  }}
                />
              </div>
            </>
          )}

          <div style={{ marginTop: theme.spacing.md }}>
            <Button
              onClick={() => onFetchFromGenius(sameAsYoutube ? artist : geniusArtist, sameAsYoutube ? song : geniusSong)}
              disabled={loading || (sameAsYoutube ? (!artist || !song) : (!geniusArtist || !geniusSong))}
              variant="secondary"
            >
              Get Lyrics from Genius
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SongInput;