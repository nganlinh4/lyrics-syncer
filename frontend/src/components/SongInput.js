// filepath: c:\WORK_win\lyrics-syncer\frontend\src\components\SongInput.js
import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import theme from '../theme/theme';

const SongInput = ({
  artist,
  song,
  audioOnly,
  loading,
  onArtistChange,
  onSongChange,
  onAudioOnlyChange,
  onDownload,
  onForceDownload,
  onFetchFromGenius,
  showForceButton
}) => {
  return (
    <Card title="Song Details">
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

        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <input
            type="checkbox"
            id="audioOnly"
            checked={audioOnly}
            onChange={onAudioOnlyChange}
          />
          <label htmlFor="audioOnly" style={theme.typography.body}>
            Audio Only
          </label>
        </div>

        <div style={{ display: 'grid', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
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

          <Button
            onClick={onFetchFromGenius}
            disabled={loading || !artist || !song}
            variant="secondary"
          >
            Get Lyrics from Genius
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SongInput;