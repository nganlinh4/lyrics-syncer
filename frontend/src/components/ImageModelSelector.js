import React from 'react';

const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash Experimental',
    description: 'Image generation optimized for abstract visualizations'
  }
];

const ImageModelSelector = ({ selectedModel, onModelChange }) => {
  return (
    <div style={{ marginTop: '15px' }}>
      <label htmlFor="imageModelSelect">Image Generation Model:</label>
      <select
        id="imageModelSelect"
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
        marginLeft: '200px'
      }}>
        {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.description}
      </div>
    </div>
  );
};

export default ImageModelSelector;