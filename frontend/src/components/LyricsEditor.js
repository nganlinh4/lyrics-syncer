import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import theme from '../theme/theme';

const LyricsEditor = ({ 
  initialLyrics = [], 
  onSave, 
  onCancel,
  artist,
  song 
}) => {
  const { t } = useTranslation();
  const [editedLyrics, setEditedLyrics] = useState(initialLyrics.join('\n'));
  const textareaRef = useRef(null);

  const handleSave = async () => {
    const lyricsArray = editedLyrics
      .split('\n')
      .map(line => line.trim())
      .filter(line => line); // Remove empty lines
    
    try {
      if (onSave) {
        await onSave(lyricsArray, artist, song);
      }
    } catch (error) {
      console.error('Failed to save lyrics:', error);
    }
  };

  return (
    <div style={{ display: 'grid', gap: theme.spacing.md }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm
      }}>
        <h3 style={{
          ...theme.typography.h3
        }}>
          {t('customLyrics.title')}
        </h3>
        <div style={{ 
          color: theme.colors.text.secondary,
          fontSize: theme.typography.small.fontSize
        }}>
          {t('customLyrics.charactersCount', { count: editedLyrics.length })}
        </div>
      </div>
      
      <textarea
        ref={textareaRef}
        value={editedLyrics}
        onChange={(e) => setEditedLyrics(e.target.value)}
        placeholder={t('customLyrics.placeholder')}
        style={{
          width: '100%',
          minHeight: '200px',
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.sm,
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.background.light,
          color: theme.colors.text.primary,
          fontFamily: 'inherit',
          resize: 'vertical',
          lineHeight: '1.5'
        }}
      />
      
      <p style={{
        ...theme.typography.small,
        color: theme.colors.text.secondary
      }}>
        {t('customLyrics.instructions')}
      </p>
      
      <div style={{
        display: 'flex',
        gap: theme.spacing.md,
        justifyContent: 'flex-end'
      }}>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="secondary"
          >
            {t('common.cancel')}
          </Button>
        )}
        <Button
          onClick={handleSave}
          variant="primary"
        >
          {t('customLyrics.submit')}
        </Button>
      </div>
    </div>
  );
};

export default LyricsEditor;