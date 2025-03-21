import React from 'react';
import { useTranslation } from 'react-i18next';
import theme from '../theme/theme';

const IMAGE_MODELS = [
  {
    id: 'gemini-2.0-flash-exp-image-generation',
    nameKey: 'settings.models.image.geminiFlash',
    descriptionKey: 'settings.modelDescription.geminiFlashExp'
  }
];

const ImageModelSelector = ({ selectedModel, onModelChange }) => {
  const { t } = useTranslation();

  return (
    <div style={{
      display: 'grid',
      gap: theme.spacing.sm
    }}>
      <label
        htmlFor="imageModelSelect"
        style={{
          ...theme.typography.body,
          fontWeight: '500'
        }}
      >
        {t('settings.models.image.imageGeneration')}
      </label>
      
      <div style={{
        display: 'grid',
        gap: theme.spacing.sm
      }}>
        <select
          id="imageModelSelect"
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
          {IMAGE_MODELS.map(model => (
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
          {t(IMAGE_MODELS.find(m => m.id === selectedModel)?.descriptionKey)}
        </p>
      </div>
    </div>
  );
};

export default ImageModelSelector;