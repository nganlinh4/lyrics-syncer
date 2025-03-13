import React from 'react';
import ApiKeyInstructions from './ApiKeyInstructions';
import StatusIndicator from './StatusIndicator';

const ApiKeyInput = ({ 
  type, 
  value, 
  status, 
  onChange, 
  onSave 
}) => {
  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
  
  return (
    <div style={{ marginTop: '15px' }}>
      <label htmlFor={`${type}ApiKey`}>{capitalizedType} API Key:</label>
      <input
        type="text"
        id={`${type}ApiKey`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ marginRight: '10px', width: '300px' }}
      />
      <button onClick={() => onSave(type, value)}>
        Save {capitalizedType} API Key
      </button>
      <StatusIndicator status={status} />
      <ApiKeyInstructions type={type} />
    </div>
  );
};

export default ApiKeyInput;