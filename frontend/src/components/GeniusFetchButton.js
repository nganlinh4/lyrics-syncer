import React from 'react';
import Button from '../ui/Button';

const GeniusFetchButton = ({ onFetch, artist, song, disabled }) => {
  return (
    <Button
      onClick={() => onFetch(artist, song)}
      disabled={disabled || !artist || !song}
      style={{ marginRight: '8px' }}
    >
      Fetch from Genius
    </Button>
  );
};

export default GeniusFetchButton;