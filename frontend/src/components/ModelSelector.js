import React from 'react';
import { useTranslation } from 'react-i18next';
import theme from '../theme/theme';

const MODELS = [
  {
    id: 'gemini-2.0-pro-exp-02-05',
    nameKey: 'settings.models.lyrics.geminiPro',
    descriptionKey: 'settings.modelDescription.geminiPro'
  },
  {
    id: 'gemini-2.0-flash-thinking-exp-01-21',
    nameKey: 'settings.models.lyrics.geminiFlashThinking',
    descriptionKey: 'settings.modelDescription.geminiFlashThinking'
  }
];

const ModelSelector = ({ selectedModel, onModelChange }) => {
  const { t } = useTranslation();

  return (
    <div style={{
      display: 'grid',
      gap: theme.spacing.sm
    }}>
      <h3 style={{
        ...theme.typography.h3,
        marginBottom: theme.spacing.md
      }}>
        {t('settings.models.lyrics.title')}
      </h3>
      
      <div style={{
        display: 'grid',
        gap: theme.spacing.sm
      }}>
        <label
          htmlFor="modelSelect"
          style={{
            ...theme.typography.body,
            fontWeight: '500'
          }}
        >
          {t('settings.models.lyrics.lyricsMatching')}
        </label>

        <select
          id="modelSelect"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          style={{
            padding: theme.spacing.sm,
            borderRadius: theme.borderRadius.sm,
            border: `1px solid ${theme.colors.border}`,
            fontSize: theme.typography.body.fontSize,
            width: '100%',
            backgroundColor: theme.colors.background.main,
            cursor: 'pointer',
            transition: theme.transitions.fast
          }}
        >
          {MODELS.map(model => (
            <option key={model.id} value={model.id}>
              {t(model.nameKey)}
            </option>
          ))}
        </select>

        <p style={{
          ...theme.typography.small,
          color: theme.colors.text.secondary,
          marginTop: theme.spacing.xs
        }}>
          {t(MODELS.find(m => m.id === selectedModel)?.descriptionKey)}
        </p>
      </div>
    </div>
  );
};

export default ModelSelector;