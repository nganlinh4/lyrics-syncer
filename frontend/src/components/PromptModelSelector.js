import React from 'react';
import { useTranslation } from 'react-i18next';
import theme from '../theme/theme';

const PROMPT_MODELS = [
  {
    id: 'gemini-2.0-flash-lite',
    nameKey: 'settings.models.prompt.geminiFlash',
    descriptionKey: 'settings.modelDescription.geminiFlashLite'
  },
  {
    id: 'gemini-2.5-pro-exp-03-25',
    nameKey: 'settings.models.prompt.geminiPro',
    descriptionKey: 'settings.modelDescription.geminiPro'
  }
];

const PromptModelSelector = ({ selectedModel, onModelChange }) => {
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
        {t('settings.models.prompt.title')}
      </h3>

      <div style={{
        display: 'grid',
        gap: theme.spacing.sm
      }}>
        <label
          htmlFor="promptModelSelect"
          style={{
            ...theme.typography.body,
            fontWeight: '500'
          }}
        >
          {t('settings.models.prompt.promptGeneration')}
        </label>

        <select
          id="promptModelSelect"
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
          {PROMPT_MODELS.map(model => (
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
          {t(PROMPT_MODELS.find(m => m.id === selectedModel)?.descriptionKey)}
        </p>
      </div>
    </div>
  );
};

export default PromptModelSelector;