import React from 'react';
import theme from '../theme/theme';

const IMAGE_MODELS = [
  {
    id: 'gemini-2.0-flash-exp-image-generation',
    name: 'Gemini 2.0 Flash Experimental',
    description: 'Image generation optimized for abstract visualizations'
  }
];

const ImageModelSelector = ({ selectedModel, onModelChange }) => {
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
        Image Generation Model:
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
              {model.name}
            </option>
          ))}
        </select>

        <p style={{
          ...theme.typography.small,
          color: theme.colors.text.secondary,
          marginTop: theme.spacing.xs
        }}>
          {IMAGE_MODELS.find(m => m.id === selectedModel)?.description}
        </p>
      </div>
    </div>
  );
};

export default ImageModelSelector;