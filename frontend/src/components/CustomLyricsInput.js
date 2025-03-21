import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import Button from '../ui/Button';
import theme from '../theme/theme';

const CustomLyricsInput = ({ onCustomLyrics }) => {
  const { t } = useTranslation();
  const [showInput, setShowInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleSubmit = () => {
    if (!customText.trim()) return;
    
    const lyrics = customText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    onCustomLyrics(lyrics);
    setCustomText('');
    setShowInput(false);
  };

  return (
    <Card title={t('customLyrics.title')}>
      <div style={{ display: 'grid', gap: theme.spacing.md }}>
        {!showInput ? (
          <Button
            onClick={() => setShowInput(true)}
            variant="secondary"
          >
            {t('lyrics.customLyrics')}
          </Button>
        ) : (
          <div style={{ display: 'grid', gap: theme.spacing.md }}>
            <div style={{
              backgroundColor: theme.colors.background.light,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.sm
            }}>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={t('customLyrics.placeholder')}
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: theme.typography.body.fontSize,
                  resize: 'vertical',
                  backgroundColor: theme.colors.background.main
                }}
              />
              
              <div style={{
                display: 'flex',
                gap: theme.spacing.sm,
                justifyContent: 'flex-end'
              }}>
                <Button 
                  onClick={() => setShowInput(false)}
                  variant="secondary"
                >
                  {t('common.cancel')}
                </Button>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={!customText.trim()}
                  variant="primary"
                >
                  {t('customLyrics.submit')}
                </Button>
              </div>
            </div>

            <p style={{
              ...theme.typography.small,
              color: theme.colors.text.secondary
            }}>
              {t('customLyrics.instructions')}
            </p>

            <p style={{
              ...theme.typography.small,
              color: theme.colors.text.secondary
            }}>
              {t('customLyrics.charactersCount', { count: customText.length })}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CustomLyricsInput;