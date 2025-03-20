import React from 'react';
import theme from '../theme/theme';

const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.0-pro-exp-02-05',
    name: 'Gemini 2.0 Pro Experimental',
    description: 'The strongest model for lyrics timing. But not always the best.'
  },
  {
    id: 'gemini-2.0-flash-thinking-exp-01-21',
    name: 'Gemini 2.0 Flash Thinking Experimental',
    description: 'Slower but sometimes more accurate model for lyrics timing.'
  }
];

const ModelSelector = ({ selectedModel, onModelChange }) => {
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
        Lyrics Matching Model:
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
              {model.name}
            </option>
          ))}
        </select>

        <p style={{
          ...theme.typography.small,
          color: theme.colors.text.secondary,
          marginTop: theme.spacing.xs
        }}>
          {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.description}
        </p>
      </div>
    </div>
  );
};

export default ModelSelector;