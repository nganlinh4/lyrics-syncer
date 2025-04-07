// filepath: c:\WORK_win\lyrics-syncer\frontend\src\components\SongInput.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  geniusLoading,
  onGeniusArtistChange,
  onGeniusSongChange
}) => {
  const { t } = useTranslation();
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

      // Also call the callbacks if they exist
      if (onGeniusArtistChange) {
        onGeniusArtistChange(artist);
      }
      if (onGeniusSongChange) {
        onGeniusSongChange(song);
      }
    }
  }, [sameAsYoutube, artist, song, onGeniusArtistChange, onGeniusSongChange]);

  const handleGeniusArtistChange = (e) => {
    setGeniusArtist(e.target.value);
    localStorage.setItem('geniusArtist', e.target.value);
    if (onGeniusArtistChange) {
      onGeniusArtistChange(e.target.value);
    }
  };

  const handleGeniusSongChange = (e) => {
    setGeniusSong(e.target.value);
    localStorage.setItem('geniusSong', e.target.value);
    if (onGeniusSongChange) {
      onGeniusSongChange(e.target.value);
    }
  };

  return (
    <Card title={t('lyrics.title')}>
      <div style={{ display: 'grid', gap: theme.spacing.lg }}>
        {/* YouTube Section */}
        <section>
          <h3 style={theme.typography.h3}>{t('audio.source')}</h3>
          <div style={{ display: 'grid', gap: theme.spacing.md }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'center', gap: theme.spacing.md }}>
              <label htmlFor="artist" style={theme.typography.body}>{t('audio.artist')}:</label>
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
              <label htmlFor="song" style={theme.typography.body}>{t('audio.song')}:</label>
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

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: theme.spacing.md
            }}>
              <Button
                onClick={onDownload}
                disabled={loading || !artist || !song}
                variant="primary"
                style={{ width: '100%' }}
              >
                {loading ? t('common.loading') : t('audio.download')}
              </Button>

              <Button
                onClick={onForceDownload}
                disabled={loading || !artist || !song}
                variant="warning"
                style={{ width: '100%' }}
              >
                {t('audio.force')}
              </Button>
            </div>
          </div>
        </section>

        {/* Genius Section */}
        <section>
          <h3 style={theme.typography.h3}>{t('lyrics.genius.source')}</h3>
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
              <span style={theme.typography.body}>{t('lyrics.genius.useSame')}</span>
            </label>

            {!sameAsYoutube && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'center', gap: theme.spacing.md }}>
                  <label htmlFor="geniusArtist" style={theme.typography.body}>{t('audio.artist')}:</label>
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
                  <label htmlFor="geniusSong" style={theme.typography.body}>{t('audio.song')}:</label>
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

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: theme.spacing.md
            }}>
              <Button
                onClick={() => onFetchFromGenius(sameAsYoutube ? artist : geniusArtist, sameAsYoutube ? song : geniusSong)}
                disabled={geniusLoading || (sameAsYoutube ? (!artist || !song) : (!geniusArtist || !geniusSong))}
                variant="primary"
                style={{ width: '100%' }}
              >
                {geniusLoading ? t('common.loading') : t('lyrics.genius.fetch')}
              </Button>

              <Button
                onClick={() => onFetchFromGenius(sameAsYoutube ? artist : geniusArtist, sameAsYoutube ? song : geniusSong, true)}
                disabled={geniusLoading || (sameAsYoutube ? (!artist || !song) : (!geniusArtist || !geniusSong))}
                variant="warning"
                style={{ width: '100%' }}
              >
                {t('lyrics.genius.force')}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Card>
  );
};

export default SongInput;