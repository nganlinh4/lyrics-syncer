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
  showForceButton,
  geniusLoading // Add this prop
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

  const handleGeniusArtistChange = (e) => {
    setGeniusArtist(e.target.value);
    localStorage.setItem('geniusArtist', e.target.value);
  };

  const handleGeniusSongChange = (e) => {
    setGeniusSong(e.target.value);
    localStorage.setItem('geniusSong', e.target.value);
  };

  return (
    <Card title="Song Details">
      <div style={{ display: 'grid', gap: theme.spacing.lg }}>
        {/* YouTube Section */}
        <section>
          <h3 style={theme.typography.h3}>YouTube Audio Source</h3>
          <div style={{ display: 'grid', gap: theme.spacing.md }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'center', gap: theme.spacing.md }}>
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

            <div style={{ display: 'flex', gap: theme.spacing.md }}>
              <Button
                onClick={onDownload}
                disabled={loading || !artist || !song}
                variant="primary"
              >
                {loading ? 'Downloading...' : 'Download Audio'}
              </Button>
              
              {showForceButton && (
                <Button
                  onClick={onForceDownload}
                  disabled={loading}
                  variant="warning"
                >
                  Force Redownload
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Genius Section */}
        <section>
          <h3 style={theme.typography.h3}>Genius Lyrics Source</h3>
          <div style={{ display: 'grid', gap: theme.spacing.md }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
              <input
                type="checkbox"
                checked={sameAsYoutube}
                onChange={(e) => {
                  setSameAsYoutube(e.target.checked);
                  localStorage.setItem('sameAsYoutube', e.target.checked);
                  if (e.target.checked) {
                    setGeniusArtist(artist);
                    setGeniusSong(song);
                  }
                }}
              />
              <span style={theme.typography.body}>Use same as YouTube</span>
            </label>

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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'center', gap: theme.spacing.md }}>
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

            <div style={{ display: 'flex', gap: theme.spacing.md }}>
              <Button
                onClick={() => onFetchFromGenius(sameAsYoutube ? artist : geniusArtist, sameAsYoutube ? song : geniusSong)}
                disabled={geniusLoading || (sameAsYoutube ? (!artist || !song) : (!geniusArtist || !geniusSong))}
                variant="secondary"
              >
                {geniusLoading ? 'Loading...' : 'Get Lyrics from Genius'}
              </Button>

              <Button
                onClick={() => onFetchFromGenius(sameAsYoutube ? artist : geniusArtist, sameAsYoutube ? song : geniusSong, true)}
                disabled={geniusLoading || (sameAsYoutube ? (!artist || !song) : (!geniusArtist || !geniusSong))}
                variant="warning"
              >
                Force Refetch Lyrics
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Card>
  );
};

export default SongInput;