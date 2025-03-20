import React from 'react';
import theme from '../theme/theme';

const PROMPT_MODELS = [
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    description: 'Fast prompt generation with good contextual understanding'
  },
  {
    id: 'gemini-2.0-pro-exp-02-05',
    name: 'Gemini 2.0 Pro Experimental',
    description: 'Stronger prompt generation with advanced contextual understanding'
  }
];

const PromptModelSelector = ({ selectedModel, onModelChange }) => {
  return (
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
        Prompt Generation Model:
      </label>
      
      <div style={{
        display: 'grid',
        gap: theme.spacing.sm
      }}>
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
              {model.name}
            </option>
          ))}
        </select>

        <p style={{
          ...theme.typography.small,
          color: theme.colors.text.secondary,
          marginTop: theme.spacing.xs
        }}>
          {PROMPT_MODELS.find(m => m.id === selectedModel)?.description}
        </p>
      </div>
    </div>
  );
};

export default PromptModelSelector;