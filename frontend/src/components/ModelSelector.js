import React from 'react';
import { useTranslation } from 'react-i18next';
import theme from '../theme/theme';

const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.0-pro-exp-02-05',
    nameKey: 'settings.models.chat.geminiPro',
    descriptionKey: 'settings.modelDescription.geminiPro'
  },
  {
    id: 'gemini-2.0-flash-thinking-exp-01-21',
    nameKey: 'settings.models.chat.geminiFlash',
    descriptionKey: 'settings.modelDescription.geminiFlashLite'
  }
];

const ModelSelector = ({ selectedModel, onModelChange }) => {
  const { t } = useTranslation();

  return (
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
        {t('settings.models.chat.lyricsMatching')}
      </label>
      
      <div style={{
        display: 'grid',
        gap: theme.spacing.sm
      }}>
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
          {AVAILABLE_MODELS.map(model => (
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
          {t(AVAILABLE_MODELS.find(m => m.id === selectedModel)?.descriptionKey)}
        </p>
      </div>
    </div>
  );
};

export default ModelSelector;