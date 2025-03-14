import React, { useEffect } from 'react';

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
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel && AVAILABLE_MODELS.some(m => m.id === savedModel)) {
      onModelChange(savedModel);
    } else {
      onModelChange(AVAILABLE_MODELS[0].id);
    }
  }, [onModelChange]);

  return (
    <div style={{ marginTop: '15px' }}>
      <label htmlFor="modelSelect">AI Model:</label>
      <select
        id="modelSelect"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        style={{ 
          marginLeft: '10px',
          padding: '5px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          width: '300px'
        }}
      >
        {AVAILABLE_MODELS.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      <div style={{ 
        marginTop: '5px',
        fontSize: '0.8em',
        color: '#666',
        marginLeft: '70px'
      }}>
        {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.description}
      </div>
    </div>
  );
};

export default ModelSelector;